## 1. 领域层基础设施

- [x] 1.1 创建 `lib/pregnancy/types.ts` — 定义 MainStage、SubStage、StageDefinition、RawContext、PregnancyContext、KnowledgeRule、HealthTemplate、FieldDef、Capability 类型
- [x] 1.2 创建 `lib/pregnancy/calculator.ts` — 实现 `calculateWeek(dueDate)` 和 `calculatePostpartumDay(postpartumDate)` 纯函数，从现有 profile/page.tsx 和 api/chat/route.ts 中提取并统一
- [x] 1.3 编写 `__tests__/unit/lib/pregnancy/calculator.test.ts` — 覆盖正常计算、边界值（预产期已过/未来、产后天数 0/42/43）、类型验证

## 2. 共享规则

- [x] 2.1 创建 `lib/pregnancy/rules/health-templates.ts` — 定义各阶段健康数据模板（fetalMovement、weightTracking、symptomRecord、folicAcid 等），每个模板包含 id、label、fields
- [x] 2.2 创建 `lib/pregnancy/rules/capabilities.ts` — 定义 6 个 AI 工具的 capability 对象（对应现有 tools.ts 中的工具名）
- [x] 2.3 创建 `lib/pregnancy/rules/knowledge-rules.ts` — 定义各阶段的知识推送规则（auto/checklist/on-demand），从现有 knowledge.ts 的推送逻辑提取

## 3. 阶段注册表

- [x] 3.1 创建 `lib/pregnancy/stages/preconception.ts` — 备孕期 StageDefinition（match: mainStage === 'preconception'）
- [x] 3.2 创建 `lib/pregnancy/stages/early-pregnancy.ts` — 孕早期（≤12周）
- [x] 3.3 创建 `lib/pregnancy/stages/mid-pregnancy.ts` — 孕中期（13-27周）
- [x] 3.4 创建 `lib/pregnancy/stages/late-pregnancy.ts` — 孕晚期（≥28周）
- [x] 3.5 创建 `lib/pregnancy/stages/postpartum-recovery.ts` — 产后恢复（0-42天）
- [x] 3.6 创建 `lib/pregnancy/stages/nursing-period.ts` — 哺乳期（43天+）
- [x] 3.7 创建 `lib/pregnancy/stages/index.ts` — 导出 stageRegistry 数组，按匹配优先级排列（先具体后通用）
- [x] 3.8 编写 `__tests__/unit/lib/pregnancy/stages.test.ts` — 验证 6 个阶段匹配互斥、边界值（week 12/13/27/28、day 42/43）

## 4. 上下文工厂

- [x] 4.1 创建 `lib/pregnancy/context.ts` — 实现 `createContext(profile)` 函数：调用 calculator 计算 week/postpartumDay → 遍历 stageRegistry 匹配 → 组装 PregnancyContext
- [x] 4.2 编写 `__tests__/unit/lib/pregnancy/context.test.ts` — 端到端测试：给定各阶段 Profile 验证返回完整 PregnancyContext（含正确的 subStage、stageDef、healthTemplates、capabilities）
- [x] 4.3 创建 `lib/pregnancy/index.ts` — 统一导出 createContext、types、stageRegistry

## 5. 消费方改造

- [x] 5.1 改造 `app/profile/page.tsx` — 删除 calculateCurrentWeek/calculatePostpartumDays，改用 `createContext(profile)` 获取 week/postpartumDay/subStage label
- [x] 5.2 改造 `app/api/chat/route.ts` — 删除内联周数计算，改用 `createContext(profile)` 构建 agent context
- [x] 5.3 改造 `app/_langchain/agent.ts` — 从 PregnancyContext 获取阶段信息用于 system prompt，根据 ctx.capabilities 动态选择工具
- [x] 5.4 改造 `app/_langchain/agent.ts` 中的工具注册 — 从硬编码全部工具改为从 capabilities 过滤
- [x] 5.5 改造 `app/lib/knowledge.ts` — 删除 `getKnowledgeForStage()` 函数，仅保留纯数据导出；推送逻辑已迁入 rules/knowledge-rules.ts
- [x] 5.6 改造 `app/onboarding/page.tsx` — 阶段选项从 stageRegistry 动态生成 mainStage 去重列表

## 6. 验证

- [x] 6.1 `pnpm build` 编译通过
- [x] 6.2 `pnpm test` 全部通过（含新写的领域层测试）
- [x] 6.3 手动验证：聊天功能正常、profile 显示正确、onboarding 流程正常
