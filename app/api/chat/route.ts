import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createServerClient } from "@/app/_supabase/server";
import { graph } from "@/app/_graph/graph";
import { createContext } from "@/lib/pregnancy";

export async function POST(req: Request) {
  try {
    // 1. 获取当前用户
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // 2. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.stage) {
      return Response.json(
        { error: '用户档案不完整，请先选择您的阶段' },
        { status: 400 }
      );
    }

    // 3. 解析请求消息
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: '无效的消息格式' },
        { status: 400 }
      );
    }

    // 4. 通过领域层计算阶段信息
    const ctx = createContext(profile);

    // 5. 构建 context（含阶段动态工具列表）
    const availableTools = ctx.capabilities
      .map((c) => `- ${c.id}：${c.label}`)
      .join('\n');

    const context = {
      role: profile.role || undefined,
      stage: ctx.mainStage ?? undefined,
      subStage: ctx.subStage ?? undefined,
      due_date: profile.due_date ?? undefined,
      postpartum_date: profile.postpartum_date ?? undefined,
      current_week: ctx.week,
      postpartum_days: ctx.postpartumDay,
      available_tools: availableTools,
    };

    // 6. 转换消息并调用 agent
    const langchainMessages = await toBaseMessages(messages);

    const stream = await graph.stream(
      { messages: langchainMessages },
      {
        streamMode: ["values", "messages", "custom"],
        configurable: { thread_id: user.id },
        context,
      },
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });

  } catch (error) {
    console.error('Chat API 错误:', error);
    return Response.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
