import { createServerClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';

/**
 * 密码重置 API（通过旧密码验证）
 * POST /api/auth/reset-password
 *
 * Body: { phone: string, oldPassword: string, newPassword: string }
 */
export async function POST(req: Request) {
  try {
    const { phone, oldPassword, newPassword } = await req.json();

    // 1. 基础验证
    if (!phone || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请提供手机号、旧密码和新密码' },
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

    // 3. 验证新密码长度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密码至少需要 6 位' },
        { status: 400 }
      );
    }

    // 4. 验证新旧密码不相同
    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: '新密码不能与旧密码相同' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 5. 先用旧密码验证用户身份（使用标准伪 email 格式）
    const pseudoEmail = `${phone}@example.com`;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password: oldPassword,
    });

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { success: false, error: '旧密码错误，请重新输入' },
        { status: 401 }
      );
    }

    // 6. 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('更新密码失败:', updateError);
      return NextResponse.json(
        { success: false, error: '密码重置失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '密码重置成功，请使用新密码登录',
    });

  } catch (error) {
    console.error('密码重置 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}
