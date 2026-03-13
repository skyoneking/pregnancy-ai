## Why

项目已有完整的天气助手功能（工具调用、API 路由、流式 UI），但完全没有测试基础设施，任何改动都缺乏回归保障。现在是补充测试的合适时机——功能稳定、代码清晰、层次分明。

此外，Claude Code 已接入 Playwright MCP 能力，具备运行和调试浏览器 E2E 测试的条件，适合同步引入端到端测试覆盖完整用户流程。

## What Changes

- 引入 Vitest 测试框架及 React Testing Library，建立完整单元/集成测试基础设施
- 新增 `vitest.config.ts` 和 `vitest.setup.ts` 配置文件
- 在 `app/_langchain/agent.ts` 中导出工具函数和 schema，以便单元测试直接引用
- 新增 `__tests__/` 目录，包含 3 个层级的测试文件：
  - `unit/agent.test.ts`：工具函数、中间件、contextSchema 单元测试
  - `unit/api/chat.route.test.ts`：API 路由集成测试
  - `ui/page.test.tsx`：Chat 组件渲染与交互测试
- 引入 Playwright（仅 Chrome）进行 E2E 测试，新增 `playwright.config.ts` 和 `e2e/` 测试目录
  - `e2e/chat.spec.ts`：页面加载、消息发送、工具审批完整流程测试
  - 使用 `page.route()` mock `/api/chat` 接口，保证测试确定性
- 更新 `openspec/config.yaml`：context 块追加测试约定，rules 块添加测试分层规则

## Capabilities

### New Capabilities

- `vitest-infrastructure`：Vitest 测试框架基础设施，包含配置、依赖、测试脚本
- `agent-unit-tests`：agent 工具函数（getWeather、getUserLocation）、错误处理中间件、contextSchema 的单元测试
- `api-route-tests`：POST /api/chat 路由的集成测试（mock 外部依赖）
- `ui-component-tests`：Chat UI 组件测试，覆盖消息渲染、工具审批三种状态、表单交互
- `e2e-playwright-tests`：Playwright E2E 测试（Chrome），覆盖完整用户交互流程，使用路由拦截 mock 后端
- `openspec-test-rules`：config.yaml 中新增测试相关约定（context）和生成规则（rules）

### Modified Capabilities

（无既有 spec 变更）

## Impact

- **新增依赖**（devDependencies）：`vitest`、`@vitejs/plugin-react`、`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`、`jsdom`、`@vitest/coverage-v8`、`@playwright/test`
- **源码改动**：`app/_langchain/agent.ts` 新增导出（不影响运行时行为）
- **新增文件**：`vitest.config.ts`、`vitest.setup.ts`、`playwright.config.ts`、`__tests__/**`、`e2e/**`
- **配置变更**：`openspec/config.yaml`（仅元数据，不影响运行时）
- **不影响**：Next.js 构建、生产环境代码、API 行为
