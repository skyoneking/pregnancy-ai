## Context

`openspec/config.yaml` 当前只有 `schema: spec-driven` 一行有效配置，OpenSpec 在生成 artifact 时没有任何项目背景可用。本次改动仅需向该文件追加 `context` 字段，无需修改任何代码。

## Goals / Non-Goals

**Goals:**
- 在 `openspec/config.yaml` 中补充 `context` 块，涵盖技术栈、架构、领域特性和约定
- 确保 context 内容准确反映项目现状，便于 AI 在未来生成 artifact 时参考

**Non-Goals:**
- 不修改应用代码
- 不添加 `rules` 配置（可在后续 change 中按需补充）
- 不迁移或重构现有 spec 文件

## Decisions

**决策：直接编辑 config.yaml，不创建新文件**
- 仅在现有 `openspec/config.yaml` 中追加 `context` 字段
- 理由：改动极小，无需额外抽象或分层

**决策：context 使用结构化多行文本**
- 按 `## Project Overview`、`## Tech Stack`、`## Architecture`、`## Domain & Features`、`## Conventions` 分节
- 理由：分节结构让 AI 更易定位所需信息，同时便于人工维护

## Risks / Trade-offs

- **context 过时风险** → 技术栈变更时需同步更新 config.yaml，建议在相关 change 的 tasks.md 中加入"更新 openspec context"作为收尾步骤
- **内容冗余风险** → context 应保持精简，避免与 spec 文件内容重复；本次 context 聚焦于元信息（栈、约定），不写业务规则
