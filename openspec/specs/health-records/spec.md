## ADDED Requirements

### Requirement: 健康记录数据模型
系统 SHALL 定义可扩展的健康记录数据模型，支持多种记录类型。

#### Scenario: 胎动记录数据结构
- **WHEN** 创建胎动记录数据模型
- **THEN** 模型 MUST 包含字段：
  - `id`: 唯一标识符
  - `user_id`: 关联用户 ID（外键）
  - `record_type`: 'fetal_movement'
  - `record_date`: 记录日期
  - `movement_count`: 胎动次数
  - `duration_minutes`: 计数时长（分钟）
  - `notes`: 备注信息（可选）
  - `created_at`: 创建时间

#### Scenario: 体重记录数据结构
- **WHEN** 创建体重记录数据模型
- **THEN** 模型 MUST 包含字段：
  - `id`: 唯一标识符
  - `user_id`: 关联用户 ID（外键）
  - `record_type`: 'weight'
  - `record_date`: 记录日期
  - `weight_kg`: 体重（公斤）
  - `week`: 孕周（可选，孕期用户）
  - `notes`: 备注信息（可选）
  - `created_at`: 创建时间

#### Scenario: 症状记录数据结构
- **WHEN** 创建症状记录数据模型
- **THEN** 模型 MUST 包含字段：
  - `id`: 唯一标识符
  - `user_id`: 关联用户 ID（外键）
  - `record_type`: 'symptom'
  - `record_date`: 记录日期
  - `symptom_description`: 症状描述
  - `severity`: 严重程度（'mild' | 'moderate' | 'severe'）
  - `week`: 孕周（孕期用户）
  - `resolved`: 是否已缓解（布尔值）
  - `notes`: 备注信息（可选）
  - `created_at`: 创建时间

### Requirement: 创建健康记录
系统 SHALL 提供创建健康记录的 API 接口。

#### Scenario: 成功创建胎动记录
- **WHEN** 用户提交胎动记录数据
- **THEN** API 在 `health_records` 表中创建记录
- **AND** 返回 201 状态码和新建记录的完整数据
- **AND** 自动关联当前用户 ID

#### Scenario: 数据验证失败
- **WHEN** 用户提交的记录数据缺少必填字段或格式错误
- **THEN** API 返回 400 错误
- **AND** 错误信息明确说明验证失败原因

#### Scenario: 未登录用户尝试创建
- **WHEN** 未登录用户尝试创建健康记录
- **THEN** API 返回 401 错误

### Requirement: 读取健康记录
系统 SHALL 提供查询健康记录的 API 接口。

#### Scenario: 查询所有记录
- **WHEN** 用户请求获取健康记录列表
- **THEN** API 返回该用户的所有健康记录
- **AND** 结果按 `record_date` 降序排列
- **AND** 支持按 `record_type` 过滤

#### Scenario: 按日期范围查询
- **WHEN** 用户指定日期范围查询记录
- **THEN** API 返回该日期范围内的记录
- **AND** 日期范围格式为 `start_date` 和 `end_date` 参数

#### Scenario: 按记录类型查询
- **WHEN** 用户指定 `record_type` 参数查询
- **THEN** API 仅返回该类型的记录
- **AND** 支持的类型：'fetal_movement'、'weight'、'symptom'

#### Scenario: 未登录用户尝试查询
- **WHEN** 未登录用户请求查询记录
- **THEN** API 返回 401 错误

### Requirement: 更新健康记录
系统 SHALL 提供更新健康记录的 API 接口。

#### Scenario: 更新已有记录
- **WHEN** 用户提交更新到特定记录 ID
- **THEN** API 更新该记录的数据
- **AND** 验证用户拥有该记录（通过 `user_id` 匹配）
- **AND** 返回 200 状态码和更新后的记录

#### Scenario: 更新不存在的记录
- **WHEN** 用户尝试更新不存在的记录 ID
- **THEN** API 返回 404 错误

#### Scenario: 尝试更新他人记录
- **WHEN** 用户尝试更新不属于自己的记录
- **THEN** API 返回 403 错误
- **AND** 错误信息为"无权访问该记录"

### Requirement: 删除健康记录
系统 SHALL 提供删除健康记录的 API 接口。

#### Scenario: 删除已有记录
- **WHEN** 用户请求删除特定记录 ID
- **THEN** API 从数据库中删除该记录
- **AND** 验证用户拥有该记录
- **AND** 返回 204 状态码（无内容）

#### Scenario: 删除不存在的记录
- **WHEN** 用户尝试删除不存在的记录 ID
- **THEN** API 返回 404 错误

#### Scenario: 尝试删除他人记录
- **WHEN** 用户尝试删除不属于自己的记录
- **THEN** API 返回 403 错误

### Requirement: 健康记录数据分析
系统 SHALL 提供基础的健康记录数据分析能力。

#### Scenario: 胎动趋势分析
- **WHEN** 用户请求胎动趋势（最近 7 天）
- **THEN** API 返回每日胎动次数和计时时长
- **AND** 数据格式适配图表展示（日期、次数）

#### Scenario: 体重趋势分析
- **WHEN** 用户请求体重趋势（整个孕期）
- **THEN** API 返回按孕周的体重记录
- **AND** 包含与标准增重曲线的对比数据（如果可用）

#### Scenario: 症状统计
- **WHEN** 用户请求症状统计
- **THEN** API 返回按严重程度和孕周分组的症状记录
- **AND** 标注已缓解和未缓解的症状数量

### Requirement: 健康记录隐私保护
系统 SHALL 确保健康记录的隐私安全。

#### Scenario: 记录隔离
- **WHEN** 用户查询健康记录
- **THEN** API 只返回该用户自己的记录
- **AND** 不能通过记录 ID 猜测访问他人记录

#### Scenario: 数据导出
- **WHEN** 用户请求导出自己的健康记录
- **THEN** API 生成 CSV 或 JSON 格式的导出文件
- **AND** 导出文件包含用户的所有记录数据
- **AND** 导出前 MUST 验证用户身份

#### Scenario: 数据删除（GDPR 合规）
- **WHEN** 用户请求删除账户
- **THEN** 系统 MUST 同时删除该用户的所有健康记录
- **AND** 删除操作不可逆
- **AND** 删除前 MUST 要求用户确认
