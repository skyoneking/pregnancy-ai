import type { KnowledgeRule } from '../types';

// ─── 备孕期 ──────────────────────────────────────────────────────────────────

export const preconceptionRules: KnowledgeRule[] = [
  { id: 'pre-folic', type: 'auto', title: '叶酸补充' },
  { id: 'pre-checkup', type: 'auto', title: '孕前检查' },
  { id: 'pre-ovulation', type: 'auto', title: '排卵期计算' },
  { id: 'pre-lifestyle', type: 'on-demand', title: '生活方式调整' },
  { id: 'pre-nutrition', type: 'on-demand', title: '营养准备' },
  { id: 'pre-emotion', type: 'checklist', title: '情绪管理' },
];

// ─── 孕早期 (≤12周) ──────────────────────────────────────────────────────────

export const earlyPregnancyRules: KnowledgeRule[] = [
  { id: 'ep-weekly', type: 'auto', title: '每周发育信息' },
  { id: 'ep-folic', type: 'checklist', title: '叶酸补充' },
  { id: 'ep-symptom', type: 'on-demand', title: '早孕反应应对' },
  { id: 'ep-nt', type: 'auto', title: 'NT检查提醒' },
];

// ─── 孕中期 (13-27周) ────────────────────────────────────────────────────────

export const midPregnancyRules: KnowledgeRule[] = [
  { id: 'mp-weekly', type: 'auto', title: '每周发育信息' },
  { id: 'mp-anomaly', type: 'auto', title: '大排畸检查提醒' },
  { id: 'mp-gtt', type: 'auto', title: '糖耐量检查提醒' },
  { id: 'mp-movement', type: 'checklist', title: '胎动初感' },
  { id: 'mp-nutrition', type: 'on-demand', title: '孕中期营养' },
];

// ─── 孕晚期 (≥28周) ──────────────────────────────────────────────────────────

export const latePregnancyRules: KnowledgeRule[] = [
  { id: 'lp-weekly', type: 'auto', title: '每周发育信息' },
  { id: 'lp-movement', type: 'checklist', title: '胎动计数指导' },
  { id: 'lp-birth-prep', type: 'auto', title: '分娩准备' },
  { id: 'lp-bag', type: 'checklist', title: '待产包准备' },
  { id: 'lp-sign', type: 'auto', title: '临产征兆识别' },
];

// ─── 产后恢复 (0-42天) ───────────────────────────────────────────────────────

export const recoveryRules: KnowledgeRule[] = [
  { id: 'rc-breastfeeding', type: 'auto', title: '母乳喂养指导' },
  { id: 'rc-wound', type: 'checklist', title: '伤口护理' },
  { id: 'rc-recovery', type: 'auto', title: '产后42天恢复' },
  { id: 'rc-newborn', type: 'on-demand', title: '新生儿护理' },
  { id: 'rc-emotion', type: 'checklist', title: '产后情绪管理' },
];

// ─── 哺乳期 (43天+) ──────────────────────────────────────────────────────────

export const nursingRules: KnowledgeRule[] = [
  { id: 'nr-feeding', type: 'checklist', title: '喂养指导' },
  { id: 'nr-milestone', type: 'auto', title: '宝宝发育里程碑' },
  { id: 'nr-vaccine', type: 'auto', title: '疫苗接种提醒' },
  { id: 'nr-diet', type: 'on-demand', title: '哺乳期饮食' },
  { id: 'nr-body', type: 'on-demand', title: '身材恢复' },
];
