## MODIFIED Requirements

### Requirement: 知识库查询 API
系统 SHALL 通过领域层的知识推送规则匹配知识内容，知识文件仅作为纯数据源。

#### Scenario: Agent 查询阶段知识
- **WHEN** AI Agent 需要获取当前阶段知识
- **THEN** 从 `PregnancyContext.applicableKnowledge` 获取匹配的知识条目
- **AND** 知识匹配逻辑由领域层的 `rules/knowledge-rules.ts` 控制，不再在 knowledge.ts 中判断

#### Scenario: Agent 查询孕周知识
- **WHEN** AI Agent 需要获取特定孕周知识
- **THEN** 从知识数据源查询该孕周内容
- **AND** 推送策略（是否自动推送、推送间隔）由阶段的 `knowledge` 规则决定

#### Scenario: knowledge.ts 仅导出数据
- **WHEN** 审查 knowledge.ts 的导出
- **THEN** MUST 仅导出知识数据条目（KnowledgeItem[]）
- **AND** MUST NOT 包含 `getKnowledgeForStage()` 或其他阶段判断函数
