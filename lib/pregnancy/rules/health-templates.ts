import type { HealthTemplate } from '../types';

export const folicAcid: HealthTemplate = {
  id: 'folic-acid',
  label: '叶酸记录',
  fields: [
    { name: 'dose', label: '剂量(μg)', type: 'number' },
    { name: 'date', label: '日期', type: 'date' },
  ],
};

export const weightTracking: HealthTemplate = {
  id: 'weight-tracking',
  label: '体重记录',
  fields: [
    { name: 'weight', label: '体重(kg)', type: 'number' },
    { name: 'date', label: '日期', type: 'date' },
  ],
};

export const symptomRecord: HealthTemplate = {
  id: 'symptom-record',
  label: '症状记录',
  fields: [
    { name: 'symptom', label: '症状', type: 'text' },
    { name: 'severity', label: '严重程度', type: 'select', options: ['轻微', '中度', '严重'] },
    { name: 'date', label: '日期', type: 'date' },
  ],
};

export const fetalMovement: HealthTemplate = {
  id: 'fetal-movement',
  label: '胎动计数',
  fields: [
    { name: 'movement_count', label: '胎动次数', type: 'number' },
    { name: 'duration_minutes', label: '持续时间(分钟)', type: 'number' },
    { name: 'notes', label: '备注', type: 'text' },
  ],
};

export const moodRecord: HealthTemplate = {
  id: 'mood-record',
  label: '情绪记录',
  fields: [
    { name: 'mood', label: '情绪状态', type: 'select', options: ['良好', '一般', '低落', '焦虑'] },
    { name: 'date', label: '日期', type: 'date' },
  ],
};

export const feedingRecord: HealthTemplate = {
  id: 'feeding-record',
  label: '喂养记录',
  fields: [
    { name: 'type', label: '喂养方式', type: 'select', options: ['母乳', '配方奶', '混合'] },
    { name: 'duration', label: '时长(分钟)', type: 'number' },
    { name: 'date', label: '日期', type: 'date' },
  ],
};
