## Context

当前孕期领域数据分布在两处：
- `lib/pregnancy/` — 已有阶段定义、日期计算、上下文工厂、知识规则元数据
- `app/_graph/` — 知识内容数据、食物安全库、症状规则、产检时间表、每周发育数据，以及 LangChain agent/tool 包装

`app/_graph/tools.ts` 中的 `calculatePregnancyInfo` 与 `lib/pregnancy/calculator.ts` 重复实现了孕周计算。

## Goals / Non-Goals

**Goals:**
- 孕期领域纯数据统一归入 `lib/pregnancy/data/`
- `lib/pregnancy` 不依赖 `langchain` 或任何 AI 框架
- 消除 calculator 重复计算
- `app/_graph/tools.ts` 精简为纯 LangChain 包装胶水

**Non-Goals:**
- 不迁移 `agent.ts` 和 `graph.ts`（AI 编排层留在 `_graph`）
- 不改变工具的对外行为（输入/输出不变）
- 不重构知识数据内容本身
- 不合并 `data/knowledge.ts` 和 `rules/knowledge-rules.ts`（二者职责不同：内容 vs 元数据规则）

## Decisions

### D1: 数据文件按领域实体拆分而非按来源

5 个独立文件：`knowledge.ts`、`food-safety.ts`、`symptoms.ts`、`prenatal-schedule.ts`、`weekly-dev.ts`。

**替代方案**: 按来源（tools-data.ts + knowledge.ts 两文件）。
**选择理由**: 每个数据实体职责单一，后续独立维护时不会互相污染。与 `rules/` 目录下按职责拆分的模式一致。

### D2: calculator.ts 扩展而非保留重复 tool

在 `calculator.ts` 新增 `calculatePregnancyInfo(dueDate)` 返回 `{ currentWeek, stage, daysRemaining }`，tools.ts 的 `calculate_pregnancy_info` tool 内部调用它。

**替代方案**: 保留两处计算，仅做数据迁移。
**选择理由**: 重复计算是 bug 温床（如阶段阈值不一致），复用已有函数更安全。

### D3: data 通过 index.ts 统一导出，lib/pregnancy/index.ts 新增 data 命名空间导出

`data/index.ts` 直接 re-export 各模块。`lib/pregnancy/index.ts` 新增 `export * as data from './data'`。

**选择理由**: 消费者可按需 `import { foodDatabase } from '@/lib/pregnancy/data/food-safety'` 或统一 `import { data } from '@/lib/pregnancy'`。两种方式都支持。

## Risks / Trade-offs

- **[迁移遗漏]** import 路径更新遗漏导致运行时错误 → 通过测试覆盖验证，所有测试通过即确认无遗漏
- **[循环依赖]** data 模块如果反向引用上层模块 → data 模块只能引用同层或 `../types`，通过 lint 规则约束
- **[KnowledgeItem.stage 类型]** 当前从 `@/app/_supabase/types` 导入 `Stage`，迁移后可改用 `../types` 的 `MainStage`（`MainStage = Stage`，类型兼容）
