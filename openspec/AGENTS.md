# OpenSpec 指令

为使用 OpenSpec 进行规约驱动开发的 AI 编码助手提供的指令。

## TL;DR 快速清单

- 搜索现有工作：`openspec spec list --long`, `openspec list` (只在全文搜索时使用 `rg`)
- 决定范围：新能力 vs 修改现有能力
- 选择一个唯一的 `change-id`：kebab-case, 动词引导 (`add-`, `update-`, `remove-`, `refactor-`)
- 搭建脚手架：`proposal.md`, `tasks.md`, `design.md` (仅在需要时), 以及每个受影响能力的增量规约
- 编写增量：使用 `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`；每个需求至少包含一个 `#### Scenario:`
- 验证：`openspec validate [change-id] --strict` 并修复问题
- 请求批准：在提案被批准之前不要开始实施

## 三阶段工作流

### 阶段 1: 创建变更
当您需要进行以下操作时创建提案：
- 添加特性或功能
- 进行破坏性变更 (API, schema)
- 改变架构或模式
- 优化性能 (改变行为)
- 更新安全模式

触发器 (示例):
- "帮我创建一个变更提案"
- "帮我计划一个变更"
- "帮我创建一个提案"
- "我想创建一个规约提案"
- "我想创建一个规约"

宽松匹配指南:
- 包含以下之一: `proposal`, `change`, `spec`
- 并包含以下之一: `create`, `plan`, `make`, `start`, `help`

对于以下情况跳过提案：
- Bug 修复 (恢复预期行为)
- 拼写错误、格式、注释
- 依赖更新 (非破坏性)
- 配置变更
- 现有行为的测试

**工作流**
1.  回顾 `openspec/project.md`, `openspec list`, 和 `openspec list --specs` 以理解当前上下文。
2.  选择一个唯一的动词引导的 `change-id` 并在 `openspec/changes/<id>/` 下搭建 `proposal.md`, `tasks.md`, 可选的 `design.md`, 以及规约增量。
3.  使用 `## ADDED|MODIFIED|REMOVED Requirements` 起草规约增量，每个需求至少有一个 `#### Scenario:`。
4.  运行 `openspec validate <id> --strict` 并在分享提案前解决任何问题。

### 阶段 2: 实施变更
将这些步骤作为 TODOs 跟踪并逐一完成。
1.  **阅读 proposal.md** - 理解正在构建什么
2.  **阅读 design.md** (如果存在) - 回顾技术决策
3.  **阅读 tasks.md** - 获取实施清单
4.  **顺序实施任务** - 按顺序完成
5.  **确认完成** - 在更新状态前确保 `tasks.md` 中的每个项目都已完成
6.  **更新清单** - 所有工作完成后，将每个任务设置为 `- [x]` 以使列表反映现实
7.  **批准门禁** - 在提案被审查和批准之前不要开始实施

### 阶段 3: 归档变更
部署后，创建单独的 PR 以：
- 移动 `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
- 如果能力已更改，则更新 `specs/`
- 对于仅工具的变更，使用 `openspec archive <change-id> --skip-specs --yes` (总是明确传递变更 ID)
- 运行 `openspec validate --strict` 以确认归档的变更通过检查

## 任何任务之前

**上下文清单:**
- [ ] 阅读 `specs/[capability]/spec.md` 中的相关规约
- [ ] 检查 `changes/` 中的待定变更以发现冲突
- [ ] 阅读 `openspec/project.md` 以了解项目约定
- [ ] 运行 `openspec list` 查看活动变更
- [ ] 运行 `openspec list --specs` 查看现有能力

**创建规约之前:**
- 总是检查能力是否已存在
- 倾向于修改现有规约而不是创建副本
- 使用 `openspec show [spec]` 回顾当前状态
- 如果请求模棱两可，在搭建脚手架前提出 1–2 个澄清问题

### 搜索指南
- 枚举规约: `openspec spec list --long` (或 `--json` 用于脚本)
- 枚举变更: `openspec list` (或 `openspec change list --json` - 已弃用但可用)
- 显示详情:
  - 规约: `openspec show <spec-id> --type spec` (使用 `--json` 进行过滤)
  - 变更: `openspec show <change-id> --json --deltas-only`
- 全文搜索 (使用 ripgrep): `rg -n "Requirement:|Scenario:" openspec/specs`

## 快速开始

### CLI 命令

```bash
# 基本命令
openspec list                  # 列出活动变更
openspec list --specs          # 列出规约
openspec show [item]           # 显示变更或规约
openspec validate [item]       # 驗證變更或規約
openspec archive <change-id> [--yes|-y]   # 部署后归档 (为非交互式运行添加 --yes)

# 项目管理
openspec init [path]           # 初始化 OpenSpec
openspec update [path]         # 更新指令文件

# 交互模式
openspec show                  # 提示进行选择
openspec validate              # 批量验证模式

