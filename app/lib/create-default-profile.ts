import { createServerClient } from '@/app/_supabase/server';
import type { ProfileInsert } from '@/app/_supabase/types';

/**
 * 为用户创建默认档案
 * @param userId - 用户 ID
 * @returns 创建成功返回档案数据，失败返回 null
 */
export async function createDefaultProfile(userId: string): Promise<ProfileInsert | null> {
  try {
    const supabase = await createServerClient();

    const defaultProfile: ProfileInsert = {
      user_id: userId,
      stage: 'preconception',
      role: null,
      due_date: null,
      postpartum_date: null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      console.error('创建默认档案失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('创建默认档案异常:', error);
    return null;
  }
}
