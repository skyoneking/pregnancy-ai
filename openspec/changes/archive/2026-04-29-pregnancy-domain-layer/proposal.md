## Why

孕期阶段逻辑分散在 `profile/page.tsx`（周数计算）、`_langchain/agent.ts`（工具选择）、`lib/knowledge.ts`（知识推送）、`api/chat/route.ts`（重复计算）等多个文件中。相同逻辑重复实现，阶段判断没有统一标准，新增子阶段需要改多处。需要抽取独立的领域层来统一管理。

## What Changes

- 新增 `lib/pregnancy/` 领域层，包含阶段注册表（6 个子阶段）、日期计算器、上下文工厂
- 每个子阶段声明式定义自己的知识推送规则、健康数据模板、能力/工具列表
- `_langchain/agent.ts` 改为从 `PregnancyContext` 动态选择工具，不再手动拼接阶段描述
- `lib/knowledge.ts` 的推送逻辑迁入领域层，本文件变成纯数据源
- `profile/page.tsx` 和 `api/chat/route.ts` 删除重复的计算函数，改用 `createContext()`
- `onboarding/page.tsx` 阶段选项从注册表动态生成

## Capabilities

### New Capabilities
- `pregnancy-domain`: 孕期全周期领域层——阶段注册表、日期计算、上下文工厂、知识推送规则、健康数据模板、能力控制

### Modified Capabilities
- `pregnancy-context`: 上下文构建从分散计算改为统一由 `createContext()` 生成
- `pregnancy-tools`: 工具从内嵌阶段判断改为无状态纯函数，由领域层 capabilities 控制可用性
- `knowledge-base`: 推送逻辑迁入领域层，knowledge 文件变成纯数据源
- `user-profile`: 周数/天数显示改用领域层计算结果
- `user-onboarding`: 阶段选项从注册表动态生成，不再硬编码

## Impact

- **新增代码**: `lib/pregnancy/` 目录（types、calculator、context、stages/、rules/）
- **修改代码**: `app/_langchain/agent.ts`、`app/lib/knowledge.ts`、`app/api/chat/route.ts`、`app/profile/page.tsx`、`app/onboarding/page.tsx`
- **依赖**: 无新外部依赖，纯 TypeScript 实现
- **数据库**: 无 schema 变更
- **API**: 无接口变更，行为保持向后兼容
