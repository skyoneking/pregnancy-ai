"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "./lib/profile";
import type { UserProfile } from "./types/profile";

function calculateCurrentWeek(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.round((due.getTime() - now.getTime()) / msPerDay);
  const daysPregnant = 280 - daysRemaining;
  return Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));
}

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [profile] = useState<UserProfile | null>(() =>
    typeof window !== "undefined" ? getProfile() : null,
  );

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      body: profile ? { profile } : undefined,
    }),
  });

  if (!profile) return null;

  const currentWeek = calculateCurrentWeek(profile.dueDate);
  const roleLabel = profile.role === "mom" ? "准妈妈" : "准爸爸";

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* 孕周信息标签 */}
      <div className="fixed top-0 left-0 right-0 flex justify-center py-3 bg-white border-b border-pink-100 z-10">
        <span className="text-pink-600 font-medium text-sm">
          {roleLabel} · 孕 {currentWeek} 周
        </span>
      </div>

      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
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
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="和我聊聊孕期的问题吧..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
