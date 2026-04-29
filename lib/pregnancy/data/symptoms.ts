export type SymptomLevel = "🟢正常" | "🟡观察" | "🟠就医" | "🔴急诊";

export interface SymptomRule {
  keywords: string[];
  level: SymptomLevel;
  advice: string;
}

export const symptomRules: SymptomRule[] = [
  {
    keywords: [
      "大量出血",
      "严重腹痛",
      "破水",
      "抽搐",
      "昏迷",
      "剧烈头痛视物模糊",
    ],
    level: "🔴急诊",
    advice: "请立即拨打120或前往急诊，这是孕期紧急情况，不可延误",
  },
  {
    keywords: [
      "出血",
      "规律宫缩",
      "胎动减少",
      "持续头痛",
      "水肿加重",
      "发烧",
      "高烧",
    ],
    level: "🟠就医",
    advice: "建议24-48小时内就医，请联系您的产科医生",
  },
  {
    keywords: [
      "偶尔腹胀",
      "轻微水肿",
      "腰酸",
      "失眠",
      "便秘",
      "胃灼热",
      "轻微头晕",
    ],
    level: "🟡观察",
    advice: "这是常见的孕期不适，注意观察。如症状持续加重，请就医",
  },
  {
    keywords: [
      "孕吐",
      "恶心",
      "疲劳",
      "尿频",
      "乳房胀痛",
      "妊娠纹",
      "轻微腹胀",
    ],
    level: "🟢正常",
    advice: "这是正常的孕期反应，注意休息，保持营养均衡",
  },
];
