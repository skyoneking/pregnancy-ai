## MODIFIED Requirements

### Requirement: 孕周计算工具
系统 SHALL 通过领域层 `calculator.ts` 提供孕周计算，`calculatePregnancyInfo` 函数位于 `lib/pregnancy/calculator.ts`，`calculate_pregnancy_info` LangChain tool 内部调用领域层计算函数，不再自行计算。

#### Scenario: 计算当前孕周信息
- **WHEN** 调用 `calculatePregnancyInfo(dueDate)`
- **THEN** 返回 `{ currentWeek, stage: '孕早期'|'孕中期'|'孕晚期', daysRemaining }`
- **AND** 内部复用 `calculateWeek(dueDate)` 计算孕周
- **AND** stage 由 currentWeek 决定（≤13: 孕早期，≤27: 孕中期，其他: 孕晚期）

#### Scenario: 预产期已过时处理
- **WHEN** 当前日期超过 dueDate
- **THEN** daysRemaining 为 0
- **AND** currentWeek 为 42（由 calculateWeek 的范围限制保证）

### Requirement: 工具数据由领域层提供
工具函数 SHALL 从 `lib/pregnancy/data/` 导入领域数据，`app/_graph/tools.ts` 仅包含 LangChain `tool()` 包装逻辑。

#### Scenario: 食物安全工具使用领域数据
- **WHEN** 审查 `check_food_safety` tool 源码
- **THEN** foodDatabase MUST 从 `@/lib/pregnancy/data/food-safety` 导入
- **AND** tool 函数体 MUST NOT 包含内联数据定义

#### Scenario: 症状评估工具使用领域数据
- **WHEN** 审查 `assess_symptom` tool 源码
- **THEN** symptomRules MUST 从 `@/lib/pregnancy/data/symptoms` 导入
- **AND** tool 函数体 MUST NOT 包含内联数据定义

#### Scenario: 产检时间表工具使用领域数据
- **WHEN** 审查 `get_prenatal_schedule` tool 源码
- **THEN** prenatalSchedule MUST 从 `@/lib/pregnancy/data/prenatal-schedule` 导入
- **AND** tool 函数体 MUST NOT 包含内联数据定义

#### Scenario: 每周发育工具使用领域数据
- **WHEN** 审查 `get_weekly_development` tool 源码
- **THEN** weeklyData MUST 从 `@/lib/pregnancy/data/weekly-dev` 导入
- **AND** tool 函数体 MUST NOT 包含内联数据定义

#### Scenario: 上下文知识工具使用领域数据
- **WHEN** 审查 `get_contextual_knowledge` tool 源码
- **THEN** knowledgeBase、searchKnowledgeByKeyword MUST 从 `@/lib/pregnancy/data/knowledge` 导入
- **AND** getKnowledgeForStage 函数 MUST 从 `@/lib/pregnancy/data/knowledge` 导入
- **AND** tool 函数体 MUST NOT 包含内联数据或知识判断逻辑

### Requirement: 工具可用性由阶段控制
AI Agent SHALL 根据 `PregnancyContext.capabilities` 动态选择可用工具，而非硬编码全部工具。

#### Scenario: 孕晚期用户可使用全部工具
- **WHEN** 用户处于孕晚期（subStage = 'late-pregnancy'）
- **THEN** agent MUST 将全部 6 个工具提供给 LLM

#### Scenario: 备孕期用户不可使用产检工具
- **WHEN** 用户处于备孕期（subStage = 'preconception'）
- **THEN** agent MUST NOT 将 `getPrenatalSchedule` 工具提供给 LLM

#### Scenario: 工具本身不包含阶段判断逻辑
- **WHEN** 审查任意工具的源代码
- **THEN** 工具函数 MUST NOT 包含 if/switch 阶段判断代码
- **AND** 工具仅根据输入参数返回结果，阶段过滤由 capabilities 机制控制

### Requirement: tools.ts 不包含领域数据定义
`app/_graph/tools.ts` SHALL 仅包含 LangChain tool 包装逻辑，所有领域数据从 `lib/pregnancy/data/` 导入。

#### Scenario: tools.ts 无内联数据
- **WHEN** 审查 `app/_graph/tools.ts` 源码
- **THEN** MUST NOT 包含 foodDatabase、symptomRules、prenatalSchedule、weeklyData 等内联数据常量
- **AND** MUST NOT 包含 KnowledgeItem、SafetyLevel、SymptomLevel、CheckItem 等类型定义
- **AND** MUST 仅导出 LangChain tool 实例（通过 `tool()` 创建）

### Requirement: knowledge.ts 从 _graph 目录删除
`app/_graph/knowledge.ts` SHALL 被删除，其内容迁移到 `lib/pregnancy/data/knowledge.ts`。

#### Scenario: _graph 目录不再包含 knowledge.ts
- **WHEN** 检查 `app/_graph/` 目录内容
- **THEN** MUST NOT 包含 `knowledge.ts` 文件
- **AND** 所有对 `@/app/_graph/knowledge` 的引用 MUST 更新为 `@/lib/pregnancy/data/knowledge`
