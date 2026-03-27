## MODIFIED Requirements

### Requirement: 账号密码注册
系统 SHALL 提供账号密码注册的 API 接口。

#### Scenario: 成功注册新用户
- **WHEN** 用户提交用户名、手机号和密码（>=6 位）
- **THEN** Supabase Auth 创建新用户记录
- **AND** 密码使用 bcrypt 哈希存储
- **AND** API 返回 200 状态码和 session token
- **AND** 自动创建用户档案（profiles 记录），包含 `username` 字段

#### Scenario: 手机号已注册
- **WHEN** 用户提交已注册的手机号
- **THEN** API 返回 409 冲突错误
- **AND** 错误信息为"该手机号已注册，请直接登录"

#### Scenario: 密码不符合规则
- **WHEN** 用户提交的密码 <6 位
- **THEN** API 返回 400 错误
- **AND** 错误信息为"密码至少需要 6 位"

#### Scenario: 手机号格式无效
- **WHEN** 用户提交的手机号格式不正确
- **THEN** API 返回 400 错误
- **AND** 错误信息为"请输入有效的手机号"

#### Scenario: 手机号或密码为空
- **WHEN** 用户提交的手机号或密码为空
- **THEN** API 返回 400 错误
- **AND** 错误信息为"请输入手机号和密码"

#### Scenario: 用户名为空
- **WHEN** 用户提交的用户名为空
- **THEN** API 返回 400 错误
- **AND** 错误信息为"请输入用户名"

#### Scenario: 用户名格式无效
- **WHEN** 用户提交的用户名不符合格式要求（少于 2 字符、超过 20 字符、或包含非法字符）
- **THEN** API 返回 400 错误
- **AND** 错误信息为"用户名需为 2-20 个字符，仅支持中英文、数字和下划线"
