import type { StageDefinition } from '../types';
import { moodRecord, feedingRecord } from '../rules/health-templates';
import { checkFoodSafety, assessSymptom, getContextualKnowledge } from '../rules/capabilities';
import { nursingRules } from '../rules/knowledge-rules';

export const nursingPeriod: StageDefinition = {
  id: 'nursing',
  mainStage: 'postpartum',
  label: '哺乳期',
  description: '哺乳期（43天及以后），关注喂养指导、宝宝发育和妈妈恢复',
  match: (ctx) => ctx.mainStage === 'postpartum' && (ctx.postpartumDay ?? 0) >= 43,
  knowledge: nursingRules,
  health: [moodRecord, feedingRecord],
  capabilities: [checkFoodSafety, assessSymptom, getContextualKnowledge],
};
