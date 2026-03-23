import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePregnancyInfo,
  getWeeklyDevelopment,
  checkFoodSafety,
  getPrenatalSchedule,
  assessSymptom,
  getContextualKnowledge,
} from '@/app/_langchain/agent';

// Mock knowledge functions
vi.mock('@/app/lib/knowledge', () => ({
  getKnowledgeForStage: vi.fn(),
  searchKnowledgeByKeyword: vi.fn(),
}));

import { getKnowledgeForStage, searchKnowledgeByKeyword } from '@/app/lib/knowledge';

describe('AI Tools: calculatePregnancyInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('根据预产期计算当前孕周（假设今天是280天前）', async () => {
    // Mock今天为预产期前280天（孕1周）
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 279); // 280 - 1 = 279天后是预产期

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(1);
    expect(result.stage).toBe('孕早期');
    expect(result.daysRemaining).toBe(279);
  });

  it('孕13周属于孕早期', async () => {
    // 13周 = 91天，预产期前189天
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 189);

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(13);
    expect(result.stage).toBe('孕早期');
  });

  it('孕14周属于孕中期', async () => {
    // 14周 = 98天，预产期前182天
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 182);

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(14);
    expect(result.stage).toBe('孕中期');
  });

  it('孕27周属于孕中期', async () => {
    // 27周 = 189天，预产期前91天
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 91);

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(27);
    expect(result.stage).toBe('孕中期');
  });

  it('孕28周属于孕晚期', async () => {
    // 28周 = 196天，预产期前84天
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 84);

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(28);
    expect(result.stage).toBe('孕晚期');
  });

  it('预产期当天返回40周0天剩余', async () => {
    const today = new Date();
    const dueDateStr = today.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.currentWeek).toBe(40);
    expect(result.daysRemaining).toBe(0);
  });

  it('超过预产期显示0天剩余', async () => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() - 10); // 预产期已过10天

    const dueDateStr = dueDate.toISOString().split('T')[0];
    const result = JSON.parse(await calculatePregnancyInfo.invoke({ due_date: dueDateStr }));

    expect(result.daysRemaining).toBe(0);
  });
});

describe('AI Tools: getWeeklyDevelopment', () => {
  it('返回孕14周准妈妈视角信息', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 14, role: 'mom' });

    expect(result).toContain('孕14周');
    expect(result).toContain('吸吮动作');
  });

  it('返回孕14周准爸爸视角信息', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 14, role: 'dad' });

    expect(result).toContain('孕14周');
    expect(result).toContain('早孕最难受');
  });

  it('返回孕20周准妈妈视角信息', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 20, role: 'mom' });

    expect(result).toContain('孕20周');
    expect(result).toContain('听觉已发育');
    expect(result).toContain('大排畸');
  });

  it('返回孕40周准妈妈视角信息', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 40, role: 'mom' });

    expect(result).toContain('孕40周');
    expect(result).toContain('预产期');
  });

  it('不在数据中的孕周自动选择最近的周数', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 15, role: 'mom' });

    // 应该返回14周或16周的信息（15距离14和16都是1，应该选择较小的14）
    expect(result).toMatch(/孕1[46]周/);
  });

  it('所有返回信息包含免责声明', async () => {
    const result = await getWeeklyDevelopment.invoke({ week: 20, role: 'mom' });

    expect(result).toContain('以上为孕');
    expect(result).toContain('参考信息');
    expect(result).toContain('以医生检查结果为准');
  });
});

describe('AI Tools: checkFoodSafety', () => {
  it('安全食物：苹果', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '苹果' }));

    expect(result.food).toBe('苹果');
    expect(result.level).toBe('安全');
    expect(result.reason).toContain('维生素C');
    expect(result.disclaimer).toContain('以上仅供参考');
  });

  it('安全食物：鸡蛋', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '鸡蛋' }));

    expect(result.level).toBe('安全');
    expect(result.reason).toContain('全熟');
  });

  it('适量食物：坚果', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '坚果' }));

    expect(result.level).toBe('适量');
    expect(result.reason).toContain('一小把');
  });

  it('避免食物：螃蟹', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '螃蟹' }));

    expect(result.level).toBe('避免');
    expect(result.reason).toContain('性寒');
  });

  it('禁止食物：酒精', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '酒精' }));

    expect(result.level).toBe('禁止');
    expect(result.reason).toContain('胎儿酒精综合症');
  });

  it('未知食物返回未知等级', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '未知食物xyz' }));

    expect(result.food).toBe('未知食物xyz');
    expect(result.level).toBe('未知');
    expect(result.disclaimer).toContain('以上仅供参考');
  });

  it('所有结果包含免责声明', async () => {
    const result = JSON.parse(await checkFoodSafety.invoke({ food_name: '苹果' }));

    expect(result.disclaimer).toBe('以上仅供参考，不构成医疗诊断，请以医生意见为准');
  });
});

