import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 外部依赖
vi.mock('@/app/_langchain/agent', () => ({
  langchainAgent: { stream: vi.fn() },
}));

vi.mock('@ai-sdk/langchain', () => ({
  toBaseMessages: vi.fn(),
  toUIMessageStream: vi.fn(),
}));

vi.mock('ai', () => ({
  createUIMessageStreamResponse: vi.fn(),
}));

import { POST } from '@/app/api/chat/route';
import { langchainAgent } from '@/app/_langchain/agent';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';

const mockStream = Symbol('stream');
const mockBaseMessages = [{ role: 'user', content: 'hello' }];
const mockUIStream = Symbol('uiStream');
const mockResponse = new Response('ok', { status: 200 });

beforeEach(() => {
  vi.clearAllMocks();
  (toBaseMessages as ReturnType<typeof vi.fn>).mockResolvedValue(mockBaseMessages);
  (langchainAgent.stream as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
  (toUIMessageStream as ReturnType<typeof vi.fn>).mockReturnValue(mockUIStream);
  (createUIMessageStreamResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);
});

function makeRequest(messages: unknown[]) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}

const testMessages = [{ role: 'user', content: 'hello', id: '1', parts: [] }];

describe('POST /api/chat', () => {
  it('5.2: 合法请求返回 200 响应', async () => {
    const res = await POST(makeRequest(testMessages));
    expect(res.status).toBe(200);
  });

  it('5.3: toBaseMessages 被调用，参数为请求体的 messages 数组', async () => {
    await POST(makeRequest(testMessages));
    expect(toBaseMessages).toHaveBeenCalledOnce();
    expect(toBaseMessages).toHaveBeenCalledWith(testMessages);
  });

  it('5.4: langchainAgent.stream 以正确 configurable 和 context 调用', async () => {
    await POST(makeRequest(testMessages));
    expect(langchainAgent.stream).toHaveBeenCalledOnce();
    const [, options] = (langchainAgent.stream as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.configurable.thread_id).toBe('1');
    expect(options.context.user_id).toBe('u1');
    expect(options.streamMode).toEqual(expect.arrayContaining(['values', 'messages', 'custom']));
  });
});
