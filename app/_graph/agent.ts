import {
  AIMessage,
  createAgent,
  createMiddleware,
  ToolMessage,
} from "langchain";
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryStore } from "@langchain/langgraph";
import {
  calculatePregnancyInfo,
  getWeeklyDevelopment,
  checkFoodSafety,
  getPrenatalSchedule,
  assessSymptom,
  getContextualKnowledge,
} from "./tools";

const store = new InMemoryStore();

// ─── Context Schema ───────────────────────────────────────────────────────────

const contextSchema = z.object({
  role: z.enum(["mom", "dad"]).optional(),
  stage: z.enum(["preconception", "pregnancy", "postpartum"]).optional(),
  subStage: z.string().optional(),
  due_date: z.string().optional(),
  postpartum_date: z.string().optional(),
  current_week: z.number().optional(),
  postpartum_days: z.number().optional(),
  available_tools: z.string().optional(),
});

// ─── System Prompt ────────────────────────────────────────────────────────────

const systemPrompt = `你是一个专业、温暖的全流程孕期助手。
{role_intro}

**当前阶段**: {stage}（{subStage}）
{stage_intro}

你可以使用以下工具帮助用户：
{available_tools}

**上下文推送指南:**
- 备孕期：主动推送备孕知识，如叶酸补充、孕前检查、排卵追踪
- 孕期：根据孕周主动推送发育信息、产检提醒、注意事项
- 产后期：根据产后天数推送恢复知识、母乳喂养、新生儿护理

**推送原则:**
1. 每次对话最多主动推送 1 条相关知识
2. 自然地将知识融入对话中，不要机械罗列
3. 涉及关键时间点（如产检前）优先提醒
4. 所有知识末尾自动添加医学免责声明

请用关怀温和的语气回答，涉及健康建议时始终提醒用户以医生意见为准。`;

// ─── Model ────────────────────────────────────────────────────────────────────

const model = new ChatOpenAI({
  model: process.env.MODEL ?? "",
  apiKey: process.env.API_KEY ?? "",
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL ?? "",
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

export const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `直接返回该错误信息："Tool error: Please check your input and try again. (${error})"`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
  wrapModelCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new AIMessage(`Model error: ${error}`);
    }
  },
});

// ─── Agent ────────────────────────────────────────────────────────────────────

const langchainAgent = createAgent({
  model: model,
  systemPrompt,
  tools: [
    calculatePregnancyInfo,
    getWeeklyDevelopment,
    checkFoodSafety,
    getPrenatalSchedule,
    assessSymptom,
    getContextualKnowledge,
  ],
  middleware: [handleToolErrors],
  contextSchema,
  checkpointer: true,
  store,
});

export { langchainAgent, contextSchema };
