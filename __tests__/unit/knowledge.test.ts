import { describe, it, expect } from 'vitest';
import {
  searchKnowledgeByKeyword,
  preconceptionKnowledge,
  pregnancyKnowledge,
  postpartumKnowledge,
  type KnowledgeItem,
} from '@/app/_graph/knowledge';

describe('知识库数据结构', () => {
  it('备孕期知识包含6个知识点', () => {
    expect(preconceptionKnowledge).toHaveLength(6);
  });

  it('孕期知识包含1-42周', () => {
    const weeks = Object.keys(pregnancyKnowledge).map(Number);
    expect(weeks).toHaveLength(42);
    expect(Math.min(...weeks)).toBe(1);
    expect(Math.max(...weeks)).toBe(42);
  });

  it('产后期知识包含10个知识点', () => {
    expect(postpartumKnowledge).toHaveLength(10);
  });

  it('所有知识内容包含医学免责声明', () => {
    const allKnowledge: KnowledgeItem[] = [
      ...preconceptionKnowledge,
      ...Object.values(pregnancyKnowledge),
      ...postpartumKnowledge,
    ];

    allKnowledge.forEach((item) => {
      expect(item.content).toMatch(/以上仅供参考|请以医生意见为准|请咨询医生|请咨询营养师|请勇敢寻求帮助|可治疗的|产后抑郁症是可治疗的/);
    });
  });
});

describe('getKnowledgeForStage 已迁至 tools.ts', () => {
  // getKnowledgeForStage 和 getStageCoreKnowledge 的逻辑
  // 已从 knowledge.ts 迁入 tools.ts，相关测试见 graph-tools.test.ts
  it.todo('getKnowledgeForStage 测试已迁移');
});

describe('searchKnowledgeByKeyword', () => {
  it('搜索"叶酸"返回包含叶酸的知识', () => {
    const result = searchKnowledgeByKeyword('叶酸');

    expect(result.length).toBeGreaterThan(0);
    result.forEach((item) => {
      const match =
        item.title.includes('叶酸') ||
        item.content.includes('叶酸') ||
        item.tags.some((tag) => tag.includes('叶酸'));
      expect(match).toBe(true);
    });
  });

  it('搜索"排卵"返回包含排卵的知识', () => {
    const result = searchKnowledgeByKeyword('排卵');

    expect(result.length).toBeGreaterThan(0);
    result.forEach((item) => {
      const match =
        item.title.includes('排卵') ||
        item.content.includes('排卵') ||
        item.tags.some((tag) => tag.includes('排卵'));
      expect(match).toBe(true);
    });
  });

  it('搜索"检查"返回包含检查的知识', () => {
    const result = searchKnowledgeByKeyword('检查');

    expect(result.length).toBeGreaterThan(0);
  });

  it('搜索"疫苗"返回产后疫苗接种知识', () => {
    const result = searchKnowledgeByKeyword('疫苗');

    expect(result.length).toBeGreaterThan(0);
    const vaccineItem = result.find((k) => k.title.includes('疫苗'));
    expect(vaccineItem).toBeDefined();
  });

  it('搜索"发育"返回发育相关知识', () => {
    const result = searchKnowledgeByKeyword('发育');

    expect(result.length).toBeGreaterThan(0);
  });

  it('标题匹配优先于内容匹配', () => {
    const result = searchKnowledgeByKeyword('叶酸');

    // 第一条应该是标题匹配的
    if (result.length > 0) {
      const first = result[0];
      const titleMatch = first.title.toLowerCase().includes('叶酸');
      expect(titleMatch).toBe(true);
    }
  });

  it('最多返回3条结果', () => {
    const result = searchKnowledgeByKeyword('营养');

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('不区分大小写', () => {
    const result1 = searchKnowledgeByKeyword('叶酸');
    const result2 = searchKnowledgeByKeyword('叶酸'.toUpperCase());

    expect(result1).toHaveLength(result2.length);
  });

  it('搜索不存在的关键词返回空数组', () => {
    const result = searchKnowledgeByKeyword('不存在的关键词xyz123');

    expect(result).toHaveLength(0);
  });

  it('搜索空字符串返回结果（空字符串匹配所有）', () => {
    const result = searchKnowledgeByKeyword('');

    // 空字符串会匹配所有内容，返回最多3条
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe('知识项完整性', () => {
  it('所有知识项包含必需字段', () => {
    const allKnowledge: KnowledgeItem[] = [
      ...preconceptionKnowledge,
      ...Object.values(pregnancyKnowledge),
      ...postpartumKnowledge,
    ];

    allKnowledge.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.content).toBeDefined();
      expect(item.stage).toBeDefined();
      expect(item.tags).toBeDefined();
      expect(Array.isArray(item.tags)).toBe(true);
    });
  });

  it('孕期知识项包含week字段', () => {
    Object.values(pregnancyKnowledge).forEach((item) => {
      expect(item.week).toBeDefined();
      expect(item.week).toBeGreaterThan(0);
      expect(item.week).toBeLessThanOrEqual(42);
    });
  });

  it('产后期知识项包含postpartumDay字段', () => {
    postpartumKnowledge.forEach((item) => {
      expect(item.postpartumDay).toBeDefined();
      expect(item.postpartumDay).toBeGreaterThan(0);
    });
  });

  it('tags数组不为空', () => {
    const allKnowledge: KnowledgeItem[] = [
      ...preconceptionKnowledge,
      ...Object.values(pregnancyKnowledge),
      ...postpartumKnowledge,
    ];

    allKnowledge.forEach((item) => {
      expect(item.tags.length).toBeGreaterThan(0);
    });
  });
});
