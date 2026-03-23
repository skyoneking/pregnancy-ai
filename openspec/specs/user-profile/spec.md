## ADDED Requirements

### Requirement: 创建用户档案
系统 SHALL 在用户首次登录时自动创建用户档案。

#### Scenario: 首次注册自动创建档案
- **WHEN** 用户通过账号密码注册且用户记录不存在
- **THEN** 系统在 `profiles` 表中创建新档案
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
- **AND** 档案数据包含：`id`、`user_id`、`stage`、`role`、`due_date`、`created_at`、`updated_at`

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

### Requirement: 档案数据验证
系统 SHALL 在更新档案时验证数据的完整性和一致性。

#### Scenario: 孕期阶段必填字段验证
- **WHEN** 用户将阶段更新为 'pregnancy'
- **THEN** 系统 MUST 验证 `due_date` 和 `role` 字段已填写
- **AND** 如果缺少必填字段，返回 400 错误并提示

#### Scenario: 预产期日期格式验证
- **WHEN** 用户提交预产期
- **THEN** 系统 MUST 验证格式为 YYYY-MM-DD
- **AND** 验证日期在合理范围内（今天至今天 + 280 天）
- **AND** 验证失败时返回具体错误信息

#### Scenario: 备孕/产后阶段可选字段
- **WHEN** 用户将阶段更新为 'preconception' 或 'postpartum'
- **THEN** 系统 MUST 允许 `due_date` 和 `role` 为空
- **AND** 其他阶段特定字段按需验证

### Requirement: 多设备档案同步
系统 SHALL 支持用户档案在多设备间实时同步。

#### Scenario: 设备 A 更新档案，设备 B 实时同步
- **WHEN** 用户在设备 A 上更新档案
- **THEN** 设备 B 通过 Supabase Realtime 订阅接收更新
- **AND** 设备 B 的 UI 自动刷新显示最新数据

#### Scenario: 离线更新冲突解决
- **WHEN** 用户在设备 A 离线更新档案，同时在设备 B 在线更新
- **THEN** 系统采用"最后写入胜"策略
- **AND** 保留最新的 `updated_at` 时间戳记录
