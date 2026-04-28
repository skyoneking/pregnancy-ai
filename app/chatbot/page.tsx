"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { ChatSidebar } from "@/app/chatbot/components/chat-sidebar";
import { WelcomeScreen } from "@/app/chatbot/components/welcome-screen";
import { client } from "@/app/chatbot/lib/client";
import { getLastSession, setLastSession } from "@/app/chatbot/lib/storage";
import type { Assistant, Thread } from "@langchain/langgraph-sdk";
import { BaseMessage } from "langchain";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatbotPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(
    null,
  );
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [initialized, setInitialized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load threads for an assistant ──
  const loadThreads = useCallback(async () => {
    const list = await client.threads.search({
      limit: 50,
      sortBy: "updated_at",
      sortOrder: "desc",
    });
    setThreads(list);
    return list;
  }, []);

  // ── Load messages for a thread ──
  const loadMessages = useCallback(async (threadId: string) => {
    const state = await client.threads.getState(threadId);
    const msgs = (state.values as any)?.messages ?? [];
    setMessages(msgs);
  }, []);

  // ── Initialization ──
  useEffect(() => {
    async function init() {
      try {
        const assistList = await client.assistants.search();
        setAssistants(assistList);
        if (assistList.length === 0) {
          setInitialized(true);
          return;
        }

        const lastSession = getLastSession();
        const savedAssistant = lastSession
          ? assistList.find((a) => a.assistant_id === lastSession.assistantId)
          : null;
        const assistant = savedAssistant || assistList[0];
        setCurrentAssistant(assistant);

        const threadList = await loadThreads();

        if (lastSession?.threadId) {
          const savedThread = threadList.find(
            (t) => t.thread_id === lastSession.threadId,
          );
          if (savedThread) {
            setCurrentThread(savedThread);
            await loadMessages(savedThread.thread_id);
            setInitialized(true);
            return;
          }
        }

        // No valid saved session → new conversation state
        setCurrentThread(null);
        setMessages([]);
        setLastSession(assistant.assistant_id, null);
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setInitialized(true);
      }
    }
    init();
  }, [loadThreads, loadMessages]);

  // ── Switch assistant ──
  const handleAssistantChange = useCallback(
    async (assistant: Assistant) => {
      abortRef.current?.abort();
      setCurrentAssistant(assistant);
      setCurrentThread(null);
      setMessages([]);
      setLastSession(assistant.assistant_id, null);
      const list = await loadThreads();
      setThreads(list);
    },
    [loadThreads],
  );

  // ── Switch thread ──
  const handleThreadChange = useCallback(
    async (thread: Thread | null) => {
      abortRef.current?.abort();
      setCurrentThread(thread);
      if (thread) {
        setLastSession(currentAssistant!.assistant_id, thread.thread_id);
        await loadMessages(thread.thread_id);
      } else {
        setLastSession(currentAssistant!.assistant_id, null);
        setMessages([]);
      }
    },
    [currentAssistant, loadMessages],
  );

  // ── Reload threads (after rename/delete) ──
  const handleThreadsUpdate = useCallback(async () => {
    if (!currentAssistant) return;
    const list = await loadThreads();
    setThreads(list);
  }, [currentAssistant, loadThreads]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentAssistant) return;
      setStatus("submitted");

      try {
        let threadId = currentThread?.thread_id ?? null;

        // Create thread if this is a new conversation
        if (!threadId) {
          const newThread = await client.threads.create({
            metadata: {
              assistant_id: currentAssistant.assistant_id,
              name: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
            },
          });
          threadId = newThread.thread_id;
          setCurrentThread(newThread);
          setThreads((prev) => [newThread, ...prev]);
          setLastSession(currentAssistant.assistant_id, threadId);
        }

        const ac = new AbortController();
        abortRef.current = ac;

        setStatus("streaming");
        const stream = client.runs.stream(
          threadId,
          currentAssistant.assistant_id,
          {
            input: {
              messages: [{ role: "user", content }],
            },
            streamMode: "messages",
            signal: ac.signal,
          },
        );

        for await (const chunk of stream) {
          const newMsg = (chunk.data as any)?.[0];
          if (!newMsg) continue;

          if (
            chunk.event === "messages/complete" &&
            chunk.data[0]?.type === "human"
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }

          if (
            chunk.event === "messages/partial" ||
            (chunk.event === "messages/complete" &&
              chunk.data[0]?.type === "ai")
          ) {
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === newMsg.id);
              if (idx === -1) return [...prev, newMsg];
              const updated = [...prev];
              updated[idx] = newMsg;
              return updated;
            });
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Send message failed:", err);
          setStatus("error");
          return;
        }
      }

      setStatus("ready");
      // Refresh thread list to get updated timestamps
      if (currentAssistant) {
        const list = await loadThreads();
        setThreads(list);
      }
    },
    [currentAssistant, currentThread, loadThreads],
  );

  // ── Handle submit ──
  const handleSubmit = useCallback(
    (message: { text: string }) => {
      if (!message.text.trim() || status === "streaming") return;
      sendMessage(message.text.trim());
      setText("");
    },
    [sendMessage, status],
  );

  // ── Handle suggestion click ──
  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (status === "streaming") return;
      sendMessage(text);
    },
    [sendMessage, status],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [],
  );

  const isSubmitDisabled = !text.trim() || status === "streaming";

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen divide-x overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        assistants={assistants}
        currentAssistant={currentAssistant}
        threads={threads}
        currentThread={currentThread}
        onAssistantChange={handleAssistantChange}
        onThreadChange={handleThreadChange}
        onThreadsUpdate={handleThreadsUpdate}
      />

      {/* Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b px-4 py-3 text-sm font-medium">
          {currentThread
            ? (currentThread.metadata?.name as string) || "未命名对话"
            : "新对话"}
        </div>

        {/* Center: Messages or Welcome */}
        {currentThread || messages.length > 0 ? (
          <Conversation>
            <ConversationContent>
              {messages.map(({ id, type, content, additional_kwargs }) => {
                const reasoning_content: any =
                  additional_kwargs?.reasoning_content;
                const isHuman = type === "human";
                const contentArr = Array.isArray(content) ? content : null;

                return (
                  <MessageBranch defaultBranch={0} key={id}>
                    <MessageBranchContent>
                      {isHuman && contentArr ? (
                        contentArr.map((item: any) => (
                          <Message from="user" key={`${id}-${item.id}`}>
                            {reasoning_content && (
                              <Reasoning defaultOpen={true}>
                                <ReasoningTrigger />
                                <ReasoningContent>
                                  {reasoning_content}
                                </ReasoningContent>
                              </Reasoning>
                            )}
                            <MessageContent>
                              <MessageResponse>
                                {item.text as any}
                              </MessageResponse>
                            </MessageContent>
                          </Message>
                        ))
                      ) : (
                        <Message from={isHuman ? "user" : "assistant"} key={id}>
                          {reasoning_content && (
                            <Reasoning defaultOpen={true}>
                              <ReasoningTrigger />
                              <ReasoningContent>
                                {reasoning_content}
                              </ReasoningContent>
                            </Reasoning>
                          )}
                          <MessageContent>
                            <MessageResponse>{content as any}</MessageResponse>
                          </MessageContent>
                        </Message>
                      )}
                    </MessageBranchContent>
                  </MessageBranch>
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Prompt Input (always visible) */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputHeader />
            <PromptInputBody>
              <PromptInputTextarea
                onChange={handleTextChange}
                value={text}
                placeholder="输入你的问题..."
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
