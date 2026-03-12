## ADDED Requirements

### Requirement: OpenSpec 项目上下文配置
`openspec/config.yaml` 中的 `context` 字段 SHALL 包含项目技术栈、架构说明、关键文件路径、领域特性和开发约定，并以结构化多行文本呈现。

#### Scenario: AI 生成 artifact 时可获取项目背景
- **WHEN** 用户执行 `/opsx:propose` 或 `/opsx:apply` 命令
- **THEN** OpenSpec 将 `config.yaml` 中的 `context` 注入到 AI 提示中
- **AND** AI 生成的 artifact 内容应体现对该项目技术栈和领域的感知

#### Scenario: context 涵盖技术栈信息
- **WHEN** 查看 `openspec/config.yaml` 的 `context` 字段
- **THEN** 其内容 SHALL 包含框架（Next.js）、AI 库（LangChain/LangGraph/AI SDK）、模型配置（Alibaba QwQ）、样式方案（Tailwind CSS）及包管理器（pnpm）等信息

#### Scenario: context 涵盖架构与关键文件
- **WHEN** 查看 `openspec/config.yaml` 的 `context` 字段
- **THEN** 其内容 SHALL 列出关键文件路径（page.tsx、useAgentChat.ts、route.ts、agent.ts）及各自职责

#### Scenario: context 涵盖领域特性
- **WHEN** 查看 `openspec/config.yaml` 的 `context` 字段
- **THEN** 其内容 SHALL 说明工具调用（get_weather_for_location、get_user_location）、工具审批流程、流式响应和对话记忆等核心特性
