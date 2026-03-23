import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase客户端
vi.mock('@/app/_supabase/server', () => ({
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// Mock 认证限制函数
vi.mock('@/app/lib/auth-rate-limit', () => ({
  checkLoginAttempts: vi.fn(),
  recordFailedAttempt: vi.fn(),
  resetFailedAttempts: vi.fn(),
}));

// Mock 默认档案创建
vi.mock('@/app/lib/create-default-profile', () => ({
  createDefaultProfile: vi.fn(),
}));

import { POST as LoginPOST } from '@/app/api/auth/login/route';
import { POST as RegisterPOST } from '@/app/api/auth/register/route';
import { POST as ResetPasswordPOST } from '@/app/api/auth/reset-password/route';
import { createServerClient, createAdminClient } from '@/app/_supabase/server';
import { checkLoginAttempts, recordFailedAttempt, resetFailedAttempts } from '@/app/lib/auth-rate-limit';
import { createDefaultProfile } from '@/app/lib/create-default-profile';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock用户数据
const mockUser = {
  id: 'user-123',
  email: '13800138000@example.com',
};

const mockSession = {
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  user: mockUser,
};

const mockProfile = {
  id: 'profile-123',
  user_id: 'user-123',
  stage: 'preconception',
  role: null,
  due_date: null,
  postpartum_date: null,
  created_at: '2025-03-20T00:00:00.000Z',
  updated_at: '2025-03-20T00:00:00.000Z',
};

// Mock Supabase客户端
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(),
} as unknown as SupabaseClient;

// Mock Admin客户端
const mockAdminClient = {
  auth: {
    admin: {
      createUser: vi.fn(),
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  (createDefaultProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
});

// Helper函数：创建Request对象
function makeRequest(method: 'POST', body: object) {
  return new Request('http://localhost/api/auth/login', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Helper函数：Mock认证查询
function mockAuthQuery(data: any, error: any = null) {
  const mockEq = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data, error }),
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: mockEq,
  });

  (mockSupabase as any).from.mockReturnValue({
    select: mockSelect,
  });
}

// ============================================================================
// 登录 API 测试
// ============================================================================

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    // 默认：允许登录
    (checkLoginAttempts as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });

    // 默认：登录成功
    (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    // 默认：档案存在
    mockAuthQuery(mockProfile);

    // 默认：重置失败计数
    (resetFailedAttempts as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  });

  describe('基础验证', () => {
    it('返回400（缺少手机号）', async () => {
      const req = makeRequest('POST', { phone: '', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('请输入手机号和密码');
    });

    it('返回400（缺少密码）', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: '' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入手机号和密码');
    });

    it('返回400（手机号格式无效：非1开头）', async () => {
      const req = makeRequest('POST', { phone: '23800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入有效的手机号');
    });

    it('返回400（手机号格式无效：长度不足11位）', async () => {
      const req = makeRequest('POST', { phone: '138001380', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入有效的手机号');
    });

    it('返回400（手机号格式无效：包含非数字）', async () => {
      const req = makeRequest('POST', { phone: '1380013800a', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入有效的手机号');
    });
  });

  describe('登录失败限制', () => {
    it('返回429（账号已锁定）', async () => {
      (checkLoginAttempts as ReturnType<typeof vi.fn>).mockReturnValue({
        allowed: false,
        reason: '登录失败次数过多，账号已锁定15分钟',
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('账号已锁定');
      expect(body.lockedUntil).toBeDefined();
    });

    it('返回401（密码错误，记录失败尝试）', async () => {
      (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      (recordFailedAttempt as ReturnType<typeof vi.fn>).mockReturnValue({
        remainingAttempts: 4,
      });

      const req = makeRequest('POST', { phone: '13800138000', password: 'wrongpassword' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('密码错误，请重新输入');
      expect(body.remainingAttempts).toBe(4);
      expect(recordFailedAttempt).toHaveBeenCalledWith('13800138000');
    });

    it('密码错误第5次，remainingAttempts为0', async () => {
      (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      (recordFailedAttempt as ReturnType<typeof vi.fn>).mockReturnValue({
        remainingAttempts: 0,
      });

      const req = makeRequest('POST', { phone: '13800138000', password: 'wrongpassword' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.remainingAttempts).toBe(0);
    });
  });

  describe('登录成功', () => {
    it('返回200+session数据（登录成功）', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('登录成功');
      expect(body.session.access_token).toBe('access-token-123');
      expect(body.session.user.phone).toBe('13800138000');
      expect(body.session.user.profile).toEqual(mockProfile);
    });

    it('登录成功时调用resetFailedAttempts', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      await LoginPOST(req);

      expect(resetFailedAttempts).toHaveBeenCalledWith('13800138000');
    });

    it('登录成功且档案已存在，返回现有档案', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      const body = await res.json();
      expect(body.session.user.profile).toEqual(mockProfile);
      expect(createDefaultProfile).not.toHaveBeenCalled();
    });

    it('登录成功但档案不存在，创建默认档案', async () => {
      // Mock档案不存在
      mockAuthQuery(null, { code: 'PGRST116' });

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(createDefaultProfile).toHaveBeenCalledWith('user-123');
      const body = await res.json();
      expect(body.session.user.profile).toEqual(mockProfile);
    });

    it('调用supabase.auth.signInWithPassword', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      await LoginPOST(req);

      expect((mockSupabase.auth as any).signInWithPassword).toHaveBeenCalledWith({
        email: '13800138000@example.com',
        password: 'password123',
      });
    });
  });

  describe('异常处理', () => {
    it('返回500（其他认证错误）', async () => {
      (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Database connection failed' },
      });

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Database connection failed');
    });

    it('返回500（未捕获异常）', async () => {
      (mockSupabase.auth as any).signInWithPassword.mockRejectedValue(new Error('Unexpected error'));

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123' });
      const res = await LoginPOST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('服务器错误，请稍后重试');
    });
  });
});

// ============================================================================
// 注册 API 测试
// ============================================================================

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    // 默认：Admin创建用户成功
    mockAdminClient.auth.admin.createUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

    // 默认：自动登录成功
    (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    // 默认：档案创建成功
    (createDefaultProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
  });

  describe('基础验证', () => {
    it('返回400（缺少手机号）', async () => {
      const req = makeRequest('POST', { phone: '', password: 'password123', confirmPassword: 'password123' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入手机号和密码');
    });

    it('返回400（手机号格式无效）', async () => {
      const req = makeRequest('POST', { phone: '12345678901', password: 'password123', confirmPassword: 'password123' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请输入有效的手机号');
    });

    it('返回400（密码少于6位）', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: '12345', confirmPassword: '12345' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('密码至少需要 6 位');
    });
  });

  describe('注册成功', () => {
    it('返回201+session数据', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123', confirmPassword: 'password123' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('注册成功');
      expect(body.session.access_token).toBeDefined();
      expect(body.session.user.phone).toBe('13800138000');
    });

    it('注册后自动创建默认档案', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123', confirmPassword: 'password123' });
      await RegisterPOST(req);

      expect(createDefaultProfile).toHaveBeenCalledWith('user-123');
    });

    it('调用adminClient.auth.admin.createUser', async () => {
      const req = makeRequest('POST', { phone: '13800138000', password: 'password123', confirmPassword: 'password123' });
      await RegisterPOST(req);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: '13800138000@example.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: { phone: '13800138000' },
      });
    });
  });

  describe('注册失败', () => {
    it('返回409（用户已存在）', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already been registered' },
      });

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123', confirmPassword: 'password123' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('已注册');
    });

    it('返回500（服务器错误）', async () => {
      mockAdminClient.auth.admin.createUser.mockRejectedValue(new Error('Database error'));

      const req = makeRequest('POST', { phone: '13800138000', password: 'password123', confirmPassword: 'password123' });
      const res = await RegisterPOST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('服务器错误，请稍后重试');
    });
  });
});

// ============================================================================
// 重置密码 API 测试
// ============================================================================

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    // 默认：登录成功（验证旧密码）
    (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    // 默认：更新密码成功
    (mockSupabase.auth as any).updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('基础验证', () => {
    it('返回400（缺少手机号）', async () => {
      const req = makeRequest('POST', { phone: '', oldPassword: 'old123', newPassword: 'new123' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('请提供手机号、旧密码和新密码');
    });

    it('返回400（新密码少于6位）', async () => {
      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'old123', newPassword: '12345' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('新密码至少需要 6 位');
    });

    it('返回401（旧密码错误）', async () => {
      (mockSupabase.auth as any).signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'wrongold', newPassword: 'newpassword123' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('旧密码错误，请重新输入');
    });
  });

  describe('重置成功', () => {
    it('返回200（重置成功）', async () => {
      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'old123', newPassword: 'newpassword123' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('密码重置成功，请使用新密码登录');
    });

    it('调用supabase.auth.updateUser', async () => {
      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'old123', newPassword: 'newpassword123' });
      await ResetPasswordPOST(req);

      expect((mockSupabase.auth as any).updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });

  describe('重置失败', () => {
    it('返回500（更新密码失败）', async () => {
      (mockSupabase.auth as any).updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Failed to update password' },
      });

      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'old123', newPassword: 'newpassword123' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('密码重置失败');
    });

    it('返回500（未捕获异常）', async () => {
      (mockSupabase.auth as any).updateUser.mockRejectedValue(new Error('Unexpected error'));

      const req = makeRequest('POST', { phone: '13800138000', oldPassword: 'old123', newPassword: 'newpassword123' });
      const res = await ResetPasswordPOST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('服务器错误，请稍后重试');
    });
  });
});
