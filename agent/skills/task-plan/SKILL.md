---
name: task-plan
description: Mandatory planning workflow for all tools that perform (file, code, or directory) mutation (write, edit, delete) even if it is a simple, trivial, straightforward, previous or repeated task.
---

# Task Planning Workflow

## Process

1. Search and analyze the user's request, then draft a plan and **CREATE `TODO.md` DIRECTLY** in the current working directory containing **ONLY A `## Plan` SECTION** at this stage. Do not add a `## Tasks` section yet — that only happens after acceptance (step 4).
2. Assess whether the task is complex or complicated. **Only if it is**, ask up to **5** non-obvious clarifying questions, along with suggestions.
   - If the task is **simple, trivial, or straightforward**, skip the questions step entirely and proceed directly to restating the plan for confirmation (step 3).
   - Each question must include an option for **"Let AI decide"**.
   - If the user selects "Let AI decide" for a question, the AI makes the call itself and **must state its decision and brief reasoning before proceeding** to the next step.
   - If the user revises the request, **edit the `## Plan` section of `TODO.md` directly** to reflect the revision, then restate the **full updated plan** before proceeding. `TODO.md` still contains only `## Plan` at this point — no tasks yet.
3. Wait for explicit **"YES"** confirmation before implementing anything.
   - If the user does **not** accept the plan (declines, cancels, or abandons it instead of confirming), **delete `TODO.md`** (this removes the draft plan along with it, since there is nothing else in the file yet) then ask what the user wants to do instead.
4. **Only once the plan is accepted with "YES"**: append a `## Tasks` section below the existing `## Plan` section, inside the same `TODO.md`, using the format below. The `## Tasks` checklist must never be created before this point.
5. As each task completes, update `TODO.md` immediately, marking that specific task `[x]`.
   - **`Task Complete` is the final line. It may only be marked `[x]` when every single task above it has been completed — with no exceptions.**
     - Tasks are an ordered, step-by-step sequence: each task must be **executed in order** (task 1 first, then task 2, etc.) before the next one begins.
     - `Task Complete` MUST remain `[ ]` until the very last preceding task is marked `[x]`. If even **one** task above it is still `[ ]`, `Task Complete` MUST stay `[ ]`.
     - Never mark `Task Complete` `[x]` prematurely, in advance, or alongside any unfinished tasks.
   - The `## Plan` section itself is never checked off or deleted while the checklist is in progress — it stays at the top of the file as the record of what was agreed to.

****There is only ever one file: `TODO.md`.** Its lifecycle has exactly two stages:
1. **Plan drafted, not yet accepted:** `TODO.md` exists with `## Plan` only.
2. **Plan accepted:** `TODO.md` contains `## Plan` followed by `## Tasks`.

No `PLAN.md` or any other separate plan file is ever created, and `## Tasks` never appears before "YES" is given.

---

## TODO.md Format

`TODO.md` has two sections, always in this order, and they appear at different stages of the workflow:

```markdown
## Plan

<the drafted / accepted plan, in prose or bullet form>

## Tasks

1. [x] Task description
2. [ ] Task description
...
N. [ ] Task Complete
<N. here refers to the last number in the task list>
```

- **Before step 3 ("YES" confirmation):** the file contains **only** the `## Plan` section. There is no `## Tasks` heading and no checklist at all yet.
- **After acceptance (step 4 onward):** the `## Tasks` section is appended below `## Plan` and is maintained using the checklist rules below.

**Checklist rules:**

- One task per line. No exceptions — never place two tasks on the same line.
- Each line starts with a numbered list marker, followed by a single checkbox:
  `N. [ ]` (ongoing) or `N. [x]` (completed).
- The **only** two valid checkbox states are `[ ]` and `[x]`. No other marker (`[DONE]`, `[X]`, `[✓]`, `[-]`, `[]` with no space, etc.) is permitted.
- A task is marked `[x]` **immediately** when — and only when — that specific task finishes. Do not batch updates or mark tasks complete in advance.
- The **last line** of the `## Tasks` section is always:
  `N. [ ] Task Complete`
