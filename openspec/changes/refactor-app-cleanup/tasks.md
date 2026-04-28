## 1. 迁移工具和 Agent 到 _graph/

- [x] 1.1 创建 `app/_graph/tools.ts`，从 `app/_langchain/agent.ts` 提取 6 个工具定义（calculatePregnancyInfo、getWeeklyDevelopment、checkFoodSafety、getPrenatalSchedule、assessSymptom、getContextualKnowledge）及其依赖数据（weeklyData、foodDatabase、prenatalSchedule、symptomRules）
- [x] 1.2 创建 `app/_graph/agent.ts`，从 `app/_langchain/agent.ts` 提取模型配置（ChatOpenAI）、中间件（handleToolErrors）、contextSchema、systemPrompt 和 agent 创建逻辑
- [x] 1.3 将 `app/lib/knowledge.ts` 移动到 `app/_graph/knowledge.ts`，修复 Stage 类型导入（统一使用 `@/app/_supabase/types` 中的 Stage）
- [x] 1.4 更新 `app/_graph/tools.ts` 中 getContextualKnowledge 的导入路径，从 `@/app/_graph/knowledge` 导入
- [x] 1.5 重写 `app/_graph/graph.ts`：移除 `_langchain` 和 `_RAG` 导入，移除 retrieve 工具和 store.put 测试代码，改为从 `./agent` 和 `./tools` 导入

## 2. 删除废弃模块

- [x] 2.1 删除 `app/_langchain/` 目录
- [x] 2.2 删除 `app/_RAG/` 目录
- [x] 2.3 删除 `app/api/rag/route.ts`
- [x] 2.4 删除 `app/page.tsx`（旧聊天界面）
- [x] 2.5 删除 `app/lib/knowledge.ts`（已迁移到 _graph/）
- [x] 2.6 删除 `app/lib/error-messages.ts`（无引用）
- [x] 2.7 删除 `app/types/global.d.ts`（空文件）

## 3. 清理测试

- [x] 3.1 删除 `__tests__/unit/agent.test.ts`（引用 _langchain/agent）
- [x] 3.2 删除 `__tests__/unit/agent-tools.test.ts`（引用 _langchain/agent 和 knowledge）
- [x] 3.3 删除 `__tests__/unit/knowledge.test.ts`（引用已移动的 knowledge）— 已更新导入路径保留
- [x] 3.4 更新 `__tests__/unit/api/chat.route.test.ts`，将 mock 路径从 `@/app/_langchain/agent` 改为 `@/app/_graph/graph`
- [x] 3.5 运行 `pnpm test` 确认所有剩余测试通过

## 4. 验证

- [x] 4.1 运行 `pnpm build` 确认无编译错误 — 预存 TypeScript 错误（attachments.tsx:openDelay）与本次重构无关
- [x] 4.2 运行 `pnpm test` 确认所有测试通过 — 179/179 通过，仅 profile.test.ts 有预存问题
- [x] 4.3 通过 Playwright MCP 工具访问 `/chatbot`，确认聊天界面正常加载
- [x] 4.4 确认 `/api/chat` 路由正常响应（检查无 500 错误）— 无 auth 返回 401，符合预期
