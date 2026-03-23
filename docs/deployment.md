# 部署文档

## 前置条件

- Supabase 账号和项目
- Vercel 账号
- 智谱 AI API Key

## 部署步骤

### 1. Supabase 生产环境

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建新项目（生产环境）
2. 在 SQL Editor 运行建表脚本：
   - 创建 `profiles` 表
   - 创建 `health_records` 表
   - 配置 RLS 策略
3. 记录项目 URL、Anon Key、Service Role Key

### 2. Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
   GLM_API_KEY=your-glm-api-key
   GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
   GLM_MODEL=glm-4-flash
   ```
4. 部署

### 3. 验证

- 访问生产 URL，测试注册/登录流程
- 验证 AI 对话功能
- 检查 Supabase Dashboard 确认数据写入正常

## 监控

### Supabase Dashboard
- Database → 查看表数据和查询日志
- Auth → 查看用户注册和登录情况
- Edge Functions / API → 监控 API 调用量

### Vercel
- Analytics → 页面加载性能
- Logs → 服务端日志和错误

---

# 应急预案

## Supabase 服务异常

### 症状
- 用户无法登录/注册
- API 返回 500 错误
- 数据无法保存

### 处理步骤
1. 检查 [Supabase Status](https://status.supabase.com/) 确认是否为平台故障
2. 如果是平台故障：在应用中显示维护提示，等待恢复
3. 如果是项目问题：
   - 检查 Supabase Dashboard → Logs
   - 检查 RLS 策略是否正常
   - 检查数据库连接数是否超限

### 临时措施
- 可在前端添加离线提示："服务暂时不可用，请稍后重试"
- 对话功能可独立于数据库运行（降级为无上下文模式）

## 智谱 AI 服务异常

### 症状
- AI 对话无响应或超时
- 返回错误消息

### 处理步骤
1. 检查智谱平台状态和 API Key 余额
2. 检查 `GLM_API_KEY` 环境变量是否正确
3. 查看 Vercel Logs 中的错误详情

### 临时措施
- 对话 API 已有 try-catch，会返回友好错误提示
- 非对话功能（注册、档案管理）不受影响

## 数据库备份

- Supabase 自动进行每日备份（Pro 计划）
- Free 计划无自动备份，建议定期手动导出数据
