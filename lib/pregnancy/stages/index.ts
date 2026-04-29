import type { MainStage, StageDefinition } from '../types';
import { preconception } from './preconception';
import { earlyPregnancy } from './early-pregnancy';
import { midPregnancy } from './mid-pregnancy';
import { latePregnancy } from './late-pregnancy';
import { postpartumRecovery } from './postpartum-recovery';
import { nursingPeriod } from './nursing-period';

// 先具体后通用，确保匹配优先级
export const stageRegistry: StageDefinition[] = [
  earlyPregnancy,
  midPregnancy,
  latePregnancy,
  postpartumRecovery,
  nursingPeriod,
  preconception,
];

// MainStage 去重选项，用于 onboarding 等场景
export interface MainStageOption {
  value: MainStage;
  label: string;
  icon: string;
  description: string;
}

export const mainStageOptions: MainStageOption[] = [
  { value: 'preconception', label: '备孕期', icon: '💊', description: '准备怀孕，获取备孕知识' },
  { value: 'pregnancy', label: '孕期', icon: '🤰', description: '已怀孕，追踪孕期变化' },
  { value: 'postpartum', label: '产后期', icon: '👶', description: '产后恢复，宝宝护理' },
];