describe('AI Tools: getPrenatalSchedule', () => {
  it('孕6周返回建档检查为即将进行', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 6 }));

    expect(result.currentWeek).toBe(6);
    expect(result.next).toBeDefined();
    expect(result.next?.name).toBe('建档检查');
  });

  it('孕12周NT检查为即将进行', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 12 }));

    expect(result.next?.name).toBe('NT检查');
  });

  it('孕20周唐氏筛查为即将进行（15-20周）', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 20 }));

    // 孕20周时，唐氏筛查（15-20周）仍在即将进行范围内（start-4=11，20>=11）
    expect(result.next?.name).toBe('唐氏筛查');
  });

  it('孕25周糖耐量检查为即将进行（24-28周）', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 25 }));

    // 孕25周时，糖耐量检查（24-28周）在即将进行范围内（start-4=20，25>=20）
    expect(result.next?.name).toBe('糖耐量检查（OGTT）');
  });

  it('孕40周返回每周产检', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 40 }));

    expect(result.next?.name).toBe('每周产检');
  });

  it('孕10周已完成建档检查（假设）', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 10 }));

    // 孕10周时，建档检查（6-8周）应该已完成
    const completedNames = result.completed.map((c: any) => c.name);
    expect(completedNames).toContain('建档检查');
  });

  it('孕30周已完成多个早期检查', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 30 }));

    const completedNames = result.completed.map((c: any) => c.name);
    expect(completedNames.length).toBeGreaterThan(3);
    expect(completedNames).toContain('建档检查');
    expect(completedNames).toContain('NT检查');
  });

  it('所有结果包含免责声明', async () => {
    const result = JSON.parse(await getPrenatalSchedule.invoke({ current_week: 20 }));

    expect(result.disclaimer).toContain('仅供参考');
    expect(result.disclaimer).toContain('遵医嘱');
  });
});

describe('AI Tools: assessSymptom', () => {
  it('急诊症状：大量出血', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '大量出血' }));

    expect(result.level).toBe('🔴急诊');
    expect(result.advice).toContain('立即拨打120');
  });

  it('急诊症状：破水', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '破水' }));

    expect(result.level).toBe('🔴急诊');
    expect(result.advice).toContain('急诊');
  });

  it('急诊症状：剧烈头痛视物模糊', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '剧烈头痛视物模糊' }));

    expect(result.level).toBe('🔴急诊');
  });

  it('就医症状：出血（非大量）', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '有出血' }));

    expect(result.level).toBe('🟠就医');
    expect(result.advice).toContain('24-48小时内就医');
  });

  it('就医症状：胎动减少', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '感觉胎动减少' }));

    expect(result.level).toBe('🟠就医');
  });

  it('观察症状：偶尔腹胀', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '偶尔腹胀' }));

    expect(result.level).toBe('🟡观察');
    expect(result.advice).toContain('注意观察');
  });

  it('正常症状：孕吐', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '孕吐' }));

    expect(result.level).toBe('🟢正常');
    expect(result.advice).toContain('正常');
  });

  it('正常症状：乳房胀痛', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '乳房胀痛' }));

    expect(result.level).toBe('🟢正常');
  });

  it('未知症状默认为观察级别（宁严勿松）', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '未知症状xyz' }));

    expect(result.level).toBe('🟡观察');
    expect(result.advice).toContain('暂无明确参考');
  });

  it('所有结果包含免责声明', async () => {
    const result = JSON.parse(await assessSymptom.invoke({ symptom: '孕吐' }));

    expect(result.disclaimer).toContain('以上仅供参考');
  });
});

