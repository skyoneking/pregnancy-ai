import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { langchainAgent } from "@/app/_langchain/agent";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const langchainMessages = await toBaseMessages(messages);

  const stream = await langchainAgent.stream(
    { messages: langchainMessages },
    {
      streamMode: ["values", "messages", "custom"],
      configurable: { thread_id: "1" },
      context: { user_id: "u1" },
    },
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
}
