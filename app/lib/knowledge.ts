/**
 * 知识库数据结构
 *
 * 包含备孕期、孕期、产后期的健康知识
 * 所有医疗建议仅供参考,不构成专业医疗诊断
 */

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export type Stage = 'preconception' | 'pregnancy' | 'postpartum';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  stage: Stage;
  week?: number;           // 孕期专属: 孕周 (1-42)
  postpartumDay?: number;  // 产后专属: 产后天数 (1-42)
  tags: string[];
  autoPush?: boolean;      // 是否自动推送
}

// ─── 备孕期知识 (6个知识点) ───────────────────────────────────────────────────

export const preconceptionKnowledge: KnowledgeItem[] = [
  {
    id: 'pre-1',
    title: '叶酸补充',
    content: `**叶酸补充的重要性**

孕前3个月开始补充叶酸,可以有效预防胎儿神经管畸形。

**建议:**
- 每日补充400-800微克叶酸
- 选择含叶酸的复合维生素
- 持续补充至孕早期结束

**富含叶酸的食物:**
- 深绿色蔬菜(菠菜、西兰花)
- 豆类(黄豆、扁豆)
- 动物肝脏(适量)
- 全谷物

*以上仅供参考,具体剂量请咨询医生*`,
    stage: 'preconception',
    tags: ['营养', '维生素', '预防畸形'],
    autoPush: true,
  },
  {
    id: 'pre-2',
    title: '孕前检查',
    content: `**孕前检查项目清单**

建议在孕前3-6个月进行全面的孕前检查。

**必做项目:**
- 血常规、尿常规
- 肝功能、肾功能
- 甲状腺功能
- 性激素六项
- TORCH检查(风疹、巨细胞等)
- 口腔检查
- 遗传咨询(如有家族史)

**重要提醒:**
- 接种风疹疫苗(需避孕3个月)
- 治疗慢性疾病(高血压、糖尿病等)
- 停用可能致畸的药物

*以上仅供参考,请以医生意见为准*`,
    stage: 'preconception',
    tags: ['检查', '健康评估', '预防'],
    autoPush: true,
  },
  {
    id: 'pre-3',
    title: '排卵期计算',
    content: `**如何准确计算排卵期**

掌握排卵期可以提高受孕几率。

**计算方法:**

1. **日历法**
   -月经周期规律者:排卵日=下次月经前14天
   -例如:周期30天,本次月经第1天,下次月经预计第31天
   -排卵日=31-14=第17天

2. **基础体温法**
   -每天早晨醒来未活动前测量体温
   -排卵后体温会升高0.3-0.5℃
   -持续高温提示已排卵

3. **排卵试纸**
   -月经前第14天开始测试
   -出现强阳性预示24-48小时内排卵

4. **宫颈黏液法**
   -排卵期宫颈黏液增多、透明、可拉丝

**最佳受孕时间:**
排卵前2天至排卵后24小时

*以上仅供参考,如长期未孕建议就医*`,
    stage: 'preconception',
    tags: ['排卵', '受孕', '周期计算'],
    autoPush: true,
  },
  {
    id: 'pre-4',
    title: '生活方式调整',
    content: `**孕前生活方式调整**

健康的生活习惯有助于提高受孕几率和胎儿健康。

**立即停止:**
- 吸烟(包括二手烟)
- 酗酒
- 熬夜、过度劳累
- 高强度运动(适度运动可继续)

**建议养成:**
- 规律作息(每天7-8小时睡眠)
- 适量运动(每周3-5次,每次30分钟)
- 保持健康体重(BMI 18.5-24)
- 减少咖啡因摄入(每天<200mg)

**环境因素:**
- 避免接触有害物质(农药、化学试剂)
- 减少辐射暴露
- 避免高温环境(如桑拿、热水澡)

*以上仅供参考,请以医生意见为准*`,
    stage: 'preconception',
    tags: ['生活方式', '健康', '环境'],
    autoPush: false,
  },
  {
    id: 'pre-5',
    title: '营养准备',
    content: `**孕前营养准备**

良好的营养状态为孕期打下基础。

**重点营养素:**

1. **叶酸** (400-800μg/天)
   - 预防神经管畸形

2. **铁** (15mg/天)
   - 预防孕期贫血
   - 来源:红肉、动物血、菠菜

3. **碘** (150μg/天)
   - 促进胎儿大脑发育
   - 来源:海带、紫菜、碘盐

4. **钙** (800mg/天)
   - 维持骨骼健康
   - 来源:牛奶、豆制品、深绿色蔬菜

5. **优质蛋白质**
   - 鸡蛋、鱼肉、瘦肉、豆类

**饮食原则:**
- 食物多样,均衡摄入
- 三餐规律,不暴饮暴食
- 适当增加水果蔬菜

*以上仅供参考,具体需求请咨询营养师*`,
    stage: 'preconception',
    tags: ['营养', '饮食', '维生素'],
    autoPush: false,
  },
  {
    id: 'pre-6',
    title: '情绪管理',
    content: `**孕前情绪管理**

良好的心理状态有助于受孕和孕期健康。

**减压方法:**

1. **运动减压**
   - 瑜伽、散步、游泳
   - 每周3-5次,每次30分钟

2. **兴趣活动**
   - 阅读、听音乐、绘画
   - 避免过度疲劳

3. **社交支持**
   - 与伴侣充分沟通
   - 分享担忧和期待
   - 寻求家人朋友的理解支持

4. **专业帮助**
   - 如感到持续焦虑、抑郁
   - 及时寻求心理咨询

**夫妻关系:**
- 共同学习孕期知识
- 讨论育儿观念
- 享受二人世界时光

*以上仅供参考,如有心理困扰请及时寻求专业帮助*`,
    stage: 'preconception',
    tags: ['情绪', '心理健康', '夫妻关系'],
    autoPush: false,
  },
];

