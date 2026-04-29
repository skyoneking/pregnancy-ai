import type { StageDefinition } from '../types';
import { folicAcid, weightTracking, symptomRecord } from '../rules/health-templates';
import { calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { earlyPregnancyRules } from '../rules/knowledge-rules';

export const earlyPregnancy: StageDefinition = {
  id: 'early-pregnancy',
  mainStage: 'pregnancy',
  label: '孕早期',
  description: '孕早期（1-12周），胚胎器官发育关键期，注意叶酸补充和避免有害物质',
  match: (ctx) => ctx.mainStage === 'pregnancy' && (ctx.week ?? 0) <= 12,
  knowledge: earlyPregnancyRules,
  health: [folicAcid, weightTracking, symptomRecord],
  capabilities: [calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, assessSymptom, getContextualKnowledge],
};
