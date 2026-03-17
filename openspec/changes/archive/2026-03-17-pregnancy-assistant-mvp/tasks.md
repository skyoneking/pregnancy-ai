## 1. 数据层：UserProfile 类型与 localStorage 工具

- [x] 1.1 在 `app/types/profile.ts` 中定义 `UserProfile` 接口（role, dueDate, createdAt）
- [x] 1.2 在 `app/lib/profile.ts` 中实现 `getProfile()`、`saveProfile()`、`clearProfile()` 工具函数
- [x] 1.3 新建 `__tests__/unit/profile.test.ts`，测试三个工具函数的正常和边界场景

## 2. Onboarding 页面

- [x] 2.1 创建 `app/onboarding/page.tsx`，实现身份选择（准妈妈/准爸爸）卡片 UI
- [x] 2.2 添加预产期日期选择器，带输入验证（不早于今天，不晚于今天+10个月）
- [x] 2.3 实现提交逻辑：验证通过后调用 `saveProfile()`，跳转至 `/`
- [x] 2.4 新建 `__tests__/ui/onboarding.test.tsx`：
  - 选择"准妈妈"/"准爸爸"卡片后高亮正确项
  - 未选身份时提交按钮禁用或提示
  - 输入合法预产期后调用 `saveProfile()` 并触发 router.push('/')

## 3. Agent Context Schema 扩展

- [x] 3.1 在 `app/_langchain/agent.ts` 中扩展 `contextSchema`，新增 `role` 和 `due_date` 字段（Zod 验证）
- [x] 3.2 更新 agent 系统提示为孕期助手人设，根据 context.role 动态注入用户身份
- [x] 3.3 更新 `__tests__/unit/agent.test.ts` — contextSchema 测试：
  - **删除**原有 `getUserLocation` 测试组（全部用例）
  - **删除**原有 `getWeather` 测试组（全部用例）
  - **删除**原有 contextSchema 的旧测试（`{user_id:"u1"}` 校验逻辑，不含 role/due_date）
  - **保留** `handleToolErrors` 测试组（逻辑不变）
  - **新增** contextSchema 测试：`{user_id, role:'mom', due_date:'2025-09-01'}` → 解析成功
  - **新增** contextSchema 测试：缺少 role 字段 → safeParse 返回 false
  - **新增** contextSchema 测试：缺少 due_date 字段 → safeParse 返回 false

## 4. 孕期专用工具实现

- [x] 4.1 实现 `calculatePregnancyInfo` 工具：根据 due_date 计算孕周、孕期阶段、距预产期天数
- [x] 4.2 实现 `getWeeklyDevelopment` 工具：静态孕周数据（14-40周），根据 role 返回不同视角内容
- [x] 4.3 实现 `checkFoodSafety` 工具：内置食物安全数据库（至少20种常见食物），四档安全等级
- [x] 4.4 实现 `getPrenatalSchedule` 工具：静态产检时间表，根据孕周返回已完成/待做/即将到来的检查
- [x] 4.5 实现 `assessSymptom` 工具：四级分级逻辑，所有结果强制包含免责声明字段
- [x] 4.6 移除原有天气工具（`getWeather`、`getUserLocation`）
- [x] 4.7 在 `__tests__/unit/agent.test.ts` 中新增五个工具的单元测试：
  - `calculatePregnancyInfo`：给定预产期 → 返回正确孕周；预产期为今天 → 孕40周
  - `getWeeklyDevelopment`：role='mom' vs role='dad' 返回内容不同；孕周超出范围 → 返回兜底信息
  - `checkFoodSafety`：螃蟹→避免；叶酸→安全；咖啡→适量；未知食物→通用建议
  - `getPrenatalSchedule`：孕20周 → 包含大排畸；孕12周 → 包含NT筛查
  - `assessSymptom`：大量出血→🔴紧急且含免责声明；轻微恶心→🟢正常；腹痛→至少🟠就诊等级

## 5. API 路由更新

- [x] 5.1 修改 `app/api/chat/route.ts`：从请求体解析 `profile`，缺少 profile 时返回 400 错误
- [x] 5.2 将 `profile.role` 和 `profile.dueDate` 注入 agent context（`role`、`due_date` 字段）
- [x] 5.3 更新 `__tests__/unit/api/chat.route.test.ts`：
  - **删除**原 `makeRequest`（不含 profile）构造的合法请求测试
  - **删除**原 langchainAgent.stream 验证中 `context.user_id:'u1'` 的硬编码断言
  - **新增** `makeRequest` 携带 `profile:{role:'mom', dueDate:'2025-09-01'}` → 返回 200
  - **新增** 验证 langchainAgent.stream 调用时 context 含 `role:'mom'` 和 `due_date:'2025-09-01'`
  - **新增** 请求体缺少 `profile` 字段 → 返回 400

## 6. 主聊天页 UI 改造

- [x] 6.1 修改 `app/page.tsx`：添加 `useEffect` 检测 localStorage，无档案时跳转 `/onboarding`
- [x] 6.2 在聊天界面顶部添加孕周信息标签（"准妈妈 · 孕 X 周" / "准爸爸 · 孕 X 周"）
- [x] 6.3 移除天气工具审批 UI（approval-requested、output-available 等状态的渲染逻辑）
- [x] 6.4 更新聊天界面所有文案为中文（占位符、角色标签、状态提示）
- [x] 6.5 修改 `useAgentChat` hook（若存在）：发送消息时携带 profile 信息
- [x] 6.6 重写 `__tests__/ui/page.test.tsx`：
  - **删除**全部天气工具测试组（`approval-requested`、`output-available`、`output-denied`、`data-status` 相关测试组，约6.5–6.11对应场景）
  - **删除**英文占位符测试（`'Say something...'`）
  - **新增** mock localStorage 无档案时：组件触发 `router.push('/onboarding')`
  - **新增** mock localStorage 有档案（role:'mom', 孕28周）：渲染包含"准妈妈 · 孕 28 周"的标签
  - **新增** 中文占位符渲染（如"和孕伴说点什么..."）
  - **新增** 表单提交时 sendMessage 被调用，且 profile 信息包含在发送数据中

## 7. E2E 测试

- [x] 7.1 重写 `e2e/chat.spec.ts`：
  - **删除**旧场景：英文占位符检测（`'Say something...'`）
  - **删除**旧场景：天气工具审批 UI（7.6 Approve/Deny 按钮相关场景）
  - **删除**旧场景：天气工具 mock 流（`getWeatherInformation` tool-call body）
- [x] 7.2 新增 E2E：首次访问 `/`（localStorage 无档案）→ 自动跳转 `/onboarding`
- [x] 7.3 新增 E2E：Onboarding 完整流程 → 选择"准妈妈" → 输入预产期 → 提交 → 跳转聊天页 → 顶部出现孕周标签
- [x] 7.4 新增 E2E：聊天页发送消息（mock `/api/chat` 返回孕期助手 SSE 响应）→ 显示 AI 中文回复
- [x] 7.5 通过 Playwright MCP 工具验证完整流程，截图确认：
  - Onboarding 页两种身份卡片状态
  - 聊天页孕周信息标签显示正确
  - AI 回复内容包含孕期相关信息
