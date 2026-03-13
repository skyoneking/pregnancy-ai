## ADDED Requirements

### Requirement: config.yaml context 中包含测试约定
`openspec/config.yaml` 的 `context` 块 SHALL 包含测试框架、目录结构、命名规范、mock 策略、覆盖率目标和 Playwright MCP 验证工作流的描述。

#### Scenario: context 块包含 Testing 小节
- **WHEN** OpenSpec AI 读取 config.yaml context
- **THEN** context 中存在 `## Testing` 小节，包含测试框架（Vitest + Playwright）、测试目录（__tests__/ 和 e2e/）、命名规范（*.test.ts / *.test.tsx / *.spec.ts）、mock 策略、覆盖率目标，以及 Playwright MCP 验证工作流说明

### Requirement: config.yaml rules 包含 testing 层级规则
`openspec/config.yaml` 的 `rules` 块 SHALL 包含测试文件位置、命名和用例要求的规则。

#### Scenario: rules.testing 规则被正确配置
- **WHEN** OpenSpec AI 为测试相关任务生成 tasks 或 specs
- **THEN** AI 遵循以下约束：测试文件在 `__tests__/`、命名为 `*.test.ts` / `*.test.tsx`、每个测试文件包含 happy path 和边界用例、外部依赖通过 `vi.mock()` 隔离

### Requirement: config.yaml rules 包含 coverage 规则
`openspec/config.yaml` 的 `rules` 块 SHALL 包含各层级覆盖率要求。

#### Scenario: rules.coverage 规则被正确配置
- **WHEN** OpenSpec AI 生成测试相关任务
- **THEN** AI 遵循各层级覆盖目标：agent 工具覆盖所有分支，API 路由验证请求解析和参数传递，UI 组件覆盖所有渲染分支和交互

### Requirement: config.yaml rules 包含 layers 层级职责规则
`openspec/config.yaml` 的 `rules` 块 SHALL 包含 4 个测试层级（含 E2E）的职责说明。

#### Scenario: rules.layers 规则被正确配置
- **WHEN** OpenSpec AI 规划测试架构
- **THEN** AI 将工具逻辑归入 unit/agent/，路由测试归入 unit/api/，组件测试归入 ui/，E2E 测试归入 e2e/（Playwright），各层级的 mock 策略与职责描述一致

### Requirement: config.yaml rules 包含 Playwright MCP E2E 验证规则
`openspec/config.yaml` 的 `rules` 块 SHALL 包含 `e2e-validation` 规则：E2E 相关代码完成后必须通过 Playwright MCP 工具直接验证功能。

#### Scenario: rules.e2e-validation 规则存在
- **WHEN** OpenSpec AI 生成包含 E2E 测试的任务列表
- **THEN** 验证步骤中包含"使用 Playwright MCP 工具（browser_navigate、browser_snapshot、browser_click 等）直接验证 E2E 流程"，而不仅仅是运行 `pnpm test:e2e` 命令

#### Scenario: 实现方通过 Playwright MCP 验证 E2E 功能
- **WHEN** E2E 测试文件编写完成后需要验证
- **THEN** 实现方 SHALL 通过 Playwright MCP 调用：`browser_navigate` 导航页面、`browser_snapshot` 检查元素、`browser_click` 触发交互，并截图确认每个关键步骤的视觉结果
