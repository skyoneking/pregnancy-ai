## MODIFIED Requirements

### Requirement: 身份选择
系统 SHALL 从阶段注册表动态生成阶段选项，而非硬编码。

#### Scenario: 阶段选项从注册表生成
- **WHEN** 引导页渲染阶段选择 UI
- **THEN** 阶段选项 MUST 从 stageRegistry 中提取 mainStage 的去重列表
- **AND** 每个选项显示对应的中文标签

#### Scenario: 新增阶段自动出现
- **WHEN** 在 stageRegistry 中新增一个 mainStage 值
- **THEN** 引导页的阶段选择 UI 自动包含该新选项
- **AND** 无需修改 onboarding/page.tsx 的代码
