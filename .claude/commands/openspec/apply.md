---
name: OpenSpec: 应用
description: 实施一个已批准的 OpenSpec 变更并保持任务同步。
category: OpenSpec
tags: [openspec, apply, 应用]
---
<!-- OPENSPEC:START -->
**护栏**
- 优先选择直接、最简化的实现，仅在被要求或明确需要时才增加复杂性。
- 保持变更范围与所要求的结果紧密相关。
- 如果你需要额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录中——如果看不到，请运行 `ls openspec` 或 `openspec update`）。

**步骤**
将这些步骤作为 TODOs 跟踪并逐一完成。
1.  阅读 `changes/<id>/proposal.md`、`design.md`（如果存在）和 `tasks.md` 以确认范围和验收标准。
2.  按顺序完成任务，保持编辑最少并专注于所要求的变更。
3.  在更新状态之前确认完成——确保 `tasks.md` 中的每个项目都已完成。
4.  所有工作完成后更新清单，以便每个任务都标记为 `- [x]` 并反映现实。
5.  当需要额外上下文时，参考 `openspec list` 或 `openspec show <item>`。

**参考**
- 如果在实施过程中需要提案的额外上下文，请使用 `openspec show <id> --json --deltas-only`。
<!-- OPENSPEC:END -->