- `Task Complete` may be changed to `[x]` **if and only if every task above it is already `[x]`**, meaning all tasks have been **fully executed in their correct step-by-step order** from first to last.
- If even one task above `Task Complete` is still `[ ]`, `Task Complete` **must remain `[ ]`** — no exceptions, no shortcuts, no batching.

### Correct example — plan drafted, not yet accepted

```markdown
## Plan

Set up the project, install dependencies, implement the core logic, and cover it with tests.
```

*(No `## Tasks` section yet — the user has not said "YES".)*

### Correct example — plan accepted, tasks in progress

```markdown
## Plan

Set up the project, install dependencies, implement the core logic, and cover it with tests.

## Tasks

1. [x] Set up project directory structure
2. [x] Install required dependencies
3. [ ] Write core module logic
4. [ ] Write unit tests
5. [ ] Task Complete
```

*(Task Complete stays `[ ]` because tasks 3 and 4 are still open.)*

### Correct example — all done

```markdown
## Plan

Set up the project, install dependencies, implement the core logic, and cover it with tests.

## Tasks

1. [x] Set up project directory structure
2. [x] Install required dependencies
3. [x] Write core module logic
4. [x] Write unit tests
5. [x] Task Complete
```

### Not allowed

```markdown
## Plan
## Tasks
1. [ ] Do something                                               ← ## Tasks added before "YES" was given
1. [ ] This is an ongoing task 2. [x] This is a completed task    ← two tasks on one line
1. [DONE] Set up project                                           ← invalid marker
2. [] Install required dependencies                                ← missing space inside checkbox
1. [x] Task Complete   (while task 2 below is still [ ])           ← premature completion
(a separate PLAN.md file)                                          ← plan must live inside TODO.md, not its own file
```

---

## Existing TODO.md Handling

If a `TODO.md` already exists:

| Condition | Action |
|---|---|
| All tasks done | Overwrite the whole file — both `## Plan` and `## Tasks` sections — with the new plan and new task(s) |
| Tasks unfinished | **STOP** — ask user to choose one: |
| | a) Finish existing unfinished tasks first (file untouched) |
| | b) Append new task(s) alongside unfinished ones — the `## Plan` section is updated to describe the combined scope, and new tasks are appended to `## Tasks` |
| | c) Overwrite the whole file with only the new plan and new task(s) |

**Whenever the file is overwritten or new tasks are appended (options a–c above):**

- `Task Complete` must be reset to `[ ]` (unmarked). The plan is no longer finished, so `Task Complete` can never remain `[x]` when new or unfinished tasks exist.
- `Task Complete` must be **repositioned to the last line** of the renumbered `## Tasks` list, after every task — new or pre-existing.
- Renumber all lines sequentially so `Task Complete` keeps its position as the final numbered item.
- The `## Plan` section is updated in the same pass so it accurately reflects whatever is now in `## Tasks` — the plan and the checklist must never describe different things.

### Example — appending new tasks to unfinished ones

Before (unfinished):

```markdown
## Plan

Set up the project and implement the core logic.

## Tasks

1. [x] Set up project directory structure
2. [ ] Write core module logic
3. [ ] Task Complete
```

User asks to append two new tasks. Correct result:

```markdown
## Plan

Set up the project, implement the core logic, add logging support, and cover it with integration tests.

## Tasks

1. [x] Set up project directory structure
2. [ ] Write core module logic
3. [ ] Add logging support
4. [ ] Write integration tests
5. [ ] Task Complete
```

**Critical rule: `Task Complete` must never be marked `[x]` while any task above it is still `[ ]`. It is the literal final step that signifies all prior work — executed in order, from top to bottom — is fully done. Marking it early (while tasks remain `[ ]`), marking multiple steps at once without execution, or skipping intermediate tasks are all forbidden.**

---

## User Intervention

- If a step requires user input, **stop immediately** and state exactly what is needed.
- If the user's answer is irrelevant or unhelpful, decide between:
  - a) Skip the task and continue
  - b) Do research and try an alternative approach
  - c) Stop the task entirely
  - Then ask the user which option they'd like to take.
- If the user abandons the plan, **delete `TODO.md`**.