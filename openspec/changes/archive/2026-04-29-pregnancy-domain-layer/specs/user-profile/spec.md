## MODIFIED Requirements

### Requirement: 读取用户档案
系统 SHALL 在显示用户档案时，通过 `createContext()` 获取计算后的孕期信息。

#### Scenario: 成功读取档案并显示孕期信息
- **WHEN** 用户已登录且档案存在，stage 为 'pregnancy'
- **THEN** 页面调用 `createContext(profile)` 获取 PregnancyContext
- **AND** 显示 ctx.subStage 对应的中文标签（如"孕晚期"）
- **AND** 显示 ctx.week（由 createContext 计算，不再使用页面内的 calculateCurrentWeek 函数）

#### Scenario: 产后用户显示产后天数
- **WHEN** 用户 stage 为 'postpartum'
- **THEN** 页面通过 ctx.postpartumDay 显示产后天数
- **AND** 不再使用页面内的 calculatePostpartumDays 函数

#### Scenario: 页面不包含日期计算函数
- **WHEN** 审查 profile/page.tsx 源代码
- **THEN** MUST NOT 包含 `calculateCurrentWeek` 或 `calculatePostpartumDays` 函数定义
