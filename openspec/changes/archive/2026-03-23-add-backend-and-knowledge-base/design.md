## Context

当前孕期助手 MVP 是纯前端应用，用户档案存储在 localStorage 中，AI 工具数据硬编码在代码中。这种架构存在以下限制：

**当前状态**：
- **数据孤岛**：用户数据无法在多设备间同步，更换设备或清除浏览器数据会丢失所有记录
- **内容静态**：知识库硬编码在 `app/_langchain/agent.ts`，更新需要重新部署
- **阶段单一**：仅支持孕期，无法覆盖备孕和产后的全流程健康管理
- **推送缺失**：知识依赖用户主动查询，缺乏基于用户状态的上下文感知推送

**技术约束**：
- 项目基于 Next.js 16 (App Router) + React 19
- 使用 LangChain + LangGraph 构建 AI Agent
- 前端状态管理通过 Vercel AI SDK 的 `useChat` hook
- 现有测试基础设施：Vitest (单元/集成) + Playwright (E2E)
- 部署平台：Vercel

**业务需求**：
- 支持"备孕 → 孕期 → 产后"全流程健康管理
- 知识内容能够动态更新和管理
- 用户数据在多设备间同步
- AI 根据用户状态主动推送相关知识

## Goals / Non-Goals

**Goals**：
1. 引入后端持久化存储，实现用户数据多端同步
2. 建立结构化知识库系统，支持按阶段/周数/关键词索引
3. 实现上下文推送引擎，AI 根据用户状态主动推送知识
4. 扩展用户档案模型，支持备孕/孕期/产后全流程
5. 提供简单易用的账号密码认证系统

**Non-Goals**：
- **不实现 CMS**：知识库初期使用 TypeScript 数据结构，不搭建内容管理系统
- **不做社交功能**：本次不涉及用户间交流、社区等功能
- **不做数据可视化**：健康记录的数据分析图表不在本次范围
- **不做支付/订阅**：保持免费，不涉及商业化功能
- **不做实时聊天**：AI 助手仍是单人对话，不支持多人协作

## Decisions

### 1. 后端服务选型：Supabase

**决策**：使用 Supabase 作为后端服务（PostgreSQL + Auth + Realtime）

**理由**：
- **集成度高**：单一平台提供数据库、认证、实时订阅、文件存储
- **开发效率**：开箱即用的 Auth API，节省开发时间
- **免费额度充足**：500MB 数据库、2GB 流量/月、无限 API 调用（限速后）
- **Next.js 友好**：官方提供 `@supabase/supabase-js` 和 `@supabase/auth-helpers-nextjs`
- **TypeScript 支持**：自动生成类型定义，类型安全

**替代方案对比**：
| 方案 | 优点 | 缺点 | 舍弃原因 |
|------|------|------|----------|
| 自建 PostgreSQL + NextAuth | 完全控制 | 需要自己搭建 Auth、Realtime | 开发成本高，MVP 阶段过度设计 |
| Firebase | Google 生态 | NoSQL 复杂查询困难 | 关系型数据模型更适合健康记录 |
| MongoDB + Realm | 灵活文档模型 | 学习曲线，SQL 更成熟 | 团队更熟悉关系型数据库 |

### 2. 认证方式：账号密码登录

**决策**：使用传统的账号密码登录方式

**理由**：
1. **简单可靠**：技术实现简单，不依赖第三方服务（如短信服务商）
2. **成本可控**：无需支付短信费用，运营成本低
3. **用户熟悉**：传统登录方式，用户学习成本低
4. **离线可用**：session 有效期内可离线使用

**密码规则**：
- **最低要求**：>=6 位（降低门槛，提高转化率）
- **不强制复杂度**：不要求大小写、数字、特殊字符组合（用户可自主选择）
- **安全存储**：使用 Supabase Auth 的 bcrypt 哈希存储，不存储明文

**实现细节**：
- 注册：用户输入账号（手机号）+ 密码（>=6 位）→ Supabase Auth `signUp()` → 创建用户
- 登录：用户输入账号（手机号）+ 密码 → Supabase Auth `signInWithPassword()` → 验证成功
- Session：持久化在 localStorage，自动刷新（有效期 30 天）
- 密码重置：通过安全问题或邮箱重置（MVP 阶段可简化为联系客服）

