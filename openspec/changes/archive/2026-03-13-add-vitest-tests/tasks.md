## 1. 安装测试基础设施

- [x] 1.1 执行 `pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8` 安装 Vitest 相关测试依赖
- [x] 1.2 执行 `pnpm add -D @playwright/test` 安装 Playwright，并运行 `pnpm exec playwright install chromium` 仅安装 Chrome 浏览器
- [x] 1.3 在 `package.json` 的 `scripts` 中添加：`"test": "vitest run"`、`"test:watch": "vitest"`、`"test:coverage": "vitest run --coverage"`、`"test:e2e": "playwright test"`
- [x] 1.4 创建 `vitest.config.ts`，配置 `@vitejs/plugin-react`、`environment: 'jsdom'`、`globals: true`、`setupFiles`、`@/*` 路径别名、coverage 选项（include `app/**`，thresholds lines 80）
- [x] 1.5 创建 `vitest.setup.ts`，内容为 `import '@testing-library/jest-dom'`
- [x] 1.6 创建 `playwright.config.ts`，配置 `testDir: './e2e'`、`projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`、`webServer: { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true }`

## 2. 修改 agent.ts 增加导出

- [x] 2.1 在 `app/_langchain/agent.ts` 末尾将 `export { langchainAgent }` 改为 `export { langchainAgent, getWeather, getUserLocation, handleToolErrors, contextSchema }`

## 3. 创建测试目录结构

- [x] 3.1 创建目录 `__tests__/unit/api/`、`__tests__/ui/` 和 `e2e/`

## 4. Agent 单元测试

- [x] 4.1 创建 `__tests__/unit/agent.test.ts`，测试 `getUserLocation`：user_id=u1 返回 "上海"、user_id=u2 返回 "北京"、user_id="" 返回 "北京"
- [x] 4.2 在 `agent.test.ts` 中测试 `getWeather`：city="上海" 返回 "上海天气一向不错!"、writer 存在时被调用（含 type:'status'）、writer 为 undefined 时不抛出错误
- [x] 4.3 在 `agent.test.ts` 中测试 `handleToolErrors`：handler 正常时透传结果、handler 抛异常时返回 ToolMessage（content 含 "Tool error:"）
- [x] 4.4 在 `agent.test.ts` 中测试 `contextSchema`：`{user_id:"u1"}` 解析成功、`{user_id:123}` 解析失败、`{}` 解析失败

## 5. API 路由集成测试

- [x] 5.1 创建 `__tests__/unit/api/chat.route.test.ts`，使用 `vi.mock` mock `@/app/_langchain/agent`、`@ai-sdk/langchain`、`ai`
- [x] 5.2 测试：POST 合法请求返回 200 响应
- [x] 5.3 测试：`toBaseMessages` 被调用，参数为请求体的 messages 数组
- [x] 5.4 测试：`langchainAgent.stream` 被调用，`configurable.thread_id === "1"`、`context.user_id === "u1"`、`streamMode` 含 `["values","messages","custom"]`

## 6. UI 组件测试

- [x] 6.1 创建 `__tests__/ui/page.test.tsx`，使用 `vi.mock('@ai-sdk/react')` mock `useChat`
- [x] 6.2 测试：空消息列表渲染 placeholder 为 "Say something..." 的 input
- [x] 6.3 测试：role=user 的消息显示 "User: " 前缀
- [x] 6.4 测试：role=assistant 的消息显示 "AI: " 前缀
- [x] 6.5 测试：`approval-requested` 状态显示城市名和 Approve/Deny 按钮
- [x] 6.6 测试：点击 Approve 调用 `addToolApprovalResponse({..., approved: true})`
- [x] 6.7 测试：点击 Deny 调用 `addToolApprovalResponse({..., approved: false})`
- [x] 6.8 测试：`output-available` 状态显示天气输出文本
- [x] 6.9 测试：`output-denied` 状态显示拒绝相关文本
- [x] 6.10 测试：最后 part 非 text 时显示 data-status 的 message
- [x] 6.11 测试：最后 part 为 text 时不显示 data-status 的 message
- [x] 6.12 测试：输入文字提交表单后 `sendMessage({text})` 被调用且 input 清空

## 7. Playwright E2E 测试

- [x] 7.1 创建 `e2e/chat.spec.ts`，在 `beforeEach` 中用 `page.route('/api/chat', ...)` 拦截所有 API 请求
- [x] 7.2 实现 mock 辅助函数：接收预定义文本响应，返回符合 Vercel AI SDK SSE 流式格式的响应体
- [x] 7.3 测试：页面加载后显示 placeholder 为 "Say something..." 的输入框
- [x] 7.4 测试：输入 "你好" 并提交后，页面出现 "User: " + "你好" 的消息（mock 返回简单文本响应）
- [x] 7.5 测试：mock 返回 AI 文本响应时，页面出现 "AI: " 前缀的消息
- [x] 7.6 测试：mock 返回 approval-requested 工具状态时，页面出现 "上海" + Approve/Deny 按钮
- [x] 7.7 测试：点击 Approve 按钮后触发对应请求（通过路由拦截验证）
- [x] 7.8 测试：点击 Deny 按钮后页面显示拒绝相关文本

## 8. 更新 openspec/config.yaml

- [x] 8.1 在 `openspec/config.yaml` 的 `context` 块末尾追加 `## Testing` 小节（Vitest + Playwright、目录结构、命名规范、mock 策略、覆盖率目标、Playwright MCP 验证工作流）
- [x] 8.2 取消 `openspec/config.yaml` 中 `rules` 块的注释，添加 `testing`、`coverage`、`layers` 三个维度的规则（layers 包含 e2e/ Playwright 层），并新增 `e2e-validation` 规则：E2E 测试代码完成后必须通过 Playwright MCP 工具直接验证（browser_navigate、browser_snapshot、browser_click 等），不能仅依赖命令行运行

## 9. 验证

- [x] 9.1 运行 `pnpm test`，确认所有 Vitest 测试通过（无失败用例）
- [x] 9.2 运行 `pnpm test:coverage`，确认核心逻辑覆盖率 ≥ 80%
- [x] 9.3 使用 Playwright MCP 工具直接验证 E2E 流程：
  - 调用 `browser_navigate` 导航到 `http://localhost:3000`
  - 调用 `browser_snapshot` 确认输入框存在
  - 输入消息并提交，截图确认消息出现在对话列表
  - 触发工具审批流程，截图确认 Approve/Deny 按钮出现
  - 点击 Approve/Deny，截图确认结果状态正确渲染
- [x] 9.4 运行 `pnpm test:e2e`，确认脚本化 Playwright 测试也通过（Chrome）
- [x] 9.5 运行 `pnpm build`，确认项目正常编译，无 TypeScript 错误
