import type { Stage } from '@/app/_supabase/types';

export type MainStage = Stage;

export type SubStage =
  | 'preconception'
  | 'early-pregnancy'
  | 'mid-pregnancy'
  | 'late-pregnancy'
  | 'recovery'
  | 'nursing';

export interface FieldDef {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'date';
  unit?: string;
  options?: string[];
}

export interface HealthTemplate {
  id: string;
  label: string;
  fields: FieldDef[];
}

export interface KnowledgeRule {
  id: string;
  type: 'auto' | 'checklist' | 'on-demand';
  title: string;
}

export interface Capability {
  id: string;
  label: string;
}

export interface RawContext {
  mainStage: MainStage | null;
  week?: number;
  postpartumDay?: number;
}

export interface StageDefinition {
  id: SubStage;
  mainStage: MainStage;
  label: string;
  description: string;
  match: (ctx: RawContext) => boolean;
  knowledge: KnowledgeRule[];
  health: HealthTemplate[];
  capabilities: Capability[];
}

export interface PregnancyContext {
  mainStage: MainStage | null;
  subStage: SubStage | null;
  week?: number;
  postpartumDay?: number;
  stageDef?: StageDefinition;
  healthTemplates: HealthTemplate[];
  capabilities: Capability[];
}
