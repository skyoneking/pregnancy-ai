'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import type { Profile, Stage, Role } from '@/app/_supabase/types';

type PushFrequency = 'daily' | 'weekly' | 'manual';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // 编辑表单状态
  const [formData, setFormData] = useState({
    stage: user?.profile?.stage || '',
    role: user?.profile?.role || '',
    due_date: user?.profile?.due_date || '',
    postpartum_date: user?.profile?.postpartum_date || '',
  });

  // 推送频率设置
  const [pushFrequency, setPushFrequency] = useState<PushFrequency>('daily');

  // 计算当前孕周或产后天数
  const calculateCurrentWeek = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.round((due.getTime() - now.getTime()) / msPerDay);
    const daysPregnant = 280 - daysRemaining;
    return Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));
  };

  const calculatePostpartumDays = (postpartumDate: string) => {
    const now = new Date();
    const postpartum = new Date(postpartumDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.floor((now.getTime() - postpartum.getTime()) / msPerDay));
  };

  // 当用户数据变化时更新表单数据
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        stage: user.profile.stage,
        role: user.profile.role || '',
        due_date: user.profile.due_date || '',
        postpartum_date: user.profile.postpartum_date || '',
      });
    }
  }, [user]);

  // 从 localStorage 读取推送频率设置
  useEffect(() => {
    const saved = localStorage.getItem('pushFrequency');
    if (saved && ['daily', 'weekly', 'manual'].includes(saved)) {
      setPushFrequency(saved as PushFrequency);
    }
  }, []);

  // 检查登录状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  // 保存档案
  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // 过滤空字符串字段，避免 Zod 日期格式验证失败
      const payload: Record<string, string> = { stage: formData.stage, role: formData.role };
      if (formData.due_date) payload.due_date = formData.due_date;
      if (formData.postpartum_date) payload.postpartum_date = formData.postpartum_date;

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('档案保存成功');
        setEditing(false);
        // 3秒后清除成功消息
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || '保存失败，请稍后重试');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    // 恢复原始数据
    if (user?.profile) {
      setFormData({
        stage: user.profile.stage,
        role: user.profile.role || '',
        due_date: user.profile.due_date || '',
        postpartum_date: user.profile.postpartum_date || '',
      });
    }
    setEditing(false);
    setMessage('');
  };

  // 退出登录
  const handleSignOut = async () => {
    await signOut();
    router.push('/onboarding');
  };

  // 保存推送频率
  const handlePushFrequencyChange = (value: PushFrequency) => {
    setPushFrequency(value);
    localStorage.setItem('pushFrequency', value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-pink-600">加载中...</div>
      </div>
    );
  }

  if (!user || !user.profile) {
    return null;
  }

  const profile = user.profile;

  // 计算显示信息
  const getStageLabel = (stage: Stage) => {
    switch (stage) {
      case 'preconception': return '备孕期';
      case 'pregnancy': return '孕期';
      case 'postpartum': return '产后期';
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'mom': return '准妈妈';
      case 'dad': return '准爸爸';
    }
  };

  let stageInfo = '';
  if (profile.stage === 'pregnancy' && profile.due_date) {
    const currentWeek = calculateCurrentWeek(profile.due_date);
    stageInfo = `孕 ${currentWeek} 周`;
  } else if (profile.stage === 'postpartum' && profile.postpartum_date) {
    const days = calculatePostpartumDays(profile.postpartum_date);
    stageInfo = `产后第 ${days} 天`;
  }

  // 日期范围限制
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDateObj = new Date(today);
  maxDateObj.setMonth(maxDateObj.getMonth() + 10);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-pink-50 p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部：返回按钮 + 标题 + 退出登录 */}
        <div className="bg-white rounded-t-2xl px-4 sm:px-6 py-3 sm:py-4 border-b border-pink-100 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-pink-600 hover:text-pink-700 transition-colors text-sm sm:text-base"
          >
            ← 返回聊天
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-pink-600">个人中心</h1>

          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="text-xs sm:text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            退出登录
          </button>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-b-2xl shadow-md p-4 sm:p-6 mb-4">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mr-4">
              <span className="text-3xl">
                {profile.role === 'mom' ? '🤰' : profile.role === 'dad' ? '👨‍👩‍👧' : '👤'}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {getRoleLabel(profile.role)}
              </div>
              <div className="text-sm text-gray-500">
                {profile.phone || '用户'}
              </div>
            </div>
          </div>

          {/* 档案信息 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">当前阶段</span>
              <span className="font-medium text-pink-600">
                {getStageLabel(profile.stage)}
              </span>
            </div>

            {stageInfo && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">进度</span>
                <span className="font-medium text-pink-600">{stageInfo}</span>
              </div>
            )}

            {profile.due_date && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">预产期</span>
                <span className="font-medium text-gray-800">{profile.due_date}</span>
              </div>
            )}

            {profile.postpartum_date && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">生产日期</span>
                <span className="font-medium text-gray-800">{profile.postpartum_date}</span>
              </div>
            )}
          </div>

          {/* 编辑按钮 */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-full mt-4 py-2 border-2 border-pink-300 text-pink-600 rounded-xl hover:bg-pink-50 transition-colors font-medium"
            >
              编辑档案
            </button>
          )}
        </div>

        {/* 编辑表单 */}
        {editing && (
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">编辑档案</h2>

            {/* 阶段选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                当前阶段
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: 'preconception' })}
                  className={`py-3 sm:py-3 rounded-xl border-2 text-center transition-all ${
                    formData.stage === 'preconception'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl mb-1">💊</div>
                  <div className="text-sm font-medium">备孕期</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: 'pregnancy' })}
                  className={`py-3 rounded-xl border-2 text-center transition-all ${
                    formData.stage === 'pregnancy'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🤰</div>
                  <div className="text-sm font-medium">孕期</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: 'postpartum' })}
                  className={`py-3 rounded-xl border-2 text-center transition-all ${
                    formData.stage === 'postpartum'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl mb-1">👶</div>
                  <div className="text-sm font-medium">产后期</div>
                </button>
              </div>
            </div>

            {/* 角色选择（所有阶段都显示） */}
            {formData.stage && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  您的身份
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mom' })}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      formData.role === 'mom'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 text-gray-600 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">🤰</div>
                    <div className="text-sm font-medium">准妈妈</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'dad' })}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      formData.role === 'dad'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">👨‍👩‍👧</div>
                    <div className="text-sm font-medium">准爸爸</div>
                  </button>
                </div>
              </div>
            )}

            {/* 孕期特定信息 */}
            {formData.stage === 'pregnancy' && (
              <div className="mb-6">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  预产期 <span className="text-red-500">*</span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={formData.due_date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            )}

            {/* 产后特定信息 */}
            {formData.stage === 'postpartum' && (
              <div className="mb-6">
                <label htmlFor="postpartumDate" className="block text-sm font-medium text-gray-700 mb-2">
                  生产日期 <span className="text-red-500">*</span>
                </label>
                <input
                  id="postpartumDate"
                  type="date"
                  value={formData.postpartum_date}
                  max={maxDate}
                  onChange={(e) => setFormData({ ...formData, postpartum_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            )}

            {/* 错误/成功提示 */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              }`}>
                {message}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full sm:flex-1 py-3 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:flex-1 py-3 sm:py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-xl transition-colors font-medium"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* 推送频率设置 */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">推送设置</h2>
          <p className="text-sm text-gray-500 mb-4">
            选择 AI 助手推送知识的频率
          </p>

          <div className="space-y-3">
            <label className={`flex items-center p-3 sm:p-3 border-2 rounded-xl cursor-pointer transition-all ${
              pushFrequency === 'daily' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
            }`}>
              <input
                type="radio"
                name="pushFrequency"
                checked={pushFrequency === 'daily'}
                onChange={() => handlePushFrequencyChange('daily')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-800 text-sm sm:text-base">每日推送</div>
                <div className="text-sm text-gray-500">AI 每天主动推送 1 条相关知识</div>
              </div>
            </label>

            <label className={`flex items-center p-3 sm:p-3 border-2 rounded-xl cursor-pointer transition-all ${
              pushFrequency === 'weekly' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
            }`}>
              <input
                type="radio"
                name="pushFrequency"
                checked={pushFrequency === 'weekly'}
                onChange={() => handlePushFrequencyChange('weekly')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-800 text-sm sm:text-base">每周推送</div>
                <div className="text-sm text-gray-500">仅在重要孕周推送知识</div>
              </div>
            </label>

            <label className={`flex items-center p-3 sm:p-3 border-2 rounded-xl cursor-pointer transition-all ${
              pushFrequency === 'manual' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
            }`}>
              <input
                type="radio"
                name="pushFrequency"
                checked={pushFrequency === 'manual'}
                onChange={() => handlePushFrequencyChange('manual')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-800 text-sm sm:text-base">手动获取</div>
                <div className="text-sm text-gray-500">仅在我询问时提供知识</div>
              </div>
            </label>
          </div>
        </div>

        {/* 退出登录确认对话框 */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">退出登录</h3>
              <p className="text-gray-600 mb-6">确定要退出登录吗？</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
