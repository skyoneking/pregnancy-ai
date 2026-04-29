import { describe, it, expect } from 'vitest';
import { stageRegistry } from '@/lib/pregnancy/stages';
import type { RawContext } from '@/lib/pregnancy/types';

describe('stageRegistry', () => {
  it('包含 6 个子阶段', () => {
    expect(stageRegistry).toHaveLength(6);
  });

  it('包含所有必需的 SubStage id', () => {
    const ids = stageRegistry.map((s) => s.id);
    expect(ids).toContain('preconception');
    expect(ids).toContain('early-pregnancy');
    expect(ids).toContain('mid-pregnancy');
    expect(ids).toContain('late-pregnancy');
    expect(ids).toContain('recovery');
    expect(ids).toContain('nursing');
  });

  it('每个阶段定义包含完整字段', () => {
    for (const stage of stageRegistry) {
      expect(stage.id).toBeTruthy();
      expect(stage.mainStage).toBeTruthy();
      expect(stage.label).toBeTruthy();
      expect(stage.description).toBeTruthy();
      expect(typeof stage.match).toBe('function');
      expect(Array.isArray(stage.knowledge)).toBe(true);
      expect(Array.isArray(stage.health)).toBe(true);
      expect(Array.isArray(stage.capabilities)).toBe(true);
    }
  });
});

describe('阶段匹配互斥', () => {
  function findMatch(ctx: RawContext) {
    return stageRegistry.filter((s) => s.match(ctx));
  }

  it('备孕期只匹配 preconception', () => {
    const matches = findMatch({ mainStage: 'preconception' });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('preconception');
  });

  it('孕期 12 周匹配孕早期', () => {
    const matches = findMatch({ mainStage: 'pregnancy', week: 12 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('early-pregnancy');
  });

  it('孕期 13 周匹配孕中期', () => {
    const matches = findMatch({ mainStage: 'pregnancy', week: 13 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('mid-pregnancy');
  });

  it('孕期 27 周匹配孕中期', () => {
    const matches = findMatch({ mainStage: 'pregnancy', week: 27 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('mid-pregnancy');
  });

  it('孕期 28 周匹配孕晚期', () => {
    const matches = findMatch({ mainStage: 'pregnancy', week: 28 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('late-pregnancy');
  });

  it('产后 42 天匹配恢复期', () => {
    const matches = findMatch({ mainStage: 'postpartum', postpartumDay: 42 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('recovery');
  });

  it('产后 43 天匹配哺乳期', () => {
    const matches = findMatch({ mainStage: 'postpartum', postpartumDay: 43 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('nursing');
  });

  it('孕期 1 周匹配孕早期', () => {
    const matches = findMatch({ mainStage: 'pregnancy', week: 1 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('early-pregnancy');
  });

  it('产后 0 天匹配恢复期', () => {
    const matches = findMatch({ mainStage: 'postpartum', postpartumDay: 0 });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('recovery');
  });
});

describe('健康数据模板', () => {
  it('孕晚期包含胎动计数模板', () => {
    const stage = stageRegistry.find((s) => s.id === 'late-pregnancy')!;
    expect(stage.health.some((h) => h.id === 'fetal-movement')).toBe(true);
    const tmpl = stage.health.find((h) => h.id === 'fetal-movement')!;
    expect(tmpl.fields.map((f) => f.name)).toContain('movement_count');
    expect(tmpl.fields.map((f) => f.name)).toContain('duration_minutes');
    expect(tmpl.fields.map((f) => f.name)).toContain('notes');
  });

  it('孕早期不包含胎动计数模板', () => {
    const stage = stageRegistry.find((s) => s.id === 'early-pregnancy')!;
    expect(stage.health.some((h) => h.id === 'fetal-movement')).toBe(false);
  });
});

describe('能力控制', () => {
  it('孕晚期包含全部 6 个工具', () => {
    const stage = stageRegistry.find((s) => s.id === 'late-pregnancy')!;
    expect(stage.capabilities).toHaveLength(6);
  });

  it('备孕期不包含产检时间表', () => {
    const stage = stageRegistry.find((s) => s.id === 'preconception')!;
    expect(stage.capabilities.some((c) => c.id === 'get_prenatal_schedule')).toBe(false);
  });
});
