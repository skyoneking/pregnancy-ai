const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateWeek(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const daysRemaining = Math.round((due.getTime() - now.getTime()) / MS_PER_DAY);
  const daysPregnant = 280 - daysRemaining;
  return Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));
}

export function calculatePostpartumDay(postpartumDate: string): number {
  const now = new Date();
  const postpartum = new Date(postpartumDate);
  return Math.max(0, Math.floor((now.getTime() - postpartum.getTime()) / MS_PER_DAY));
}

export function calculatePregnancyInfo(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const daysRemaining = Math.max(0, Math.round((due.getTime() - now.getTime()) / MS_PER_DAY));
  const daysPregnant = 280 - daysRemaining;
  const currentWeek = Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));

  let stage: string;
  if (currentWeek <= 13) stage = '孕早期';
  else if (currentWeek <= 27) stage = '孕中期';
  else stage = '孕晚期';

  return { currentWeek, stage, daysRemaining };
}
