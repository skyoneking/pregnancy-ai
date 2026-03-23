import { createServerClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';

/**
 * 获取当前登录用户信息
 * GET /api/auth/user
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();

    // 1. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // 2. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 3. 返回用户信息（从 metadata 获取真实手机号）
    const realPhone = user.user_metadata?.phone || user.email?.replace('@example.com', '') || '';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: realPhone,
        profile: profile || null,
        created_at: user.created_at,
      },
    });

  } catch (error) {
    console.error('获取用户 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}

/**
 * 退出登录
 * POST /api/auth/user
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '退出登录成功',
    });

  } catch (error) {
    console.error('退出登录 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}
