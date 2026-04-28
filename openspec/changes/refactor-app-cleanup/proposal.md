## Why

app 目录下存在多套并行的聊天界面（page.tsx vs chatbot/）和多套 Agent 实现（_langchain/、_graph/、_RAG/），代码分散且部分已废弃。需要清理无用代码，统一到 chatbot + _graph 架构上，降低维护成本。

## What Changes

- **删除** `app/page.tsx`（旧 AI SDK 聊天界面），将 `app/chatbot/page.tsx` 提升为主页面
- **删除** `app/_langchain/` 目录（旧 LangChain Agent，已被 _graph/ 替代）
- **删除** `app/_RAG/` 目录（RAG Agent，未使用）
- **删除** 确认无引用的废弃文件：`app/lib/error-messages.ts`、`app/types/global.d.ts`、`app/lib/knowledge.ts`
- **清理** 因上述删除产生的孤儿引用（hooks、API 路由、测试文件）
- **更新** 相关测试以匹配重构后的代码结构

## Capabilities

### New Capabilities

（无新增能力，本次为纯清理重构）

### Modified Capabilities

- `pregnancy-chat-ui`: 聊天界面从 `app/page.tsx` + `app/chatbot/` 双入口合并为单一 chatbot 入口
- `agent-unit-tests`: 删除 _langchain 和 _RAG 相关测试，保留 _graph 测试
- `api-route-tests`: 更新 api/chat 路由测试（如引用了 _langchain）

## Impact

- **页面路由**: 根路径 `/` 需要重定向到 `/chatbot` 或将 chatbot 内容提升到根 page.tsx
- **API 路由**: `app/api/chat/route.ts` 目前引用 `_graph/graph`，无需改动；`app/api/rag/route.ts` 需删除
- **Hooks**: `app/hooks/useAgentChat.ts` 可能仅被旧 page.tsx 使用，需确认后清理
- **测试**: `__tests__/` 和 `e2e/` 中涉及已删除模块的测试需同步清理
- **依赖**: package.json 中若有仅被 _langchain/_RAG 使用的依赖，可考虑后续清理
