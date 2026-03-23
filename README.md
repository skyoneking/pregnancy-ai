# 孕期助手 AI (Pregnancy Assistant)

基于 Next.js + Supabase + LangChain 的全流程孕期 AI 助手，支持备孕期、孕期、产后期三个阶段的个性化知识推送。

## 功能特性

- **账号认证**: 手机号 + 密码注册/登录，密码重置，登录失败锁定
- **档案管理**: 用户阶段选择（备孕/孕期/产后），预产期、角色设置
- **多设备同步**: 基于 Supabase Realtime 的档案实时同步
- **AI 对话**: LangChain Agent + 智谱 GLM 模型，根据用户阶段和孕周推送知识
- **知识库**: 内置备孕/孕期/产后知识，食物安全查询，产检时间表，症状评估

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: LangChain + 智谱 GLM-4-Flash
- **测试**: Vitest (单元) + Playwright (E2E)
- **包管理**: pnpm

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
cp .env.example .env.local
```

需要配置：
- **Supabase**: 项目 URL、Anon Key、Service Role Key（在 Supabase Dashboard → Settings → API 获取）
- **GLM AI**: API Key（在 [智谱开放平台](https://open.bigmodel.cn/) 获取）

### 3. 初始化数据库

在 Supabase SQL Editor 中运行建表脚本，创建 `profiles` 和 `health_records` 表，并配置 RLS 策略。

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
app/
├── _langchain/       # LangChain Agent（AI 工具、系统提示）
├── _supabase/        # Supabase 客户端初始化和类型定义
├── api/
│   ├── auth/         # 认证 API（register, login, reset-password）
│   ├── chat/         # AI 对话 API
│   └── user/         # 用户档案 API（profile）
├── contexts/         # React Context（AuthProvider）
├── hooks/            # Custom Hooks（useAuth）
├── lib/              # 工具库（知识库、限流、错误消息）
├── onboarding/       # 引导页（注册/登录 + 阶段选择）
├── profile/          # 个人中心页
└── page.tsx          # 聊天主页
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（手机号 + 密码） |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/reset-password` | 密码重置（旧密码验证） |
| GET | `/api/user/profile` | 获取用户档案 |
| PUT | `/api/user/profile` | 更新用户档案 |
| POST | `/api/chat` | AI 对话 |

## 测试

```bash
# 单元测试
pnpm test

# E2E 测试（需要 dev server 运行）
pnpm test:e2e

# 覆盖率报告
pnpm test:coverage
```

## 数据库表

### profiles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 关联 auth.users |
| stage | text | 阶段（preconception/pregnancy/postpartum） |
| role | text | 角色（mom/dad） |
| due_date | date | 预产期 |
| postpartum_date | date | 生产日期 |
| push_frequency | text | 推送频率（daily/weekly/manual） |

RLS 策略确保用户只能访问自己的数据。
