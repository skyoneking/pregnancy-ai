## 1. 编辑配置文件

- [x] 1.1 在 `openspec/config.yaml` 中，于 `schema: spec-driven` 后追加 `context` 块，内容包含：
  - `## Project Overview`：项目简介（中文天气助手聊天机器人，Next.js + LangChain/LangGraph）
  - `## Tech Stack`：Next.js 16、React 19、TypeScript 5、LangChain 1.x、LangGraph、Vercel AI SDK、Alibaba QwQ 模型（ALIBABA_API_KEY + BASE_URL）、Tailwind CSS 4、Zod 4、Axios、pnpm
  - `## Architecture`：列出 `app/page.tsx`、`app/hooks/useAgentChat.ts`、`app/api/chat/route.ts`、`app/_langchain/agent.ts` 的路径及职责
  - `## Domain & Features`：工具调用（get_weather_for_location、get_user_location）、工具审批流程、LangGraph MemorySaver 对话记忆、流式响应、中文系统提示
  - `## Conventions`：TypeScript strict mode、`"use client"` 指令、模块化分层（agent / API / hooks / UI）、Conventional Commits

## 2. 验证

- [x] 2.1 运行 `openspec status --change "update-config-context"` 确认所有 artifact 状态为 `done`
- [x] 2.2 查看更新后的 `openspec/config.yaml`，确认 YAML 格式正确（无缩进错误）
- [x] 2.3 使用 `/opsx:propose` 发起一个测试性新 change，观察生成的 proposal.md 是否体现了项目背景信息
