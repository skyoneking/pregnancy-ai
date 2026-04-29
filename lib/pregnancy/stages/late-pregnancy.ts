import type { StageDefinition } from '../types';
import { weightTracking, symptomRecord, fetalMovement } from '../rules/health-templates';
import { calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, getPrenatalSchedule, assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { latePregnancyRules } from '../rules/knowledge-rules';

export const latePregnancy: StageDefinition = {
  id: 'late-pregnancy',
  mainStage: 'pregnancy',
  label: '孕晚期',
  description: '孕晚期（28周及以后），注意胎动计数、分娩准备和临产征兆',
  match: (ctx) => ctx.mainStage === 'pregnancy' && (ctx.week ?? 0) >= 28,
  knowledge: latePregnancyRules,
  health: [weightTracking, symptomRecord, fetalMovement],
  capabilities: [calculatePregnancyInfo, getWeeklyDevelopment, checkFoodSafety, getPrenatalSchedule, assessSymptom, getContextualKnowledge],
};
