## 1. 创建 lib/pregnancy/data/ 数据模块

- [x] 1.1 新建 `lib/pregnancy/data/knowledge.ts`：从 `app/_graph/knowledge.ts` 迁入 KnowledgeItem 类型、preconceptionKnowledge、pregnancyKnowledge、postpartumKnowledge、searchKnowledgeByKeyword、knowledgeBase；调整 Stage 导入路径
- [x] 1.2 新建 `lib/pregnancy/data/food-safety.ts`：从 `app/_graph/tools.ts` 抽取 SafetyLevel 类型和 foodDatabase 常量
- [x] 1.3 新建 `lib/pregnancy/data/symptoms.ts`：从 `app/_graph/tools.ts` 抽取 SymptomLevel 类型、SymptomRule 接口、symptomRules 数组
- [x] 1.4 新建 `lib/pregnancy/data/prenatal-schedule.ts`：从 `app/_graph/tools.ts` 抽取 CheckItem 接口、prenatalSchedule 数组
- [x] 1.5 新建 `lib/pregnancy/data/weekly-dev.ts`：从 `app/_graph/tools.ts` 抽取 weeklyData Record
- [x] 1.6 新建 `lib/pregnancy/data/index.ts`：统一 re-export 所有数据模块的公开导出

## 2. 扩展领域层

- [x] 2.1 扩展 `lib/pregnancy/calculator.ts`：新增 `calculatePregnancyInfo(dueDate)` 返回 `{ currentWeek, stage, daysRemaining }`，内部复用 `calculateWeek`
- [x] 2.2 更新 `lib/pregnancy/index.ts`：新增 `export * as data from './data'` 和 `calculatePregnancyInfo` 导出

## 3. 精简 app/_graph 层

- [x] 3.1 重写 `app/_graph/tools.ts`：删除所有内联数据定义，改为从 `@/lib/pregnancy/data` 导入数据；删除 `calculatePregnancyInfo` tool，改为在 `calculate_pregnancy_info` tool 中调用 `calculator.calculatePregnancyInfo`
- [x] 3.2 删除 `app/_graph/knowledge.ts`

## 4. 更新测试

- [x] 4.1 更新 `__tests__/unit/knowledge.test.ts`：import 路径从 `@/app/_graph/knowledge` 改为 `@/lib/pregnancy/data/knowledge`
- [x] 4.2 更新 `__tests__/unit/graph-tools.test.ts`：数据相关的 import 从 `@/lib/pregnancy/data` 导入，tool 测试仍从 `@/app/_graph/tools` 导入
- [x] 4.3 运行全部测试确认通过：`pnpm test`
