export interface CheckItem {
  week: string;
  name: string;
  description: string;
}

export const prenatalSchedule: CheckItem[] = [
  {
    week: "6-8",
    name: "建档检查",
    description: "确认妊娠，建立孕期档案，血常规、尿常规、传染病筛查",
  },
  {
    week: "11-13",
    name: "NT检查",
    description: "颈后透明层超声检查，评估染色体异常风险",
  },
  {
    week: "15-20",
    name: "唐氏筛查",
    description: "评估胎儿唐氏综合症及神经管缺陷风险",
  },
  {
    week: "20-24",
    name: "大排畸（系统超声）",
    description: "详细筛查胎儿器官结构发育情况",
  },
  {
    week: "24-28",
    name: "糖耐量检查（OGTT）",
    description: "筛查妊娠期糖尿病",
  },
  {
    week: "28-32",
    name: "胎儿生长发育评估",
    description: "超声检查胎儿生长发育，胎位检查",
  },
  {
    week: "32-36",
    name: "胎心监护开始",
    description: "定期胎心监护，评估胎儿宫内状态",
  },
  {
    week: "36-40",
    name: "每周产检",
    description: "宫颈检查，胎位确认，评估分娩方式",
  },
  { week: "40+", name: "过期评估", description: "超过预产期需评估引产时机" },
];
