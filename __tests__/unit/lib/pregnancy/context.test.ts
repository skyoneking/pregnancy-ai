import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContext } from '@/lib/pregnancy/context';
import type { Profile } from '@/app/_supabase/types';

// 固定当前日期为 2025-05-04
const NOW = new Date('2025-05-04T12:00:00');

describe('createContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('备孕期用户生成上下文', () => {
    const profile = makeProfile({ stage: 'preconception' });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('preconception');
    expect(ctx.subStage).toBe('preconception');
    expect(ctx.week).toBeUndefined();
    expect(ctx.postpartumDay).toBeUndefined();
    expect(ctx.stageDef).toBeDefined();
    expect(ctx.stageDef!.id).toBe('preconception');
  });

  it('孕期用户生成上下文 — 孕早期', () => {
    // 预产期 2025-09-01 → week 23, 但测试用 week 10 的场景
    // due_date = today + (280 - 10*7) = today + 210 days
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 210);
    const profile = makeProfile({ stage: 'pregnancy', due_date: due.toISOString().split('T')[0] });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('pregnancy');
    expect(ctx.subStage).toBe('early-pregnancy');
    expect(ctx.week).toBe(10);
    expect(ctx.postpartumDay).toBeUndefined();
    expect(ctx.stageDef!.mainStage).toBe('pregnancy');
  });

  it('孕期用户生成上下文 — 孕中期', () => {
    // week 20 → due = today + (280 - 140) = today + 140
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 140);
    const profile = makeProfile({ stage: 'pregnancy', due_date: due.toISOString().split('T')[0] });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('pregnancy');
    expect(ctx.subStage).toBe('mid-pregnancy');
    expect(ctx.week).toBe(20);
  });

  it('孕期用户生成上下文 — 孕晚期', () => {
    // week 32 → due = today + (280 - 224) = today + 56
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 56);
    const profile = makeProfile({ stage: 'pregnancy', due_date: due.toISOString().split('T')[0] });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('pregnancy');
    expect(ctx.subStage).toBe('late-pregnancy');
    expect(ctx.week).toBe(32);
  });

  it('产后期用户 — 恢复期', () => {
    const profile = makeProfile({ stage: 'postpartum', postpartum_date: '2025-04-20' });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('postpartum');
    expect(ctx.subStage).toBe('recovery');
    expect(ctx.postpartumDay).toBe(14);
    expect(ctx.week).toBeUndefined();
  });

  it('产后期用户 — 哺乳期', () => {
    // 43 天前
    const pp = new Date('2025-05-04');
    pp.setDate(pp.getDate() - 43);
    const profile = makeProfile({ stage: 'postpartum', postpartum_date: pp.toISOString().split('T')[0] });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBe('postpartum');
    expect(ctx.subStage).toBe('nursing');
    expect(ctx.postpartumDay).toBe(43);
  });

  it('stage 为 null 时返回通用上下文', () => {
    const profile = makeProfile({ stage: null });
    const ctx = createContext(profile);

    expect(ctx.mainStage).toBeNull();
    expect(ctx.subStage).toBeNull();
    expect(ctx.healthTemplates).toEqual([]);
    expect(ctx.capabilities).toEqual([]);
    expect(ctx.stageDef).toBeUndefined();
  });

  it('孕期孕晚期包含全部 capabilities', () => {
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 56);
    const profile = makeProfile({ stage: 'pregnancy', due_date: due.toISOString().split('T')[0] });
    const ctx = createContext(profile);

    expect(ctx.capabilities).toHaveLength(6);
  });

  it('备孕期不包含产检时间表 capability', () => {
    const profile = makeProfile({ stage: 'preconception' });
    const ctx = createContext(profile);

    expect(ctx.capabilities.some((c) => c.id === 'get_prenatal_schedule')).toBe(false);
  });
});

function makeProfile(overrides: Partial<Profile>): Profile {
  return {
    id: 'test-id',
    user_id: 'test-user-id',
    username: null,
    stage: null,
    role: null,
    due_date: null,
    postpartum_date: null,
    push_frequency: 'weekly',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
