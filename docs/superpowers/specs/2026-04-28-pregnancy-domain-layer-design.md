# 孕期全周期领域层重构设计

## Context

当前孕期阶段逻辑分散在 `profile/page.tsx`（周数计算）、`_graph/knowledge.ts`（知识推送）、`_graph/tools.ts`（工具阶段判断）、`_graph/agent.ts`（system prompt 拼接）、`api/chat/route.ts`（重复计算）等多个文件中。相同逻辑重复实现，阶段判断没有统一标准，新增子阶段需要改多处。

本次重构目标：抽取独立的孕期领域层，统一管理阶段判断、日期计算、知识推送策略、健康数据模板、能力/权限控制。现有 `_graph` 架构和页面都变成领域层的消费者。

## 方案：阶段注册表 + 上下文计算器

### 目录结构

```
lib/pregnancy/
├── types.ts              # 核心类型：MainStage, SubStage, StageDefinition, PregnancyContext
├── calculator.ts         # 纯函数：日期/周数计算
├── context.ts            # createContext(profile) → PregnancyContext
├── stages/               # 阶段注册表
│   ├── index.ts          # 导出 stageRegistry: StageDefinition[]
│   ├── preconception.ts  # 备孕期
│   ├── early-pregnancy.ts # 孕早期 (≤12周)
│   ├── mid-pregnancy.ts  # 孕中期 (13-27周)
│   ├── late-pregnancy.ts # 孕晚期 (≥28周)
│   ├── postpartum-recovery.ts # 产后恢复 (0-42天)
│   └── nursing-period.ts # 哺乳期 (43天+)
└── rules/                # 共享规则（被 stages 引用）
    ├── knowledge-rules.ts  # 知识推送规则
    ├── health-templates.ts # 健康数据模板
    └── capabilities.ts     # 能力/工具定义
```

### 核心类型

```typescript
// MainStage 与 _supabase/types.ts 中的 Stage 值域完全一致，
// 数据库仍存 Stage，领域层用 MainStage 作为内部命名以区分 SubStage
type MainStage = 'preconception' | 'pregnancy' | 'postpartum';

type SubStage =
  | 'preconception'
  | 'early-pregnancy'   // ≤12周
  | 'mid-pregnancy'     // 13-27周
  | 'late-pregnancy'    // ≥28周
  | 'recovery'          // 产后0-42天
  | 'nursing';          // 产后43天+

interface StageDefinition {
  id: SubStage;
  mainStage: MainStage;
  label: string;                          // "孕晚期"
  description: string;                    // "孕28周至分娩，重点监测胎动和产检"
  match: (ctx: RawContext) => boolean;     // 判断函数
  knowledge: KnowledgeRule[];
  health: HealthTemplate[];
  capabilities: Capability[];
}

interface RawContext {
  mainStage: MainStage;
  week?: number;
  postpartumDay?: number;
}

interface PregnancyContext {
  mainStage: MainStage;
  subStage: SubStage;
  week?: number;
  postpartumDay?: number;
  stageDef: StageDefinition;
  applicableKnowledge: KnowledgeItem[];
  healthTemplates: HealthTemplate[];
  capabilities: Capability[];
}

// 知识推送规则
interface KnowledgeRule {
  type: 'auto' | 'checklist' | 'on-demand';
  interval?: number;         // auto 类型：每 N 周推送一次
  source?: string;           // 知识来源标识
  items?: string[];          // checklist 类型：具体条目
}

// 健康数据模板
interface HealthTemplate {
  id: string;                // 'fetal-movement' | 'weight' | 'symptom' | ...
  label: string;             // "胎动计数"
  fields: FieldDef[];        // 字段定义
}

interface FieldDef {
  name: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  label: string;
  required: boolean;
  options?: string[];        // select 类型的选项
}

// 能力/工具定义
interface Capability {
  id: string;                // 对应 _graph/tools.ts 中的工具名
  label: string;
  description: string;
}
```

### 子阶段定义

每个阶段文件导出一个 `StageDefinition` 声明式对象：

| 子阶段 | ID | match 条件 | 健康模板 | 能力 |
|--------|------|-----------|---------|------|
| 备孕期 | `preconception` | mainStage === 'preconception' | 叶酸记录、月经周期 | 排卵计算、营养建议 |
| 孕早期 | `early-pregnancy` | pregnancy && week ≤ 12 | 症状记录、体重 | 发育信息、食品安全、症状评估 |
| 孕中期 | `mid-pregnancy` | pregnancy && week 13-27 | 体重、症状记录 | 发育信息、产检计划、食品安全 |
| 孕晚期 | `late-pregnancy` | pregnancy && week ≥ 28 | 胎动计数、体重、症状 | 全部工具 |
| 产后恢复 | `recovery` | postpartum && day 0-42 | 恶露、伤口、哺乳 | 恢复指导、新生儿护理 |
| 哺乳期 | `nursing` | postpartum && day ≥ 43 | 哺乳记录、宝宝发育 | 喂养指导、疫苗计划、发育里程碑 |

### createContext() 流程

```
Profile (stage, due_date, postpartum_date)
  → calculator: 计算 week / postpartumDay
  → stages.match(): 遍历 stageRegistry，用 match() 找到匹配阶段
  → 组装 PregnancyContext（含阶段定义、知识、健康模板、能力）
```

### 消费方改造

**改造文件：**

| 文件 | 改动量 | 内容 |
|------|--------|------|
| `app/profile/page.tsx` | 中 | 删除 calculateCurrentWeek/calculatePostpartumDays，改用 createContext() |
| `app/api/chat/route.ts` | 中 | 删除内联周数计算，改用 createContext() |
| `app/_graph/agent.ts` | 较大 | 用 ctx.stageDef.capabilities 动态选择工具，不再手动拼接阶段描述 |
| `app/_graph/tools.ts` | 中 | 删除内嵌阶段判断，变成无状态纯函数 |
| `app/_graph/knowledge.ts` | 重构 | 推送逻辑迁到 rules/knowledge-rules.ts，本文件变成纯数据源 |
| `app/onboarding/page.tsx` | 小 | 阶段选项从 stageRegistry 动态生成 |

**不改动：** `app/_graph/graph.ts`、`app/_supabase/types.ts`、`components/ai-elements/*`

### 测试策略

领域层是纯函数 + 声明式配置，测试策略：

1. **calculator.ts** — 输入各种日期组合（预产期、生产日期、边界值），验证 week/postpartumDay 计算正确
2. **每个 StageDefinition 的 match()** — 构造 RawContext，验证各阶段匹配正确、互斥
3. **createContext()** — 端到端测试，给定 Profile 验证返回完整的 PregnancyContext
4. **现有消费方** — 改造后行为不变（回归测试）

### 验证方式

1. `npm run build` 编译通过
2. 领域层单元测试全部通过
3. 现有功能（聊天、profile、onboarding）行为不变
