import type { Capability } from '../types';

export const calculatePregnancyInfo: Capability = {
  id: 'calculate_pregnancy_info',
  label: '孕周计算',
};

export const getWeeklyDevelopment: Capability = {
  id: 'get_weekly_development',
  label: '胎儿发育信息',
};

export const checkFoodSafety: Capability = {
  id: 'check_food_safety',
  label: '食物安全查询',
};

export const getPrenatalSchedule: Capability = {
  id: 'get_prenatal_schedule',
  label: '产检时间表',
};

export const assessSymptom: Capability = {
  id: 'assess_symptom',
  label: '症状评估',
};

export const getContextualKnowledge: Capability = {
  id: 'get_contextual_knowledge',
  label: '专业知识推送',
};
