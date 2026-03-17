## ADDED Requirements

### Requirement: 用户档案注入 API 请求
系统 SHALL 在每次发送消息时，将 localStorage 中的 `pregnancy_profile` 随消息一起发送至 `/api/chat`。

#### Scenario: 发送消息携带档案信息
- **WHEN** 用户发送消息
- **THEN** 请求体 MUST 包含 `{ messages, profile: { role, dueDate } }`

#### Scenario: 档案不存在时阻止发送
- **WHEN** 用户发送消息但 localStorage 中无有效档案
- **THEN** 系统阻止发送并跳转至 `/onboarding`

### Requirement: API 路由接收孕期上下文
系统 SHALL 从请求体中解析 `profile`，并将其注入 LangChain agent 的 context。

#### Scenario: 成功注入上下文
- **WHEN** API 路由接收到包含有效 `profile` 的请求
- **THEN** agent 调用时 context MUST 包含 `role` 和 `due_date` 字段

#### Scenario: 缺少 profile 时返回错误
- **WHEN** API 路由接收到不含 `profile` 的请求
- **THEN** 系统返回 400 错误，错误信息为"缺少用户档案信息"

### Requirement: Agent context schema 扩展
Agent 的 context schema SHALL 包含 `role`（'mom' | 'dad'）和 `due_date`（ISO 字符串）字段。

#### Scenario: 有效 context 通过 schema 验证
- **WHEN** agent 接收到 context `{ user_id, role: 'mom', due_date: '2025-09-01' }`
- **THEN** Zod schema 验证通过，agent 正常执行

#### Scenario: 缺少必填字段时验证失败
- **WHEN** agent 接收到缺少 `role` 或 `due_date` 的 context
- **THEN** Zod schema 验证失败，抛出错误

### Requirement: 系统提示携带孕期上下文
Agent 的系统提示 SHALL 在运行时注入用户身份和孕周信息，使 AI 响应具备个性化感知。

#### Scenario: 准妈妈上下文系统提示
- **WHEN** context.role 为 'mom'
- **THEN** 系统提示中 MUST 包含"准妈妈"身份标识和当前预产期信息

#### Scenario: 准爸爸上下文系统提示
- **WHEN** context.role 为 'dad'
- **THEN** 系统提示中 MUST 包含"准爸爸"身份标识，AI 回答侧重陪伴和支持建议