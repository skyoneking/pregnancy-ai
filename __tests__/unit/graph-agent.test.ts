import { describe, it, expect } from 'vitest';
import { handleToolErrors, contextSchema } from '@/app/_graph/agent';
import { ToolMessage } from 'langchain';

// ─────────────────────────────────────────────
// contextSchema
// ─────────────────────────────────────────────
describe('contextSchema', () => {
  it('{role:"mom", due_date:"2025-12-01", stage:"pregnancy"} 解析成功', () => {
    const result = contextSchema.parse({ role: 'mom', due_date: '2025-12-01', stage: 'pregnancy' });
    expect(result).toEqual({ role: 'mom', due_date: '2025-12-01', stage: 'pregnancy' });
  });

  it('{role:"dad", due_date:"2025-12-01", stage:"pregnancy"} 解析成功', () => {
    const result = contextSchema.parse({ role: 'dad', due_date: '2025-12-01', stage: 'pregnancy' });
    expect(result.role).toBe('dad');
  });

  it('role 非法值解析失败', () => {
    const result = contextSchema.safeParse({ role: 'unknown', due_date: '2025-12-01', stage: 'pregnancy' });
    expect(result.success).toBe(false);
  });

  it('缺少 stage 解析失败', () => {
    const result = contextSchema.safeParse({ role: 'mom', due_date: '2025-12-01' });
    expect(result.success).toBe(false);
  });

  it('{} 解析失败', () => {
    const result = contextSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// handleToolErrors
// ─────────────────────────────────────────────
describe('handleToolErrors', () => {
  const mockRequest = { toolCall: { id: 'tool-call-1' }, input: {} } as any;

  it('handler 正常时透传结果', async () => {
    const result = await handleToolErrors.wrapToolCall(mockRequest, async () => 'result');
    expect(result).toBe('result');
  });

  it('handler 抛异常时返回包含 "Tool error:" 的 ToolMessage', async () => {
    const result = await handleToolErrors.wrapToolCall(mockRequest, async () => {
      throw new Error('Tool failed!');
    });
    expect(result).toBeInstanceOf(ToolMessage);
    expect((result as ToolMessage).content).toContain('Tool error:');
  });
});
