import { createServerClient } from '@/app/_supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ProfileInsert, ProfileUpdate } from '@/app/_supabase/types';

// ─── Zod Schema 定义 ────────────────────────────────────────────────────────

// 日期格式验证
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日期格式必须为 YYYY-MM-DD',
});

// 档案验证 Schema
const profileSchema = z.object({
  stage: z.enum(['preconception', 'pregnancy', 'postpartum'], {
    required_error: '请选择您的当前阶段',
  }),
  role: z.enum(['mom', 'dad']).optional(),
  due_date: dateSchema.optional(),
  postpartum_date: dateSchema.optional(),
}).refine((data) => {
  // 孕期必须有 role 和 due_date
  if (data.stage === 'pregnancy') {
    return !!data.role && !!data.due_date;
  }
  // 产后期必须有 postpartum_date
  if (data.stage === 'postpartum') {
    return !!data.postpartum_date;
  }
  return true;
}, {
  message: '数据验证失败：孕期必须填写角色和预产期，产后期必须填写生产日期',
  }).refine((data) => {
  // 日期范围验证
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (data.due_date) {
    const dueDate = new Date(data.due_date);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 10);
    if (dueDate < today || dueDate > maxDate) {
      return false;
    }
  }

  if (data.postpartum_date) {
    const postpartumDate = new Date(data.postpartum_date);
    const minDate = new Date(today);
    minDate.setFullYear(minDate.getFullYear() - 3); // 最多3年前
    if (postpartumDate < minDate || postpartumDate > today) {
      return false;
    }
  }

  return true;
}, {
  message: '日期范围验证失败：预产期需在今天至十个月后，生产日期需在最近3年内',
});

/**
 * 获取用户档案
 * GET /api/user/profile
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

    if (profileError) {
      // 档案不存在时返回空（可能还未填写）
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          profile: null,
        });
      }

      throw profileError;
    }

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('获取档案 API 错误:', error);
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
 * 创建或更新用户档案
 * PUT /api/user/profile
 *
 * Body: {
 *   stage: 'preconception' | 'pregnancy' | 'postpartum',
 *   role?: 'mom' | 'dad',
 *   due_date?: string, // YYYY-MM-DD
 *   postpartum_date?: string // YYYY-MM-DD
 * }
 */
export async function PUT(req: Request) {
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

    // 2. 解析请求数据
    const body = await req.json();

    // 3. 使用 Zod 验证数据
    const validationResult = profileSchema.safeParse(body);

    if (!validationResult.success) {
      // 提取第一个错误信息返回给用户
      const errors = validationResult.error.errors;
      const firstError = errors && errors.length > 0 ? errors[0] : null;
      const errorMessage = firstError?.message || '数据格式错误';

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // 使用验证后的数据
    const { stage, role, due_date, postpartum_date } = validationResult.data;

    // 4. 检查档案是否存在
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // 更新现有档案
      const updateData: ProfileUpdate = {
        stage,
        role: role || null,
        due_date: due_date || null,
        postpartum_date: postpartum_date || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 创建新档案
      const insertData: ProfileInsert = {
        user_id: user.id,
        stage,
        role: role || null,
        due_date: due_date || null,
        postpartum_date: postpartum_date || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: '档案保存成功',
      profile: result,
    });

  } catch (error) {
    console.error('保存档案 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}
