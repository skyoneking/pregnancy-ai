## Context

项目已有完整天气助手功能，但没有测试基础设施。现有代码分为 3 个清晰层级：
- **Agent 层**（`app/_langchain/agent.ts`）：工具函数 + 中间件 + Zod schema，纯逻辑，无副作用依赖
- **API 层**（`app/api/chat/route.ts`）：Next.js 路由，依赖 langchainAgent 和 Vercel AI SDK
- **UI 层**（`app/page.tsx`）：React Client Component，依赖 `@ai-sdk/react` 的 `useChat`

新增背景：Claude Code 已接入 Playwright MCP，具备运行浏览器测试的能力，适合同步引入 E2E 层覆盖完整用户流程。

当前约束：pnpm 包管理、TypeScript strict、Next.js App Router（ESM 环境）、E2E 仅针对 Chrome。

## Goals / Non-Goals

**Goals:**
- 建立 Vitest 测试基础设施（配置 + 依赖 + 脚本）
- 覆盖 3 个层级的核心逻辑，核心分支覆盖率 ≥ 80%
- 引入 Playwright（Chrome）E2E 测试，覆盖完整用户交互流程
- 在 `openspec/config.yaml` 中记录测试约定，供 OpenSpec AI 后续生成规范使用
- 最小化对现有源码的改动

**Non-Goals:**
- 多浏览器兼容性测试（Firefox、Safari、WebKit）
- 性能测试或负载测试
- CI/CD 流水线配置
- 测试现有代码的已知 bug（如 thread_id 硬编码）

## Decisions

### 决策 1：选用 Vitest 而非 Jest

**选择：Vitest**

| 维度 | Vitest | Jest |
|------|--------|------|
| ESM 支持 | 原生，无需额外配置 | 需要 babel-jest 或 ts-jest |
| Next.js 兼容 | 与 Vite 生态对齐，摩擦少 | 在 App Router + ESM 下配置复杂 |
| 速度 | 更快（基于 esbuild） | 相对较慢 |
| API 兼容性 | 兼容 Jest API（vi = jest 语法） | - |

项目使用 Next.js 16 + TypeScript 5 strict + ESM，Vitest 是更自然的选择。

### 决策 2：E2E 使用 Playwright，仅 Chrome

**选择：Playwright（chromium 项目）**

理由：
- Claude Code 已接入 Playwright MCP，可直接在 IDE 中运行/调试 E2E 测试
- Chrome（chromium）覆盖主要用户群，无需多浏览器增加维护成本
- Playwright 对 Next.js 流式响应支持优于 Cypress

配置：使用 `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`，不配置其他浏览器项目。

### 决策 3：E2E 测试使用 page.route() mock 后端

**选择：Playwright `page.route()` 拦截 `/api/chat`**

理由：E2E 测试若调用真实 LLM API 会导致：1）测试结果不确定；2）产生 API 费用；3）依赖网络和外部服务。

通过 `page.route('/api/chat', ...)` 返回预定义的 Vercel AI SDK 格式流式响应，保证测试确定性。

**备选方案**（未采用）：MSW（Mock Service Worker）——在 Playwright 中配置复杂，不如 route 直接。

### 决策 4：测试目录结构

**选择：**
```
__tests__/          ← Vitest 单元/集成/组件测试
├── unit/
│   ├── agent.test.ts
│   └── api/chat.route.test.ts
└── ui/
    └── page.test.tsx

e2e/                ← Playwright E2E 测试（独立目录）
└── chat.spec.ts
```

`e2e/` 与 `__tests__/` 分离，因为它们使用不同的测试运行器（Playwright vs Vitest），配置和依赖不重叠。

### 决策 5：agent.ts 的可测试性改造

**选择：在 `agent.ts` 末尾追加具名导出**

```typescript
// 追加导出（不改变现有代码结构）
export { langchainAgent, getWeather, getUserLocation, handleToolErrors, contextSchema };
```

**理由**：最小改动，不影响运行时行为；避免重构工具定义方式。

### 决策 6：DOM 环境选择

**选择：`jsdom`**

React Testing Library 官方推荐环境，与 `@testing-library/jest-dom` 集成成熟。

### 决策 7：API 路由测试策略

Next.js App Router 路由函数是标准异步函数，可直接 import 测试。通过 `vi.mock()` 隔离：
- `@/app/_langchain/agent` → mock `langchainAgent.stream()`
- `@ai-sdk/langchain` → mock `toBaseMessages`, `toUIMessageStream`
- `ai` → mock `createUIMessageStreamResponse`

## Risks / Trade-offs

- **LangChain `langchain` 包的 tool API** → `tool()` 函数返回的 StructuredTool 实例的直接调用方式需在实现时验证（`.invoke()` 或直接调用函数引用）
- **`page.tsx` 中 `useChat` 类型推断复杂** → mock 时需要匹配 `messages[].parts` 的完整类型，若类型不匹配会导致编译失败；需要精心构造 mock 数据
- **E2E mock 流式响应格式** → Vercel AI SDK 的流式格式（`data:` 前缀 SSE）需要精确模拟，实现时需参考 AI SDK 文档
- **覆盖率阈值过严会阻塞开发** → 初期设为 80%，后续可按需调整

## Migration Plan

1. 安装 devDependencies（不影响生产环境）
2. 添加 `vitest.config.ts` 和 `vitest.setup.ts`
3. 添加 `playwright.config.ts`（Chrome only，webServer 指向 `pnpm dev`）
4. 修改 `agent.ts` 追加导出
5. 创建 `__tests__/` 单元/集成/组件测试文件
6. 创建 `e2e/` E2E 测试文件
7. 更新 `openspec/config.yaml`
8. 运行 `pnpm test` 和 `pnpm test:e2e` 验证全部通过

无回滚风险——均为 devDependencies 和测试文件，删除即可回滚。

## Open Questions

- 无
