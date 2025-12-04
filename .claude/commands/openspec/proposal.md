---
name: OpenSpec: 提案
description: 搭建一个新的 OpenSpec 变更并进行严格验证。
category: OpenSpec
tags: [openspec, change, 提案, 变更]
---
<!-- OPENSPEC:START -->
**护栏**
- 优先选择直接、最简化的实现，仅在被要求或明确需要时才增加复杂性。
- 保持变更范围与所要求的结果紧密相关。
- 如果你需要额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录中——如果看不到，请运行 `ls openspec` 或 `openspec update`）。
- 在编辑文件之前，识别任何模糊或不明确的细节，并提出必要的后续问题。
- 在提案阶段不要编写任何代码。只创建设计文档（proposal.md, tasks.md, design.md, 和 spec deltas）。实施在批准后的应用阶段进行。

**步骤**
1.  审阅 `openspec/project.md`，运行 `openspec list` 和 `openspec list --specs`，并检查相关代码或文档（例如，通过 `rg`/`ls`）以使提案基于当前行为；注意任何需要澄清的差距。
2.  选择一个唯一的动词引导的 `change-id` 并在 `openspec/changes/<id>/` 下搭建 `proposal.md`、`tasks.md` 和 `design.md`（如果需要）。
3.  将变更映射到具体的能力或需求中，将多范围的工作分解为具有清晰关系和顺序的独立规约增量。
4.  当解决方案跨越多个系统、引入新模式或在提交规约前需要权衡讨论时，在 `design.md` 中记录架构推理。
5.  在 `changes/<id>/specs/<capability>/spec.md`（每个能力一个文件夹）中起草规约增量，使用 `## ADDED|MODIFIED|REMOVED Requirements`，每个需求至少有一个 `#### Scenario:`，并在相关时交叉引用相关能力。
6.  将 `tasks.md` 起草为一个有序的小型、可验证工作项列表，这些工作项可交付用户可见的进度，包括验证（测试、工具），并突出显示依赖关系或可并行化的工作。
7.  使用 `openspec validate <id> --strict` 进行验证，并在分享提案前解决所有问题。

**参考**
- 在验证失败时，使用 `openspec show <id> --json --deltas-only` 或 `openspec show <spec> --type spec` 来检查细节。
- 在编写新需求之前，使用 `rg -n "Requirement:|Scenario:" openspec/specs` 搜索现有需求。
- 使用 `rg <keyword>`、`ls` 或直接读取文件来探索代码库，以使提案与当前的实现现实保持一致。
<!-- OPENSPEC:END -->
