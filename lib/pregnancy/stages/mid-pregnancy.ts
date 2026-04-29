import type { StageDefinition } from '../types';
import { weightTracking, symptomRecord } from '../rules/health-templates';
import { calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, getPrenatalSchedule, assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { midPregnancyRules } from '../rules/knowledge-rules';

export const midPregnancy: StageDefinition = {
  id: 'mid-pregnancy',
  mainStage: 'pregnancy',
  label: '孕中期',
  description: '孕中期（13-27周），胎儿快速生长期，注意营养均衡和定期产检',
  match: (ctx) => ctx.mainStage === 'pregnancy' && (ctx.week ?? 0) >= 13 && (ctx.week ?? 0) <= 27,
  knowledge: midPregnancyRules,
  health: [weightTracking, symptomRecord],
  capabilities: [calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, getPrenatalSchedule, assessSymptom, getContextualKnowledge],
};
