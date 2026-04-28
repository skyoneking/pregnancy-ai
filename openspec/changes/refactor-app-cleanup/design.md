## Context

app/ 目录下存在三套并行实现：
1. **两套聊天 UI**：`page.tsx`（@ai-sdk/react）和 `chatbot/`（LangGraph + 自定义组件）
2. **两套 Agent**：`_langchain/agent.ts`（工具定义 + Agent）和 `_graph/graph.ts`（图编排，依赖 _langchain）
3. **一套未完成的 RAG**：`_RAG/`（加载 Nike 10-K PDF，仅用于测试）

关键依赖链：`api/chat/route.ts` → `_graph/graph.ts` → `_langchain/agent.ts`（工具+Agent）+ `_RAG/agent.ts`（检索）

所有工具定义（calculatePregnancyInfo 等 6 个工具）、模型配置、中间件都在 `_langchain/agent.ts` 中。`_graph/graph.ts` 只是一个薄包装层。

`lib/knowledge.ts` 被 `_langchain/agent.ts` 中的 `getContextualKnowledge` 工具引用，**实际有生产引用**，不能直接删除。

## Goals / Non-Goals

**Goals:**
- 删除旧聊天界面（`page.tsx`），将 `chatbot/` 确立为唯一聊天入口
- 将工具和 Agent 逻辑从 `_langchain/agent.ts` 合并到 `_graph/` 下，然后删除 `_langchain/`
- 删除 `_RAG/` 及其相关 API 路由
- 删除确认无用的文件（`error-messages.ts`、`global.d.ts`）
- 清理相关测试文件

**Non-Goals:**
- 不修改工具的业务逻辑或知识库数据
- 不重构 UI 组件结构
- 不清理 package.json 中的依赖（后续可单独处理）
- 不修改 onboarding/profile 页面

## Decisions

### D1: 工具和 Agent 合并到 _graph/

**决定**: 将 `_langchain/agent.ts` 中的工具定义、模型、中间件拆分到 `_graph/tools.ts` + `_graph/agent.ts`，`graph.ts` 保持图编排职责。

**理由**: `_langchain/agent.ts` 承担了太多职责（工具+模型+中间件+Agent+知识库引用），拆分后每个文件职责单一。

**替代方案**: 全部放入 `graph.ts` — 文件会过大（500+ 行），不可取。

### D2: 知识库文件处理

**决定**: 将 `lib/knowledge.ts` 移动到 `_graph/knowledge.ts`，修复 Stage 类型的重复定义（统一使用 `_supabase/types.ts` 中的）。

**理由**: `knowledge.ts` 被 `getContextualKnowledge` 工具使用，是有实际引用的。移动而非删除，保持功能完整。消除 Stage 类型重复。

### D3: RAG 功能移除

**决定**: 删除 `_graph/graph.ts` 中的 `retrieve` 工具和对 `_RAG/agent.ts` 的引用。

**理由**: RAG 使用 Nike 10-K PDF 测试数据，不是真实业务功能。移除后图结构更简洁。

### D4: 路由策略

**决定**: 删除根 `page.tsx`，在 `chatbot/page.tsx` 中保留 `/chatbot` 路径。

**理由**: chatbot 已是独立路径，简单删除旧页面即可。不涉及路由重定向复杂度。若后续需要根路径跳转，可通过 next.config 的 redirects 配置。

### D5: 测试清理

**决定**: 删除引用已删除模块的测试文件，保留可通过的测试。

**理由**: 引用 _langchain/_RAG 的测试在模块删除后必然失败，需同步清理。

## Risks / Trade-offs

- **[风险] 工具迁移可能引入 bug** → 逐文件迁移，保持导入路径一致，每步运行测试验证
- **[风险] 测试覆盖率下降** → 删除废弃测试后，后续需补充 _graph 层的测试
- **[取舍] 不清理依赖包** → 减少本次变更范围，langchain 相关包后续统一清理
