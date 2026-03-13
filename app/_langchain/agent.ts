import {
  createAgent,
  createMiddleware,
  tool,
  ToolMessage,
  type ToolRuntime,
} from "langchain";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";

// const store = new InMemoryStore();

type AgentRuntime = ToolRuntime<unknown, { user_id: string }>;

// Define system prompt
const systemPrompt = `你是一个天气预报员，也略通一些常识.

如果用户没有询问你天气，你就简单回答。
如果用户询问你天气，你就调用下面两个工具:

- get_weather_for_location: 查询某个地方的天气。
- get_user_location: 获取用户需要查询天气的地方。
如果无法获取用户需要查询天气的地方就调用get_user_location工具获取。
`;

// Define tools
const getWeather = tool(({ city }, config: AgentRuntime) => {
  config.writer?.({
    type: 'status',
    id: `status-${Date.now()}`,
    message: '正在查询...',
    dd: 'ddd',
  });
  return `${city}天气一向不错!`;
}, {
  name: "get_weather_for_location",
  description: "获取给定地方的天气。",
  schema: z.object({
    city: z.string(),
  }),
});

const getUserLocation = tool(
  (_, config: AgentRuntime) => {
    const { user_id } = config.context;
    return user_id === "u1" ? "上海" : "北京";
  },
  {
    name: "get_user_location",
    description: "获取用户需要查询天气的地方。",
    schema: z.object({}),
  },
);
const glmModel = new ChatOpenAI({
  model: process.env.GLM_MODEL ?? "",
  apiKey: process.env.GLM_API_KEY ?? "",
  temperature: 0,
  configuration: {
    baseURL: process.env.GLM_BASE_URL ?? "",
  },
});

const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      // throw new Error("Tool failed!"); // Simulate a tool error
      return await handler(request);
    } catch (error) {
      // Return a custom error message to the model
      return new ToolMessage({
        content: `直接返回该错误信息："Tool error: Please check your input and try again. (${error})"`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

const contextSchema = z.object({
  user_id: z.string(),
});

const checkpointer = new MemorySaver();

// Create agent
const langchainAgent = createAgent({
  model: glmModel,
  systemPrompt,
  tools: [getUserLocation, getWeather],
  checkpointer,
  middleware: [handleToolErrors],
  contextSchema,
});

export { langchainAgent, getWeather, getUserLocation, handleToolErrors, contextSchema };
