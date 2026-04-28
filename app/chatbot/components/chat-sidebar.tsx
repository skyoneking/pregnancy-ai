"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { client } from "@/app/chatbot/lib/client";
import type { Assistant, Thread } from "@langchain/langgraph-sdk";
import { MoreHorizontalIcon, PlusIcon, ChevronDownIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatSidebarProps {
  assistants: Assistant[];
  currentAssistant: Assistant | null;
  threads: Thread[];
  currentThread: Thread | null;
  onAssistantChange: (assistant: Assistant) => void;
  onThreadChange: (thread: Thread | null) => void;
  onThreadsUpdate: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString("zh-CN");
}

function getThreadName(thread: Thread): string {
  return (thread.metadata?.name as string) || "未命名对话";
}

function ThreadItemRow({
  thread,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(getThreadName(thread));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onRename(editValue.trim() || "未命名对话");
      setEditing(false);
    } else if (e.key === "Escape") {
      setEditing(false);
      setEditValue(getThreadName(thread));
    }
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer text-sm hover:bg-muted ${
        isActive ? "bg-muted font-medium" : ""
      }`}
      onClick={onSelect}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-background border rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setEditing(false);
            setEditValue(getThreadName(thread));
          }}
        />
      ) : (
        <>
          <span className="flex-1 truncate">{getThreadName(thread)}</span>
          <span className="text-xs text-muted-foreground hidden group-hover:inline">
            {formatRelativeTime(thread.updated_at)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                <PencilIcon className="size-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2Icon className="size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

export function ChatSidebar({
  assistants,
  currentAssistant,
  threads,
  currentThread,
  onAssistantChange,
  onThreadChange,
  onThreadsUpdate,
}: ChatSidebarProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleRename = useCallback(
    async (thread: Thread, name: string) => {
      await client.threads.update(thread.thread_id, {
        metadata: { ...thread.metadata, name },
      });
      onThreadsUpdate();
    },
    [onThreadsUpdate],
  );

  const handleDelete = useCallback(
    async (thread: Thread) => {
      await client.threads.delete(thread.thread_id);
      if (currentThread?.thread_id === thread.thread_id) {
        onThreadChange(null);
      }
      onThreadsUpdate();
    },
    [currentThread, onThreadChange, onThreadsUpdate],
  );

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r bg-muted/30">
      {/* Assistant Selector */}
      <div className="border-b p-2">
        <DropdownMenu open={assistantOpen} onOpenChange={setAssistantOpen}>
          <DropdownMenuTrigger
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            <span className="truncate">
              {currentAssistant?.name || currentAssistant?.assistant_id || "选择 Assistant"}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[264px]">
            {assistants.map((a) => (
              <DropdownMenuItem
                key={a.assistant_id}
                onClick={() => onAssistantChange(a)}
              >
                <span className="truncate">{a.name || a.assistant_id}</span>
              </DropdownMenuItem>
            ))}
            {assistants.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                未找到 Assistant
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Thread Button */}
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onThreadChange(null)}
        >
          <PlusIcon className="size-4" />
          新建对话
        </Button>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 pb-2">
          {threads.map((thread) => (
            <ThreadItemRow
              key={thread.thread_id}
              thread={thread}
              isActive={currentThread?.thread_id === thread.thread_id}
              onSelect={() => onThreadChange(thread)}
              onRename={(name) => handleRename(thread, name)}
              onDelete={() => handleDelete(thread)}
            />
          ))}
          {threads.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              暂无对话
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