// ─── 孕期知识 (每周要点) ───────────────────────────────────────────────────────

// 辅助函数:生成孕期每周知识
function generateWeeklyKnowledge(week: number): KnowledgeItem {
  const getWeekInfo = (w: number) => {
    if (w <= 12) return { stage: '孕早期', focus: '器官发育', key: '叶酸、休息、防畸形' };
    if (w <= 27) return { stage: '孕中期', focus: '快速生长', key: '营养、运动、产检' };
    return { stage: '孕晚期', focus: '体重增长', key: '准备分娩、数胎动' };
  };

  const info = getWeekInfo(week);

  let development = '';
  let tips = '';

  // 根据孕周生成特定内容
  if (week === 5) {
    development = '心脏开始跳动,神经管闭合';
    tips = '继续补充叶酸,避免接触有害物质';
  } else if (week === 8) {
    development = '胚胎初具人形,器官开始发育';
    tips = '可能感到早孕反应,少食多餐';
  } else if (week === 12) {
    development = '胎儿约9cm,外生殖器发育可辨性别';
    tips = '早孕期结束,NT检查时间(11-13周)';
  } else if (week === 16) {
    development = '胎儿约15cm,开始有胎动';
    tips = '感受初次胎动,开始穿孕妇装';
  } else if (week === 20) {
    development = '胎儿约25cm,听觉发育,可听到声音';
    tips = '大排畸检查时间(20-24周),可以和宝宝说话';
  } else if (week === 24) {
    development = '胎儿约30cm,肺部发育';
    tips = '糖耐量检查时间,注意预防妊娠糖尿病';
  } else if (week === 28) {
    development = '胎儿约36cm,进入孕晚期';
    tips = '开始每两周产检,学习数胎动';
  } else if (week === 32) {
    development = '胎儿约42cm,基本成形';
    tips = '可能出现假性宫缩,准备待产包';
  } else if (week === 36) {
    development = '胎儿约47cm,头位入盆准备分娩';
    tips = '每周产检,注意胎动和宫缩';
  } else if (week === 40) {
    development = '足月宝宝,随时准备出生';
    tips = '注意临产征兆:规律宫缩、破水、见红';
  } else {
    development = `${info.stage}:胎儿持续${info.focus},各项功能逐步完善`;
    tips = `${info.key},保持定期产检`;
  }

  return {
    id: `preg-w${week}`,
    title: `孕${week}周: ${info.stage}`,
    content: `**孕${week}周发育情况**

**胎儿发育:**
${development}

**本周重点:**
${tips}

**温馨提示:**
- 保持均衡营养,适量运动
- 感受胎动,与宝宝建立连接
- 记录身体变化,及时与医生沟通
- 保持心情愉快,充分休息

*以上仅供参考,请以医生意见为准*`,
    stage: 'pregnancy',
    week,
    tags: [info.stage, '发育', '产检'],
    autoPush: week % 4 === 0, // 每4周自动推送一次
  };
}

// 生成1-42周的知识
export const pregnancyKnowledge: Record<number, KnowledgeItem> = {};
for (let i = 1; i <= 42; i++) {
  pregnancyKnowledge[i] = generateWeeklyKnowledge(i);
}

