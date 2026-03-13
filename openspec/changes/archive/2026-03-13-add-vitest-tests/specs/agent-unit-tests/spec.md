## ADDED Requirements

### Requirement: getUserLocation 工具函数分支覆盖
`getUserLocation` 工具 SHALL 根据 `config.context.user_id` 返回对应城市。

#### Scenario: user_id 为 u1 时返回上海
- **WHEN** `getUserLocation` 被调用，`config.context.user_id === "u1"`
- **THEN** 返回值为 `"上海"`

#### Scenario: user_id 非 u1 时返回北京
- **WHEN** `getUserLocation` 被调用，`config.context.user_id === "u2"`
- **THEN** 返回值为 `"北京"`

#### Scenario: user_id 为空字符串时返回北京
- **WHEN** `getUserLocation` 被调用，`config.context.user_id === ""`
- **THEN** 返回值为 `"北京"`（非 u1 均视为北京）

### Requirement: getWeather 工具函数行为覆盖
`getWeather` 工具 SHALL 返回包含城市名的天气字符串，并在 writer 可用时发送状态事件。

#### Scenario: 返回包含城市名的天气信息
- **WHEN** `getWeather` 以 `{ city: "上海" }` 调用
- **THEN** 返回值为 `"上海天气一向不错!"`

#### Scenario: writer 存在时发出状态事件
- **WHEN** `getWeather` 被调用，`config.writer` 为 mock 函数
- **THEN** `config.writer` 被调用一次，参数包含 `type: 'status'` 和 `message: '正在查询...'`

#### Scenario: writer 为 undefined 时不抛出错误
- **WHEN** `getWeather` 被调用，`config.writer` 为 `undefined`
- **THEN** 函数正常返回，不抛出任何异常

### Requirement: handleToolErrors 中间件行为覆盖
错误处理中间件 SHALL 在工具成功时透传结果，在工具失败时返回包含错误信息的 ToolMessage。

#### Scenario: handler 正常执行时透传结果
- **WHEN** `handleToolErrors` 包装的 handler 正常返回 `"result"`
- **THEN** 中间件返回值为 `"result"`，不做任何修改

#### Scenario: handler 抛出异常时返回 ToolMessage
- **WHEN** `handleToolErrors` 包装的 handler 抛出 `Error("Tool failed!")`
- **THEN** 中间件返回 `ToolMessage` 实例，其 `content` 包含子串 `"Tool error:"`

### Requirement: contextSchema Zod 校验
`contextSchema` SHALL 正确校验 `user_id` 字段的存在性和类型。

#### Scenario: 合法 context 通过校验
- **WHEN** 以 `{ user_id: "u1" }` 调用 `contextSchema.parse()`
- **THEN** 解析成功，返回 `{ user_id: "u1" }`

#### Scenario: user_id 类型错误时校验失败
- **WHEN** 以 `{ user_id: 123 }` 调用 `contextSchema.safeParse()`
- **THEN** `success` 为 `false`

#### Scenario: 缺少 user_id 时校验失败
- **WHEN** 以 `{}` 调用 `contextSchema.safeParse()`
- **THEN** `success` 为 `false`
