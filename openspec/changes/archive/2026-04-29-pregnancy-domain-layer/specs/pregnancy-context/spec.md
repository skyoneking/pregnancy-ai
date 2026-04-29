## MODIFIED Requirements

### Requirement: API 路由接收全流程上下文
系统 SHALL 通过 `createContext()` 生成 PregnancyContext，取代内联的日期计算逻辑。

#### Scenario: 孕期上下文注入成功
- **WHEN** API 路由接收到孕期用户（`stage: 'pregnancy'`）的请求
- **THEN** 调用 `createContext(profile)` 生成 PregnancyContext
- **AND** agent 接收到的 context MUST 包含 `stage`、`role`、`due_date`、`current_week`（由 createContext 计算）和 `subStage`
- **AND** context 用于个性化 AI 响应和知识推送

#### Scenario: 备孕期上下文注入成功
- **WHEN** API 路由接收到备孕期用户（`stage: 'preconception'`）的请求
- **THEN** 调用 `createContext(profile)` 生成 PregnancyContext
- **AND** context MUST 包含 `stage` 和 `subStage`（均为 'preconception'）
- **AND** context 不包含 `role`、`due_date` 等孕期特定字段

#### Scenario: 产后期上下文注入成功
- **WHEN** API 路由接收到产后期用户（`stage: 'postpartum'`）的请求
- **THEN** 调用 `createContext(profile)` 生成 PregnancyContext
- **AND** context MUST 包含 `stage`、`postpartumDays`（由 createContext 计算）和 `subStage`（'recovery' 或 'nursing'）

#### Scenario: 缺少 profile 时返回错误
- **WHEN** API 路由接收到不含 `profile` 的请求
- **THEN** 系统返回 400 错误，错误信息为"缺少用户档案信息"
