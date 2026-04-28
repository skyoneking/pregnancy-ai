## REMOVED Requirements

### Requirement: getUserLocation 工具函数分支覆盖
**Reason**: getUserLocation 工具已不存在于当前代码库，属于早期天气功能残留
**Migration**: 无需迁移

### Requirement: getWeather 工具函数行为覆盖
**Reason**: getWeather 工具已不存在于当前代码库，属于早期天气功能残留
**Migration**: 无需迁移

### Requirement: contextSchema Zod 校验
**Reason**: contextSchema 已重构（字段从 user_id 改为 role/stage/due_date 等），旧测试不再适用
**Migration**: 后续需为新的 contextSchema 编写测试

## ADDED Requirements

### Requirement: _graph 层工具测试
系统 SHALL 为迁移到 `_graph/` 下的孕期工具（calculatePregnancyInfo、getWeeklyDevelopment、checkFoodSafety、getPrenatalSchedule、assessSymptom、getContextualKnowledge）提供单元测试。

#### Scenario: calculatePregnancyInfo 正确计算孕周
- **WHEN** 以有效预产期调用 calculatePregnancyInfo
- **THEN** 返回正确的 currentWeek、stage 和 daysRemaining

#### Scenario: checkFoodSafety 返回已知食物安全等级
- **WHEN** 以 "苹果" 调用 checkFoodSafety
- **THEN** 返回安全等级为 "安全"

#### Scenario: assessSymptom 对未知症状返回观察级别
- **WHEN** 以未匹配的关键词调用 assessSymptom
- **THEN** 返回 🟡观察 级别（宁严勿松原则）
