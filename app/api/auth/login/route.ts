import { createServerClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';
import { checkLoginAttempts, recordFailedAttempt, resetFailedAttempts } from '@/app/lib/auth-rate-limit';
import { createDefaultProfile } from '@/app/lib/create-default-profile';

/**
 * 用户登录 API
 * POST /api/auth/login
 *
 * Body: { phone: string, password: string }
 */
export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    // 1. 基础验证
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: '请输入手机号和密码' },
        { status: 400 }
      );
    }

    // 2. 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的手机号' },
        { status: 400 }
      );
    }

    // 3. 检查登录失败限制
    const rateLimitCheck = checkLoginAttempts(phone);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
          lockedUntil: rateLimitCheck.lockedUntil,
        },
        { status: 429 }
      );
    }

    const supabase = await createServerClient();

    // 4. 尝试登录（使用标准伪 email 格式）
    const pseudoEmail = `${phone}@example.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password,
    });

    if (error) {
      // 记录失败尝试
      const failedResult = recordFailedAttempt(phone);

      // 密码错误
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          {
            success: false,
            error: '密码错误，请重新输入',
            remainingAttempts: failedResult.remainingAttempts,
          },
          { status: 401 }
        );
      }

      // 其他错误
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    // 5. 登录成功，重置失败计数
    resetFailedAttempts(phone);

    // 6. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    // 7. 如果档案不存在，创建默认档案
    let finalProfile = profile;
    if (profileError || !profile) {
      console.log('用户档案不存在，创建默认档案');
      finalProfile = await createDefaultProfile(data.user.id);
    }

    return NextResponse.json({
      success: true,
      message: '登录成功',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          phone: phone,
          profile: finalProfile || null,
        },
      },
    });

  } catch (error) {
    console.error('登录 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}
