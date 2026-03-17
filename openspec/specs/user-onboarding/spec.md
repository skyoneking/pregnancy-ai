## ADDED Requirements

### Requirement: 用户档案收集
系统 SHALL 在首次访问时引导用户完成身份和预产期的填写，并将档案写入 localStorage。

#### Scenario: 首次访问跳转引导页
- **WHEN** 用户访问 `/`，且 localStorage 中不存在 `pregnancy_profile`
- **THEN** 系统自动跳转至 `/onboarding`

#### Scenario: 已有档案跳过引导
- **WHEN** 用户访问 `/`，且 localStorage 中存在有效的 `pregnancy_profile`
- **THEN** 系统不跳转，直接展示主聊天界面

#### Scenario: 直接访问引导页
- **WHEN** 用户直接访问 `/onboarding`
- **THEN** 系统展示引导页，包含身份选择和预产期输入

### Requirement: 身份选择
系统 SHALL 提供准妈妈和准爸爸两个身份选项，用户 MUST 选择其中一项才能继续。

#### Scenario: 选择准妈妈
- **WHEN** 用户点击"准妈妈"选项
- **THEN** 系统高亮选中状态，等待填写预产期

#### Scenario: 选择准爸爸
- **WHEN** 用户点击"准爸爸"选项
- **THEN** 系统高亮选中状态，等待填写预产期

#### Scenario: 未选择身份时提交
- **WHEN** 用户未选择身份直接点击确认
- **THEN** 系统显示错误提示"请选择您的身份"，不跳转

### Requirement: 预产期输入
系统 SHALL 提供日期选择器，用户 MUST 填写预产期才能完成引导。

#### Scenario: 填写有效预产期
- **WHEN** 用户选择一个未来日期作为预产期
- **THEN** 系统接受并在确认时写入档案

#### Scenario: 填写无效日期
- **WHEN** 用户选择一个超过预产期合理范围的日期（早于今天或晚于当前日期+10个月）
- **THEN** 系统显示错误提示"请填写有效的预产期"，不允许提交

#### Scenario: 未填写预产期时提交
- **WHEN** 用户未填写预产期直接点击确认
- **THEN** 系统显示错误提示"请填写预产期"，不跳转

### Requirement: 档案持久化
系统 SHALL 在用户完成引导后将档案写入 localStorage，格式为 `{ role, dueDate, createdAt }`。

#### Scenario: 成功保存档案并跳转
- **WHEN** 用户填写完整（身份 + 预产期）并点击确认
- **THEN** 系统将 `pregnancy_profile` 写入 localStorage，并跳转至 `/`

#### Scenario: 档案数据结构验证
- **WHEN** 档案写入 localStorage
- **THEN** 档案 MUST 包含 `role`（'mom' 或 'dad'）、`dueDate`（ISO 日期字符串）、`createdAt`（ISO 时间戳）三个字段