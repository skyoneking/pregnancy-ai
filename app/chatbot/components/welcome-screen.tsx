"use client";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

const suggestions = [
  "孕期需要注意什么？",
  "帮我制定产检计划",
  "孕期营养饮食建议",
  "如何缓解孕吐？",
  "孕晚期要准备什么？",
  "胎动多少次算正常？",
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold">开始新对话</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          选择一个话题或直接输入你的问题
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 max-w-md">
        {suggestions.map((s) => (
          <button
            key={s}
            className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
            onClick={() => onSuggestionClick(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
