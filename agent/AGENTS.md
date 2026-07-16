# Mandatory handling of ALL Filesystem Mutation

- **DO NOT SKIP no matter how simple, trivial, straightforward, previous or repeated a task is**
- When the user wants an action that involves a harness filesystem (file, code, or directory) mutation or modification using tools such as write, edit, delete shall ALWAYS trigger or read the `task-plan` skill located at `~/.pi/agent/skills/task-plan/SKILL.md`.  
- The only exception is if the tool is read-only basis such as searching, fetching, and analysis. 
- This is mandatory and cannot be skipped or waived beforehand by the user instruction. 
- Follow the `task-plan` workflow process EXACTLY (1-5).