// ─── 产后期知识 (10个知识点) ──────────────────────────────────────────────────

export const postpartumKnowledge: KnowledgeItem[] = [
  {
    id: 'post-1',
    title: '产后42天恢复',
    content: `**产后恢复关键期**

产后42天是身体恢复的重要时期。

**恶露观察:**
- 血性恶露(1-3天):鲜红色
- 浆液性恶露(4-10天):淡粉色
- 白色恶露(10天-3周):黄白色
- 如恶露增多、有异味、发热,及时就医

**伤口护理:**
- 顺产伤口:每日清洗,保持干燥
- 剖宫产伤口:避免沾水,按时换药
- 如伤口红肿、渗液、疼痛加重,及时就医

**产后复查(42天):**
检查项目:
- 子宫恢复情况
- 伤口愈合情况
- 盆底肌功能
- 血常规、血压

*以上仅供参考,请以医生意见为准*`,
    stage: 'postpartum',
    postpartumDay: 42,
    tags: ['恢复', '复查', '恶露'],
    autoPush: true,
  },
  {
    id: 'post-2',
    title: '母乳喂养指导',
    content: `**母乳喂养要点**

**正确含接姿势:**
- 宝宝嘴巴张大,含住大部分乳晕
- 下嘴唇外翻
- 鼻子不被压迫
- 听到有节奏的吞咽声

**按需喂养:**
- 新生儿:每天8-12次
- 饿的信号:舔嘴唇、吸手、哭闹
- 每次喂养15-30分钟

**常见问题:**
- 乳头皲裂:调整姿势,涂抹羊脂膏
- 乳汁不足:多吸吮,保持心情放松
- 乳腺堵塞:冷敷,按摩,继续哺乳

**何时需就医:**
- 乳房红肿热痛
- 发热>38.5℃
- 宝宝体重增长不理想

*以上仅供参考,如有问题及时咨询医生或 lactation consultant*`,
    stage: 'postpartum',
    postpartumDay: 7,
    tags: ['哺乳', '喂养', '乳房护理'],
    autoPush: true,
  },
  {
    id: 'post-3',
    title: '新生儿护理',
    content: `**新生儿日常护理**

**脐带护理:**
- 保持干燥清洁
- 每日用碘伏消毒
- 一般7-14天脱落
- 如有红肿、渗液、异味,及时就医

**换尿布:**
- 新生儿每天10-12次
- 大小便后及时更换
- 用温水清洗,擦干
- 预防红屁股:涂抹护臀膏

**洗澡:**
- 水温37-38℃
- 室温26-28℃
- 每天1次或隔天1次
- 时间5-10分钟
- 注意保暖,避免受凉

**睡眠安全:**
- 仰卧睡姿
- 床铺坚实,无杂物
- 避免过热
- 同房间分床睡

*以上仅供参考,请以医生意见为准*`,
    stage: 'postpartum',
    postpartumDay: 3,
    tags: ['新生儿', '护理', '日常'],
    autoPush: false,
  },
  {
    id: 'post-4',
    title: '宝宝发育里程碑',
    content: `**0-6个月发育里程碑**

**1个月:**
- 俯卧抬头片刻
- 追视移动物体
- 对声音有反应

**3个月:**
- 俯卧抬头45°
- 会笑出声
- 抓握物体

**6个月:**
- 独坐片刻
- 认识陌生人
- 开始添加辅食

**促进发育:**
- 多与宝宝互动、说话
- 提供适龄玩具
- 鼓励探索
- 充足的爬行时间

**警惕信号:**
- 3个月不会抬头
- 6个月不会独坐
- 对声音无反应
- 不与人眼神交流

如有以上情况,及时咨询医生。

*以上仅供参考,每个宝宝发育节奏不同*`,
    stage: 'postpartum',
    postpartumDay: 30,
    tags: ['发育', '里程碑', '宝宝'],
    autoPush: false,
  },
  {
    id: 'post-5',
    title: '疫苗接种时间表',
    content: `**宝宝疫苗接种时间表**

**出生时:**
- 乙肝疫苗(第1针)
- 卡介苗(1针)

**1个月:**
- 乙肝疫苗(第2针)

**2个月:**
- 脊灰疫苗(第1针)
- 五联疫苗(第1针,含百白破、Hib、脊灰)

**3个月:**
- 五联疫苗(第2针)
- 肺炎球菌疫苗(第1针)

**4个月:**
- 五联疫苗(第3针)
- 肺炎球菌疫苗(第2针)

**5个月:**
- 轮状病毒疫苗

**6个月:**
- 乙肝疫苗(第3针)

**注意事项:**
- 按时接种,不要提前或推迟
- 接种后观察30分钟
- 可能出现发热、哭闹,属正常反应
- 如高热>39℃、持续哭闹,及时就医

*以上仅供参考,具体以当地疫苗接种指南为准*`,
    stage: 'postpartum',
    postpartumDay: 14,
    tags: ['疫苗', '接种', '预防'],
    autoPush: false,
  },
  {
    id: 'post-6',
    title: '妈妈产后恢复',
    content: `**产后身体恢复**

**盆底肌恢复:**
- 产后42天后开始凯格尔运动
- 收缩盆底肌5秒,放松10秒
- 每天3组,每组10-15次
- 持续8-12周可见效果

**腹直肌修复:**
- 检查:仰卧起坐时腹部隆起
- 修复:避免仰卧起坐,选择温和运动
- 推荐:腹式呼吸、桥式运动
- 严重者需就医治疗

**身材恢复:**
- 不要急于节食减肥
- 母乳喂养有助于消耗热量
- 适度运动:散步、瑜伽
- 耐心,给自己6-12个月时间

**情绪管理:**
- 产后情绪波动常见
- 充足休息很重要
- 寻求家人帮助
- 如持续情绪低落、焦虑,警惕产后抑郁,及时就医

*以上仅供参考,如有不适请及时就医*`,
    stage: 'postpartum',
    postpartumDay: 21,
    tags: ['恢复', '盆底肌', '身材', '情绪'],
    autoPush: false,
  },
  {
    id: 'post-7',
    title: '产后饮食营养',
    content: `**产后饮食建议**

**总体原则:**
- 营养均衡,食物多样
- 足够蛋白质和钙
- 多汤水,促进乳汁分泌
- 避免生冷、辛辣

**推荐食物:**
- 优质蛋白:鱼、肉、蛋、奶、豆制品
- 富含钙:牛奶、豆制品、深绿色蔬菜
- 富含铁:红肉、动物血、肝脏
- 催乳食物:鲫鱼汤、猪蹄汤、丝瓜

**哺乳期每日摄入:**
- 蛋白质:80g(比平时多15g)
- 钙:1000-1200mg
- 铁:25mg
- 水分:3000ml以上

**避免/限制:**
- 酒精、过量咖啡因
- 高汞鱼类(鲨鱼、旗鱼)
- 生食(生鱼片、生鸡蛋)
- 过于辛辣刺激的食物

*以上仅供参考,具体需求请咨询营养师*`,
    stage: 'postpartum',
    postpartumDay: 7,
    tags: ['饮食', '营养', '哺乳'],
    autoPush: false,
  },
  {
    id: 'post-8',
    title: '产后避孕',
    content: `**产后避孕指导**

**什么时候需要避孕?**
产后42天后如有性生活,就需要避孕。

**产后排卵时间:**
- 不哺乳:产后6-10周可能恢复排卵
- 哺乳:产后3-6个月可能恢复排卵
- **重要:**排卵先于月经,可能不知不觉怀孕

**避孕方法选择:**

1. **避孕套**
   - 安全,无副作用
   - 需每次正确使用

2. **短效避孕药**
   - 哺乳期:产后6周后使用,仅含孕激素
   - 不哺乳:产后3周后可使用复方避孕药
   - 需每天服用,不可漏服

3. **宫内节育器(避孕环)**
   - 产后42天复查时放置
   - 长效可逆
   - 不影响哺乳

4. **绝育手术**
   - 如确定不再生育
   - 需慎重考虑

*以上仅供参考,请咨询医生选择适合的避孕方式*`,
    stage: 'postpartum',
    postpartumDay: 42,
    tags: ['避孕', '计划生育', '健康'],
    autoPush: false,
  },
  {
    id: 'post-9',
    title: '产后心理调适',
    content: `**产后情绪管理**

**产后情绪低落(常见):**
- 发生率:50-80%
- 时间:产后3-5天开始
- 持续:数天到2周
- 表现:情绪波动、易哭、焦虑
- 处理:充分休息,家人支持,多休息即可缓解

**产后抑郁症(需重视):**
- 发生率:10-15%
- 时间:产后数周至数月
- 持续:超过2周
- 表现:
  - 持续悲伤、绝望
  - 对宝宝无兴趣
  - 睡眠障碍(非宝宝引起)
  - 自责、无价值感
  - 伤害自己或宝宝的念头
- **必须立即就医**

**预防和应对:**
- 产前学习育儿知识
- 产后充分休息,接受帮助
- 保持社交,不要孤立自己
- 与伴侣、家人沟通感受
- 参加妈妈支持小组
- 如有异常,及时寻求专业帮助

*产后抑郁症是可治疗的,请勇敢寻求帮助*`,
    stage: 'postpartum',
    postpartumDay: 14,
    tags: ['情绪', '心理健康', '产后抑郁'],
    autoPush: false,
  },
  {
    id: 'post-10',
    title: '重返职场准备',
    content: `**产假结束前的准备**

**提前准备(产假前2周):**

1. **母乳安排**
   - 提前储备:吸奶冷冻
   - 职场吸奶:了解公司哺乳室
   - 调整喂养:逐渐引入奶瓶

2. **宝宝照顾**
   - 确定照顾人(家人/保姆)
   - 交代宝宝作息、习惯
   - 留下紧急联系方式

3. **工作交接**
   - 提前了解工作变动
   - 整理交接文档
   - 与领导、同事沟通

4. **心理准备**
   - 调整心态,接受分离焦虑
   - 平衡工作与家庭
   - 不要追求完美

**重返职场后:**
- 逐步适应节奏
- 高效陪伴宝宝
- 保持与宝宝的亲密关系
- 寻求家人的理解和支持

*以上仅供参考,根据个人情况灵活调整*`,
    stage: 'postpartum',
    postpartumDay: 90,
    tags: ['职场', '工作', '适应'],
    autoPush: false,
  },
];

