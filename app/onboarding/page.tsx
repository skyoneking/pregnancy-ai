'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProfile } from '../lib/profile';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<'mom' | 'dad' | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDateObj = new Date(today);
  maxDateObj.setMonth(maxDateObj.getMonth() + 10);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('请选择您的身份');
      return;
    }
    if (!dueDate) {
      setError('请输入预产期');
      return;
    }
    if (dueDate < minDate || dueDate > maxDate) {
      setError('预产期需在今天至十个月后之间');
      return;
    }

    saveProfile({ role, dueDate, createdAt: new Date().toISOString() });
    router.push('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">欢迎使用孕期助手</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">先告诉我一些基本信息，以便为您提供个性化服务</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* 角色选择 */}
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

          {/* 预产期 */}
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

          {/* 错误提示 */}
          {error && (
            <p role="alert" className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          {/* 提交 */}
          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            开始使用
          </button>
        </form>
      </div>
    </div>
  );
}
