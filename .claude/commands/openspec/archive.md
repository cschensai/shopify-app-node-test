---
name: OpenSpec: 归档
description: 归档一个已部署的 OpenSpec 变更并更新规约。
category: OpenSpec
tags: [openspec, archive, 归档]
---
<!-- OPENSPEC:START -->
**护栏**
- 优先选择直接、最简化的实现，仅在被要求或明确需要时才增加复杂性。
- 保持变更范围与所要求的结果紧密相关。
- 如果你需要额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录中——如果看不到，请运行 `ls openspec` 或 `openspec update`）。

**步骤**
1.  确定要归档的变更 ID：
    -   如果此提示已包含特定的变更 ID（例如，在由斜杠命令参数填充的 `<ChangeId>` 块内），请在修剪空格后使用该值。
    -   如果对话中松散地引用了某个变更（例如，通过标题或摘要），请运行 `openspec list` 以显示可能的 ID，分享相关候选项，并确认用户意图的是哪一个。
    -   否则，请审阅对话，运行 `openspec list`，并询问用户要归档哪个变更；在继续之前等待一个已确认的变更 ID。
    -   如果仍然无法确定单个变更 ID，请停止并告知用户您尚无法归档任何内容。
2.  通过运行 `openspec list`（或 `openspec show <id>`）来验证变更 ID，如果变更缺失、已归档或因其他原因未准备好归档，则停止。
3.  运行 `openspec archive <id> --yes` 以便 CLI 移动变更并应用规约更新而无需提示（仅对纯工具性工作使用 `--skip-specs`）。
4.  审阅命令输出以确认目标规约已更新并且变更已进入 `changes/archive/`。
5.  使用 `openspec validate --strict`进行验证，如果任何内容看起来不对劲，请使用 `openspec show <id>`进行检查。

**参考**
- 在归档前使用 `openspec list` 确认变更 ID。
- 使用 `openspec list --specs` 检查更新后的规约，并在交接前解决任何验证问题。
<!-- OPENSPEC:END -->
