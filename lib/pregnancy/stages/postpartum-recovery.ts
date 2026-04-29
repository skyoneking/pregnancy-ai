import type { StageDefinition } from '../types';
import { moodRecord, feedingRecord, symptomRecord } from '../rules/health-templates';
import { assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { recoveryRules } from '../rules/knowledge-rules';

export const postpartumRecovery: StageDefinition = {
  id: 'recovery',
  mainStage: 'postpartum',
  label: '产后恢复',
  description: '产后恢复期（0-42天），关注伤口护理、母乳喂养和身体恢复',
  match: (ctx) => ctx.mainStage === 'postpartum' && (ctx.postpartumDay ?? 0) <= 42,
  knowledge: recoveryRules,
  health: [moodRecord, feedingRecord, symptomRecord],
  capabilities: [assessSymptom, getContextualKnowledge],
};
