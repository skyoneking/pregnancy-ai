## ADDED Requirements

### Requirement: 账号密码注册
系统 SHALL 提供账号密码注册的 API 接口。

#### Scenario: 成功注册新用户
- **WHEN** 用户提交手机号和密码（>=6 位）
- **THEN** Supabase Auth 创建新用户记录
- **AND** 密码使用 bcrypt 哈希存储
- **AND** API 返回 200 状态码和 session token
- **AND** 自动创建用户档案（profiles 记录）

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

### Requirement: 账号密码登录
系统 SHALL 提供账号密码登录的 API 接口。

#### Scenario: 登录凭证正确时登录成功
- **WHEN** 用户提交手机号和正确的密码
- **THEN** Supabase Auth 验证成功，创建 session
- **AND** API 返回 200 状态码和 session token
- **AND** 用户信息包含关联的 profile 数据

#### Scenario: 密码错误
- **WHEN** 用户提交手机号和错误的密码
- **THEN** API 返回 401 错误
- **AND** 错误信息为"密码错误，请重新输入"

#### Scenario: 用户不存在
- **WHEN** 用户提交未注册的手机号
- **THEN** API 返回 401 错误
- **AND** 错误信息为"该手机号未注册，请先注册"

#### Scenario: 手机号或密码为空
- **WHEN** 用户提交的手机号或密码为空
- **THEN** API 返回 400 错误
- **AND** 错误信息为"请输入手机号和密码"

### Requirement: 密码重置
系统 SHALL 提供密码重置的 API 接口。

#### Scenario: 成功重置密码（验证旧密码）
- **WHEN** 用户提交手机号、旧密码和新密码（>=6 位）
- **THEN** 系统验证旧密码正确后更新为新密码
- **AND** API 返回 200 状态码
- **AND** 提示"密码重置成功"

#### Scenario: 旧密码错误
- **WHEN** 用户提交错误的旧密码
- **THEN** API 返回 401 错误
- **AND** 错误信息为"旧密码错误，请重新输入"

#### Scenario: 新密码不符合规则
- **WHEN** 用户提交的新密码 <6 位
- **THEN** API 返回 400 错误
- **AND** 错误信息为"密码至少需要 6 位"

#### Scenario: 用户不存在
- **WHEN** 用户提交未注册的手机号
- **THEN** API 返回 404 错误
- **AND** 错误信息为"该手机号未注册"

#### Scenario: 新旧密码相同
- **WHEN** 用户提交的新密码与旧密码相同
- **THEN** API 返回 400 错误
- **AND** 错误信息为"新密码不能与旧密码相同"

### Requirement: Session 管理
系统 SHALL 使用 Supabase Auth 的 session 管理，支持自动刷新和持久化。

#### Scenario: Session 持久化
- **WHEN** 用户登录成功
- **THEN** session token 存储在 localStorage 中
- **AND** session 有效期为 30 天
- **AND** session 在有效期内自动刷新

#### Scenario: Session 过期时重新认证
- **WHEN** 用户访问受保护资源但 session 已过期
- **THEN** 系统清除本地 session 数据
- **AND** 重定向至 `/onboarding` 认证流程
- **AND** 提示用户"登录已过期，请重新登录"

#### Scenario: 主动退出登录
- **WHEN** 用户点击"退出登录"
- **THEN** 系统调用 Supabase `signOut()` 方法
- **AND** 清除本地 session 数据
- **AND** 重定向至 `/onboarding`

### Requirement: 登录失败限制
系统 SHALL 限制登录失败次数，防止暴力破解。

#### Scenario: 连续登录失败次数过多
- **WHEN** 同一手机号连续 5 次登录失败
- **THEN** API 返回 429 错误
- **AND** 错误信息为"登录失败次数过多，请 15 分钟后再试"
- **AND** 锁定 15 分钟后自动解锁

#### Scenario: 锁定期间尝试登录
- **WHEN** 用户在锁定期间尝试登录
- **THEN** API 返回 429 错误
- **AND** 错误信息包含剩余锁定时间

#### Scenario: 锁定时间结束后自动解锁
- **WHEN** 锁定时间（15 分钟）结束
- **THEN** 用户可正常尝试登录
- **AND** 失败计数器重置为 0

### Requirement: 获取当前用户
系统 SHALL 提供获取当前登录用户的 API 接口。

#### Scenario: 已登录用户获取信息
- **WHEN** 用户已登录且 session 有效
- **THEN** API 返回 200 状态码和用户信息（id、phone、created_at）
- **AND** 用户信息包含关联的 profile 数据

#### Scenario: 未登录用户访问
- **WHEN** 未登录用户请求获取当前用户
- **THEN** API 返回 401 错误
- **AND** 提示用户先完成认证
