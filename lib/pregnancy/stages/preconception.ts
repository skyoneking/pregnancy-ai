import type { StageDefinition } from '../types';
import { folicAcid, moodRecord } from '../rules/health-templates';
import { calculatePregnancyInfo, checkFoodSafety, assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { preconceptionRules } from '../rules/knowledge-rules';

export const preconception: StageDefinition = {
  id: 'preconception',
  mainStage: 'preconception',
  label: '备孕期',
  description: '准备怀孕阶段，关注孕前健康、营养补充和排卵追踪',
  match: (ctx) => ctx.mainStage === 'preconception',
  knowledge: preconceptionRules,
  health: [folicAcid, moodRecord],
  capabilities: [calculatePregnancyInfo, checkFoodSafety, assessSymptom, getContextualKnowledge],
};
