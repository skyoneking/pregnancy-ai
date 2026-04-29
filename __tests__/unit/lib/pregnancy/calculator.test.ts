import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateWeek, calculatePostpartumDay, calculatePregnancyInfo } from '@/lib/pregnancy/calculator';

describe('calculateWeek', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('正常计算孕周', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    // 预产期 2025-09-01, daysRemaining = 120, daysPregnant = 160, week = ceil(160/7) = 23
    expect(calculateWeek('2025-09-01')).toBe(23);
  });

  it('孕周最小值为 1', () => {
    vi.setSystemTime(new Date('2026-01-01'));
    // 预产期远在未来，计算结果 < 1
    expect(calculateWeek('2027-12-01')).toBe(1);
  });

  it('孕周最大值为 42', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    // 预产期已过，计算结果 > 42
    expect(calculateWeek('2024-01-01')).toBe(42);
  });

  it('预产期正好是今天时返回 40', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    // daysRemaining = 0, daysPregnant = 280, week = ceil(280/7) = 40
    expect(calculateWeek('2025-05-04')).toBe(40);
  });

  it('边界值: 孕早期上限 week=12', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    // 需要 week = 12, daysPregnant = 12*7 = 84, daysRemaining = 280-84 = 196
    // due = today + 196 days
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 196);
    const dueStr = due.toISOString().split('T')[0];
    expect(calculateWeek(dueStr)).toBe(12);
  });
});

describe('calculatePostpartumDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('正常计算产后天数', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    expect(calculatePostpartumDay('2025-04-20')).toBe(14);
  });

  it('产后天数 = 0（当天生产）', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    expect(calculatePostpartumDay('2025-05-04')).toBe(0);
  });

  it('生产日期在未来时返回 0', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    expect(calculatePostpartumDay('2025-06-01')).toBe(0);
  });

  it('产后 42 天（恢复期/哺乳期边界）', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    expect(calculatePostpartumDay('2025-03-23')).toBe(42);
  });

  it('产后 43 天（进入哺乳期）', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    expect(calculatePostpartumDay('2025-03-22')).toBe(43);
  });
});

describe('calculatePregnancyInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('孕13周属于孕早期', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    // daysRemaining = 189, daysPregnant = 91, week = ceil(91/7) = 13
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 189);
    const dueStr = due.toISOString().split('T')[0];
    const info = calculatePregnancyInfo(dueStr);
    expect(info.currentWeek).toBe(13);
    expect(info.stage).toBe('孕早期');
    expect(info.daysRemaining).toBe(189);
  });

  it('孕14周属于孕中期', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 182);
    const dueStr = due.toISOString().split('T')[0];
    const info = calculatePregnancyInfo(dueStr);
    expect(info.currentWeek).toBe(14);
    expect(info.stage).toBe('孕中期');
  });

  it('孕28周属于孕晚期', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    const due = new Date('2025-05-04');
    due.setDate(due.getDate() + 84);
    const dueStr = due.toISOString().split('T')[0];
    const info = calculatePregnancyInfo(dueStr);
    expect(info.currentWeek).toBe(28);
    expect(info.stage).toBe('孕晚期');
  });

  it('预产期已过 daysRemaining 为 0', () => {
    vi.setSystemTime(new Date('2025-05-04'));
    const info = calculatePregnancyInfo('2024-01-01');
    expect(info.daysRemaining).toBe(0);
    expect(info.currentWeek).toBe(40);
    expect(info.stage).toBe('孕晚期');
  });
});
