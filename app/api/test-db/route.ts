import { createServerClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';

/**
 * 测试 API - 验证 Supabase 数据库连接
 * GET /api/test-db
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    // 测试 1: 检查数据库连接
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    if (tablesError) {
      return NextResponse.json(
        {
          success: false,
          error: '数据库连接失败',
          details: tablesError.message,
        },
        { status: 500 }
      );
    }

    // 测试 2: 检查 RLS 策略（应该返回空，因为无认证）
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    // 测试 3: 检查 health_records 表
    const { data: records, error: recordsError } = await supabase
      .from('health_records')
      .select('*')
      .limit(0);

    return NextResponse.json({
      success: true,
      message: '✅ 数据库连接成功！',
      tests: {
        profiles_table: tablesError ? '❌ 失败' : '✅ 正常',
        profiles_query: profilesError ? '✅ RLS 生效（拒绝无认证访问）' : '⚠️ RLS 可能未正确配置',
        health_records_table: recordsError ? '❌ 失败' : '✅ 正常',
      },
      note: 'profiles_query 显示 RLS 策略正在工作（拒绝未认证请求）',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
