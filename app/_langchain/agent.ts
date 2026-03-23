import {
  createAgent,
  createMiddleware,
  tool,
  ToolMessage,
} from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { getKnowledgeForStage, searchKnowledgeByKeyword, type Stage } from "@/app/lib/knowledge";

// ─── Context Schema ───────────────────────────────────────────────────────────

const contextSchema = z.object({
  role: z.enum(["mom", "dad"]).optional(),
  stage: z.enum(["preconception", "pregnancy", "postpartum"]),
  due_date: z.string().optional(), // YYYY-MM-DD
  postpartum_date: z.string().optional(), // YYYY-MM-DD
  current_week: z.number().optional(),
  postpartum_days: z.number().optional(),
});

// ─── System Prompt ────────────────────────────────────────────────────────────

const systemPrompt = `你是一个专业、温暖的全流程孕期助手。
{role_intro}

**当前阶段**: {stage}
{stage_intro}

你可以使用以下工具帮助用户：
- calculate_pregnancy_info：根据预产期计算当前孕周、孕期阶段和距预产期天数
- get_weekly_development：获取指定孕周的胎儿发育信息
- check_food_safety：查询食物在孕期的安全等级
- get_prenatal_schedule：获取产检时间表
- assess_symptom：评估孕期症状的紧急程度
- get_contextual_knowledge：获取当前阶段相关的专业知识

**上下文推送指南:**
- 备孕期：主动推送备孕知识，如叶酸补充、孕前检查、排卵追踪
- 孕期：根据孕周主动推送发育信息、产检提醒、注意事项
- 产后期：根据产后天数推送恢复知识、母乳喂养、新生儿护理

**推送原则:**
1. 每次对话最多主动推送 1 条相关知识
2. 自然地将知识融入对话中，不要机械罗列
3. 涉及关键时间点（如产检前）优先提醒
4. 所有知识末尾自动添加医学免责声明

请用关怀温和的语气回答，涉及健康建议时始终提醒用户以医生意见为准。`;

// ─── Tool: calculatePregnancyInfo ─────────────────────────────────────────────

export const calculatePregnancyInfo = tool(
  ({ due_date }: { due_date: string }) => {
    const now = new Date();
    const due = new Date(due_date);
    // Full-term pregnancy is 40 weeks = 280 days
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.round((due.getTime() - now.getTime()) / msPerDay);
    const daysPregnant = 280 - daysRemaining;
    const currentWeek = Math.max(1, Math.min(42, Math.ceil(daysPregnant / 7)));

    let stage: string;
    if (currentWeek <= 13) stage = "孕早期";
    else if (currentWeek <= 27) stage = "孕中期";
    else stage = "孕晚期";

    return JSON.stringify({
      currentWeek,
      stage,
      daysRemaining: Math.max(0, daysRemaining),
    });
  },
  {
    name: "calculate_pregnancy_info",
    description: "根据预产期计算当前孕周、孕期阶段（孕早期/孕中期/孕晚期）和距预产期剩余天数",
    schema: z.object({
      due_date: z.string().describe("预产期，格式 YYYY-MM-DD"),
    }),
  },
);

// ─── Tool: getWeeklyDevelopment ───────────────────────────────────────────────

