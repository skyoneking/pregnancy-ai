## Why

当前项目是一个天气查询 AI 助手，底层具备完整的流式对话、工具调用和 GLM 模型接入能力，但业务价值有限。将其转型为**孕期全程助手**，能充分利用现有技术基础，为备孕及孕期中的夫妻双方提供有实际价值的 AI 辅助服务。MVP 聚焦孕中阶段，为后续"传统应用 + AI 融合"的完整产品留出扩展空间。

## What Changes

- **移除** 天气工具（`get_weather_for_location`、`get_user_location`）及相关审批 UI
- **新增** Onboarding 引导页（`/onboarding`）：用户选择身份（准妈妈/准爸爸）并填写预产期，结果写入 localStorage
- **新增** 五个孕期专用 AI 工具：孕周计算、每周胎儿发育、食物安全查询、产检时间表、四级症状评估
- **修改** Agent 系统提示：从天气助手人设切换为孕期助手人设，感知用户身份与孕周
- **修改** API 路由：接收前端传入的 userProfile（role + dueDate），注入 agent context
- **修改** 主聊天页：全中文界面，顶部显示孕周信息，首次访问自动跳转 Onboarding

## Capabilities

### New Capabilities

- `user-onboarding`：用户档案收集与持久化——选择夫妻身份、填写预产期、存储至 localStorage，首次访问检测与跳转逻辑
- `pregnancy-context`：孕期上下文注入——将 userProfile（role + dueDate）从前端传入 API，扩展 agent context schema，使所有工具具备孕周感知能力
- `pregnancy-tools`：五个孕期专用 AI 工具——孕周计算、每周胎儿发育（双视角）、食物安全查询、产检时间表、四级症状分级评估
- `pregnancy-chat-ui`：全中文孕期对话界面——移除天气相关 UI，显示孕周信息标签，适配孕期助手交互场景

### Modified Capabilities

（无需修改的现有 spec）

## Impact

- **修改文件**：`app/_langchain/agent.ts`、`app/api/chat/route.ts`、`app/page.tsx`
- **新增文件**：`app/onboarding/page.tsx`
- **移除依赖**：无（工具替换在现有框架内进行）
- **新增依赖**：无（复用现有 LangChain 工具调用机制）
- **Breaking**：原有天气功能完全移除，现有对话历史（MemorySaver thread_id:"1"）将因系统提示变更而出现上下文不一致（MVP 阶段可接受）