describe('AI Tools: getContextualKnowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('备孕期返回自动推送的知识', async () => {
    const mockKnowledge = [
      {
        id: 'pre-1',
        title: '叶酸补充',
        content: '孕前3个月开始补充叶酸...',
        stage: 'preconception' as const,
        tags: ['营养'],
        autoPush: true,
      },
    ];

    vi.mocked(getKnowledgeForStage).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'preconception' }));

    expect(getKnowledgeForStage).toHaveBeenCalledWith('preconception', undefined, undefined);
    expect(result.knowledge).toHaveLength(1);
    expect(result.knowledge[0].title).toBe('叶酸补充');
    expect(result.count).toBe(1);
  });

  it('孕期+孕周返回对应周数知识', async () => {
    const mockKnowledge = [
      {
        id: 'preg-w5',
        title: '孕5周: 孕早期',
        content: '心脏开始跳动...',
        stage: 'pregnancy' as const,
        week: 5,
        tags: ['发育'],
        autoPush: false,
      },
    ];

    vi.mocked(getKnowledgeForStage).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'pregnancy', week: 5 }));

    expect(getKnowledgeForStage).toHaveBeenCalledWith('pregnancy', 5, undefined);
    expect(result.knowledge).toHaveLength(1);
    expect(result.knowledge[0].title).toContain('孕5周');
  });

  it('产后期+产后天数返回相关知识', async () => {
    const mockKnowledge = [
      {
        id: 'post-2',
        title: '母乳喂养指导',
        content: '正确含接姿势...',
        stage: 'postpartum' as const,
        postpartumDay: 7,
        tags: ['哺乳'],
        autoPush: true,
      },
    ];

    vi.mocked(getKnowledgeForStage).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({
      stage: 'postpartum',
      postpartumDay: 7,
    }));

    expect(getKnowledgeForStage).toHaveBeenCalledWith('postpartum', undefined, 7);
    expect(result.knowledge).toHaveLength(1);
    expect(result.knowledge[0].title).toContain('母乳喂养');
  });

  it('使用关键词搜索知识', async () => {
    const mockKnowledge = [
      {
        id: 'pre-1',
        title: '叶酸补充',
        content: '孕前3个月开始补充叶酸...',
        stage: 'preconception' as const,
        tags: ['营养'],
        autoPush: true,
      },
    ];

    vi.mocked(searchKnowledgeByKeyword).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({
      stage: 'preconception',
      keyword: '叶酸',
    }));

    expect(searchKnowledgeByKeyword).toHaveBeenCalledWith('叶酸');
    expect(result.knowledge).toHaveLength(1);
    expect(result.knowledge[0].title).toBe('叶酸补充');
  });

  it('无相关知识时返回提示消息', async () => {
    vi.mocked(getKnowledgeForStage).mockReturnValue([]);

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'preconception' }));

    expect(result.message).toBe('暂无相关知识');
    expect(result.disclaimer).toContain('以上仅供参考');
  });

  it('知识内容只返回前3行（避免内容过长）', async () => {
    const mockKnowledge = [
      {
        id: 'pre-1',
        title: '叶酸补充',
        content: '第一行\n第二行\n第三行\n第四行\n第五行',
        stage: 'preconception' as const,
        tags: ['营养'],
        autoPush: true,
      },
    ];

    vi.mocked(getKnowledgeForStage).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'preconception' }));

    const contentLines = result.knowledge[0].content.split('\n');
    expect(contentLines.length).toBeLessThanOrEqual(3);
  });

  it('异常情况返回错误信息', async () => {
    vi.mocked(getKnowledgeForStage).mockImplementation(() => {
      throw new Error('数据库连接失败');
    });

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'preconception' }));

    expect(result.error).toBe('获取知识失败');
    expect(result.message).toContain('数据库连接失败');
    expect(result.disclaimer).toContain('以上仅供参考');
  });

  it('所有返回结果包含免责声明', async () => {
    const mockKnowledge = [
      {
        id: 'pre-1',
        title: '叶酸补充',
        content: '孕前3个月开始补充叶酸...',
        stage: 'preconception' as const,
        tags: ['营养'],
        autoPush: true,
      },
    ];

    vi.mocked(getKnowledgeForStage).mockReturnValue(mockKnowledge);

    const result = JSON.parse(await getContextualKnowledge.invoke({ stage: 'preconception' }));

    expect(result.disclaimer).toContain('以上仅供参考');
    expect(result.disclaimer).toContain('不构成医疗诊断');
  });
});
