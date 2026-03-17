## ADDED Requirements

### Requirement: 全中文界面
系统 SHALL 使用全中文显示所有 UI 文字，包括占位符、按钮、标签和状态提示。

#### Scenario: 输入框占位符为中文
- **WHEN** 用户查看聊天输入框
- **THEN** 占位符文字 MUST 为中文（如"和孕伴说点什么..."）

#### Scenario: 所有按钮和标签为中文
- **WHEN** 用户查看聊天界面
- **THEN** 发送按钮、角色标签、状态提示 MUST 全部使用中文

### Requirement: 顶部孕周信息展示
系统 SHALL 在聊天界面顶部展示用户档案摘要，包括当前身份和孕周。

#### Scenario: 准妈妈身份展示
- **WHEN** 已登录用户（role: 'mom'）进入聊天页
- **THEN** 顶部显示"准妈妈 · 孕 X 周"（X 为当前估算孕周）

#### Scenario: 准爸爸身份展示
- **WHEN** 已登录用户（role: 'dad'）进入聊天页
- **THEN** 顶部显示"准爸爸 · 孕 X 周"（X 为当前估算孕周）

### Requirement: 移除天气相关 UI
系统 SHALL 移除所有天气工具相关的审批 UI 组件和状态展示逻辑。

#### Scenario: 不渲染工具审批按钮
- **WHEN** 用户查看聊天界面
- **THEN** 界面中 MUST 不出现"批准/拒绝"工具审批按钮

#### Scenario: 不渲染天气工具状态
- **WHEN** 用户查看聊天界面
- **THEN** 界面中 MUST 不出现天气查询相关的工具状态显示

### Requirement: 首次访问检测与跳转
系统 SHALL 在主聊天页初始化时检查用户档案，无档案时自动跳转。

#### Scenario: 无档案时跳转 Onboarding
- **WHEN** 用户访问 `/`，localStorage 中无 `pregnancy_profile`
- **THEN** 系统在页面加载后跳转至 `/onboarding`

#### Scenario: 有档案时正常显示
- **WHEN** 用户访问 `/`，localStorage 中有有效 `pregnancy_profile`
- **THEN** 系统读取档案，展示孕周信息，显示聊天界面