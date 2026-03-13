## ADDED Requirements

### Requirement: 空消息列表基础渲染
Chat 组件 SHALL 在无消息时正常渲染输入框和表单。

#### Scenario: 空消息列表时渲染 input
- **WHEN** `useChat` 返回空 `messages` 数组
- **THEN** 页面存在一个 placeholder 为 `"Say something..."` 的输入框

### Requirement: 消息角色标签渲染
Chat 组件 SHALL 根据消息 role 显示对应前缀标签。

#### Scenario: 用户消息显示 User 前缀
- **WHEN** `messages` 包含 `role: "user"` 的消息（text part）
- **THEN** 渲染结果包含文本 `"User: "`

#### Scenario: AI 消息显示 AI 前缀
- **WHEN** `messages` 包含 `role: "assistant"` 的消息（text part）
- **THEN** 渲染结果包含文本 `"AI: "`

### Requirement: 工具审批三种状态渲染
Chat 组件 SHALL 正确渲染 `tool-getWeatherInformation` part 的三种状态。

#### Scenario: approval-requested 状态显示城市和操作按钮
- **WHEN** 消息包含 `type: "tool-getWeatherInformation"`、`state: "approval-requested"` 的 part，`input.city` 为 `"上海"`
- **THEN** 渲染结果包含 `"上海"`，并存在 `"Approve"` 和 `"Deny"` 两个按钮

#### Scenario: 点击 Approve 调用 addToolApprovalResponse
- **WHEN** 用户点击 `"Approve"` 按钮
- **THEN** `addToolApprovalResponse` 被调用，参数包含 `{ approved: true }`

#### Scenario: 点击 Deny 调用 addToolApprovalResponse
- **WHEN** 用户点击 `"Deny"` 按钮
- **THEN** `addToolApprovalResponse` 被调用，参数包含 `{ approved: false }`

#### Scenario: output-available 状态显示天气输出
- **WHEN** 消息包含 `state: "output-available"`、`input.city: "上海"`、`output: "上海天气一向不错!"` 的 part
- **THEN** 渲染结果包含 `"上海天气一向不错!"`

#### Scenario: output-denied 状态显示拒绝提示
- **WHEN** 消息包含 `state: "output-denied"`、`input.city: "上海"` 的 part
- **THEN** 渲染结果包含 `"上海"` 和 `"denied"` 相关文本

### Requirement: data-status part 条件渲染
Chat 组件 SHALL 仅在消息最后一个 part 不是 text 时显示 status 消息。

#### Scenario: 最后 part 非 text 时显示 status
- **WHEN** 消息最后一个 part 为 `type: "data-status"`，`data.message: "正在查询..."`
- **THEN** 渲染结果包含 `"正在查询..."`

#### Scenario: 最后 part 为 text 时不显示 status
- **WHEN** 消息包含 `data-status` part，但最后一个 part 为 `type: "text"`
- **THEN** 渲染结果不包含 status 的 data.message 内容

### Requirement: 表单提交行为
Chat 组件 SHALL 在表单提交时调用 sendMessage 并清空输入框。

#### Scenario: 提交表单后调用 sendMessage 并清空 input
- **WHEN** 用户在输入框输入 `"上海天气怎么样"` 后提交表单
- **THEN** `sendMessage` 被调用，参数为 `{ text: "上海天气怎么样" }`，且输入框值变为空字符串
