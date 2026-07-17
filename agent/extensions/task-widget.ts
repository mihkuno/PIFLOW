/**
 * Task Plan Widget Extension (Enhanced UI)
 *
 * Displays a sticky widget above the TUI prompt input showing TODO.md Tasks section
 * with modern styling: per-line backgrounds, outline/filled squares, progress tracking.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { isBashToolResult } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";

/** Minimal shape of `ctx.ui.theme` that this file relies on. */
type Theme = {
  fg(token: string, text: string): string;
  bg(token: string, text: string): string;
  strikethrough(text: string): string;
};

type TaskLine = { done: boolean; text: string };

const PAD = " \u2003 ";   // thin space padding

/* ═══════════════════ Parsing TODO.md ═══════════════ */

/** Pull `{ done, text }` entries out of the "## Tasks" section of a TODO.md. */
function parseTasks(content: string): TaskLine[] {
  const rawLines = content.split("\n");

  let inTasksSection = false;
  const taskLines: TaskLine[] = [];

  for (const raw of rawLines) {
    if (raw.startsWith("##")) {
      inTasksSection = /tasks?/i.test(raw);
      continue;
    }
    if (!inTasksSection) continue;

    // Accepts "- [ ] text", "* [x] text", "1. [ ] text", "1) [ ] text",
    // and the bare "1[ ] text" / "[ ] text" forms — whatever list-marker
    // style ends up in front of the checkbox.
    const match = raw.match(/^\s*(?:[-*]|\d+[.)]?)?\s*\[([ xX])\]\s+(.+)$/);
    if (!match) continue;

    taskLines.push({ done: match[1].toLowerCase() === "x", text: match[2].trim() });
  }

  return taskLines;
}

/**
 * Wrap already-colorized `content` in a full-width background fill.
 * Truncates safely (ANSI-aware) if content would overflow `width`, then pads
 * with plain spaces up to `width` so the background paints edge-to-edge.
 */
function fillLine(theme: Theme, bgToken: string, content: string, width: number): string {
  const clipped = truncateToWidth(content, Math.max(0, width));
  const pad = Math.max(0, width - visibleWidth(clipped));
  return theme.bg(bgToken, clipped + " ".repeat(pad));
}

/** Render parsed task lines into full-width, theme-colored widget rows. */
function renderTaskWidget(taskLines: TaskLine[], theme: Theme, width: number): string[] {
  if (taskLines.length === 0) return [];

  const rendered: string[] = [];

  // ── Header bar with progress ──
  const total     = taskLines.length;
  const doneCount = taskLines.filter(t => t.done).length;
  const pct       = Math.round((doneCount / total) * 100);

  const headerText = `  📋  TASKS   ${"─".repeat(Math.min(total * 2, 45))}   ${doneCount}/${total} (${pct}%)`;
  rendered.push(fillLine(theme, "customMessageBg", theme.fg("customMessageLabel", headerText), width));

  // ── Separator line, spanning the full width ──
  rendered.push(theme.fg("borderMuted", "─".repeat(Math.max(0, width))));

  // ── Each task row, background filling the entire line ──
  for (const tl of taskLines) {
    if (tl.done) {
      // DONE — muted bg, filled square ■, muted+strikethrough text
      const content =
        PAD +
        theme.fg("success", "\u25A0") +      // ■ Filled square
        " " + theme.fg("muted", theme.strikethrough(tl.text));
      rendered.push(fillLine(theme, "toolSuccessBg", content, width));
    } else {
      // NOT DONE — accent bg, outline square □, default text
      const content =
        PAD +
        theme.fg("accent", "\u25A1") +       // □ Outline / hollow square
        " " + theme.fg("text", tl.text);
      rendered.push(fillLine(theme, "toolPendingBg", content, width));
    }
  }

  return rendered;
}

/* ═══════ Bash pwd tracking (verifies cwd via tool output) ═══════ */

/** Pull the plain-text output out of a tool_result event's content blocks. */
function textFromContent(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b: any): b is { type: "text"; text: string } => b && b.type === "text" && typeof b.text === "string")
    .map(b => b.text)
    .join("\n");
}

/**
 * Given the stdout of a bash command we already know was a bare `pwd`,
 * return its resolved absolute path, or null if it doesn't look valid.
 */
function resolvedPwd(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed || trimmed.includes("\n") || !trimmed.startsWith("/")) return null;

  try {
    return fs.realpathSync(trimmed);
  } catch {
    return null;
  }
}

/* ═══════ File discovery & watching ═══════ */

function findTodoMd(startDir: string): string | null {
  const candidate = path.join(path.resolve(startDir), "TODO.md");
  return fs.existsSync(candidate) ? candidate : null;
}

function contentHash(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);
    return `${stat.size}-${stat.mtimeMs}`;
  } catch {
    return "";
  }
}

/* ═══════ Extension factory ═══════ */