const weeklyData: Record<number, { mom: string; dad: string }> = {
  14: {
    mom: "孕14周：宝宝身长约8.7cm，已能做出吸吮动作。您可能感到早孕反应减轻，食欲逐渐恢复。",
    dad: "孕14周：宝宝已进入孕中期，早孕最难受的阶段结束了。伴侣食欲恢复，可以多准备营养均衡的食物。",
  },
  16: {
    mom: "孕16周：宝宝约11cm，开始出现细腻的头发。您的肚子开始明显隆起，可能感受到最初的胎动。",
    dad: "孕16周：伴侣可能开始感受到第一次胎动，陪她一起感受这个神奇时刻很重要。",
  },
  20: {
    mom: "孕20周：宝宝约16.5cm，听觉已发育，可以听到您的声音。建议做详细的大排畸检查（20-24周）。",
    dad: "孕20周：大排畸检查是重要里程碑，尽量陪伴参加。宝宝能听到声音了，可以多跟宝宝说话。",
  },
  24: {
    mom: "孕24周：宝宝约30cm，肺部开始发育。注意做糖耐量检查，预防妊娠期糖尿病。",
    dad: "孕24周：这周伴侣需要做糖耐量检查，记得提醒和陪同。开始准备宝宝用品的清单。",
  },
  28: {
    mom: "孕28周：进入孕晚期，宝宝约36cm。开始每两周产检一次，注意胎动计数，每天早中晚各数1小时。",
    dad: "孕28周：进入孕晚期，伴侣行动渐渐不便，主动承担家务。了解胎动计数方法以备不时之需。",
  },
  32: {
    mom: "孕32周：宝宝约42cm，已基本成形。可能出现假性宫缩，如规律宫缩请及时就医。",
    dad: "孕32周：开始准备待产包和医院联系方式。了解分娩信号，随时准备送伴侣去医院。",
  },
  36: {
    mom: "孕36周：宝宝约47cm，进入待产准备阶段。每周一次产检，注意胎位、宫颈情况。",
    dad: "孕36周：待产包应准备齐全，医院路线已确认。伴侣需要更多的心理支持和陪伴。",
  },
  38: {
    mom: "孕38周：足月宝宝！宝宝随时可能出生。出现规律宫缩、破水、见红请立即就医。",
    dad: "孕38周：随时待命！规律宫缩（每5-10分钟一次）、破水或大量见红，立刻送医院。",
  },
  40: {
    mom: "孕40周：预产期到啦！每个宝宝都有自己的节奏，前后两周内分娩都属正常。保持放松。",
    dad: "孕40周：预产期已到，保持手机畅通，随时准备出发。给伴侣更多的鼓励和陪伴。",
  },
};

export const getWeeklyDevelopment = tool(
  ({ week, role }: { week: number; role: "mom" | "dad" }) => {
    // Find the closest week in our data
    const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
    const closest = availableWeeks.reduce((prev, curr) =>
      Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev,
    );
    const data = weeklyData[closest];
    return data[role] + `\n\n【以上为孕${closest}周参考信息，以医生检查结果为准】`;
  },
  {
    name: "get_weekly_development",
    description: "获取指定孕周的胎儿发育和孕期变化信息，根据用户角色（准妈妈/准爸爸）返回不同视角的内容",
    schema: z.object({
      week: z.number().describe("当前孕周（1-42）"),
      role: z.enum(["mom", "dad"]).describe("用户角色"),
    }),
  },
);

// ─── Tool: checkFoodSafety ────────────────────────────────────────────────────

type SafetyLevel = "安全" | "适量" | "避免" | "禁止";
const foodDatabase: Record<string, { level: SafetyLevel; reason: string }> = {
  苹果: { level: "安全", reason: "富含维生素C和膳食纤维，适合孕期食用" },
  香蕉: { level: "安全", reason: "富含钾和B族维生素，有助于缓解孕吐" },
  牛奶: { level: "安全", reason: "优质钙质来源，孕期每天建议300-500ml" },
  鸡蛋: { level: "安全", reason: "优质蛋白质和DHA来源，全熟食用" },
  三文鱼: { level: "安全", reason: "富含DHA，有益胎儿大脑发育，注意选择低汞鱼类" },
  菠菜: { level: "安全", reason: "富含叶酸和铁，孕期极佳的蔬菜选择" },
  西兰花: { level: "安全", reason: "富含叶酸、维生素C和钙，孕期推荐食用" },
  豆腐: { level: "安全", reason: "优质植物蛋白和钙质来源" },
  坚果: { level: "适量", reason: "富含不饱和脂肪酸，但热量高，每天一小把即可" },
  西瓜: { level: "适量", reason: "补水利尿，但含糖量高，血糖正常者可适量食用" },
  葡萄: { level: "适量", reason: "含有白藜芦醇，适量食用，避免过多摄入糖分" },
  榴莲: { level: "适量", reason: "高糖高热量，妊娠期糖尿病患者应避免，普通孕妇少量可以" },
  螃蟹: { level: "避免", reason: "性寒，可能引起子宫收缩，有流产风险，孕早期尤其不建议" },
  螺蛳: { level: "避免", reason: "性寒且易携带寄生虫，孕期建议避免" },
  生鱼片: { level: "避免", reason: "生食存在寄生虫和细菌风险，孕期建议避免" },
  生蚝: { level: "避免", reason: "生食贝类存在感染李斯特菌风险，孕期避免" },
  薏仁: { level: "避免", reason: "中医认为有促进子宫收缩作用，孕期建议避免" },
  酒精: { level: "禁止", reason: "酒精可穿过胎盘导致胎儿酒精综合症，孕期完全禁止" },
  生肉: { level: "禁止", reason: "可能含有弓形虫、沙门氏菌等，危及胎儿健康" },
  未经巴氏消毒的奶酪: { level: "禁止", reason: "可能含有李斯特菌，对孕妇和胎儿危险" },
  咖啡因: { level: "适量", reason: "每天摄入不超过200mg（约一杯咖啡），过量增加流产风险" },
};

