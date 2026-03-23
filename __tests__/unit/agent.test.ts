import { describe, it, expect, vi } from 'vitest';
import {
  calculatePregnancyInfo,
  getWeeklyDevelopment,
  checkFoodSafety,
  getPrenatalSchedule,
  assessSymptom,
  handleToolErrors,
  contextSchema,
} from '@/app/_langchain/agent';
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

// ─────────────────────────────────────────────
// calculatePregnancyInfo
// ─────────────────────────────────────────────
describe('calculatePregnancyInfo', () => {
  it('预产期为40周后，返回孕1周或合理周数', async () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 280);
    const result = await calculatePregnancyInfo.invoke({ due_date: farFuture.toISOString().split('T')[0] });
    const parsed = JSON.parse(result);
    expect(parsed.currentWeek).toBeGreaterThanOrEqual(1);
    expect(parsed.currentWeek).toBeLessThanOrEqual(42);
  });

  it('孕早期（≤13周）阶段标签正确', async () => {
    // 孕8周 = 距预产期约32周 = 224天后
    const due = new Date();
    due.setDate(due.getDate() + 224);
    const result = await calculatePregnancyInfo.invoke({ due_date: due.toISOString().split('T')[0] });
    const parsed = JSON.parse(result);
    expect(parsed.stage).toBe('孕早期');
  });

  it('孕中期（14-27周）阶段标签正确', async () => {
    // 孕20周 = 距预产期20周 = 140天
    const due = new Date();
    due.setDate(due.getDate() + 140);
    const result = await calculatePregnancyInfo.invoke({ due_date: due.toISOString().split('T')[0] });
    const parsed = JSON.parse(result);
    expect(parsed.stage).toBe('孕中期');
  });

  it('孕晚期（≥28周）阶段标签正确', async () => {
    // 孕30周 = 距预产期10周 = 70天
    const due = new Date();
    due.setDate(due.getDate() + 70);
    const result = await calculatePregnancyInfo.invoke({ due_date: due.toISOString().split('T')[0] });
    const parsed = JSON.parse(result);
    expect(parsed.stage).toBe('孕晚期');
  });

  it('返回 daysRemaining 字段且 ≥ 0', async () => {
    const due = new Date();
    due.setDate(due.getDate() + 100);
    const result = await calculatePregnancyInfo.invoke({ due_date: due.toISOString().split('T')[0] });
    const parsed = JSON.parse(result);
    expect(parsed.daysRemaining).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────
// getWeeklyDevelopment
// ─────────────────────────────────────────────
describe('getWeeklyDevelopment', () => {
  it('准妈妈和准爸爸返回不同内容', async () => {
    const momResult = await getWeeklyDevelopment.invoke({ week: 20, role: 'mom' });
    const dadResult = await getWeeklyDevelopment.invoke({ week: 20, role: 'dad' });
    expect(momResult).not.toBe(dadResult);
  });

  it('返回内容包含免责声明', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 20, role: 'mom' });
    expect(result).toContain('以医生检查结果为准');
  });

  it('未收录孕周自动匹配最近的周数', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 15, role: 'mom' });
    expect(result).toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// checkFoodSafety
// ─────────────────────────────────────────────
describe('checkFoodSafety', () => {
  it('苹果 返回安全等级', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '苹果' }));
    expect(result.level).toBe('安全');
  });

  it('酒精 返回禁止等级', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '酒精' }));
    expect(result.level).toBe('禁止');
  });

  it('未知食物返回"未知"等级', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '外星果' }));
    expect(result.level).toBe('未知');
  });

  it('所有结果包含 disclaimer 字段', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '苹果' }));
    expect(result.disclaimer).toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// getPrenatalSchedule
// ─────────────────────────────────────────────
describe('getPrenatalSchedule', () => {
  it('孕8周时建档检查在 upcoming 中', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 8 }));
    const allItems = [...result.completed, ...result.upcoming];
    expect(allItems.some((i: { name: string }) => i.name === '建档检查')).toBe(true);
  });

  it('孕30周时 NT 检查在 completed 中', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 30 }));
    expect(result.completed.some((i: { name: string }) => i.name === 'NT检查')).toBe(true);
  });

  it('返回 disclaimer 字段', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 20 }));
    expect(result.disclaimer).toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// assessSymptom
// ─────────────────────────────────────────────
describe('assessSymptom', () => {
  it('大量出血 → 🔴急诊', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '大量出血，肚子很痛', current_week: 20 }));
    expect(result.level).toBe('🔴急诊');
  });

  it('出血 → 🟠就医', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '有一点出血', current_week: 10 }));
    expect(result.level).toBe('🟠就医');
  });

  it('孕吐 → 🟢正常', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '有孕吐和恶心', current_week: 8 }));
    expect(result.level).toBe('🟢正常');
  });

  it('未知症状 → 至少🟡观察（宁严勿松）', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '脚有点麻', current_week: 20 }));
    expect(['🟡观察', '🟠就医', '🔴急诊']).toContain(result.level);
  });

  it('所有结果包含 disclaimer 字段', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '孕吐', current_week: 8 }));
    expect(result.disclaimer).toBeTruthy();
    expect(result.disclaimer).toContain('不构成医疗诊断');
  });
});
