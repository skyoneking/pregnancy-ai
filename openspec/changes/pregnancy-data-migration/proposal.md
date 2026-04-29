## Why

孕期领域数据（知识库、食物安全库、症状规则、产检时间表、每周发育数据）散落在 `app/_graph/tools.ts` 和 `app/_graph/knowledge.ts` 中，未归入 `lib/pregnancy` 统一管理。同时 `tools.ts` 中的 `calculatePregnancyInfo` 与 `lib/pregnancy/calculator.ts` 功能重复。

## What Changes

- 新建 `lib/pregnancy/data/` 目录，包含 5 个纯数据模块 + 1 个统一导出
- 从 `app/_graph/knowledge.ts` 迁移全部知识库内容到 `lib/pregnancy/data/knowledge.ts`
- 从 `app/_graph/tools.ts` 抽取食物安全库、症状规则、产检时间表、每周发育数据到独立数据模块
- 扩展 `lib/pregnancy/calculator.ts`，新增 `calculatePregnancyInfo` 函数（返回孕周 + 阶段 + 剩余天数），消除与 tools.ts 的重复计算
- 精简 `app/_graph/tools.ts` 为薄 LangChain 包装层，数据从 `lib/pregnancy/data` 导入
- 删除 `app/_graph/knowledge.ts`
- 更新 `lib/pregnancy/index.ts` 新增 data 导出
- 更新测试 import 路径

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `knowledge-base`: 知识数据从 `app/_graph/knowledge.ts` 迁移到 `lib/pregnancy/data/knowledge.ts`，数据内容不变，import 路径变更
- `pregnancy-tools`: 工具数据从内联定义抽取到 `lib/pregnancy/data/` 模块，tools.ts 变为薄包装；删除重复的 `calculatePregnancyInfo` 工具，改用 calculator.ts

## Impact

- **文件变更**: 新建 6 个数据文件，精简 tools.ts，删除 knowledge.ts，扩展 calculator.ts，更新 index.ts
- **测试**: 3 个测试文件需更新 import 路径（knowledge.test.ts、graph-tools.test.ts），断言逻辑不变
- **无 API 变更**: 对外接口不变，仅为内部模块重组
- **无破坏性变更**: agent.ts、graph.ts 不受影响
