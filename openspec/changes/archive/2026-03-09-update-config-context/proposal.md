## Why

`openspec/config.yaml` 目前仅包含 `schema: spec-driven`，没有任何 `context` 配置。缺少项目背景信息，OpenSpec 在生成 artifact 时无法感知项目的技术栈、架构和领域知识，导致生成的提案、设计和任务偏于通用、缺乏针对性。

## What Changes

- 在 `openspec/config.yaml` 中新增 `context` 配置块，涵盖项目技术栈、架构说明、关键文件路径、领域特性和开发规范
- 仅修改配置文件，不涉及代码、API 或依赖变更

## Capabilities

### New Capabilities

- `openspec-project-context`：为所有后续 OpenSpec artifact 生成提供结构化项目上下文，使 AI 能够产出更贴合项目实际的提案、设计和任务

### Modified Capabilities

<!-- 无现有 spec 层面的需求变更 -->

## Impact

- **openspec/config.yaml** — 唯一修改的文件
- 所有后续 `/opsx:propose` 和 `/opsx:apply` 运行将自动获得完整的项目上下文
- 对 Next.js 应用本身无任何运行时影响
