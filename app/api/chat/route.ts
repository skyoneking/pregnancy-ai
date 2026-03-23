import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { langchainAgent } from "@/app/_langchain/agent";
import { createServerClient } from "@/app/_supabase/server";
import type { Profile } from "@/app/_supabase/types";

/**
 * 计算当前孕周或产后天数
 */
function calculateStageInfo(profile: Profile) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (profile.stage === 'pregnancy' && profile.due_date) {
    // 计算孕周
    const dueDate = new Date(profile.due_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
    const daysPregnant = 280 - daysRemaining;
    const currentWeek = Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));

    return {
      stage: 'pregnancy' as const,
      current_week: currentWeek,
      due_date: profile.due_date,
    };
  }

  if (profile.stage === 'postpartum' && profile.postpartum_date) {
    // 计算产后天数
    const postpartumDate = new Date(profile.postpartum_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const postpartumDays = Math.round((today.getTime() - postpartumDate.getTime()) / msPerDay);

    return {
      stage: 'postpartum' as const,
      postpartum_days: Math.max(0, postpartumDays),
      postpartum_date: profile.postpartum_date,
    };
  }

  // 备孕期
  return {
    stage: 'preconception' as const,
  };
}

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

    // 4. 计算阶段信息
    const stageInfo = calculateStageInfo(profile);

    // 5. 构建 context
    const context = {
      role: profile.role || undefined,
      stage: stageInfo.stage,
      due_date: stageInfo.due_date,
      postpartum_date: stageInfo.postpartum_date,
      current_week: stageInfo.current_week,
      postpartum_days: stageInfo.postpartum_days,
    };

    // 6. 转换消息并调用 agent
    const langchainMessages = await toBaseMessages(messages);

    const stream = await langchainAgent.stream(
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
