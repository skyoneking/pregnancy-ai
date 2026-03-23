# 知识库内容格式规范

## 文件位置

`app/lib/knowledge.ts`

## 数据结构

### 备孕期知识 (preconceptionKnowledge)

```typescript
{
  id: string,           // 唯一标识，如 "folic_acid"
  title: string,        // 标题，如 "叶酸补充"
  category: string,     // 分类，如 "营养"
  content: string,      // 正文内容
  tags: string[],       // 搜索标签
  disclaimer: string,   // 医学免责声明
}
```

### 孕期知识 (weeklyKnowledge)

```typescript
{
  week: number,         // 孕周（1-42）
  development: string,  // 胎儿发育描述
  tips: string,         // 注意事项
  checkups: string[],   // 本周产检项目
  disclaimer: string,
}
```

### 产后知识 (postpartumKnowledge)

```typescript
{
  id: string,
  title: string,
  category: string,     // 如 "恢复"、"喂养"、"新生儿"
  content: string,
  applicableDays: string, // 适用天数范围，如 "0-42"
  disclaimer: string,
}
```

## 内容编写规范

1. **语气**: 温暖、鼓励、专业但不生硬
2. **长度**: 每条知识 100-300 字
3. **免责声明**: 每条内容必须包含 `disclaimer` 字段
4. **标签**: 至少 3 个相关搜索标签
5. **来源**: 基于权威医学指南，避免个人经验

## 查询函数

| 函数 | 参数 | 说明 |
|------|------|------|
| `getKnowledgeForStage(stage)` | Stage | 按阶段获取知识 |
| `searchKnowledgeByKeyword(keyword)` | string | 关键词搜索 |

## 新增知识的步骤

1. 在对应数组中添加新条目
2. 确保包含所有必填字段
3. 添加医学免责声明
4. 运行 `pnpm test -- knowledge` 验证
