## MODIFIED Requirements

### Requirement: POST /api/chat 基本响应
API 路由 SHALL 通过 `_graph/graph` 的 `graph.stream()` 处理聊天请求。

#### Scenario: 合法消息体返回成功响应
- **WHEN** 向 `/api/chat` 发送 POST 请求，携带合法 messages 和认证信息
- **THEN** 路由函数返回 HTTP 200 流式响应

#### Scenario: 未登录返回 401
- **WHEN** 向 `/api/chat` 发送 POST 请求，无有效认证
- **THEN** 路由函数返回 HTTP 401

#### Scenario: 无档案返回 400
- **WHEN** 向 `/api/chat` 发送 POST 请求，已认证但无 profile
- **THEN** 路由函数返回 HTTP 400

### Requirement: agent stream 调用参数正确
API 路由 SHALL 使用 `graph.stream()` 并传入用户 context（role, stage, due_date 等）。

#### Scenario: stream 以用户 ID 作为 thread_id
- **WHEN** POST 请求被已认证用户处理
- **THEN** `graph.stream` 的 `configurable.thread_id` 为用户 ID

#### Scenario: stream 传入阶段 context
- **WHEN** 用户 profile 阶段为 pregnancy
- **THEN** `graph.stream` 的 context 包含 `stage: "pregnancy"` 和计算的 `current_week`

## REMOVED Requirements

### Requirement: 消息格式转换参数传递
**Reason**: 当前实现通过 `toBaseMessages` 转换消息后传给 graph.stream，逻辑已内化在路由中
**Migration**: 新的 API 路由测试直接验证 graph.stream 的调用参数
