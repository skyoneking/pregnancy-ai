## MODIFIED Requirements

### Requirement: 首次访问检测与跳转
系统 SHALL 仅通过 `/chatbot` 路径提供聊天界面，无档案时跳转至 onboarding。

#### Scenario: 未登录时跳转 Onboarding
- **WHEN** 用户访问 `/chatbot`，未登录
- **THEN** 系统跳转至 `/onboarding`

#### Scenario: 已登录无档案时跳转 Onboarding
- **WHEN** 用户访问 `/chatbot`，已登录但无 profile
- **THEN** 系统跳转至 `/onboarding`

#### Scenario: 有档案时正常显示聊天界面
- **WHEN** 用户访问 `/chatbot`，已登录且有有效 profile
- **THEN** 系统展示聊天界面，包含侧边栏和消息列表

## REMOVED Requirements

### Requirement: 移除天气相关 UI
**Reason**: 天气工具已在之前迭代中移除，chatbot 界面不含天气相关组件
**Migration**: 无需迁移，新 chatbot 界面从未包含天气 UI

### Requirement: 顶部孕周信息展示
**Reason**: 旧 page.tsx 的顶部孕周标签已随旧页面删除。chatbot 界面使用侧边栏展示用户信息
**Migration**: chatbot 的 chat-sidebar 组件承载用户信息展示

### Requirement: 全中文界面
**Reason**: chatbot 界面天然使用全中文，不需要单独规格约束
**Migration**: chatbot 组件已内置全中文