**账号标识**：
- 使用手机号作为账号标识（格式：13800138000）
- 复用 Supabase Auth 的 `email` 字段存储手机号
- 或使用 Supabase Auth 的 `phone` 字段（需配置）

**为什么不使用验证码登录**：
- **成本问题**：短信费用高，Supabase 免费额度有限
- **依赖风险**：依赖短信服务商，服务中断影响用户登录
- **国际用户**：国外用户短信发送成本更高
- **隐私顾虑**：部分用户不愿意提供手机号

**替代方案考虑**：
- **邮箱登录**：国际通用，但国内用户邮箱使用率低，暂不实现
- **微信登录**：需要企业资质，个人开发者无法接入
- **第三方登录**：增加集成复杂度，MVP 阶段暂不考虑

### 3. 知识库存储：TypeScript 数据结构

**决策**：知识库使用 TypeScript 对象存储在代码中，不使用数据库

**理由**：
- **开发速度快**：无需搭建 CMS，直接在代码中编辑
- **版本控制友好**：知识内容随代码版本管理，变更可追溯
- **类型安全**：TypeScript 类型定义保证数据结构一致性
- **AI 集成简单**：LangChain Agent 可直接 import 使用，无需数据库查询
- **内容量可控**：MVP 阶段每个阶段 10-20 个知识点，总计 <100 条

**数据结构设计**：
```typescript
// app/lib/knowledge.ts
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  stage: 'preconception' | 'pregnancy' | 'postpartum';
  week?: number;        // 孕期专属
  postpartumDay?: number; // 产后专属
  tags: string[];
  autoPush?: boolean;   // 是否自动推送
}

export const knowledgeBase: Record<string, KnowledgeItem[]> = {
  preconception: [...], // 备孕期 6 个知识点
  pregnancy: {...},     // 孕期按周组织（1-42 周）
  postpartum: [...],    // 产后期 10 个知识点
};
```

**未来迁移路径**：
- 当知识内容 >200 条时，迁移至 Supabase Database
- 搭建简单的 CMS（如 Next.js + Prisma + Supabase）
- AI Agent 通过 API 查询数据库获取知识

### 4. 上下文推送引擎：AI Agent 工具集成

**决策**：在 LangChain Agent 中新增 `getContextualKnowledge` 工具，AI 根据用户阶段调用

**理由**：
- **AI 驱动**：AI 决定何时推送知识，用户体验更自然
- **上下文感知**：Agent 已知用户状态，可智能选择相关内容
- **工具复用**：与现有工具（`calculatePregnancyInfo`、`assessSymptom`）一致的模式
- **易于测试**：工具独立测试，Mock 容易

**推送触发逻辑**：
```typescript
// app/_langchain/agent.ts
export const getContextualKnowledge = tool(
  ({ stage, week, postpartumDay }: { stage: string; week?: number; postpartumDay?: number }) => {
    // 根据阶段和周数/天数从 knowledgeBase 获取知识
    const items = getKnowledgeForStage(stage, week, postpartumDay);
    return JSON.stringify(items);
  },
  {
    name: "get_contextual_knowledge",
    description: "获取当前阶段相关知识，用于智能推送",
    schema: z.object({
      stage: z.enum(["preconception", "pregnancy", "postpartum"]),
      week: z.number().optional(),
      postpartumDay: z.number().optional(),
    }),
  },
);
```

**系统提示增强**：
```
你是一个专业、温暖的孕期助手。用户当前处于 {stage} 阶段。
- 备孕期：主动推送备孕知识，如叶酸补充、孕前检查、排卵追踪
- 孕期：根据孕周主动推送发育信息、产检提醒、注意事项
- 产后期：根据产后天数推送恢复知识、母乳喂养、新生儿护理

请自然地将知识融入对话中，不要机械罗列。每次对话最多主动推送 1 条知识。
```

### 5. 数据库 Schema 设计

**决策**：使用 Supabase PostgreSQL，设计三张核心表

**表结构**：

