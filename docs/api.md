# API 文档

## 认证 API

### POST /api/auth/register

注册新用户。使用 Supabase Admin API 创建用户（绕过邮件验证）。

**请求体:**
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "message": "注册成功",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { "id": "...", "phone": "13800138000", "profile": {...} }
  }
}
```

**错误响应:**
- `400` - 请输入手机号和密码 / 请输入有效的手机号 / 密码至少需要 6 位
- `409` - 该手机号已注册，请直接登录
- `500` - 服务器错误，请稍后重试

### POST /api/auth/login

用户登录。手机号转换为伪邮箱格式 `{phone}@example.com` 调用 Supabase Auth。

**请求体:**
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "message": "登录成功",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { "id": "...", "phone": "13800138000", "profile": {...} }
  }
}
```

**错误响应:**
- `400` - 请输入手机号和密码 / 请输入有效的手机号
- `401` - 密码错误，请重新输入
- `429` - 登录失败次数过多，账号已锁定15分钟
- `500` - 服务器错误，请稍后重试

**登录限制:** 连续 5 次密码错误后锁定 15 分钟。

### POST /api/auth/reset-password

通过旧密码验证重置密码。

**请求体:**
```json
{
  "phone": "13800138000",
  "oldPassword": "old123",
  "newPassword": "new123456"
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "message": "密码重置成功，请使用新密码登录"
}
```

**错误响应:**
- `400` - 请提供手机号、旧密码和新密码 / 新密码至少需要 6 位 / 新密码不能与旧密码相同
- `401` - 旧密码错误，请重新输入
- `500` - 密码重置失败，请稍后重试

---

## 档案 API

### GET /api/user/profile

获取当前用户档案（需要认证）。

**成功响应 (200):**
```json
{
  "success": true,
  "profile": {
    "id": "...",
    "user_id": "...",
    "stage": "pregnancy",
    "role": "mom",
    "due_date": "2026-08-15",
    "postpartum_date": null,
    "push_frequency": "daily"
  }
}
```

### PUT /api/user/profile

创建或更新用户档案（Upsert）。

**请求体 (Zod 验证):**
```json
{
  "stage": "pregnancy",
  "role": "mom",
  "due_date": "2026-08-15"
}
```

**字段验证规则:**
- `stage`: 必填，枚举 `preconception` | `pregnancy` | `postpartum`
- `role`: 可选，枚举 `mom` | `dad`
- `due_date`: 格式 `YYYY-MM-DD`，孕期时必填
- `postpartum_date`: 格式 `YYYY-MM-DD`，产后期时必填

---

## 数据库表结构

### profiles

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stage TEXT CHECK (stage IN ('preconception', 'pregnancy', 'postpartum')),
  role TEXT CHECK (role IN ('mom', 'dad')),
  due_date DATE,
  postpartum_date DATE,
  push_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS 策略

- 用户只能 SELECT/INSERT/UPDATE/DELETE 自己的 `profiles` 记录（`auth.uid() = user_id`）
- 匿名用户无法访问任何数据
