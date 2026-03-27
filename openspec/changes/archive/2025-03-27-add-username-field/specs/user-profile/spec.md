## MODIFIED Requirements

### Requirement: 创建用户档案
系统 SHALL 在用户首次登录时自动创建用户档案。

#### Scenario: 首次注册自动创建档案
- **WHEN** 用户通过账号密码注册且用户记录不存在
- **THEN** 系统在 `profiles` 表中创建新档案
- **AND** 档案包含用户提交的 `username` 字段
- **AND** 档案初始状态为 `stage: null`（未选择阶段）
- **AND** 档案关联至用户 ID（外键）

#### Scenario: 档案已存在时跳过创建
- **WHEN** 用户登录但档案已存在
- **THEN** 系统返回现有档案数据
- **AND** 不创建重复记录

### Requirement: 读取用户档案
系统 SHALL 提供读取当前用户档案的 API 接口。

#### Scenario: 成功读取档案
- **WHEN** 用户已登录且档案存在
- **THEN** API 返回 200 状态码和完整档案数据
- **AND** 档案数据包含：`id`、`user_id`、`username`、`stage`、`role`、`due_date`、`created_at`、`updated_at`

#### Scenario: 档案不存在时返回空对象
- **WHEN** 用户已登录但未创建档案
- **THEN** API 返回 200 状态码和空档案对象
- **AND** 前端引导用户完成档案创建

#### Scenario: 未登录用户访问
- **WHEN** 未登录用户请求读取档案
- **THEN** API 返回 401 错误
- **AND** 提示用户先完成认证

### Requirement: 更新用户档案
系统 SHALL 提供更新用户档案的 API 接口。

#### Scenario: 更新用户名
- **WHEN** 用户提交新的用户名（2-20 字符，仅限中英文、数字、下划线）
- **THEN** 系统更新 `profiles.username` 字段
- **AND** 返回 200 状态码和更新后的档案
- **AND** 记录 `updated_at` 时间戳

#### Scenario: 用户名格式无效拒绝更新
- **WHEN** 用户提交不符合格式要求的用户名
- **THEN** API 返回 400 错误
- **AND** 错误信息为"用户名需为 2-20 个字符，仅支持中英文、数字和下划线"

#### Scenario: 更新阶段信息
- **WHEN** 用户提交阶段选择（'preconception' | 'pregnancy' | 'postpartum'）
- **THEN** 系统更新 `profiles.stage` 字段
- **AND** 返回 200 状态码和更新后的档案
- **AND** 记录 `updated_at` 时间戳

#### Scenario: 孕期用户更新预产期
- **WHEN** 用户提交新的预产期（YYYY-MM-DD 格式）
- **THEN** 系统更新 `profiles.due_date` 字段
- **AND** 验证日期格式和合理性（不能早于当前日期，不能晚于当前日期 + 10 个月）
- **AND** 返回 200 状态码和更新后的档案

#### Scenario: 孕期用户更新角色
- **WHEN** 孕期用户提交角色选择（'mom' | 'dad'）
- **THEN** 系统更新 `profiles.role` 字段
- **AND** 返回 200 状态码和更新后的档案

#### Scenario: 无效数据拒绝更新
- **WHEN** 用户提交不符合验证规则的数据
- **THEN** API 返回 400 错误
- **AND** 错误信息明确说明验证失败原因

#### Scenario: 未登录用户尝试更新
- **WHEN** 未登录用户请求更新档案
- **THEN** API 返回 401 错误
