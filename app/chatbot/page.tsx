"use client";

import {
  Attachment,
  AttachmentData,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { ToolUIPart } from "ai";
import { CheckIcon, GlobeIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Client } from "@langchain/langgraph-sdk";
import { BaseMessage } from "langchain";

const client = new Client({
  apiUrl: "http://localhost:2024",
});

const models = [
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "gpt-4o",
    name: "GPT-4o",
    providers: ["openai", "azure"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    providers: ["openai", "azure"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    providers: ["google"],
  },
];

const suggestions = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
  "Tell me about TypeScript benefits",
  "How to optimize database queries?",
  "What is the difference between SQL and NoSQL?",
  "Explain cloud computing basics",
];

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const chefs = ["OpenAI", "Anthropic", "Google"];

const AttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: AttachmentData;
  onRemove: (id: string) => void;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [onRemove, attachment.id]);

  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
};

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id);
    },
    [attachments],
  );

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  );
};

const SuggestionItem = ({
  suggestion,
  onClick,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(suggestion);
  }, [onClick, suggestion]);

  return <Suggestion onClick={handleClick} suggestion={suggestion} />;
};

const ModelItem = ({
  m,
  isSelected,
  onSelect,
}: {
  m: (typeof models)[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const handleSelect = useCallback(() => {
    onSelect(m.id);
  }, [onSelect, m.id]);

  return (
    <ModelSelectorItem onSelect={handleSelect} value={m.id}>
      <ModelSelectorLogo provider={m.chefSlug} />
      <ModelSelectorName>{m.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {m.providers.map((provider) => (
          <ModelSelectorLogo key={provider} provider={provider} />
        ))}
      </ModelSelectorLogoGroup>
      {isSelected ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  );
};

const Example = () => {
  const [model, setModel] = useState<string>(models[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState<string>("");
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [, setStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const assist = await client.assistants.search();
      console.log("assistants:", assist);
      const threads = await client.threads.search<{
        messages: BaseMessage[];
      }>();
      console.log("threads:", threads);
      setMessages(threads[0]?.values.messages ?? []);
    }
    run();
  }, []);

  const selectedModelData = useMemo(
    () => models.find((m) => m.id === model),
    [model],
  );

  // const updateMessageContent = useCallback(
  //   (messageId: string, newContent: string) => {
  //     setMessages((prev) =>
  //       prev.map((msg) => {
  //         if (msg.versions.some((v) => v.id === messageId)) {
  //           return {
  //             ...msg,
  //             versions: msg.versions.map((v) =>
  //               v.id === messageId ? { ...v, content: newContent } : v,
  //             ),
  //           };
  //         }
  //         return msg;
  //       }),
  //     );
  //   },
  //   [],
  // );

  const streamResponse = useCallback(
    async (messageId: string, content: string) => {
      setStatus("streaming");
      setStreamingMessageId(messageId);

      const words = content.split(" ");
      let currentContent = "";

      for (const [i, word] of words.entries()) {
        currentContent += (i > 0 ? " " : "") + word;
        // updateMessageContent(messageId, currentContent);
        await delay(Math.random() * 100 + 50);
      }

      setStatus("ready");
      setStreamingMessageId(null);
    },
    // [updateMessageContent],
    [],
  );

  const addUserMessage = useCallback(async (content: string) => {
    const assist = await client.assistants.search();
    const threads = await client.threads.search<{
      messages: BaseMessage[];
    }>();
    const res = client.runs.stream(null, assist[0]?.assistant_id, {
      input: {
        messages: [{ role: "user", content }],
        thread_id: threads[0]?.thread_id,
      },
      streamMode: "messages",
    });
    // console.log("res", await res);
    for await (const chunk of res) {
      console.log("res", chunk);
      const newMsg = (chunk.data as any)[0];
      // 用户
      if (
        chunk.event === "messages/complete" &&
        chunk.data[0]?.type === "human"
      ) {
        setMessages((prev) => [...prev, newMsg]);
      }
      // AI
      if (
        chunk.event === "messages/partial" ||
        (chunk.event === "messages/complete" && chunk.data[0]?.type === "ai")
      ) {
        setMessages((prev) => {
          const index = prev.findIndex((msg) => msg.id === newMsg.id);
          if (index === -1) return [...prev, newMsg];

          const updated = [...prev];
          updated[index] = newMsg;
          return updated;
        });
      }
    }
  }, []);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      setStatus("submitted");

      if (message.files?.length) {
        // toast.success("Files attached", {
        //   description: `${message.files.length} file(s) attached to message`,
        // });
      }

      addUserMessage(message.text || "Sent with attachments");
      setText("");
    },
    [addUserMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setStatus("submitted");
      addUserMessage(suggestion);
    },
    [addUserMessage],
  );

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    [],
  );

  const toggleWebSearch = useCallback(() => {
    setUseWebSearch((prev) => !prev);
  }, []);

  const handleModelSelect = useCallback((modelId: string) => {
    setModel(modelId);
    setModelSelectorOpen(false);
  }, []);

  const isSubmitDisabled = useMemo(
    () => !(text.trim() || status) || status === "streaming",
    [text, status],
  );

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden h-screen">
      <div className="shrink-0 py-4 pl-4 text-red-500">yours chatbot!!!</div>
      <Conversation>
        <ConversationContent>
          {messages.map(({ id, type, content, additional_kwargs }) => {
            const reasoning_content = additional_kwargs?.reasoning_content;
            return (
              <MessageBranch defaultBranch={0} key={id}>
                <MessageBranchContent>
                  {type === "human" && Array.isArray(content) ? (
                    content.map((item) => (
                      <Message
                        from={type === "human" ? "user" : "assistant"}
                        key={`${id}-${item.id}`}
                      >
                        <>
                          {/* {message.sources?.length && (
                            <Sources>
                              <SourcesTrigger count={message.sources.length} />
                              <SourcesContent>
                                {message.sources.map((source) => (
                                  <Source
                                    href={source.href}
                                    key={source.href}
                                    title={source.title}
                                  />
                                ))}
                              </SourcesContent>
                            </Sources>
                          )} */}
                          {reasoning_content && (
                            <Reasoning defaultOpen={true}>
                              <ReasoningTrigger />
                              <ReasoningContent>
                                {reasoning_content as any}
                              </ReasoningContent>
                            </Reasoning>
                          )}
                          <MessageContent>
                            <MessageResponse>
                              {item.text as any}
                            </MessageResponse>
                          </MessageContent>
                        </>
                      </Message>
                    ))
                  ) : (
                    <Message
                      from={type === "human" ? "user" : "assistant"}
                      key={`${id}`}
                    >
                      <>
                        {/* {message.sources?.length && (
                            <Sources>
                              <SourcesTrigger count={message.sources.length} />
                              <SourcesContent>
                                {message.sources.map((source) => (
                                  <Source
                                    href={source.href}
                                    key={source.href}
                                    title={source.title}
                                  />
                                ))}
                              </SourcesContent>
                            </Sources>
                          )} */}
                        {reasoning_content && (
                          <Reasoning defaultOpen={true}>
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {reasoning_content as any}
                            </ReasoningContent>
                          </Reasoning>
                        )}
                        <MessageContent>
                          <MessageResponse>{content as any}</MessageResponse>
                        </MessageContent>
                      </>
                    </Message>
                  )}
                </MessageBranchContent>
                {content.length > 1 && (
                  <MessageBranchSelector>
                    <MessageBranchPrevious />
                    <MessageBranchPage />
                    <MessageBranchNext />
                  </MessageBranchSelector>
                )}
              </MessageBranch>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea onChange={handleTextChange} value={text} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <SpeechInput
                  className="shrink-0"
                  onTranscriptionChange={handleTranscriptionChange}
                  size="icon-sm"
                  variant="ghost"
                />
                <PromptInputButton
                  onClick={toggleWebSearch}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger
                    render={
                      <PromptInputButton>
                        {selectedModelData?.chefSlug && (
                          <ModelSelectorLogo
                            provider={selectedModelData.chefSlug}
                          />
                        )}
                        {selectedModelData?.name && (
                          <ModelSelectorName>
                            {selectedModelData.name}
                          </ModelSelectorName>
                        )}
                      </PromptInputButton>
                    }
                  ></ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {chefs.map((chef) => (
                        <ModelSelectorGroup heading={chef} key={chef}>
                          {models
                            .filter((m) => m.chef === chef)
                            .map((m) => (
                              <ModelItem
                                isSelected={model === m.id}
                                key={m.id}
                                m={m}
                                onSelect={handleModelSelect}
                              />
                            ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
              <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default Example;
