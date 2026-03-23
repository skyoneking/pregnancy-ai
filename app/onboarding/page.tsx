'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import type { Stage, Role } from '@/app/_supabase/types';

type AuthMode = 'login' | 'register' | 'reset';
type OnboardingStep = 'auth' | 'stage' | 'details';

export default function OnboardingPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();

  // 认证状态
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState(''); // 重置密码时需要
  const [newPassword, setNewPassword] = useState(''); // 重置密码时的新密码
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 档案信息
  const [step, setStep] = useState<OnboardingStep>('auth');
  const [stage, setStage] = useState<Stage | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [postpartumDate, setPostpartumDate] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDateObj = new Date(today);
  maxDateObj.setMonth(maxDateObj.getMonth() + 10);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // 如果用户已登录且有档案，跳转到首页
  useEffect(() => {
    if (user?.profile && step === 'auth') {
      router.push('/');
    }
  }, [user, step, router]);

  // 验证手机号格式
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 处理认证提交
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // 验证手机号
    if (!isValidPhone(phone)) {
      setAuthError('请输入有效的手机号');
      return;
    }

    // 验证密码
    if (password.length < 6) {
      setAuthError('密码至少需要 6 位');
      return;
    }

    // 注册时验证确认密码
    if (authMode === 'register' && password !== confirmPassword) {
      setAuthError('两次密码输入不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = authMode === 'login'
        ? await signIn(phone, password)
        : await signUp(phone, password);

      if (result.success) {
        // 认证成功，等待 useAuth 更新后检查档案
        // 使用 setTimeout 确保 session 和 user 已更新
        setTimeout(() => {
          // 检查用户是否已有档案
          if (user?.profile) {
            // 已有档案，跳转首页
            router.push('/');
          } else {
            // 无档案，进入阶段选择
            setStep('stage');
          }
        }, 100);
      } else {
        setAuthError(result.error || '操作失败，请稍后重试');
      }
    } catch (error) {
      setAuthError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理密码重置
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    // 验证手机号
    if (!isValidPhone(phone)) {
      setAuthError('请输入有效的手机号');
      return;
    }

    // 验证旧密码
    if (!oldPassword || oldPassword.length < 6) {
      setAuthError('请输入有效的旧密码');
      return;
    }

    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      setAuthError('新密码至少需要 6 位');
      return;
    }

    // 验证新旧密码不同
    if (oldPassword === newPassword) {
      setAuthError('新密码不能与旧密码相同');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, oldPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthSuccess('密码重置成功，请使用新密码登录');
        // 3秒后自动切换到登录模式
        setTimeout(() => {
          setAuthMode('login');
          setAuthSuccess('');
          setPhone('');
          setOldPassword('');
          setNewPassword('');
        }, 3000);
      } else {
        setAuthError(data.error || '重置失败，请稍后重试');
      }
    } catch (error) {
      setAuthError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理档案提交
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (!stage) {
      setProfileError('请选择您的当前阶段');
      return;
    }

    // 所有阶段都需要选择角色
    if (!role) {
      setProfileError('请选择您的身份');
      return;
    }

    // 孕期必填验证
    if (stage === 'pregnancy' && !dueDate) {
      setProfileError('请输入预产期');
      return;
    }

    if (stage === 'pregnancy' && (dueDate < minDate || dueDate > maxDate)) {
      setProfileError('预产期需在今天至十个月后之间');
      return;
    }

    // 产后必填验证
    if (stage === 'postpartum' && !postpartumDate) {
      setProfileError('请输入生产日期');
      return;
    }

    setIsSaving(true);

    try {
      // 调用 API 保存档案
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          role,
          due_date: dueDate || undefined,
          postpartum_date: postpartumDate || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 保存成功，跳转首页
        router.push('/');
      } else {
        setProfileError(data.error || '保存失败，请稍后重试');
      }
    } catch (error) {
      setProfileError('网络错误，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染认证步骤
  const renderAuthStep = () => {
    // 密码重置模式
    if (authMode === 'reset') {
      return (
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
            重置密码
          </h1>
          <p className="text-center text-gray-500 mb-8 text-sm">
            请输入手机号、旧密码和新密码
          </p>

          {/* 返回登录 */}
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
              setAuthSuccess('');
              setPhone('');
              setOldPassword('');
              setNewPassword('');
            }}
            className="mb-6 text-sm text-gray-500 hover:text-pink-600 flex items-center gap-1"
          >
            ← 返回登录
          </button>

          <form onSubmit={handleResetPassword} noValidate>
            {/* 手机号 */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* 旧密码 */}
            <div className="mb-4">
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                旧密码
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* 新密码 */}
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* 错误提示 */}
            {authError && (
              <p role="alert" className="text-red-500 text-sm mb-4">
                {authError}
              </p>
            )}

            {/* 成功提示 */}
            {authSuccess && (
              <p role="status" className="text-green-600 text-sm mb-4">
                {authSuccess}
              </p>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              {isSubmitting ? '处理中...' : '重置密码'}
            </button>
          </form>
        </div>
      );
    }

    // 登录/注册模式
    const title = authMode === 'login' ? '登录' : '注册';
    const subtitle = authMode === 'login'
      ? '欢迎回来！请使用手机号登录'
      : '创建账号，开始您的孕期之旅';

    return (
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
          {title}
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {subtitle}
        </p>

        {/* 切换登录/注册 */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all ${
              authMode === 'login'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all ${
              authMode === 'register'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleAuth} noValidate>
        {/* 手机号 */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            手机号
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        {/* 密码 */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        {/* 确认密码（仅注册） */}
        {authMode === 'register' && (
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        )}

        {/* 错误提示 */}
        {authError && (
          <p role="alert" className="text-red-500 text-sm mb-4">
            {authError}
          </p>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors"
        >
          {isSubmitting ? '处理中...' : authMode === 'login' ? '登录' : '注册'}
        </button>

        {/* 忘记密码链接（仅登录模式显示） */}
        {authMode === 'login' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode('reset');
                setAuthError('');
              }}
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              忘记密码？
            </button>
          </div>
        )}
      </form>
    </div>
  );
  };

  // 渲染阶段选择
  const renderStageStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">欢迎使用孕期助手</h1>
      <p className="text-center text-gray-500 mb-8 text-sm">请选择您当前的阶段</p>

      <form onSubmit={handleProfileSubmit} noValidate>
        {/* 阶段选择 */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-700 mb-3">当前阶段</legend>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setStage('preconception')}
              className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                stage === 'preconception'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 text-gray-600 hover:border-pink-300'
              }`}
            >
              <div className="text-2xl mb-1">💊</div>
              <div className="font-medium">备孕期</div>
              <div className="text-sm text-gray-500">准备怀孕，获取备孕知识</div>
            </button>

            <button
              type="button"
              onClick={() => setStage('pregnancy')}
              className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                stage === 'pregnancy'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 text-gray-600 hover:border-pink-300'
              }`}
            >
              <div className="text-2xl mb-1">🤰</div>
              <div className="font-medium">孕期</div>
              <div className="text-sm text-gray-500">已怀孕，追踪孕期变化</div>
            </button>

            <button
              type="button"
              onClick={() => setStage('postpartum')}
              className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                stage === 'postpartum'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 text-gray-600 hover:border-pink-300'
              }`}
            >
              <div className="text-2xl mb-1">👶</div>
              <div className="font-medium">产后期</div>
              <div className="text-sm text-gray-500">产后恢复，宝宝护理</div>
            </button>
          </div>
        </fieldset>

        {/* 角色选择（所有阶段都显示） */}
        {stage && (
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-gray-700 mb-3">您的身份</legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('mom')}
                className={`rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${
                  role === 'mom'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 text-gray-600 hover:border-pink-300'
                }`}
              >
                <div className="text-3xl mb-1">🤰</div>
                <div className="font-medium">准妈妈</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('dad')}
                className={`rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${
                  role === 'dad'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-1">👨‍👩‍👧</div>
                <div className="font-medium">准爸爸</div>
              </button>
            </div>
          </fieldset>
        )}

        {/* 孕期特定信息 */}
        {stage === 'pregnancy' && (
          <div className="mb-6">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              预产期
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        )}

        {/* 产后特定信息 */}
        {stage === 'postpartum' && (
          <div className="mb-6">
            <label htmlFor="postpartumDate" className="block text-sm font-medium text-gray-700 mb-2">
              生产日期
            </label>
            <input
              id="postpartumDate"
              type="date"
              value={postpartumDate}
              max={maxDate}
              onChange={(e) => setPostpartumDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        )}

        {/* 错误提示 */}
        {profileError && (
          <p role="alert" className="text-red-500 text-sm mb-4">
            {profileError}
          </p>
        )}

        {/* 提交 */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors"
        >
          {isSaving ? '保存中...' : '开始使用'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      {step === 'auth' ? renderAuthStep() : renderStageStep()}
    </div>
  );
}
