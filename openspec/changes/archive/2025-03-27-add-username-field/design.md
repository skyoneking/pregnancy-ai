## Context

当前注册流程仅收集手机号和密码。`profiles` 表没有 `username` 列，用户在应用内没有可展示的昵称。本次变更在注册时新增用户名字段，贯穿前端表单 → API → 数据库全链路。

## Goals / Non-Goals

**Goals:**
- 注册时收集并存储用户名
- `username` 作为必填字段，2-20 字符
- 档案 API 支持读取和更新 `username`
- 现有测试同步更新

**Non-Goals:**
- 用户名唯一性校验（本期不做，允许重名）
- 用户名展示在聊天界面（后续迭代）
- 已有用户的数据迁移（`username` 列允许 NULL，兼容老数据）

## Decisions

### 1. `username` 存储在 `profiles` 表而非 `auth.users`
- **选择**: 将 `username` 加到 `profiles` 表
- **理由**: `auth.users` 是 Supabase 托管表，自定义字段应放在业务表。`profiles` 已经是用户扩展信息的存储位置
- **替代方案**: 存入 `auth.users.user_metadata` — 查询不便，无法在 SQL 层做约束

### 2. `username` 列允许 NULL
- **选择**: `ALTER TABLE profiles ADD COLUMN username TEXT DEFAULT NULL`
- **理由**: 兼容已有用户数据，不需要数据迁移脚本。新注册用户在应用层保证必填
- **替代方案**: `NOT NULL DEFAULT ''` — 空字符串语义不明确

### 3. 验证规则：2-20 字符，仅限中英文、数字、下划线
- **选择**: 前端 + 后端双重验证，正则 `^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$`
- **理由**: 防止过短/过长的用户名，限制特殊字符保证展示安全

### 4. `create-default-profile` 函数接受 `username` 参数
- **选择**: 修改函数签名，新增 `username` 参数
- **理由**: 注册时一步到位写入 `username`，不需要额外 update 调用

## Risks / Trade-offs

- **老用户 `username` 为 NULL** → 前端展示时需做兜底处理（显示手机号后四位或"用户"）
- **无唯一性约束** → 允许重名，后续如需唯一性需加 UNIQUE 约束 + 冲突检查
