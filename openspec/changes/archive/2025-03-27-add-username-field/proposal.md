## Why

当前注册流程仅要求手机号和密码，缺少用户名字段。用户在应用中没有可展示的昵称/姓名，影响个人中心展示和社交体验。需要在注册时收集用户名，并存储到 Supabase `profiles` 表中。

## What Changes

- 注册表单新增「用户名」输入框（必填，2-20 字符）
- 注册 API 接收并传递 `username` 参数
- `profiles` 表新增 `username` 列（TEXT, NOT NULL）
- 创建默认档案时写入 `username`
- 用户档案 API 支持读取和更新 `username`
- TypeScript 类型定义同步更新

## Capabilities

### New Capabilities

（无新增能力模块）

### Modified Capabilities

- `user-auth`: 注册场景新增 `username` 必填参数，注册 API 需验证并传递该字段
- `user-profile`: `profiles` 表新增 `username` 列，档案读取/更新接口需包含该字段

## Impact

- **数据库**: `profiles` 表需要 ALTER TABLE 添加 `username` 列
- **API**: `POST /api/auth/register` 需接收 `username` 参数；`GET/PUT /api/user/profile` 需包含 `username`
- **前端**: `app/onboarding/page.tsx` 注册表单新增输入框
- **类型**: `app/_supabase/types.ts` 的 `Profile` 接口需更新
- **工具函数**: `app/lib/create-default-profile.ts` 需传入 `username`
- **Hook**: `app/hooks/useAuth.ts` 的 `signUp` 方法需传递 `username`
- **测试**: 单元测试和 E2E 测试需同步更新
