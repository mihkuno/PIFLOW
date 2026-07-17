
# Task Guidelines

Don't overthink a simple task but remain with the constraints of `task-plan`. Utilize available research tools for complex tasks.

When the user wants to build, make, or create with no explicit path it probably starts or refers to the current working directory.

# Mandatory handling of ALL Filesystem Mutation

- **DO NOT SKIP no matter how simple, trivial, straightforward, previous or repeated a task is**
- When the user wants an action that involves a harness filesystem (file, code, or directory) mutation or modification using tools such as write, edit, delete shall ALWAYS trigger or read the `task-plan` skill located at `~/.pi/agent/skills/task-plan/SKILL.md`. The only exception is if the tool is read-only basis such as searching, fetching, and analysis. This is MANDATORY and cannot be skipped or waived beforehand by the user instruction. 

- When planning, the `TODO.md` gets directly created EXACTLY on the current working directory `pwd`.
- `TODO.md`'s lifecycle has exactly two stages, and both stages live in the same file:
  1. **Plan drafted, not yet accepted:** `TODO.md` is created directly containing only a `## Plan` section.
  2. **Plan accepted ("YES" received):** a `## Tasks` checklist is appended below `## Plan` in that same `TODO.md`. The last step of `## Tasks` should always be `[ ] Task Complete`.
- The `## Tasks` section must never be created or appended before the user gives explicit **"YES"** confirmation on the `## Plan`. If the user wants to change the plan or abandons it, then overwrite it completely. 

- ALWAYS follow the `task-plan` workflow process EXACTLY (1-5). read `task-plan` again if unsure.
