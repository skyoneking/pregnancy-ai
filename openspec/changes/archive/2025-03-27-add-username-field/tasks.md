## 1. 数据库与类型

- [x] 1.1 在 Supabase 执行 `ALTER TABLE profiles ADD COLUMN username TEXT DEFAULT NULL`
- [x] 1.2 更新 `app/_supabase/types.ts` 的 `Profile` 接口，新增 `username: string | null`

## 2. 后端 API

- [x] 2.1 修改 `app/lib/create-default-profile.ts`，函数签名新增 `username` 参数，写入 profiles 时包含 `username`
- [x] 2.2 修改 `app/api/auth/register/route.ts`，接收并验证 `username` 参数（必填，正则 `^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$`），传递给 `createDefaultProfile`
- [x] 2.3 修改 `app/api/user/profile/route.ts` PUT 方法，Zod schema 新增 `username` 可选字段及验证规则

## 3. 前端

- [x] 3.1 修改 `app/onboarding/page.tsx` 注册表单，新增用户名输入框（id="username"，必填，placeholder="请输入用户名"）
- [x] 3.2 修改 `app/hooks/useAuth.ts` 的 `signUp` 方法，接收并传递 `username` 参数
- [x] 3.3 在个人中心 `app/profile/page.tsx` 展示 `username`（兜底显示"用户"）

## 4. 单元测试

- [x] 4.1 更新 `__tests__/unit/api/auth/auth-api.test.ts`，注册测试用例新增 `username` 参数、验证空用户名和格式错误场景
- [x] 4.2 更新 `__tests__/unit/api/user/profile.route.test.ts`，档案更新测试用例新增 `username` 字段验证
- [x] 4.3 更新 `__tests__/ui/onboarding.test.tsx`，验证注册表单包含用户名输入框

## 5. E2E 测试

- [x] 5.1 更新 `e2e/auth-flow.spec.ts`，注册流程填写用户名字段，验证成功注册
- [x] 5.2 新增用户名验证 E2E 场景：空用户名、格式错误的用户名

## 6. 验证

- [x] 6.1 运行 `pnpm test` 确保所有单元测试通过
- [x] 6.2 运行 `pnpm test:e2e` 确保 E2E 测试通过
- [x] 6.3 通过 MCP 工具手动验证注册流程：打开 /onboarding → 填写用户名+手机号+密码 → 注册成功
