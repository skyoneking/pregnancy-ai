## ADDED Requirements

### Requirement: 阶段注册表
系统 SHALL 提供 `stageRegistry` 数组，包含 6 个子阶段的 `StageDefinition` 定义，按匹配优先级排列。

#### Scenario: 注册表包含所有子阶段
- **WHEN** 导入 stageRegistry
- **THEN** 数组长度 MUST 为 6
- **AND** 包含 id 为 'preconception'、'early-pregnancy'、'mid-pregnancy'、'late-pregnancy'、'recovery'、'nursing' 的阶段定义

#### Scenario: 每个阶段定义包含完整字段
- **WHEN** 遍历 stageRegistry 中的任意 StageDefinition
- **THEN** 每个 MUST 包含 `id`（SubStage）、`mainStage`（MainStage）、`label`（中文标签）、`description`、`match`（判断函数）、`knowledge`、`health`、`capabilities`

### Requirement: 日期计算器
系统 SHALL 提供纯函数计算孕周和产后天数，不依赖外部状态。

#### Scenario: 从预产期计算孕周
- **WHEN** 调用 calculateWeek('2025-09-01')，且当前日期为 2025-05-04
- **THEN** 返回 18（即 (280 - daysRemaining) / 7 向上取整）

#### Scenario: 孕周范围限制
- **WHEN** 预产期已过，计算结果超过 42
- **THEN** 返回 42

#### Scenario: 预产期远在未来，计算结果小于 1
- **THEN** 返回 1

#### Scenario: 从生产日期计算产后天数
- **WHEN** 调用 calculatePostpartumDay('2025-04-20')，且当前日期为 2025-05-04
- **THEN** 返回 14

#### Scenario: 生产日期在未来
- **WHEN** 生产日期晚于当前日期
- **THEN** 返回 0

### Requirement: 上下文工厂
系统 SHALL 提供 `createContext(profile)` 函数，接收用户档案返回完整的 PregnancyContext。

#### Scenario: 孕期用户生成上下文
- **WHEN** 调用 createContext({ stage: 'pregnancy', due_date: '2025-09-01', postpartum_date: null })
- **THEN** 返回 PregnancyContext，mainStage 为 'pregnancy'
- **AND** subStage 根据计算的 week 匹配对应的子阶段（'early-pregnancy' | 'mid-pregnancy' | 'late-pregnancy'）
- **AND** 包含 stageDef（匹配的阶段定义）、healthTemplates、capabilities

#### Scenario: 备孕期用户生成上下文
- **WHEN** 调用 createContext({ stage: 'preconception', due_date: null, postpartum_date: null })
- **THEN** subStage 为 'preconception'
- **AND** week 和 postpartumDay 为 undefined

#### Scenario: 产后期用户生成上下文
- **WHEN** 调用 createContext({ stage: 'postpartum', due_date: null, postpartum_date: '2025-04-20' })
- **THEN** subStage 根据计算的 postpartumDay 匹配 'recovery'（≤42天）或 'nursing'（>42天）

#### Scenario: 阶段为 null 时降级
- **WHEN** 调用 createContext({ stage: null })
- **THEN** 返回通用上下文，subStage 为 null
- **AND** healthTemplates 和 capabilities 为空数组

### Requirement: 子阶段匹配互斥
每个 profile 数据 MUST 匹配且仅匹配一个子阶段。

#### Scenario: 孕期 12 周匹配孕早期
- **WHEN** RawContext 为 { mainStage: 'pregnancy', week: 12 }
- **THEN** 仅匹配 'early-pregnancy'

#### Scenario: 孕期 13 周匹配孕中期
- **WHEN** RawContext 为 { mainStage: 'pregnancy', week: 13 }
- **THEN** 仅匹配 'mid-pregnancy'

#### Scenario: 孕期 28 周匹配孕晚期
- **WHEN** RawContext 为 { mainStage: 'pregnancy', week: 28 }
- **THEN** 仅匹配 'late-pregnancy'

#### Scenario: 产后 42 天匹配恢复期
- **WHEN** RawContext 为 { mainStage: 'postpartum', postpartumDay: 42 }
- **THEN** 仅匹配 'recovery'

#### Scenario: 产后 43 天匹配哺乳期
- **WHEN** RawContext 为 { mainStage: 'postpartum', postpartumDay: 43 }
- **THEN** 仅匹配 'nursing'

### Requirement: 健康数据模板
每个子阶段 SHALL 声明该阶段需要记录的健康数据模板。

#### Scenario: 孕晚期包含胎动计数模板
- **WHEN** 查询 'late-pregnancy' 阶段的 healthTemplates
- **THEN** MUST 包含 id 为 'fetal-movement' 的模板
- **AND** 模板包含 movement_count、duration_minutes、notes 字段定义

#### Scenario: 孕早期不包含胎动计数模板
- **WHEN** 查询 'early-pregnancy' 阶段的 healthTemplates
- **THEN** MUST NOT 包含 id 为 'fetal-movement' 的模板

### Requirement: 能力控制
每个子阶段 SHALL 声明该阶段可用的 AI 工具（capabilities）。

#### Scenario: 孕晚期可使用全部工具
- **WHEN** 查询 'late-pregnancy' 阶段的 capabilities
- **THEN** MUST 包含所有 6 个工具的 capability 定义

#### Scenario: 备孕期不可使用产检时间表
- **WHEN** 查询 'preconception' 阶段的 capabilities
- **THEN** MUST NOT 包含 id 为 'get_prenatal_schedule' 的 capability
