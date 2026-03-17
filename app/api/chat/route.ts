import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { langchainAgent } from "@/app/_langchain/agent";
import type { UserProfile } from "@/app/types/profile";

export async function POST(req: Request) {
  const { messages, profile }: { messages: UIMessage[]; profile?: UserProfile } = await req.json();

  if (!profile) {
    return Response.json({ error: '缺少用户档案' }, { status: 400 });
  }

  const langchainMessages = await toBaseMessages(messages);

  const stream = await langchainAgent.stream(
    { messages: langchainMessages },
    {
      streamMode: ["values", "messages", "custom"],
      configurable: { thread_id: "1" },
      context: { role: profile.role, due_date: profile.dueDate },
    },
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
}