```sql
-- 用户表（Supabase Auth 自动创建）
-- auth.users (id, phone, created_at, updated_at)

-- 用户档案表
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stage TEXT CHECK (stage IN ('preconception', 'pregnancy', 'postpartum')),
  role TEXT CHECK (role IN ('mom', 'dad')),
  due_date DATE,
  postpartum_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 健康记录表（预留，为后续功能使用）
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT CHECK (record_type IN ('fetal_movement', 'weight', 'symptom')),
  record_date DATE NOT NULL,
  data JSONB NOT NULL, -- 灵活存储不同类型的记录数据
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_type_date ON health_records(record_type, record_date);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的数据
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own records" ON health_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**设计考量**：
- **外键关联**：`profiles.user_id` 关联 `auth.users(id)`，级联删除
- **数据验证**：使用 `CHECK` 约束限制 `stage` 和 `role` 枚举值
- **JSONB 灵活性**：`health_records.data` 使用 JSONB 存储不同类型记录的扩展字段
- **RLS 安全**：Row Level Security 确保用户只能访问自己的数据
- **索引优化**：为常用查询路径（user_id、record_type + date）创建索引

### 6. API 路由设计

**决策**：使用 Next.js API Routes (App Router)，RESTful 风格

**新增端点**：

```
# 账号密码认证
POST /api/auth/register
  Body: { phone: string, password: string }
  Response: { success: boolean, session: { access_token, user } }

POST /api/auth/login
  Body: { phone: string, password: string }
  Response: { success: boolean, session: { access_token, user } }

POST /api/auth/reset-password
  Body: { phone: string, newPassword: string, oldPassword?: string }
  Response: { success: boolean, message: string }

# 用户档案
GET /api/user/profile
  Headers: Authorization: Bearer <token>
  Response: { profile }

PUT /api/user/profile
  Headers: Authorization: Bearer <token>
  Body: { stage?, role?, due_date? }
  Response: { profile }
```

**认证中间件**：
```typescript
// app/api/_middleware.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs'

export async function getSupabaseReq(req: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => req.headers.get('cookie')! } }
  );
  return supabase;
}

export async function requireAuth(req: Request) {
  const supabase = await getSupabaseReq(req);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}
```

### 7. 前端状态管理升级

**决策**：扩展现有 `useChat` hook，集成 Supabase 认证和档案管理

**变更点**：
1. **认证状态管理**：
   - 新增 `app/hooks/useAuth.ts`：管理登录状态和 session
   - 使用 Supabase `onAuthStateChange` 监听认证变化

2. **档案数据获取**：
   - `app/api/chat/route.ts` 从数据库读取用户档案（不再依赖 localStorage）
   - AI Agent context 从请求中获取用户阶段和状态

3. **实时同步**：
   - 使用 Supabase Realtime 订阅 `profiles` 表变更
   - 当档案在另一设备更新时，当前设备自动刷新

**代码示例**：
```typescript
// app/hooks/useAuth.ts
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(...);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
```

## Risks / Trade-offs

### Risk 1: 知识内容准确性

**风险**：医疗健康内容需要专业背书，错误信息可能误导用户

**缓解措施**：
- 所有知识内容末尾强制添加免责声明："以上仅供参考，不构成医疗诊断，请以医生意见为准"
- 内容来源优先参考权威机构（如 WHO、中国卫生健康委员会）
- 紧急症状（如出血、剧烈腹痛）明确标注就医建议
- 后期可邀请专业医生审核内容

### Risk 2: 现有用户流失

**风险**：从 localStorage 迁移到 Supabase 后，现有用户需要重新注册

**缓解措施**：
- MVP 阶段用户量较少，影响可控
- 提示用户："我们升级了服务，需要重新注册以获得更好的体验"
- 新注册流程简洁，降低用户流失
- 提供更多功能（多设备同步、知识推送）吸引用户重新注册

### Risk 3: Supabase 依赖风险

**风险**：依赖第三方服务，存在服务中断或价格变化风险

**缓解措施**：
- 数据库定期备份（Supabase 支持自动备份）
- 设计可迁移架构：API 层抽象，未来可切换至自建 PostgreSQL
- 监控 Supabase 状态，使用服务状态页面（status.supabase.com）

### Risk 4: 密码安全问题

**风险**：用户可能使用弱密码或忘记密码

**缓解措施**：
- 教育用户使用强密码（虽不强求，但提供引导）
- 实现"忘记密码"功能，通过安全问题或邮箱重置
- Session 有效期 30 天，减少频繁登录需求
- 记录登录失败次数，防止暴力破解（5 次失败后锁定 15 分钟）
- 后期可考虑添加双因素认证（2FA）作为可选功能

### Risk 5: 上下文推送打扰用户

**风险**：过度推送可能影响用户体验，导致关闭推送或卸载应用

**缓解措施**：
- 限制自动推送频率（每日最多 1 次）
- 提供推送频率控制设置（每日/每周/手动）
- A/B 测试不同推送策略，观察用户留存率
- 收集用户反馈，持续优化推送时机和内容

## Migration Plan

### 阶段 1：开发环境搭建（Day 1-2）

1. **创建 Supabase 项目**
   - 注册 Supabase 账号，创建新项目
   - 获取 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 配置环境变量到 `.env.local`

2. **数据库初始化**
   - 在 Supabase SQL Editor 运行表结构创建脚本
   - 配置 Row Level Security (RLS) 策略
   - 测试数据库连接和权限

3. **依赖安装**
   ```bash
   pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

