# 孕期领域数据下沉设计

## 背景

`app/_graph/knowledge.ts` 和 `app/_graph/tools.ts` 包含大量孕期领域数据（知识库、食物安全库、症状规则、产检时间表、每周发育数据），这些数据应归入 `lib/pregnancy` 统一管理。同时 `tools.ts` 中的 `calculatePregnancyInfo` 与 `lib/pregnancy/calculator.ts` 功能重复。

`agent.ts` 和 `graph.ts` 是 LangChain/LangGraph AI 编排层，不迁移。

## 目标目录结构

```
lib/pregnancy/
├── data/                        ← 新增目录
│   ├── knowledge.ts             ← 从 _graph/knowledge.ts 迁入
│   ├── food-safety.ts           ← 从 _graph/tools.ts 抽取
│   ├── symptoms.ts              ← 从 _graph/tools.ts 抽取
│   ├── prenatal-schedule.ts     ← 从 _graph/tools.ts 抽取
│   ├── weekly-dev.ts            ← 从 _graph/tools.ts 抽取
│   └── index.ts                 ← 统一导出
├── calculator.ts                ← 扩展：新增 calculatePregnancyInfo
├── context.ts                   ← 不变
├── types.ts                     ← 不变
├── index.ts                     ← 新增 data 导出
├── rules/                       ← 不变
└── stages/                      ← 不变

app/_graph/
├── agent.ts                     ← 不变
├── graph.ts                     ← 不变
├── tools.ts                     ← 精简：只保留 LangChain tool() 包装
└── knowledge.ts                 ← 删除
```

## 变更清单

### 1. 新建 `lib/pregnancy/data/knowledge.ts`

从 `app/_graph/knowledge.ts` 整体迁入：
- `KnowledgeItem` 接口
- `preconceptionKnowledge` 数组
- `pregnancyKnowledge` Record
- `postpartumKnowledge` 数组
- `searchKnowledgeByKeyword` 函数
- `knowledgeBase` 导出

import 路径调整：`Stage` 类型从 `../types` 导入（原来是 `@/app/_supabase/types`）。

### 2. 新建 `lib/pregnancy/data/food-safety.ts`

从 `app/_graph/tools.ts` 抽取：
- `SafetyLevel` 类型
- `foodDatabase` 常量

### 3. 新建 `lib/pregnancy/data/symptoms.ts`

从 `app/_graph/tools.ts` 抽取：
- `SymptomLevel` 类型
- `SymptomRule` 接口
- `symptomRules` 数组

### 4. 新建 `lib/pregnancy/data/prenatal-schedule.ts`

从 `app/_graph/tools.ts` 抽取：
- `CheckItem` 接口
- `prenatalSchedule` 数组

### 5. 新建 `lib/pregnancy/data/weekly-dev.ts`

从 `app/_graph/tools.ts` 抽取：
- `weeklyData` Record

### 6. 新建 `lib/pregnancy/data/index.ts`

统一导出所有数据模块。

### 7. 扩展 `lib/pregnancy/calculator.ts`

新增 `calculatePregnancyInfo(dueDate: string)` 函数，返回：
```ts
{ currentWeek: number, stage: '孕早期'|'孕中期'|'孕晚期', daysRemaining: number }
```

内部复用已有的 `calculateWeek`。

### 8. 精简 `app/_graph/tools.ts`

- 删除所有内联数据定义
- 删除 `calculatePregnancyInfo` tool
- 每个 tool 改为从 `@/lib/pregnancy/data` 导入数据
- `getContextualKnowledge` tool 保留，改为从 `@/lib/pregnancy/data/knowledge` 导入

### 9. 删除 `app/_graph/knowledge.ts`

### 10. 更新 `lib/pregnancy/index.ts`

新增 `export * as data from './data';`

### 11. 更新测试 import 路径

| 测试文件 | 变更 |
|----------|------|
| `__tests__/unit/knowledge.test.ts` | 从 `@/lib/pregnancy/data/knowledge` 导入 |
| `__tests__/unit/graph-tools.test.ts` | 数据断言从 `@/lib/pregnancy/data` 导入，tool 测试仍从 `@/app/_graph/tools` 导入 |
| `__tests__/unit/graph-agent.test.ts` | 不变 |

## 不变的部分

- `app/_graph/agent.ts` — 不迁移、不修改
- `app/_graph/graph.ts` — 不迁移、不修改
- `lib/pregnancy/rules/` — 不变
- `lib/pregnancy/stages/` — 不变
- `lib/pregnancy/context.ts` — 不变
- `lib/pregnancy/types.ts` — 不变

## 约束

- `lib/pregnancy/` 不得依赖 `langchain` 或任何 AI 框架
- `lib/pregnancy/data/` 中的类型（如 `KnowledgeItem`）可能需要引用 `Stage` 类型，通过 `../types` 或 `@/app/_supabase/types` 导入
- 迁移后所有现有测试必须通过，只改 import 路径不改断言逻辑
