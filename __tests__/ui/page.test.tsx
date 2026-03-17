import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('ai', () => ({
  DefaultChatTransport: class MockTransport {
    constructor(_options?: unknown) {}
  },
}));

vi.mock('@/app/lib/profile', () => ({
  getProfile: vi.fn(),
}));

import Chat from '@/app/page';
import { useChat } from '@ai-sdk/react';
import { getProfile } from '@/app/lib/profile';

const mockUseChat = useChat as ReturnType<typeof vi.fn>;
const mockGetProfile = getProfile as ReturnType<typeof vi.fn>;

const validProfile = {
  role: 'mom' as const,
  dueDate: '2025-12-01',
  createdAt: '2025-03-17T00:00:00.000Z',
};

function setupUseChat(overrides: Partial<ReturnType<typeof useChat>> = {}) {
  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage: vi.fn(),
    ...overrides,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProfile.mockReturnValue(validProfile);
});

// ─────────────────────────────────────────────
// localStorage 检测 & 跳转
// ─────────────────────────────────────────────
describe('localStorage 检测', () => {
  it('有档案时正常渲染聊天页', () => {
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.getByPlaceholderText('和我聊聊孕期的问题吧...')).toBeInTheDocument();
  });

  it('无档案时不渲染聊天 UI', () => {
    mockGetProfile.mockReturnValue(null);
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.queryByPlaceholderText('和我聊聊孕期的问题吧...')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 孕周信息标签
// ─────────────────────────────────────────────
describe('孕周信息标签', () => {
  it('准妈妈档案显示"准妈妈 · 孕 X 周"标签', () => {
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.getByText(/准妈妈 · 孕/)).toBeInTheDocument();
    expect(screen.getByText(/周/)).toBeInTheDocument();
  });

  it('准爸爸档案显示"准爸爸"标签', () => {
    mockGetProfile.mockReturnValue({ ...validProfile, role: 'dad' });
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.getByText(/准爸爸 · 孕/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 中文界面
// ─────────────────────────────────────────────
describe('中文界面', () => {
  it('输入框 placeholder 为中文', () => {
    setupUseChat({ messages: [] });
    render(<Chat />);
    expect(screen.getByPlaceholderText('和我聊聊孕期的问题吧...')).toBeInTheDocument();
  });

  it('用户消息显示"用户："前缀', () => {
    setupUseChat({
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: '请问孕吐正常吗' }] },
      ] as any,
    });
    render(<Chat />);
    expect(document.body.textContent).toContain('用户：');
  });

  it('AI 消息显示"AI："前缀', () => {
    setupUseChat({
      messages: [
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: '孕吐很正常' }] },
      ] as any,
    });
    render(<Chat />);
    expect(document.body.textContent).toContain('AI：');
  });
});

// ─────────────────────────────────────────────
// 天气 UI 已移除
// ─────────────────────────────────────────────
describe('天气审批 UI 已移除', () => {
  it('不渲染 Approve/Deny 按钮', () => {
    setupUseChat({
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          parts: [
            {
              type: 'tool-getWeatherInformation',
              state: 'approval-requested',
              toolCallId: 'tc-1',
              input: { city: '上海' },
              approval: { id: 'approval-1' },
            },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// data-status 条件渲染
// ─────────────────────────────────────────────
describe('data-status 条件渲染', () => {
  it('最后 part 非 text 时显示 data-status 消息', () => {
    setupUseChat({
      messages: [
        {
          id: 'm4',
          role: 'assistant',
          parts: [{ type: 'data-status', data: { message: '正在处理...' } }],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.getByText('正在处理...')).toBeInTheDocument();
  });

  it('最后 part 为 text 时不显示 data-status 消息', () => {
    setupUseChat({
      messages: [
        {
          id: 'm5',
          role: 'assistant',
          parts: [
            { type: 'data-status', data: { message: '正在处理...' } },
            { type: 'text', text: '孕吐是正常现象' },
          ],
        },
      ] as any,
    });
    render(<Chat />);
    expect(screen.queryByText('正在处理...')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// 表单提交
// ─────────────────────────────────────────────
describe('表单提交', () => {
  it('提交后调用 sendMessage 并清空 input', async () => {
    const sendMessage = vi.fn();
    setupUseChat({ messages: [], sendMessage });
    render(<Chat />);

    const input = screen.getByPlaceholderText('和我聊聊孕期的问题吧...');
    await userEvent.type(input, '孕吐正常吗');
    fireEvent.submit(input.closest('form')!);

    expect(sendMessage).toHaveBeenCalledWith({ text: '孕吐正常吗' });
    expect(input).toHaveValue('');
  });
});
