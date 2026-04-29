import { tool } from "langchain";
import * as z from "zod";
import type { MainStage } from "@/lib/pregnancy/types";
import { calculatePregnancyInfo as calcPregnancyInfo } from "@/lib/pregnancy/calculator";
import {
  searchKnowledgeByKeyword,
  knowledgeBase,
} from "@/lib/pregnancy/data/knowledge";
import type { KnowledgeItem } from "@/lib/pregnancy/data/knowledge";
import { foodDatabase } from "@/lib/pregnancy/data/food-safety";
import { symptomRules } from "@/lib/pregnancy/data/symptoms";
import { prenatalSchedule } from "@/lib/pregnancy/data/prenatal-schedule";
import { weeklyData } from "@/lib/pregnancy/data/weekly-dev";

// ─── Tool: calculatePregnancyInfo ─────────────────────────────────────────────

export const calculatePregnancyInfo = tool(
  ({ due_date }: { due_date: string }) => {
    const { currentWeek, stage, daysRemaining } = calcPregnancyInfo(due_date);
    return JSON.stringify({ currentWeek, stage, daysRemaining });
  },
  {
    name: "calculate_pregnancy_info",
    description:
      "根据预产期计算当前孕周、孕期阶段（孕早期/孕中期/孕晚期）和距预产期剩余天数",
    schema: z.object({
      due_date: z.string().describe("预产期，格式 YYYY-MM-DD"),
    }),
  },
);

// ─── Tool: getWeeklyDevelopment ───────────────────────────────────────────────

export const getWeeklyDevelopment = tool(
  ({ week, role }: { week: number; role: "mom" | "dad" }) => {
    const availableWeeks = Object.keys(weeklyData)
      .map(Number)
      .sort((a, b) => a - b);
    const closest = availableWeeks.reduce((prev, curr) =>
      Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev,
    );
    const data = weeklyData[closest];
    return (
      data[role] + `\n\n【以上为孕${closest}周参考信息，以医生检查结果为准】`
    );
  },
  {
    name: "get_weekly_development",
    description:
      "获取指定孕周的胎儿发育和孕期变化信息，根据用户角色（准妈妈/准爸爸）返回不同视角的内容",
    schema: z.object({
      week: z.number().describe("当前孕周（1-42）"),
      role: z.enum(["mom", "dad"]).describe("用户角色"),
    }),
  },
);

// ─── Tool: checkFoodSafety ────────────────────────────────────────────────────

export const checkFoodSafety = tool(
  ({ food_name }: { food_name: string }) => {
    const result = foodDatabase[food_name];
    if (!result) {
      return JSON.stringify({
        food: food_name,
        level: "未知",
        reason:
          "该食物暂无孕期安全数据，建议咨询医生或营养师后再决定是否食用。",
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

    const completed: typeof prenatalSchedule = [];
    const upcoming: typeof prenatalSchedule = [];
    let next: (typeof prenatalSchedule)[number] | null = null;

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
    description:
      "获取产检时间表，根据当前孕周返回已完成、待完成和即将进行的产检项目",
    schema: z.object({
      current_week: z.number().describe("当前孕周"),
    }),
  },
);

// ─── Tool: assessSymptom ──────────────────────────────────────────────────────

export const assessSymptom = tool(
  ({ symptom }: { symptom: string; current_week?: number }) => {
    let matched: (typeof symptomRules)[number] | null = null;
    for (const rule of symptomRules) {
      if (rule.keywords.some((kw) => symptom.includes(kw))) {
        matched = rule;
        break;
      }
    }

    if (!matched) {
      matched = {
        keywords: [],
        level: "🟡观察",
        advice:
          "该症状暂无明确参考，建议记录症状并在下次产检时告知医生，如有加重请及时就医",
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
    description:
      "评估孕期症状的紧急程度，分四级：🟢正常/🟡观察/🟠就医/🔴急诊。采用宁严勿松原则",
    schema: z.object({
      symptom: z.string().describe("症状描述"),
      current_week: z.number().optional().describe("当前孕周（可选）"),
    }),
  },
);

// ─── Tool: getContextualKnowledge ───────────────────────────────────────────────

function getKnowledgeForStage(
  stage: MainStage,
  week?: number,
  postpartumDay?: number
): KnowledgeItem[] {
  const result: KnowledgeItem[] = [];
  const { preconception, pregnancy, postpartum } = knowledgeBase;

  if (stage === 'preconception') {
    return preconception.filter((k) => k.autoPush);
  }

  if (stage === 'pregnancy' && week) {
    const weekKnowledge = pregnancy[week];
    if (weekKnowledge) {
      result.push(weekKnowledge);
    }
  }

  if (stage === 'postpartum' && postpartumDay) {
    const relevant = postpartum.filter(
      (k) => k.postpartumDay && k.postpartumDay <= postpartumDay && k.autoPush
    );
    result.push(
      ...relevant
        .sort((a, b) => (b.postpartumDay || 0) - (a.postpartumDay || 0))
        .slice(0, 3)
    );
  }

  return result;
}

export const getContextualKnowledge = tool(
  ({
    stage,
    week,
    postpartumDay,
    keyword,
  }: {
    stage: MainStage;
    week?: number;
    postpartumDay?: number;
    keyword?: string;
  }) => {
    try {
      let knowledgeItems;

      if (keyword) {
        knowledgeItems = searchKnowledgeByKeyword(keyword);
      } else {
        knowledgeItems = getKnowledgeForStage(stage, week, postpartumDay);
      }

      if (knowledgeItems.length === 0) {
        return JSON.stringify({
          message: "暂无相关知识",
          disclaimer: "以上仅供参考，不构成医疗诊断，请以医生意见为准",
        });
      }

      const formattedKnowledge = knowledgeItems.map((item) => ({
        title: item.title,
        content: item.content.split("\n").slice(0, 3).join("\n"),
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
      stage: z
        .enum(["preconception", "pregnancy", "postpartum"])
        .describe("用户当前阶段"),
      week: z.number().optional().describe("当前孕周（仅孕期需要）"),
      postpartumDay: z.number().optional().describe("产后天数（仅产后期需要）"),
      keyword: z.string().optional().describe("搜索关键词（可选）"),
    }),
  },
);
