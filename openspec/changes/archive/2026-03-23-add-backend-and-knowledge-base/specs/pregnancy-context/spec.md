## MODIFIED Requirements

### Requirement: 用户档案注入 API 请求
系统 SHALL 在每次发送消息时，将用户档案数据随消息一起发送至 `/api/chat`。

#### Scenario: 发送消息携带完整档案信息
- **WHEN** 用户发送消息
- **THEN** 请求体 MUST 包含 `{ messages, profile: { stage, role, dueDate, postpartumDays } }`
- **AND** `stage` 字段 MUST 为 'preconception'、'pregnancy' 或 'postpartum' 之一
- **AND** 孕期用户 MUST 包含 `dueDate` 和 `role` 字段
- **AND** 产后用户 MUST 包含 `postpartumDays` 字段

#### Scenario: 档案不存在时阻止发送
- **WHEN** 用户发送消息但数据库中无有效档案
- **THEN** 系统阻止发送并跳转至 `/onboarding`

### Requirement: API 路由接收全流程上下文
系统 SHALL 从请求体中解析 `profile`，并将其注入 LangChain agent 的 context。

#### Scenario: 孕期上下文注入成功
- **WHEN** API 路由接收到孕期用户（`stage: 'pregnancy'`）的请求
- **THEN** agent context MUST 包含 `stage`、`role` 和 `due_date` 字段
- **AND** context 用于个性化 AI 响应和知识推送

#### Scenario: 备孕期上下文注入成功
- **WHEN** API 路由接收到备孕期用户（`stage: 'preconception'`）的请求
- **THEN** agent context MUST 包含 `stage` 字段（值为 'preconception'）
- **AND** context 不包含 `role`、`due_date` 等孕期特定字段

#### Scenario: 产后期上下文注入成功
- **WHEN** API 路由接收到产后期用户（`stage: 'postpartum'`）的请求
- **THEN** agent context MUST 包含 `stage` 和 `postpartumDays` 字段
- **AND** `postpartumDays` 为产后天数（整数）

#### Scenario: 缺少 profile 时返回错误
- **WHEN** API 路由接收到不含 `profile` 的请求
- **THEN** 系统返回 400 错误，错误信息为"缺少用户档案信息"

### Requirement: Agent context schema 全流程扩展
Agent 的 context schema SHALL 支持 `stage`（阶段）字段，并根据阶段包含相应字段。

#### Scenario: 孕期 context schema 验证
- **WHEN** agent 接收到孕期 context `{ stage: 'pregnancy', role: 'mom', due_date: '2025-09-01' }`
- **THEN** Zod schema 验证通过，agent 正常执行
- **AND** `stage` MUST 为 'pregnancy'
- **AND** `role` MUST 为 'mom' 或 'dad'
- **AND** `due_date` MUST 为有效的 YYYY-MM-DD 格式日期

#### Scenario: 备孕期 context schema 验证
- **WHEN** agent 接收到备孕期 context `{ stage: 'preconception' }`
- **THEN** Zod schema 验证通过，agent 正常执行
- **AND** `stage` MUST 为 'preconception'
- **AND** 允许不包含 `role` 和 `due_date` 字段

#### Scenario: 产后期 context schema 验证
- **WHEN** agent 接收到产后期 context `{ stage: 'postpartum', postpartumDays: 30 }`
- **THEN** Zod schema 验证通过，agent 正常执行
- **AND** `stage` MUST 为 'postpartum'
- **AND** `postpartumDays` MUST 为正整数
- **AND** 允许不包含 `role` 和 `due_date` 字段

#### Scenario: 无效 stage 验证失败
- **WHEN** agent 接收到包含无效 `stage` 的 context
- **THEN** Zod schema 验证失败，抛出错误
- **AND** 错误信息明确说明 `stage` 必须为有效值之一

### Requirement: 系统提示全流程个性化
Agent 的系统提示 SHALL 在运行时注入用户阶段信息，使 AI 响应适配备孕/孕期/产后场景。

#### Scenario: 备孕期系统提示
- **WHEN** context.stage 为 'preconception'
- **THEN** 系统提示中 MUST 包含"备孕期"标识
- **AND** AI 回答侧重孕前准备、排卵追踪、营养补充等内容

#### Scenario: 孕期准妈妈系统提示
- **WHEN** context.stage 为 'pregnancy' 且 context.role 为 'mom'
- **THEN** 系统提示中 MUST 包含"准妈妈"身份标识和当前预产期信息
- **AND** AI 回答侧重母体感受、胎儿发育、孕期注意事项

#### Scenario: 孕期准爸爸系统提示
- **WHEN** context.stage 为 'pregnancy' 且 context.role 为 'dad'
- **THEN** 系统提示中 MUST 包含"准爸爸"身份标识
- **AND** AI 回答侧重陪伴和支持建议

#### Scenario: 产后期系统提示
- **WHEN** context.stage 为 'postpartum'
- **THEN** 系统提示中 MUST 包含"产后期"标识和产后天数
- **AND** AI 回答侧重产后恢复、母乳喂养、新生儿护理

## ADDED Requirements

### Requirement: 阶段切换时 context 更新
系统 SHALL 在用户切换阶段时及时更新 agent context。

#### Scenario: 从备孕切换到孕期
- **WHEN** 用户从备孕期切换到孕期并填写预产期
- **THEN** 系统 MUST 更新用户档案的 `stage` 为 'pregnancy'
- **AND** 下次对话时 agent context MUST 包含新的 `stage` 和 `due_date`
- **AND** AI 自动推送孕期相关知识

#### Scenario: 从孕期切换到产后期
- **WHEN** 用户从孕期切换到产后期
- **THEN** 系统 MUST 更新用户档案的 `stage` 为 'postpartum'
- **AND** 下次对话时 agent context MUST 包含新的 `stage` 和 `postpartumDays`
- **AND** AI 自动推送产后恢复相关知识

#### Scenario: 阶段字段缺失时降级处理
- **WHEN** 用户档案中 `stage` 字段为 null 或未定义
- **THEN** 系统 MUST 引导用户完成阶段选择
- **AND** 在用户选择阶段前，AI 使用通用提示

### Requirement: 上下文推送触发器
系统 SHALL 根据用户阶段和状态自动触发知识推送。

#### Scenario: 孕周变更触发推送
- **WHEN** 孕期用户的孕周发生变化（如从孕 19 周进入孕 20 周）
- **THEN** AI 主动推送该周的核心知识
- **AND** 推送内容包含本周发育、重点事项、产检提醒（如有）

#### Scenario: 产后天数触发推送
- **WHEN** 产后用户进入关键天数（第 3 天、第 7 天、第 42 天）
- **THEN** AI 主动推送该天的恢复和护理知识
- **AND** 推送内容针对性：恶露观察、伤口护理、母乳喂养等

#### Scenario: 备孕期持续推送
- **WHEN** 用户处于备孕期
- **THEN** AI 每周推送一个备孕知识点
- **AND** 推送内容循环覆盖：叶酸、孕前检查、排卵、营养、生活调整、情绪管理
