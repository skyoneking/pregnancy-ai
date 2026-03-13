## ADDED Requirements

### Requirement: Vitest 测试框架安装与配置
项目 SHALL 安装 Vitest 及相关测试工具作为 devDependencies，并提供可运行的测试脚本。

#### Scenario: 安装测试依赖
- **WHEN** 开发者运行 `pnpm install`
- **THEN** 以下包应作为 devDependencies 存在：`vitest`、`@vitejs/plugin-react`、`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`、`jsdom`、`@vitest/coverage-v8`

#### Scenario: 执行测试脚本
- **WHEN** 开发者运行 `pnpm test`
- **THEN** vitest 以 run 模式执行所有测试文件并输出结果

#### Scenario: 执行覆盖率报告
- **WHEN** 开发者运行 `pnpm test:coverage`
- **THEN** vitest 生成覆盖率报告，核心业务文件行覆盖率 ≥ 80%

### Requirement: Vitest 配置文件
项目 SHALL 包含 `vitest.config.ts`，配置 React 插件、jsdom 环境、路径别名和覆盖率选项。

#### Scenario: 配置文件存在
- **WHEN** 开发者查看项目根目录
- **THEN** 存在 `vitest.config.ts` 文件，包含 `environment: 'jsdom'` 和 `@/*` 路径别名映射

#### Scenario: 全局 setup 文件
- **WHEN** 任意测试文件运行
- **THEN** `@testing-library/jest-dom` 的自定义 matcher（如 `toBeInTheDocument`）可直接使用，无需在每个文件中单独 import
