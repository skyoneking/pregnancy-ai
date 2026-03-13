## ADDED Requirements

### Requirement: Playwright 配置（Chrome only）
项目 SHALL 包含 `playwright.config.ts`，仅配置 Chrome（chromium）浏览器项目，并自动启动 dev server。

#### Scenario: 配置文件存在且仅使用 Chrome
- **WHEN** 开发者查看 `playwright.config.ts`
- **THEN** `projects` 数组中仅包含一个 chromium 项目，不包含 firefox 或 webkit 项目

#### Scenario: E2E 测试脚本可执行
- **WHEN** 开发者运行 `pnpm test:e2e`
- **THEN** Playwright 以 Chrome 启动，执行 `e2e/` 目录下的所有测试文件

### Requirement: 页面加载基础验证
E2E 测试 SHALL 验证聊天页面能正常加载并显示输入框。

#### Scenario: 页面加载后显示输入框
- **WHEN** 浏览器导航到应用首页
- **THEN** 页面中存在 placeholder 为 `"Say something..."` 的输入框，且可聚焦

### Requirement: 发送消息后显示用户文本
E2E 测试 SHALL 验证用户输入并提交后，消息出现在对话列表中。

#### Scenario: 提交消息后显示在对话中
- **WHEN** 用户在输入框输入 `"你好"` 并提交（mock `/api/chat` 返回简单文本响应）
- **THEN** 页面中出现包含 `"User: "` 前缀和 `"你好"` 内容的消息元素

#### Scenario: AI 回复文本显示在对话中
- **WHEN** mock `/api/chat` 返回包含 AI 文本的流式响应
- **THEN** 页面中出现包含 `"AI: "` 前缀的消息元素

### Requirement: 天气工具审批流程 E2E 验证
E2E 测试 SHALL 验证工具审批 UI 在 approval-requested 状态下出现，并可交互。

#### Scenario: 工具审批 UI 出现 Approve 和 Deny 按钮
- **WHEN** mock `/api/chat` 返回包含 `tool-getWeatherInformation` approval-requested 状态的流式响应，city 为 `"上海"`
- **THEN** 页面中出现 `"上海"` 文本，以及 `"Approve"` 和 `"Deny"` 两个可点击按钮

#### Scenario: 点击 Approve 后发送审批响应
- **WHEN** 工具审批 UI 出现后，用户点击 `"Approve"` 按钮
- **THEN** 浏览器发出包含 `approved: true` 的请求（或 mock 捕获该调用）

#### Scenario: 点击 Deny 后显示拒绝消息
- **WHEN** 工具审批 UI 出现后，用户点击 `"Deny"` 按钮
- **THEN** mock 捕获包含 `approved: false` 的调用，页面随后显示拒绝相关文本

### Requirement: 路由拦截 mock 策略
E2E 测试 SHALL 使用 `page.route()` 拦截 `/api/chat`，返回符合 Vercel AI SDK 流式格式的 mock 响应，禁止在 E2E 测试中发起真实 LLM API 调用。

#### Scenario: /api/chat 被拦截且不发起真实请求
- **WHEN** 任意 E2E 测试运行
- **THEN** 所有对 `/api/chat` 的请求均被 `page.route()` 拦截，不触达真实后端服务
