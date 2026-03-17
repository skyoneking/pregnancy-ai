import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const validProfile = { role: 'mom' as const, dueDate: '2025-12-01', createdAt: '2025-03-17T00:00:00.000Z' };
const testMessages = [{ role: 'user', content: 'hello', id: '1', parts: [] }];

beforeEach(() => {
  vi.clearAllMocks();
  (toBaseMessages as ReturnType<typeof vi.fn>).mockResolvedValue(mockBaseMessages);
  (langchainAgent.stream as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
  (toUIMessageStream as ReturnType<typeof vi.fn>).mockReturnValue(mockUIStream);
  (createUIMessageStreamResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);
});

function makeRequest(body: object) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  it('缺少 profile 时返回 400', async () => {
    const res = await POST(makeRequest({ messages: testMessages }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('携带有效 profile 时返回 200', async () => {
    const res = await POST(makeRequest({ messages: testMessages, profile: validProfile }));
    expect(res.status).toBe(200);
  });

  it('toBaseMessages 被调用，参数为请求体的 messages 数组', async () => {
    await POST(makeRequest({ messages: testMessages, profile: validProfile }));
    expect(toBaseMessages).toHaveBeenCalledOnce();
    expect(toBaseMessages).toHaveBeenCalledWith(testMessages);
  });

  it('langchainAgent.stream 以 role 和 due_date 注入 context 调用', async () => {
    await POST(makeRequest({ messages: testMessages, profile: validProfile }));
    expect(langchainAgent.stream).toHaveBeenCalledOnce();
    const [, options] = (langchainAgent.stream as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.configurable.thread_id).toBe('1');
    expect(options.context.role).toBe('mom');
    expect(options.context.due_date).toBe('2025-12-01');
    expect(options.streamMode).toEqual(expect.arrayContaining(['values', 'messages', 'custom']));
  });

  it('准爸爸 profile 也能正常调用', async () => {
    const dadProfile = { ...validProfile, role: 'dad' as const };
    await POST(makeRequest({ messages: testMessages, profile: dadProfile }));
    const [, options] = (langchainAgent.stream as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.context.role).toBe('dad');
  });
});