# 调试
openspec show [change] --json --deltas-only
openspec validate [change] --strict
```

### 命令标志

- `--json` - 机器可读的输出
- `--type change|spec` - 区分项目
- `--strict` - 全面验证
- `--no-interactive` - 禁用提示
- `--skip-specs` - 归档而不更新规约
- `--yes`/`-y` - 跳过确认提示 (非交互式归档)

## 目录结构

```
openspec/
├── project.md              # 项目约定
├── specs/                  # 当前的真相 - 构建了什么
│   └── [capability]/       # 单一专注的能力
│       ├── spec.md         # 需求和场景
│       └── design.md       # 技术模式
├── changes/                # 提案 - 应该改变什么
│   ├── [change-name]/
│   │   ├── proposal.md     # 为什么, 什么, 影响
│   │   ├── tasks.md        # 实施清单
│   │   ├── design.md       # 技术决策 (可选; 见标准)
│   │   └── specs/          # 增量变更
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # 已完成的变更
```

## 创建变更提案

### 决策树

```
新请求?
├─ 修复恢复规约行为的 Bug? → 直接修复
├─ 拼写/格式/注释? → 直接修复
├─ 新特性/能力? → 创建提案
├─ 破坏性变更? → 创建提案
├─ 架构变更? → 创建提案
└─ 不清楚? → 创建提案 (更安全)
```

### 提案结构

1.  **创建目录:** `changes/[change-id]/` (kebab-case, 动词引导, 唯一)

2.  **编写 proposal.md:**
```markdown
# 变更: [变更的简要描述]

## 为什么
[1-2句話說明問題/機會]

## 变更内容
- [变更的要点列表]
- [用 **BREAKING** 标记破坏性变更]

## 影响
- 受影响的规约: [能力列表]
- 受影响的代码: [关键文件/系统]
```

3.  **创建规约增量:** `specs/[capability]/spec.md`
```markdown
## ADDED Requirements
### Requirement: 新特性
系统 SHALL 提供...

#### Scenario: 成功案例
- **WHEN** 用户执行操作
- **THEN** 预期的结果

## MODIFIED Requirements
### Requirement: 现有特性
[完整的修改后需求]

## REMOVED Requirements
### Requirement: 旧特性
**原因**: [为什么移除]
**迁移**: [如何处理]
```
如果影响多个能力，则在 `changes/[change-id]/specs/<capability>/spec.md`下创建多个增量文件——每个能力一个。

4.  **创建 tasks.md:**
```markdown
## 1. 实施
- [ ] 1.1 创建数据库 schema
- [ ] 1.2 实现 API 端点
- [ ] 1.3 添加前端组件
- [ ] 1.4 编写测试
```

5.  **需要时创建 design.md:**
如果满足以下任一条件，则创建 `design.md`；否则省略它：
- 跨领域的变更 (多个服务/模块) 或新的架构模式
- 新的外部依赖或重大的数据模型变更
- 安全性、性能或迁移的复杂性
- 在编码前通过技术决策可以获益的模糊性

最小 `design.md` 骨架:
```markdown
## 背景
[背景, 约束, 利益相关者]

## 目标 / 非目标
- 目标: [...]
- 非目标: [...]

## 决策
- 决策: [什么和为什么]
- 考虑的替代方案: [选项 + 理由]

## 风险 / 权衡
- [风险] → 缓解措施

## 迁移计划
[步骤, 回滚]

## 开放问题
- [...]
```

## 规约文件格式

### 关键: 场景格式化

**正确** (使用 #### 标题):
```markdown
#### Scenario: 用户登录成功
- **WHEN** 提供了有效凭证
- **THEN** 返回 JWT 令牌
```

**错误** (不要使用项目符号或粗体):
```markdown
- **Scenario: User login**  ❌
**Scenario**: User login     ❌
### Scenario: User login      ❌
```

每个需求必须至少有一个场景。

### 需求措辞
- 对规范性需求使用 SHALL/MUST (除非有意为非规范性，否则避免使用 should/may)

### 增量操作

- `## ADDED Requirements` - 新能力
- `## MODIFIED Requirements` - 行为变更
- `## REMOVED Requirements` - 已弃用的特性
- `## RENAMED Requirements` - 名称变更

标题匹配使用 `trim(header)` - 忽略空格。

#### 何时使用 ADDED vs MODIFIED
- ADDED: 引入一个新的能力或子能力，可以作为一个独立的需求。当变更是正交的（例如，添加“斜杠命令配置”）而不是改变现有需求的语义时，首选 ADDED。
- MODIFIED: 更改现有需求的行为、范围或验收标准。始终粘贴完整的、更新后的需求内容（标题 + 所有场景）。归档器将用您在此处提供的内容替换整个需求；部分增量将丢失以前的细节。
- RENAMED: 仅当名称更改时使用。如果同时更改行为，请使用 RENAMED (名称) 加上 MODIFIED (内容) 并引用新名称。

