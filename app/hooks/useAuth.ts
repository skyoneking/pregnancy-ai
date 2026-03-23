'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/app/_supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/app/_supabase/types';

interface AuthUser {
  id: string;
  phone: string;
  profile: Profile | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * 认证状态管理 Hook
 * 提供登录、注册、退出登录等功能
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef<string | null>(null); // 防止重复请求

  // 获取用户档案（使用 useCallback 避免重复创建）
  const fetchUserProfile = useCallback(async (authUser: User) => {
    // 防止重复请求同一个用户
    if (fetchingRef.current === authUser.id) {
      return;
    }
    fetchingRef.current = authUser.id;

    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // API 请求失败，使用基本信息
        const realPhone = authUser.user_metadata?.phone || authUser.email?.replace('@example.com', '') || '';
        setUser({
          id: authUser.id,
          phone: realPhone,
          profile: null,
        });
      }
    } catch (error) {
      console.error('获取用户档案失败:', error);
      const realPhone = authUser.user_metadata?.phone || authUser.email?.replace('@example.com', '') || '';
      setUser({
        id: authUser.id,
        phone: realPhone,
        profile: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化并监听认证状态变化
  useEffect(() => {
    let mounted = true;
    let hadUser = false; // 跟踪之前是否有用户
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // 获取初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      if (session?.user) {
        hadUser = true;
        fetchUserProfile(session.user);

        // 订阅档案变更（多设备同步）
        channel = supabase
          .channel(`profile-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*', // 监听所有变更：INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'profiles',
              filter: `user_id=eq.${session.user.id}`, // 只监听当前用户的档案
            },
            async (payload) => {
              console.log('档案变更:', payload);
              if (!mounted) return;

              // 重新获取用户档案
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                await fetchUserProfile(session.user);
              } else if (payload.eventType === 'DELETE') {
                // 档案被删除，清理本地状态
                setUser(prev => prev ? { ...prev, profile: null } : null);
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime 订阅状态:', status);
          });
      } else {
        setLoading(false);
      }
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      setSession(session);

      if (session?.user) {
        hadUser = true;
        fetchUserProfile(session.user);

        // 订阅档案变更（如果还未订阅）
        if (!channel) {
          channel = supabase
            .channel(`profile-${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `user_id=eq.${session.user.id}`,
              },
              async (payload) => {
                console.log('档案变更:', payload);
                if (!mounted) return;

                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                  await fetchUserProfile(session.user);
                } else if (payload.eventType === 'DELETE') {
                  setUser(prev => prev ? { ...prev, profile: null } : null);
                }
              }
            )
            .subscribe((status) => {
              console.log('Realtime 订阅状态:', status);
            });
        }
      } else {
        // Session 过期或用户登出
        setUser(null);
        fetchingRef.current = null; // 重置请求锁
        setLoading(false);

        // 取消 Realtime 订阅
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }

        // 如果之前有用户，现在 session 为空，说明 session 过期了
        if (hadUser && (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) {
          // 显示友好提示并跳转到登录页
          console.log('Session 已过期，跳转到登录页');
          // 使用 window.location 确保跳转
          if (typeof window !== 'undefined') {
            window.location.href = '/onboarding?reason=session_expired';
          }
        }
      }
    });

    return () => {
      mounted = false;
      // 取消 Realtime 订阅
      if (channel) {
        supabase.removeChannel(channel);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // 登录
  const signIn = useCallback(async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success && data.session) {
        // 手动设置 session 到 Supabase 客户端
        const { access_token, refresh_token } = data.session;
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败，请稍后重试',
      };
    }
  }, []);

  // 注册
  const signUp = useCallback(async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success && data.session) {
        // 手动设置 session 到 Supabase 客户端
        const { access_token, refresh_token } = data.session;
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败，请稍后重试',
      };
    }
  }, []);

  // 退出登录
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    fetchingRef.current = null;
  }, []);

  // 刷新 session
  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('刷新 session 失败:', error);
    }
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}
