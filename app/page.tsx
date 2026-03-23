"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import type { Profile } from "./_supabase/types";

function calculateCurrentWeek(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.round((due.getTime() - now.getTime()) / msPerDay);
  const daysPregnant = 280 - daysRemaining;
  return Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));
}

function calculatePostpartumDays(postpartumDate: string): number {
  const now = new Date();
  const postpartum = new Date(postpartumDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((now.getTime() - postpartum.getTime()) / msPerDay));
}

function getStageLabel(stage: Profile['stage']): string {
  switch (stage) {
    case 'preconception': return '备孕期';
    case 'pregnancy': return '孕期';
    case 'postpartum': return '产后期';
    default: return '';
  }
}

function getRoleLabel(role: Profile['role']): string {
  switch (role) {
    case 'mom': return '准妈妈';
    case 'dad': return '准爸爸';
    default: return '';
  }
}

export default function Chat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [input, setInput] = useState("");

  // 使用 useAuth 中的 profile 数据
  const profile = user?.profile || null;

  // 检查用户登录和档案状态
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // 未登录，跳转到引导页
        router.push('/onboarding');
      } else if (!profile) {
        // 已登录但无档案，跳转到引导页
        router.push('/onboarding');
      }
    }
  }, [user, profile, authLoading, router]);

  // 构建档案数据传递给 AI
  const profileData = profile ? {
    stage: profile.stage,
    role: profile.role,
    dueDate: profile.due_date,
    postpartumDate: profile.postpartum_date,
  } : undefined;

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      body: profileData,
    }),
  });

  if (authLoading || (!user && !authLoading) || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-pink-600">加载中...</div>
      </div>
    );
  }

  if (!profile) return null;

  // 计算显示信息
  const roleLabel = getRoleLabel(profile.role);
  let stageInfo = '';

  if (profile.stage === 'pregnancy' && profile.due_date) {
    const currentWeek = calculateCurrentWeek(profile.due_date);
    stageInfo = `${roleLabel} · 孕 ${currentWeek} 周`;
  } else if (profile.stage === 'postpartum' && profile.postpartum_date) {
    const days = calculatePostpartumDays(profile.postpartum_date);
    stageInfo = `${roleLabel} · 产后第 ${days} 天`;
  } else {
    stageInfo = `${roleLabel} · ${getStageLabel(profile.stage)}`;
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto py-20 sm:py-24 px-3 sm:px-4 stretch">
      {/* 阶段信息标签 */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-pink-100 z-10 min-h-11">
        <span className="text-pink-600 font-medium text-xs sm:text-sm truncate">
          {stageInfo}
        </span>

        {/* 编辑档案按钮 */}
        <button
          onClick={() => router.push('/profile')}
          className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 hover:underline transition-colors whitespace-nowrap ml-2"
        >
          编辑档案 →
        </button>
      </div>

      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          {message.role === "user" ? "用户：" : "AI："}
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return <div key={i}>{part.text}</div>;
            }
            if (part.type === "data-status") {
              return (
                message.parts.at(-1)?.type !== "text" && (
                  <div
                    key={`${message.id}-${i}`}
                    className="text-sm text-gray-500"
                  >
                    {(part.data as { message?: string })?.message}
                  </div>
                )
              );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 mb-4 sm:mb-8 sm:p-2 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl text-sm sm:text-base"
          value={input}
          placeholder="和我聊聊孕期的问题吧..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
