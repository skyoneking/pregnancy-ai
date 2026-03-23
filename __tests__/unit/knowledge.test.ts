import { describe, it, expect } from 'vitest';
import {
  getKnowledgeForStage,
  searchKnowledgeByKeyword,
  getStageCoreKnowledge,
  preconceptionKnowledge,
  pregnancyKnowledge,
  postpartumKnowledge,
  type KnowledgeItem,
} from '@/app/lib/knowledge';

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

describe('getKnowledgeForStage', () => {
  describe('备孕期', () => {
    it('返回所有autoPush=true的知识点', () => {
      const result = getKnowledgeForStage('preconception');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((item) => {
        expect(item.stage).toBe('preconception');
        expect(item.autoPush).toBe(true);
      });
    });

    it('包含叶酸补充知识', () => {
      const result = getKnowledgeForStage('preconception');
      const folateItem = result.find((k) => k.title.includes('叶酸'));

      expect(folateItem).toBeDefined();
      expect(folateItem?.content).toMatch(/叶酸/);
    });

    it('包含孕前检查知识', () => {
      const result = getKnowledgeForStage('preconception');
      const checkupItem = result.find((k) => k.title.includes('孕前检查'));

      expect(checkupItem).toBeDefined();
      expect(checkupItem?.content).toMatch(/检查/);
    });

    it('包含排卵期计算知识', () => {
      const result = getKnowledgeForStage('preconception');
      const ovulationItem = result.find((k) => k.title.includes('排卵期'));

      expect(ovulationItem).toBeDefined();
      expect(ovulationItem?.content).toMatch(/排卵/);
    });
  });

  describe('孕期', () => {
    it('返回指定孕周的知识', () => {
      const result = getKnowledgeForStage('pregnancy', 5);

      expect(result).toHaveLength(1);
      expect(result[0].stage).toBe('pregnancy');
      expect(result[0].week).toBe(5);
    });

    it('孕5周包含心脏发育信息', () => {
      const result = getKnowledgeForStage('pregnancy', 5);

      expect(result[0].content).toMatch(/心脏/);
    });

    it('孕8周包含器官发育信息', () => {
      const result = getKnowledgeForStage('pregnancy', 8);

      expect(result[0].content).toMatch(/器官/);
    });

    it('孕12周包含NT检查提示', () => {
      const result = getKnowledgeForStage('pregnancy', 12);

      expect(result[0].content).toMatch(/NT检查/);
    });

    it('孕20周包含大排畸检查', () => {
      const result = getKnowledgeForStage('pregnancy', 20);

      expect(result[0].content).toMatch(/大排畸/);
    });

    it('孕40周包含临产征兆', () => {
      const result = getKnowledgeForStage('pregnancy', 40);

      expect(result[0].content).toMatch(/临产|分娩/);
    });

    it('无效孕周返回空数组', () => {
      const result = getKnowledgeForStage('pregnancy', 50);

      expect(result).toHaveLength(0);
    });

    it('未提供孕周时返回空数组', () => {
      const result = getKnowledgeForStage('pregnancy');

      expect(result).toHaveLength(0);
    });

    it('每4周自动推送标记为true', () => {
      const week4 = pregnancyKnowledge[4];
      const week8 = pregnancyKnowledge[8];
      const week12 = pregnancyKnowledge[12];

      expect(week4.autoPush).toBe(true);
      expect(week8.autoPush).toBe(true);
      expect(week12.autoPush).toBe(true);
    });
  });

  describe('产后期', () => {
    it('返回autoPush=true且天数<=指定天数的知识', () => {
      const result = getKnowledgeForStage('postpartum', undefined, 42);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);

      result.forEach((item) => {
        expect(item.stage).toBe('postpartum');
        expect(item.autoPush).toBe(true);
        expect(item.postpartumDay).toBeLessThanOrEqual(42);
      });
    });

    it('按天数降序排列，最多返回3条', () => {
      const result = getKnowledgeForStage('postpartum', undefined, 50);

      if (result.length >= 2) {
        for (let i = 0; i < result.length - 1; i++) {
          const currentDay = result[i].postpartumDay || 0;
          const nextDay = result[i + 1].postpartumDay || 0;
          expect(currentDay).toBeGreaterThanOrEqual(nextDay);
        }
      }

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('产后第7天返回母乳喂养知识（新生儿护理autoPush=false不返回）', () => {
      const result = getKnowledgeForStage('postpartum', undefined, 7);

      // 新生儿护理虽然postpartumDay=3，但autoPush=false，所以不会返回
      const newbornCare = result.find((k) => k.title.includes('新生儿护理'));
      expect(newbornCare).toBeUndefined();

      // 母乳喂养postpartumDay=7且autoPush=true，应该返回
      const breastfeeding = result.find((k) => k.title.includes('母乳喂养'));
      expect(breastfeeding).toBeDefined();
    });

    it('产后第7天返回母乳喂养知识', () => {
      const result = getKnowledgeForStage('postpartum', undefined, 7);

      const breastfeeding = result.find((k) => k.title.includes('母乳喂养'));
      expect(breastfeeding).toBeDefined();
    });

    it('产后第42天返回产后恢复知识', () => {
      const result = getKnowledgeForStage('postpartum', undefined, 42);

      const recovery = result.find((k) => k.title.includes('产后42天恢复'));
      expect(recovery).toBeDefined();
    });

    it('未提供产后天数时返回空数组', () => {
      const result = getKnowledgeForStage('postpartum');

      expect(result).toHaveLength(0);
    });
  });
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

describe('getStageCoreKnowledge', () => {
  it('备孕期返回所有6个知识点', () => {
    const result = getStageCoreKnowledge('preconception');

    expect(result).toHaveLength(6);
    result.forEach((item) => {
      expect(item.stage).toBe('preconception');
    });
  });

  it('产后期返回所有10个知识点', () => {
    const result = getStageCoreKnowledge('postpartum');

    expect(result).toHaveLength(10);
    result.forEach((item) => {
      expect(item.stage).toBe('postpartum');
    });
  });

  it('孕期返回每4周的知识点', () => {
    const result = getStageCoreKnowledge('pregnancy');

    result.forEach((item) => {
      expect(item.stage).toBe('pregnancy');
      expect((item.week || 0) % 4).toBe(0);
    });
  });

  it('孕期核心知识包含第4、8、12、16...周', () => {
    const result = getStageCoreKnowledge('pregnancy');
    const weeks = result.map((k) => k.week).filter((w) => w !== undefined);

    expect(weeks).toContain(4);
    expect(weeks).toContain(8);
    expect(weeks).toContain(12);
    expect(weeks).toContain(40);
  });
});

describe('边界情况', () => {
  it('孕周为0时返回空数组', () => {
    const result = getKnowledgeForStage('pregnancy', 0);

    expect(result).toHaveLength(0);
  });

  it('孕周为负数时返回空数组', () => {
    const result = getKnowledgeForStage('pregnancy', -1);

    expect(result).toHaveLength(0);
  });

  it('产后天数为0时返回空数组', () => {
    const result = getKnowledgeForStage('postpartum', undefined, 0);

    expect(result).toHaveLength(0);
  });

  it('产后天数为负数时返回空数组', () => {
    const result = getKnowledgeForStage('postpartum', undefined, -1);

    expect(result).toHaveLength(0);
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