常见陷阱: 使用 MODIFIED 添加新关注点而不包含先前的文本。这会在归档时导致细节丢失。如果您没有明确更改现有需求，请在 ADDED 下添加一个新需求。

正确编写 MODIFIED 需求:
1) 在 `openspec/specs/<capability>/spec.md` 中找到现有需求。
2) 复制整个需求块 (从 `### Requirement: ...` 到其所有场景)。
3) 将其粘贴到 `## MODIFIED Requirements` 下并进行编辑以反映新行为。
4) 确保标题文本完全匹配 (忽略空格) 并至少保留一个 `#### Scenario:`。

RENAMED 示例:
```markdown
## RENAMED Requirements
- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

## 故障排除

### 常见错误

**"变更必须至少有一个增量"**
- 检查 `changes/[name]/specs/` 是否存在且包含 .md 文件
- 验证文件是否具有操作前缀 (## ADDED Requirements)

**"需求必须至少有一个场景"**
- 检查场景是否使用 `#### Scenario:` 格式 (4个井号)
- 不要为场景标题使用项目符号或粗体

**静默的场景解析失败**
- 需要确切的格式: `#### Scenario: 名称`
- 使用以下命令调试: `openspec show [change] --json --deltas-only`

### 验证技巧

```bash
# 总是使用严格模式进行全面检查
openspec validate [change] --strict

# 调试增量解析
openspec show [change] --json | jq '.deltas'

# 检查特定需求
openspec show [spec] --json -r 1
```

## 成功路径脚本

```bash
# 1) 探索当前状态
openspec spec list --long
openspec list
# 可选的全文搜索:
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) 选择变更 id 并搭建脚手架
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## Why\n...\n\n## What Changes\n- ...\n\n## Impact\n- ...\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. Implementation\n- [ ] 1.1 ...\n" > openspec/changes/$CHANGE/tasks.md

# 3) 添加增量 (示例)
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Authentication
Users MUST provide a second factor during login.

#### Scenario: OTP required
- **WHEN** valid credentials are provided
- **THEN** an OTP challenge is required
EOF

# 4) 验证
openspec validate $CHANGE --strict
```

## 多能力示例

```
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: Two-Factor Authentication
    └── notifications/
        └── spec.md   # ADDED: OTP email notification
```

auth/spec.md
```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
...
```

notifications/spec.md
```markdown
## ADDED Requirements
### Requirement: OTP Email Notification
...
```

## 最佳实践

### 简约至上
- 默认新增代码少于100行
- 单文件实现，直到证明不足
- 没有明确理由不要使用框架
- 选择乏味但经过验证的模式

### 复杂性触发器
仅在以下情况下增加复杂性：
- 性能数据显示当前解决方案太慢
- 具体的规模要求 (>1000 用户, >100MB 数据)
- 多个已验证的用例需要抽象

### 清晰的引用
- 对代码位置使用 `file.ts:42` 格式
- 将规约引用为 `specs/auth/spec.md`
- 链接相关的变更和 PR

### 能力命名
- 使用动词-名词: `user-auth`, `payment-capture`
- 每个能力单一目的
- 10分钟可理解性原则
- 如果描述需要 "AND"，则拆分

### 变更 ID 命名
- 使用 kebab-case，简短且具描述性: `add-two-factor-auth`
- 偏好动词引导的前缀: `add-`, `update-`, `remove-`, `refactor-`
- 确保唯一性；如果已存在，则附加 `-2`, `-3` 等

## 工具选择指南

| 任务 | 工具 | 原因 |
|------|------|-----|
| 按模式查找文件 | Glob | 快速模式匹配 |
| 搜索代码内容 | Grep | 优化的正则表达式搜索 |
| 读取特定文件 | Read | 直接文件访问 |
| 探索未知范围 | Task | 多步调查 |

## 错误恢复

### 变更冲突
1.  运行 `openspec list` 查看活动变更
2.  检查重叠的规约
3.  与变更所有者协调
4.  考虑合并提案

### 验证失败
1.  使用 `--strict` 标志运行
2.  检查 JSON 输出以获取详细信息
3.  验证规约文件格式
4.  确保场景格式正确

### 缺少上下文
1.  首先阅读 project.md
2.  检查相关规约
3.  回顾最近的归档
4.  请求澄清

## 快速参考

### 阶段指示器
- `changes/` - 已提议，尚未构建
- `specs/` - 已构建并部署
- `archive/` - 已完成的变更

### 文件用途
- `proposal.md` - 为什么和什么
- `tasks.md` - 实施步骤
- `design.md` - 技术决策
- `spec.md` - 需求和行为

### CLI Essentials
```bash
openspec list              # 正在进行什么？
openspec show [item]       # 查看详情
openspec validate --strict # 它是否正确？
openspec archive <change-id> [--yes|-y]  # 标记完成 (为自动化添加 --yes)
```

记住：规约是真理。变更是提案。保持它们同步。
