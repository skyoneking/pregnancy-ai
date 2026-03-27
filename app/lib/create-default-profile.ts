import { createServerClient } from '@/app/_supabase/server';
import type { ProfileInsert } from '@/app/_supabase/types';

/**
 * 为用户创建默认档案
 * @param userId - 用户 ID
 * @returns 创建成功返回档案数据，失败返回 null
 */
export async function createDefaultProfile(userId: string, username?: string): Promise<ProfileInsert | null> {
  console.log('[createDefaultProfile] Called with userId:', userId, 'username:', username, 'stack:', new Error().stack?.split('\n').slice(0, 3).join('|'));

  try {
    const supabase = await createServerClient();

    const defaultProfile: ProfileInsert = {
      user_id: userId,
      username: username || null,
      stage: 'preconception',
      role: null,
      due_date: null,
      postpartum_date: null,
    };

    // 使用 upsert：如果档案已存在则更新（主要用于设置用户名），不存在则创建
    const { data, error } = await supabase
      .from('profiles')
      .upsert(defaultProfile, { onConflict: 'user_id' })
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