export const checkFoodSafety = tool(
  ({ food_name }: { food_name: string }) => {
    const result = foodDatabase[food_name];
    if (!result) {
      return JSON.stringify({
        food: food_name,
        level: "未知",
        reason: "该食物暂无孕期安全数据，建议咨询医生或营养师后再决定是否食用。",
        disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
      });
    }
    return JSON.stringify({
      food: food_name,
      level: result.level,
      reason: result.reason,
      disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
    });
  },
  {
    name: "check_food_safety",
    description: "查询食物在孕期的安全等级：安全/适量/避免/禁止",
    schema: z.object({
      food_name: z.string().describe("要查询的食物名称"),
    }),
  },
);

// ─── Tool: getPrenatalSchedule ────────────────────────────────────────────────

interface CheckItem {
  week: string;
  name: string;
  description: string;
}

const prenatalSchedule: CheckItem[] = [
  { week: "6-8", name: "建档检查", description: "确认妊娠，建立孕期档案，血常规、尿常规、传染病筛查" },
  { week: "11-13", name: "NT检查", description: "颈后透明层超声检查，评估染色体异常风险" },
  { week: "15-20", name: "唐氏筛查", description: "评估胎儿唐氏综合症及神经管缺陷风险" },
  { week: "20-24", name: "大排畸（系统超声）", description: "详细筛查胎儿器官结构发育情况" },
  { week: "24-28", name: "糖耐量检查（OGTT）", description: "筛查妊娠期糖尿病" },
  { week: "28-32", name: "胎儿生长发育评估", description: "超声检查胎儿生长发育，胎位检查" },
  { week: "32-36", name: "胎心监护开始", description: "定期胎心监护，评估胎儿宫内状态" },
  { week: "36-40", name: "每周产检", description: "宫颈检查，胎位确认，评估分娩方式" },
  { week: "40+", name: "过期评估", description: "超过预产期需评估引产时机" },
];

export const getPrenatalSchedule = tool(
  ({ current_week }: { current_week: number }) => {
    const parseWeekRange = (range: string): [number, number] => {
      if (range.endsWith("+")) {
        const w = parseInt(range);
        return [w, 99];
      }
      const parts = range.split("-").map(Number);
      return [parts[0], parts[1]];
    };

    const completed: CheckItem[] = [];
    const upcoming: CheckItem[] = [];
    let next: CheckItem | null = null;

    for (const item of prenatalSchedule) {
      const [start, end] = parseWeekRange(item.week);
      if (current_week > end) {
        completed.push(item);
      } else {
        upcoming.push(item);
        if (!next && current_week >= start - 4) {
          next = item;
        }
      }
    }

    return JSON.stringify({
      currentWeek: current_week,
      completed,
      upcoming,
      next,
      disclaimer: "以上产检时间表仅供参考，具体安排请遵医嘱",
    });
  },
  {
    name: "get_prenatal_schedule",
    description: "获取产检时间表，根据当前孕周返回已完成、待完成和即将进行的产检项目",
    schema: z.object({
      current_week: z.number().describe("当前孕周"),
    }),
  },
);

// ─── Tool: assessSymptom ──────────────────────────────────────────────────────

type SymptomLevel = "🟢正常" | "🟡观察" | "🟠就医" | "🔴急诊";

interface SymptomRule {
  keywords: string[];
  level: SymptomLevel;
  advice: string;
}

const symptomRules: SymptomRule[] = [
  // Emergency
  {
    keywords: ["大量出血", "严重腹痛", "破水", "抽搐", "昏迷", "剧烈头痛视物模糊"],
    level: "🔴急诊",
    advice: "请立即拨打120或前往急诊，这是孕期紧急情况，不可延误",
  },
  // Visit doctor
  {
    keywords: ["出血", "规律宫缩", "胎动减少", "持续头痛", "水肿加重", "发烧", "高烧"],
    level: "🟠就医",
    advice: "建议24-48小时内就医，请联系您的产科医生",
  },
  // Watch
  {
    keywords: ["偶尔腹胀", "轻微水肿", "腰酸", "失眠", "便秘", "胃灼热", "轻微头晕"],
    level: "🟡观察",
    advice: "这是常见的孕期不适，注意观察。如症状持续加重，请就医",
  },
  // Normal
  {
    keywords: ["孕吐", "恶心", "疲劳", "尿频", "乳房胀痛", "妊娠纹", "轻微腹胀"],
    level: "🟢正常",
    advice: "这是正常的孕期反应，注意休息，保持营养均衡",
  },
];

