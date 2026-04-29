import type { Profile } from '@/app/_supabase/types';
import type { PregnancyContext, RawContext } from './types';
import { calculateWeek, calculatePostpartumDay } from './calculator';
import { stageRegistry } from './stages';

export function createContext(profile: Profile): PregnancyContext {
  const mainStage = profile.stage;
  let week: number | undefined;
  let postpartumDay: number | undefined;

  if (mainStage === 'pregnancy' && profile.due_date) {
    week = calculateWeek(profile.due_date);
  }

  if (mainStage === 'postpartum' && profile.postpartum_date) {
    postpartumDay = calculatePostpartumDay(profile.postpartum_date);
  }

  if (!mainStage) {
    return { mainStage: null, subStage: null, healthTemplates: [], capabilities: [] };
  }

  const raw: RawContext = { mainStage, week, postpartumDay };
  const stageDef = stageRegistry.find((s) => s.match(raw));

  if (!stageDef) {
    return { mainStage, subStage: null, week, postpartumDay, healthTemplates: [], capabilities: [] };
  }

  return {
    mainStage,
    subStage: stageDef.id,
    week,
    postpartumDay,
    stageDef,
    healthTemplates: stageDef.health,
    capabilities: stageDef.capabilities,
  };
}
