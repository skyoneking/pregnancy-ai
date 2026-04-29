## MODIFIED Requirements

### Requirement: 知识库查询 API
系统 SHALL 通过领域层的知识推送规则匹配知识内容，知识文件仅作为纯数据源，位于 `lib/pregnancy/data/knowledge.ts`。

#### Scenario: Agent 查询阶段知识
- **WHEN** AI Agent 需要获取当前阶段知识
- **THEN** 从 `PregnancyContext.applicableKnowledge` 获取匹配的知识条目
- **AND** 知识匹配逻辑由领域层的 `rules/knowledge-rules.ts` 控制

#### Scenario: Agent 查询孕周知识
- **WHEN** AI Agent 需要获取特定孕周知识
- **THEN** 从 `lib/pregnancy/data/knowledge.ts` 的 `pregnancyKnowledge` Record 查询该孕周内容
- **AND** 推送策略由阶段的 `knowledge` 规则决定

#### Scenario: knowledge.ts 仅导出数据
- **WHEN** 审查 `lib/pregnancy/data/knowledge.ts` 的导出
- **THEN** MUST 仅导出知识数据条目（KnowledgeItem[]、pregnancyKnowledge Record、knowledgeBase、searchKnowledgeByKeyword）
- **AND** MUST NOT 包含 `getKnowledgeForStage()` 或其他阶段判断函数
- **AND** MUST NOT 依赖 `langchain`

#### Scenario: 知识搜索功能
- **WHEN** 调用 `searchKnowledgeByKeyword(keyword)`
- **THEN** 在所有知识数据（备孕 + 孕期 + 产后）中搜索标题、内容和标签匹配
- **AND** 返回最多 3 条结果，标题匹配优先排序

#### Scenario: KnowledgeItem 类型定义
- **WHEN** 消费者导入 KnowledgeItem 类型
- **THEN** MUST 从 `@/lib/pregnancy/data/knowledge` 导入
- **AND** 类型定义包含 id、title、content、stage、week、postpartumDay、tags、autoPush 字段
