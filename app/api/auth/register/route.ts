import { createServerClient, createAdminClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';
import { createDefaultProfile } from '@/app/lib/create-default-profile';

/**
 * 用户注册 API
 * POST /api/auth/register
 *
 * Body: { phone: string, password: string }
 */
export async function POST(req: Request) {
  try {
    const { phone, password, username } = await req.json();

    // 1. 基础验证
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: '请输入手机号和密码' },
        { status: 400 }
      );
    }

    // 2. 验证手机号格式（中国大陆 11 位手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的手机号' },
        { status: 400 }
      );
    }

    // 3. 验证密码长度（>= 6 位）
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少需要 6 位' },
        { status: 400 }
      );
    }

    // 4. 验证用户名（必填，2-20位，支持中文/英文/数字/下划线）
    if (!username) {
      return NextResponse.json(
        { success: false, error: '请输入用户名' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: '用户名需为 2-20 个字符，仅支持中英文、数字和下划线' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    // 4. 使用 Admin API 创建用户（绕过邮件发送和频率限制）
    const pseudoEmail = `${phone}@example.com`;

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: pseudoEmail,
      password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        phone: phone, // 在 user_metadata 中存储真实手机号
      },
    });

    if (createError) {
      // 处理特定错误
      if (createError.message.includes('already been registered') || createError.message.includes('duplicate')) {
        return NextResponse.json(
          { success: false, error: '该手机号已注册，请直接登录' },
          { status: 409 }
        );
      }

      console.error('创建用户失败:', createError);
      return NextResponse.json(
        { success: false, error: createError.message || '注册失败，请稍后重试' },
        { status: 400 }
      );
    }

    // 5. 创建成功后自动登录
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password,
    });

    if (signInError) {
      // 创建成功但登录失败
      console.error('自动登录失败:', signInError);
      return NextResponse.json(
        {
          success: true,
          message: '注册成功，请手动登录',
          user: {
            id: newUser.user.id,
            phone: phone,
          },
        },
        { status: 201 }
      );
    }

    // 6. 创建默认档案
    const profileResult = await createDefaultProfile(newUser.user.id, username);

    // 7. 注册成功并自动登录，返回 session 和用户信息
    return NextResponse.json({
      success: true,
      message: '注册成功',
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user: {
          id: newUser.user.id,
          phone: phone,
          profile: profileResult,
        },
      },
      user: {
        id: newUser.user.id,
        phone: phone,
        profile: profileResult,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('注册 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}
