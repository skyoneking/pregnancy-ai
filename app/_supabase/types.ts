/**
 * Supabase 数据库类型定义
 * 这些类型与数据库表结构保持一致
 */

// ────────────────────────────────────────────────────────────
// 用户档案类型
// ────────────────────────────────────────────────────────────
export type Stage = 'preconception' | 'pregnancy' | 'postpartum';
export type Role = 'mom' | 'dad';
export type PushFrequency = 'daily' | 'weekly' | 'manual';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  stage: Stage | null;
  role: Role | null;
  due_date: string | null; // YYYY-MM-DD
  postpartum_date: string | null; // YYYY-MM-DD
  push_frequency: PushFrequency;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface ProfileInsert {
  user_id: string;
  username?: string | null;
  stage?: Stage | null;
  role?: Role | null;
  due_date?: string | null;
  postpartum_date?: string | null;
  push_frequency?: PushFrequency;
}

export interface ProfileUpdate {
  username?: string | null;
  stage?: Stage | null;
  role?: Role | null;
  due_date?: string | null;
  postpartum_date?: string | null;
  push_frequency?: PushFrequency;
}

// ────────────────────────────────────────────────────────────
// 健康记录类型
// ────────────────────────────────────────────────────────────
export type HealthRecordType = 'fetal_movement' | 'weight' | 'symptom';

export interface HealthRecord {
  id: string;
  user_id: string;
  record_type: HealthRecordType;
  record_date: string; // YYYY-MM-DD
  data: Record<string, unknown>; // 灵活存储不同类型的记录数据
  notes: string | null;
  created_at: string; // ISO datetime
}

export interface HealthRecordInsert {
  user_id: string;
  record_type: HealthRecordType;
  record_date: string;
  data: Record<string, unknown>;
  notes?: string | null;
}

export interface HealthRecordUpdate {
  record_type?: HealthRecordType;
  record_date?: string;
  data?: Record<string, unknown>;
  notes?: string | null;
}

// ────────────────────────────────────────────────────────────
// 数据库表集合
// ────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      health_records: {
        Row: HealthRecord;
        Insert: HealthRecordInsert;
        Update: HealthRecordUpdate;
      };
    };
  };
}
