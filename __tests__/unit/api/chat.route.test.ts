import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/_graph/graph', () => ({
  graph: { stream: vi.fn() },
}));

vi.mock('@ai-sdk/langchain', () => ({
  toBaseMessages: vi.fn(),
  toUIMessageStream: vi.fn(),
}));

vi.mock('ai', () => ({
  createUIMessageStreamResponse: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/app/_supabase/server', () => ({
  createServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

import { POST } from '@/app/api/chat/route';
import { graph } from '@/app/_graph/graph';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';

const mockStream = Symbol('stream');
const mockBaseMessages = [{ role: 'user', content: 'hello' }];
const mockUIStream = Symbol('uiStream');
const mockResponse = new Response('ok', { status: 200 });

const validProfile = { role: 'mom' as const, due_date: '2025-12-01', stage: 'pregnancy' };
const testMessages = [{ role: 'user', content: 'hello', id: '1', parts: [] }];

beforeEach(() => {
  vi.clearAllMocks();
  (toBaseMessages as ReturnType<typeof vi.fn>).mockResolvedValue(mockBaseMessages);
  (graph.stream as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
  (toUIMessageStream as ReturnType<typeof vi.fn>).mockReturnValue(mockUIStream);
  (createUIMessageStreamResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);
  mockGetUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
  mockSingle.mockResolvedValue({ data: validProfile, error: null });
});

function makeRequest(body: object) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  it('未登录时返回 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: 'Unauthorized' });
    const res = await POST(makeRequest({ messages: testMessages }));
    expect(res.status).toBe(401);
  });

  it('无 profile 时返回 400', async () => {
    mockSingle.mockResolvedValue({ data: null, error: 'Not found' });
    const res = await POST(makeRequest({ messages: testMessages }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('携带有效 profile 时返回 200', async () => {
    const res = await POST(makeRequest({ messages: testMessages }));
    expect(res.status).toBe(200);
  });

  it('graph.stream 以 role 和 due_date 注入 context 调用', async () => {
    await POST(makeRequest({ messages: testMessages }));
    expect(graph.stream).toHaveBeenCalledOnce();
    const [, options] = (graph.stream as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.configurable.thread_id).toBe('1');
    expect(options.context.role).toBe('mom');
    expect(options.context.due_date).toBe('2025-12-01');
    expect(options.streamMode).toEqual(expect.arrayContaining(['values', 'messages', 'custom']));
  });

  it('准爸爸 profile 也能正常调用', async () => {
    const dadProfile = { ...validProfile, role: 'dad' as const };
    mockSingle.mockResolvedValue({ data: dadProfile, error: null });
    await POST(makeRequest({ messages: testMessages }));
    const [, options] = (graph.stream as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.context.role).toBe('dad');
  });
});