// ─── 知识库索引函数 ───────────────────────────────────────────────────────────

/**
 * 根据阶段、孕周、产后天数获取知识
 */
export function getKnowledgeForStage(
  stage: Stage,
  week?: number,
  postpartumDay?: number
): KnowledgeItem[] {
  const result: KnowledgeItem[] = [];

  if (stage === 'preconception') {
    // 备孕期:返回所有自动推送的知识
    return preconceptionKnowledge.filter((k) => k.autoPush);
  }

  if (stage === 'pregnancy' && week) {
    // 孕期:返回指定孕周的知识
    const weekKnowledge = pregnancyKnowledge[week];
    if (weekKnowledge) {
      result.push(weekKnowledge);
    }
  }

  if (stage === 'postpartum' && postpartumDay) {
    // 产后期:根据天数返回相关知识
    const relevant = postpartumKnowledge.filter(
      (k) => k.postpartumDay && k.postpartumDay <= postpartumDay && k.autoPush
    );
    // 按天数排序,返回最近的2-3条
    result.push(
      ...relevant
        .sort((a, b) => (b.postpartumDay || 0) - (a.postpartumDay || 0))
        .slice(0, 3)
    );
  }

  return result;
}

/**
 * 按关键词搜索知识
 */
export function searchKnowledgeByKeyword(keyword: string): KnowledgeItem[] {
  const lowerKeyword = keyword.toLowerCase();

  // 搜索所有知识
  const allKnowledge: KnowledgeItem[] = [
    ...preconceptionKnowledge,
    ...Object.values(pregnancyKnowledge),
    ...postpartumKnowledge,
  ];

  // 匹配标题或内容
  const results = allKnowledge.filter((k) => {
    const titleMatch = k.title.toLowerCase().includes(lowerKeyword);
    const contentMatch = k.content.toLowerCase().includes(lowerKeyword);
    const tagMatch = k.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));
    return titleMatch || contentMatch || tagMatch;
  });

  // 返回最多3条,按相关性排序(标题匹配优先)
  return results
    .sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(lowerKeyword);
      const bTitleMatch = b.title.toLowerCase().includes(lowerKeyword);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    })
    .slice(0, 3);
}

/**
 * 获取阶段的所有核心知识点(不包含每周内容)
 */
export function getStageCoreKnowledge(stage: Stage): KnowledgeItem[] {
  if (stage === 'preconception') {
    return preconceptionKnowledge;
  }
  if (stage === 'postpartum') {
    return postpartumKnowledge;
  }
  // 孕期返回每4周的知识点
  return Object.values(pregnancyKnowledge).filter((k) => (k.week || 0) % 4 === 0);
}

// ─── 导出知识库 ───────────────────────────────────────────────────────────────

export const knowledgeBase = {
  preconception: preconceptionKnowledge,
  pregnancy: pregnancyKnowledge,
  postpartum: postpartumKnowledge,
};
