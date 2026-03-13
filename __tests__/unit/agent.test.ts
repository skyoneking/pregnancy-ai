import { describe, it, expect, vi } from 'vitest';
import { getWeather, getUserLocation, handleToolErrors, contextSchema } from '@/app/_langchain/agent';
import { ToolMessage } from 'langchain';

// ─────────────────────────────────────────────
// getUserLocation
// ─────────────────────────────────────────────
describe('getUserLocation', () => {
  it('user_id=u1 时返回上海', async () => {
    const result = await getUserLocation.invoke({}, { context: { user_id: 'u1' } } as any);
    expect(result).toBe('上海');
  });

  it('user_id=u2 时返回北京', async () => {
    const result = await getUserLocation.invoke({}, { context: { user_id: 'u2' } } as any);
    expect(result).toBe('北京');
  });

  it('user_id="" 时返回北京', async () => {
    const result = await getUserLocation.invoke({}, { context: { user_id: '' } } as any);
    expect(result).toBe('北京');
  });
});

// ─────────────────────────────────────────────
// getWeather
// ─────────────────────────────────────────────
describe('getWeather', () => {
  it('city="上海" 时返回正确天气字符串', async () => {
    const result = await getWeather.invoke({ city: '上海' }, {} as any);
    expect(result).toBe('上海天气一向不错!');
  });

  it('writer 存在时被调用，含 type:status 和 message:正在查询...', async () => {
    const writer = vi.fn();
    await getWeather.invoke({ city: '上海' }, { writer } as any);
    expect(writer).toHaveBeenCalledOnce();
    const arg = writer.mock.calls[0][0];
    expect(arg).toMatchObject({ type: 'status', message: '正在查询...' });
  });

  it('writer 为 undefined 时不抛出错误', async () => {
    await expect(
      getWeather.invoke({ city: '上海' }, { writer: undefined } as any),
    ).resolves.toBeDefined();
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

// ─────────────────────────────────────────────
// contextSchema
// ─────────────────────────────────────────────
describe('contextSchema', () => {
  it('{user_id:"u1"} 解析成功', () => {
    const parsed = contextSchema.parse({ user_id: 'u1' });
    expect(parsed).toEqual({ user_id: 'u1' });
  });

  it('{user_id:123} 解析失败', () => {
    const result = contextSchema.safeParse({ user_id: 123 });
    expect(result.success).toBe(false);
  });

  it('{} 解析失败', () => {
    const result = contextSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
