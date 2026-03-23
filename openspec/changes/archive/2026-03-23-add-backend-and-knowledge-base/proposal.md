## Why

当前孕期助手 MVP 纯前端实现，用户数据存储在 localStorage，存在以下限制：
1. **数据孤岛**：无法在多设备间同步用户档案和健康记录
2. **内容单一**：AI 工具数据硬编码，无法动态更新知识库
3. **阶段割裂**：仅支持孕期，无法覆盖备孕和产后的全流程健康管理
4. **推送缺失**：知识依赖用户主动查询，缺乏基于用户状态的上下文推送

为构建真正有用的全流程健康管理助手，需要引入后端服务和知识库系统，实现数据持久化、多端同步和智能内容推送。

## What Changes

### 新增后端基础设施
- **用户认证系统**：账号密码登录（密码规则：>=6 位）
- **数据库服务**：PostgreSQL (Supabase) 存储用户档案、健康记录、知识库
- **API 层**：Next.js API Routes 提供认证、档案 CRUD、知识推送接口

### 新增知识库系统
- **全流程知识库**：覆盖备孕期（6个知识点）、孕期（每周增强内容）、产后期（10个知识点）
- **上下文推送引擎**：AI 根据用户当前阶段、孕周/产后天数，主动推送相关知识
- **知识库结构**：TypeScript 数据结构，支持触发器（孕周、产后天数、关键词）

### 用户体验升级
- **阶段选择**：引导流程增加"备孕/孕期/产后"三阶段选择
- **智能推送**：AI 首次问候和关键时间点（如产检前）自动推送相关知识
- **多端同步**：用户档案和健康记录在多设备间实时同步

### AI Agent 增强
- **推送工具**：新增 `get_contextual_knowledge` 工具，根据用户阶段和状态获取相关知识
- **系统提示升级**：增加上下文推送指令，AI 主动提供知识而非被动回答

## Capabilities

### New Capabilities
- `user-auth`: 账号密码认证系统（注册、登录、密码重置、获取当前用户）
- `user-profile`: 用户档案管理（创建、读取、更新阶段/预产期、多设备同步）
- `knowledge-base`: 全流程知识库系统（备孕/孕期/产后知识内容管理）
- `contextual-push`: 上下文推送引擎（根据用户阶段、孕周、产后天数自动推送相关知识）
- `health-records`: 健康记录持久化（胎动计数、体重追踪、症状日记等，为后续功能预留）

### Modified Capabilities
- `pregnancy-context`: 扩展用户档案数据结构，增加 `stage`（阶段）字段，支持备孕/孕期/产后全流程

## Impact

### 技术栈变更
- **新增依赖**：
  - `@supabase/supabase-js`: Supabase 客户端
  - 环境变量：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **数据库迁移**：首次部署需运行 Supabase SQL 脚本创建表结构（users、profiles、health_records）

### 代码结构变更
- **新增目录/文件**：
  - `app/_supabase/`: Supabase 客户端初始化、类型定义
  - `app/lib/knowledge.ts`: 知识库数据结构和查询逻辑
  - `app/api/auth/`: 认证相关 API Routes
  - `app/api/user/`: 用户档案 API Routes
  - `app/knowledge/`: 知识库 Markdown 内容文件（可选迁移到 CMS）
- **修改文件**：
  - `app/onboarding/page.tsx`: 增加阶段选择逻辑，对接后端认证
  - `app/types/profile.ts`: 增加 `stage` 字段（'preconception' | 'pregnancy' | 'postpartum'）
  - `app/_langchain/agent.ts`: 新增 `getContextualKnowledge` 工具，升级系统提示
  - `app/api/chat/route.ts`: 从请求中获取用户阶段，传递给 agent

### API 变更
- **新增端点**：
  - `POST /api/auth/register`: 账号密码注册
  - `POST /api/auth/login`: 账号密码登录
  - `POST /api/auth/reset-password`: 重置密码
  - `GET /api/user/profile`: 获取当前用户档案
  - `PUT /api/user/profile`: 更新用户档案（阶段、预产期等）
  - `GET /api/knowledge/push`: 获取上下文推送知识（内部调用，也可开放给前端）

### 数据流变更
- **认证流程**：用户访问 `/onboarding` → 注册/登录（账号 + 密码）→ 创建/获取用户档案
- **知识推送流程**：用户打开聊天 → AI 调用 `getContextualKnowledge(stage, week/day)` → 返回相关知识 → AI 自然融入对话

### 数据清理
- **移除 localStorage**：删除所有 localStorage 相关代码，数据完全迁移至 Supabase
- **BREAKING**：现有 localStorage 用户数据无法迁移，需重新注册（MVP 阶段用户量少，影响可控）

### 部署与运维
- **部署步骤**：创建 Supabase 项目 → 运行 SQL 迁移脚本 → 配置环境变量 → 部署到 Vercel
- **成本**：Supabase 免费 tier（500MB 数据库、2GB 流量/月）足够 MVP 使用
- **监控**：利用 Supabase Dashboard 监控数据库性能和 API 调用
