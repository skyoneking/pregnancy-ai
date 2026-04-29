## MODIFIED Requirements

### Requirement: 孕周计算工具
系统 SHALL 通过领域层 `calculator.ts` 提供孕周计算，`calculatePregnancyInfo` 工具内部调用领域层计算函数，不再自行计算。

#### Scenario: 计算当前孕周
- **WHEN** 工具被调用，context 中包含有效 `due_date`
- **THEN** 工具调用 `calculateWeek(due_date)` 获取当前孕周
- **AND** 返回当前孕周（1-42周）、孕期阶段（由 subStage.label 确定）、距预产期天数

#### Scenario: 预产期已过时处理
- **WHEN** 当前日期超过 `due_date`
- **THEN** 工具返回"预产期已过，宝宝可能已出生"的提示信息

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
