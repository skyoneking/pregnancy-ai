## Context

当前孕期阶段逻辑分散在多个文件中：
- `app/profile/page.tsx` — `calculateCurrentWeek()` 和 `calculatePostpartumDays()` 两个计算函数
- `app/api/chat/route.ts` — 内联的孕周计算逻辑（与 profile 页重复）
- `app/_langchain/agent.ts` — 手动拼接阶段描述到 system prompt
- `app/lib/knowledge.ts` — `getKnowledgeForStage()` 混合了阶段判断和推送策略
- `app/_langchain/agent.ts` 中工具选择 — 硬编码，无阶段过滤

相同逻辑重复实现，新增子阶段（如"哺乳期"）需改多处。

## Goals / Non-Goals

**Goals:**
- 抽取独立的 `lib/pregnancy/` 领域层，统一管理 6 个子阶段的定义和规则
- 消除 profile/page 和 api/chat 中的重复日期计算
- 让 `_langchain/agent` 和 `lib/knowledge` 成为领域层的消费者
- 保持所有现有行为不变（向后兼容重构）

**Non-Goals:**
- 不新增功能（健康记录 UI、推送通知等不在此次范围）
- 不改动数据库 schema
- 不改动 `_supabase/types.ts` 中的 `Stage` 类型
- 不改动 UI 组件

## Decisions

### 1. 阶段注册表模式（而非状态机或纯函数管道）

**选择**: 每个子阶段导出一个声明式 `StageDefinition` 对象，注册到 `stageRegistry` 数组。

**替代方案**:
- 纯函数管道（按职责拆文件）— 改一个阶段需改 4 个文件，违反"阶段内聚"
- 类继承 — TypeScript 中样板代码多，与项目函数式风格不搭
- XState 状态机 — 引入重依赖，当前阶段转换是纯计算（无副作用），不需要状态机

**理由**: 注册表模式让阶段相关所有逻辑集中在一个文件里，新增阶段只需加一个文件。`match()` 函数做判断，声明式配置做规则。简单、可测试、无框架依赖。

### 2. MainStage 与 SubStage 分层

**选择**: `MainStage`（3 个值，对应数据库 `Stage`）+ `SubStage`（6 个值，领域层实际工作单元）。

**理由**: 数据库存 MainStage，领域层用 SubStage 做细粒度控制。Profile 不变，`createContext()` 自动从 MainStage + 日期推导 SubStage。

### 3. 领域层零框架依赖

**选择**: `lib/pregnancy/` 不依赖 LangChain、LangGraph、Supabase 等任何框架。

**理由**: 领域层是纯 TypeScript 逻辑（日期计算 + 配置匹配），不应该绑定任何基础设施。上层通过 `createContext(profile)` 传入原始数据即可。

### 4. rules/ 作为共享资源

**选择**: `rules/knowledge-rules.ts`、`rules/health-templates.ts`、`rules/capabilities.ts` 被各阶段文件引用组合。

**理由**: 避免在每个阶段里重复定义相同的规则片段（如"体重记录"在孕早中晚期都用）。阶段文件 import 后组合到自己的数组里。

## Risks / Trade-offs

- **[注册表顺序敏感]** stageRegistry 中阶段匹配顺序影响结果 → 确保 match 条件互斥，用测试覆盖边界值
- **[改造面较宽]** 6 个消费方文件需同时改 → 按依赖顺序逐步改造，每步验证 build 通过
- **[类型映射]** MainStage ↔ Stage 的映射隐式依赖字符串一致 → 用类型断言 `type MainStage = Stage` 确保编译期检查