export default function taskPlanWidgetExtension(pi: ExtensionAPI): void {
  let currentFilePath: string | null = null;
  let watcher: fs.FSWatcher | null = null;
  let lastHash = "";
  let currentSkillContent = "";
  /** Last known cwd derived from `pwd` output.  Always the source of truth for file lookups. */
  let activePwd: string | null = null;
  /** Most recent ctx we've seen, so the fs.watch callback (which gets no ctx) can still refresh. */
  let lastCtx: ExtensionContext | undefined;

  /* ── Internal helpers ───────────────────────────────────────────── */

  /** Return the working-directory we should search in right now. */
  function getSearchDir(ctx?: ExtensionContext): string {
    if (activePwd) return activePwd;                     // verified pwd wins
    if (ctx && ctx.cwd) return path.resolve(ctx.cwd);     // fallback to context dir
    return ".";
  }

  /** Called when the widget should be refreshed for some reason. */
  function refreshWidget(ctx?: ExtensionContext): void {
    if (ctx) lastCtx = ctx;
    if (!ctx || !ctx.hasUI) return;

    const searchDir = getSearchDir(ctx);
    const found     = findTodoMd(searchDir);

    /* ── Detect new TODO.md appearance (first time we see one) ── */
    const isNew = currentFilePath === null && found !== null;

    if (!found || !fs.existsSync(found)) {                      // nothing to show any more
      ctx.ui.setWidget("task-widget", undefined);
      currentFilePath = null;
      lastHash        = "";
      currentSkillContent = "";
      stopWatching();
      return;
    }

    /* Nothing changed since last render?  Skip. */
    const hash = contentHash(found);
    if (found === currentFilePath && hash === lastHash) return;

    let taskLines: TaskLine[];
    try {
      const fileContent = fs.readFileSync(found, "utf-8");
      taskLines = parseTasks(fileContent);
    } catch {
      /* unreadable — leave widget as-is */
      return;
    }

    /* If this is a brand-new TODO.md, try reading ./task-plan/SKILL.md for rules. */
    if (isNew) {
      const skillPath = path.join(searchDir, "task-plan", "SKILL.md");
      try {
        if (fs.existsSync(skillPath)) {
          currentSkillContent = fs.readFileSync(skillPath, "utf-8");
          ctx.ui.notify("\ud83d\udccb Loaded task-plan rules from ./task-plan/SKILL.md", "info");
        }
      } catch {
        /* SKILL.md not found or unreadable — continue anyway */
      }
    }

    ctx.ui.setWidget("task-widget", (_tui, theme: Theme) => ({
      render(width: number): string[] {
        return renderTaskWidget(taskLines, theme, width);
      },
      invalidate(): void {
        /* nothing cached — render() always recomputes from the latest taskLines */
      },
    }));
    currentFilePath = found;
    lastHash        = hash;
    startWatching(found);                            // re-watch the file's directory
  }

  function stopWatching(): void {
    if (watcher) { watcher.close(); watcher = null; }
  }

  function startWatching(resolvedPath: string): void {
    stopWatching();
    const dir = path.dirname(resolvedPath);
    try {
      watcher = fs.watch(dir, { persistent: true }, () => {
        // Debounce a tick so a half-written save doesn't get read mid-write.
        setTimeout(() => refreshWidget(lastCtx), 50);
      });
    } catch { /* fs.watch unavailable — fine */ }
  }

  /* ═══════ Lifecycle hooks ═══════ */

  pi.on("session_start", async (_event, ctx) => {
    activePwd = null;                          // reset tracking on new session
    refreshWidget(ctx);

    const searchDir = getSearchDir(ctx);
    const found     = findTodoMd(searchDir);
    if (found && ctx.hasUI) {
      ctx.ui.notify("\ud83d\udccb Task Plan widget: watching " + path.basename(found), "info");
    }
  });

  /** After every tool finishes — re-check the current cwd for a TODO.md. */
  pi.on("tool_execution_end", async (_event, ctx) => {
    refreshWidget(ctx);
  });

  /** Before each agent turn — make sure our view is fresh. */
  pi.on("before_agent_start", async (_event, ctx) => {
    refreshWidget(ctx);
  });

  /** Detect when a `pwd` bash command runs; update our active directory tracker. */
  pi.on("tool_result", async (event, ctx) => {
    if (!isBashToolResult(event)) return;

    // Only trust this as a cwd signal if the command really was a bare `pwd` —
    // guessing from output shape alone can misfire on any single-line path-like stdout.
    const command = (event.input as { command?: string } | undefined)?.command?.trim();
    if (command !== "pwd") return;

    const stdout = textFromContent(event.content);
    const newPwd = resolvedPwd(stdout);
    if (!newPwd) return;

    const old = activePwd;
    activePwd = newPwd;                              // update source of truth
    if (old !== newPwd) {                            // directory actually changed
      refreshWidget(ctx);
    }
  });

  /** Detect when the user edits TODO.md directly via tool calls. */
  pi.on("tool_call", async (event, ctx) => {
    if (!currentFilePath) return;
    const target = String((event.input as any)?.path ?? "");
    if (!target) return;

    // normalise to absolute so relative paths still match
    const resolvedTarget = path.resolve(target);
    if (resolvedTarget === path.resolve(currentFilePath)) {
      setTimeout(() => refreshWidget(ctx), 300);     // slight delay for fs flush
    }
  });

  pi.on("session_shutdown", async (_event, _ctx) => {
    stopWatching();
    currentFilePath = null;
    lastHash        = "";
    activePwd       = null;                          // clear pwd cache on session end
    lastCtx         = undefined;
  });

  /** When the agent is idle again — refresh in case tasks were completed. */
  pi.on("agent_settled", async (_event, ctx) => {
    refreshWidget(ctx);
  });

  /** When context compaction happens (user might have done work mid-stream). */
  pi.on("session_compact", async (_event, ctx) => {
    refreshWidget(ctx);
  });
}