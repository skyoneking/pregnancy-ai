## ADDED Requirements

### Requirement: POST /api/chat 基本响应
API 路由 SHALL 对合法请求返回 200 响应。

#### Scenario: 合法消息体返回成功响应
- **WHEN** 向 `/api/chat` 发送 POST 请求，body 为 `{ messages: [...] }`
- **THEN** 路由函数返回 HTTP 200 响应

### Requirement: 消息格式转换参数传递
API 路由 SHALL 将请求体中的 `messages` 传递给 `toBaseMessages` 进行格式转换。

#### Scenario: toBaseMessages 被正确调用
- **WHEN** POST 请求携带 `messages` 数组
- **THEN** `toBaseMessages` 被调用，参数为请求体中的 `messages` 数组

### Requirement: agent stream 调用参数正确
API 路由 SHALL 以固定的 `thread_id` 和 `user_id` 调用 `langchainAgent.stream()`。

#### Scenario: stream 以正确 configurable 调用
- **WHEN** POST 请求被处理
- **THEN** `langchainAgent.stream` 被调用，`configurable.thread_id === "1"`，`context.user_id === "u1"`

#### Scenario: streamMode 包含必要模式
- **WHEN** POST 请求被处理
- **THEN** `langchainAgent.stream` 的 `streamMode` 参数包含 `"values"`、`"messages"`、`"custom"`