export const assessSymptom = tool(
  ({ symptom }: { symptom: string; current_week?: number }) => {
    // Find matching rule (宁严勿松: iterate from highest risk to lowest)
    let matched: SymptomRule | null = null;
    for (const rule of symptomRules) {
      if (rule.keywords.some((kw) => symptom.includes(kw))) {
        matched = rule;
        break;
      }
    }

    if (!matched) {
      // Default to 🟡观察 when uncertain (宁严勿松 principle)
      matched = {
        keywords: [],
        level: "🟡观察",
        advice: "该症状暂无明确参考，建议记录症状并在下次产检时告知医生，如有加重请及时就医",
      };
    }

    return JSON.stringify({
      symptom,
      level: matched.level,
      advice: matched.advice,
      disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
    });
  },
  {
    name: "assess_symptom",
    description: "评估孕期症状的紧急程度，分四级：🟢正常/🟡观察/🟠就医/🔴急诊。采用宁严勿松原则",
    schema: z.object({
      symptom: z.string().describe("症状描述"),
      current_week: z.number().optional().describe("当前孕周（可选）"),
    }),
  },
);

// ─── Tool: getContextualKnowledge ───────────────────────────────────────────────

export const getContextualKnowledge = tool(
  ({
    stage,
    week,
    postpartumDay,
    keyword
  }: {
    stage: Stage;
    week?: number;
    postpartumDay?: number;
    keyword?: string;
  }) => {
    try {
      let knowledgeItems;

      if (keyword) {
        // 按关键词搜索
        knowledgeItems = searchKnowledgeByKeyword(keyword);
      } else {
        // 根据阶段、孕周、产后天数获取知识
        knowledgeItems = getKnowledgeForStage(stage, week, postpartumDay);
      }

      // 将知识项转换为易读的文本格式
      if (knowledgeItems.length === 0) {
        return JSON.stringify({
          message: "暂无相关知识",
          disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
        });
      }

      const formattedKnowledge = knowledgeItems.map((item) => ({
        title: item.title,
        content: item.content.split("\n").slice(0, 3).join("\n"), // 只返回前3行,避免内容过长
      }));

      return JSON.stringify({
        knowledge: formattedKnowledge,
        count: knowledgeItems.length,
        disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
      });
    } catch (error) {
      return JSON.stringify({
        error: "获取知识失败",
        message: error instanceof Error ? error.message : "未知错误",
        disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
      });
    }
  },
  {
    name: "get_contextual_knowledge",
    description: `获取当前阶段相关的专业知识，用于智能推送。

使用场景：
1. 用户首次进入某阶段时推送核心知识
2. 孕周变更时推送该周发育信息
3. 产检前推送准备知识
4. 用户询问特定话题时推送相关知识

返回格式包含知识标题、内容和免责声明。`,
    schema: z.object({
      stage: z.enum(["preconception", "pregnancy", "postpartum"]).describe("用户当前阶段"),
      week: z.number().optional().describe("当前孕周（仅孕期需要）"),
      postpartumDay: z.number().optional().describe("产后天数（仅产后期需要）"),
      keyword: z.string().optional().describe("搜索关键词（可选）"),
    }),
  },
);

// ─── Model ────────────────────────────────────────────────────────────────────

const glmModel = new ChatOpenAI({
  model: process.env.GLM_MODEL ?? "",
  apiKey: process.env.GLM_API_KEY ?? "",
  temperature: 0,
  configuration: {
    baseURL: process.env.GLM_BASE_URL ?? "",
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

export const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `直接返回该错误信息："Tool error: Please check your input and try again. (${error})"`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

// ─── Agent ────────────────────────────────────────────────────────────────────

const checkpointer = new MemorySaver();

const langchainAgent = createAgent({
  model: glmModel,
  systemPrompt,
  tools: [
    calculatePregnancyInfo,
    getWeeklyDevelopment,
    checkFoodSafety,
    getPrenatalSchedule,
    assessSymptom,
    getContextualKnowledge,
  ],
  checkpointer,
  middleware: [handleToolErrors],
  contextSchema,
});

export {
  langchainAgent,
  contextSchema,
};
