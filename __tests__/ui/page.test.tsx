import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock @ai-sdk/react's useChat
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

import Chat from '@/app/page';
import { useChat } from '@ai-sdk/react';

const mockUseChat = useChat as ReturnType<typeof vi.fn>;

function setupUseChat(overrides: Partial<ReturnType<typeof useChat>> = {}) {
  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage: vi.fn(),
    addToolApprovalResponse: vi.fn(),
    ...overrides,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// 6.2 空消息列表
// ─────────────────────────────────────────────
describe('6.2 空消息列表', () => {
  it('渲染 placeholder 为 "Say something..." 的 input', () => {
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.getByPlaceholderText('Say something...')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 6.3 / 6.4 消息角色标签
// ─────────────────────────────────────────────
describe('消息角色标签', () => {
  it('6.3: role=user 的消息显示 "User: " 前缀', () => {
    setupUseChat({
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: '你好' }] },
      ] as any,
    });
    render(<Chat />);
    // "User: " is a bare text node inside the container div; check body text content
    expect(document.body.textContent).toContain('User: ');
  });

  it('6.4: role=assistant 的消息显示 "AI: " 前缀', () => {
    setupUseChat({
      messages: [
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: '你好！' }] },
      ] as any,
    });
    render(<Chat />);
    expect(document.body.textContent).toContain('AI: ');
  });
});

// ─────────────────────────────────────────────
// 6.5–6.7 工具审批状态
// ─────────────────────────────────────────────
describe('tool-getWeatherInformation: approval-requested', () => {
  const addToolApprovalResponse = vi.fn();
  const toolPart = {
    type: 'tool-getWeatherInformation',
    state: 'approval-requested',
    toolCallId: 'tc-1',
    input: { city: '上海' },
    approval: { id: 'approval-1' },
  };

  beforeEach(() => {
    setupUseChat({
      messages: [
        { id: 'm1', role: 'assistant', parts: [toolPart] },
      ] as any,
      addToolApprovalResponse,
    });
  });

  it('6.5: 显示城市名和 Approve/Deny 按钮', () => {
    render(<Chat />);
    expect(screen.getByText(/上海/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
  });

  it('6.6: 点击 Approve 调用 addToolApprovalResponse({ approved: true })', async () => {
    render(<Chat />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(addToolApprovalResponse).toHaveBeenCalledWith(
      expect.objectContaining({ approved: true }),
    );
  });

  it('6.7: 点击 Deny 调用 addToolApprovalResponse({ approved: false })', async () => {
    render(<Chat />);
    await userEvent.click(screen.getByRole('button', { name: 'Deny' }));
    expect(addToolApprovalResponse).toHaveBeenCalledWith(
      expect.objectContaining({ approved: false }),
    );
  });
});

// ─────────────────────────────────────────────
// 6.8 output-available
// ─────────────────────────────────────────────
describe('tool-getWeatherInformation: output-available', () => {
  it('6.8: 显示天气输出文本', () => {
    setupUseChat({
      messages: [
        {
          id: 'm2',
          role: 'assistant',
          parts: [
            {
              type: 'tool-getWeatherInformation',
              state: 'output-available',
              toolCallId: 'tc-2',
              input: { city: '上海' },
              output: '上海天气一向不错!',
            },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.getByText(/上海天气一向不错!/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 6.9 output-denied
// ─────────────────────────────────────────────
describe('tool-getWeatherInformation: output-denied', () => {
  it('6.9: 显示拒绝相关文本（含城市名和 denied）', () => {
    setupUseChat({
      messages: [
        {
          id: 'm3',
          role: 'assistant',
          parts: [
            {
              type: 'tool-getWeatherInformation',
              state: 'output-denied',
              toolCallId: 'tc-3',
              input: { city: '上海' },
            },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.getByText(/上海/)).toBeInTheDocument();
    expect(screen.getByText(/denied/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 6.10 / 6.11 data-status 条件渲染
// ─────────────────────────────────────────────
describe('data-status 条件渲染', () => {
  it('6.10: 最后 part 非 text 时显示 data-status 消息', () => {
    setupUseChat({
      messages: [
        {
          id: 'm4',
          role: 'assistant',
          parts: [
            { type: 'data-status', data: { message: '正在查询...' } },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.getByText('正在查询...')).toBeInTheDocument();
  });

  it('6.11: 最后 part 为 text 时不显示 data-status 消息', () => {
    setupUseChat({
      messages: [
        {
          id: 'm5',
          role: 'assistant',
          parts: [
            { type: 'data-status', data: { message: '正在查询...' } },
            { type: 'text', text: '上海天气很好！' },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.queryByText('正在查询...')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 6.12 表单提交
// ─────────────────────────────────────────────
describe('6.12 表单提交', () => {
  it('提交后调用 sendMessage 并清空 input', async () => {
    const sendMessage = vi.fn();
    setupUseChat({ messages: [], sendMessage });
    render(<Chat />);

    const input = screen.getByPlaceholderText('Say something...');
    await userEvent.type(input, '上海天气怎么样');
    fireEvent.submit(input.closest('form')!);

    expect(sendMessage).toHaveBeenCalledWith({ text: '上海天气怎么样' });
    expect(input).toHaveValue('');
  });
});