### 阶段 2：认证系统实现（Day 3-4）

1. **认证 API Routes**
   - 实现 `POST /api/auth/register`（账号密码注册）
   - 实现 `POST /api/auth/login`（账号密码登录）
   - 实现 `POST /api/auth/reset-password`（密码重置）
   - 编写单元测试（Vitest）

2. **前端认证流程**
   - 创建 `app/hooks/useAuth.ts`
   - 修改 `app/onboarding/page.tsx`：实现注册和登录表单
   - 实现密码重置界面
   - 测试登录/登出流程

### 阶段 3：知识库和档案管理（Day 5-7）

1. **知识库数据结构**
   - 创建 `app/lib/knowledge.ts`
   - 编写备孕期 6 个知识点
   - 编写孕期增强内容（每周要点）
   - 编写产后期 10 个知识点

2. **档案管理 API**
   - 实现 `GET /api/user/profile`
   - 实现 `PUT /api/user/profile`
   - 修改 `app/api/chat/route.ts`：从数据库读取档案

3. **AI Agent 集成**
   - 新增 `getContextualKnowledge` 工具
   - 升级系统提示，增加上下文推送指令
   - 测试 AI 推送逻辑

### 阶段 4：测试和优化（Day 8-9）

1. **认证流程测试**
   - 测试账号密码注册流程
   - 测试账号密码登录流程
   - 测试密码重置流程
   - 测试登录失败限制（5 次锁定）
   - 测试登录状态持久化和刷新

2. **完整流程测试**
   - 测试新用户注册和首次使用流程
   - 测试多设备同步（两个浏览器窗口）
   - 测试知识推送逻辑

3. **UI/UX 优化**
   - 优化引导流程体验
   - 添加加载状态和错误提示
   - 添加加载状态和错误提示
   - 响应式设计适配移动端

### 阶段 5：部署和监控（Day 10）

1. **生产环境部署**
   - 在 Supabase 创建生产项目
   - 配置生产环境变量
   - 运行数据库迁移脚本

2. **监控和日志**
   - 配置 Supabase Dashboard 监控
   - 设置错误告警（如认证失败率 > 10%）
   - 使用 Vercel Analytics 监控页面性能

3. **回滚策略**
   - 数据库备份保存至少 7 天，便于快速恢复
   - 如果 Supabase 服务异常，显示友好提示并暂时禁止新用户注册
   - 已登录用户可继续使用（session 有效期内）

## Open Questions

1. **密码重置方式**：是否通过安全问题或邮箱重置密码？
   - **建议**：MVP 阶段简化为"联系客服重置"，后期添加安全问题或邮箱验证

2. **知识内容更新频率**：是否需要 CMS 后台方便运营人员更新知识？
   - **建议**：观察用户反馈，当知识内容 >100 条时再考虑搭建 CMS

3. **健康记录功能优先级**：胎动计数、体重追踪等功能是否在本次实现？
   - **建议**：本次只实现数据模型，UI 和功能延后到下一迭代

4. **多语言支持**：是否需要支持英文或其他语言？
   - **建议**：专注中文市场，成熟后再考虑国际化

5. **用户反馈收集**：如何收集用户对知识内容和推送频率的反馈？
   - **建议**：在聊天界面添加"点赞/点踩"按钮，收集用户对推送内容的反馈
