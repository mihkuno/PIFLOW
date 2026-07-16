import type { EntryRenderer, ToolExecutionStartEvent } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";

interface PendingToolData {
  toolName: string;
  argsSummary: string;
}

function getArgsSummary(toolName: string, input: unknown): string {
  if (!input) return "";
  const safeInput = input as Record<string, unknown>;
  const parts: string[] = [];

  if (toolName === "bash") {
    const cmd = String(safeInput.command || "(empty)").slice(0, 80);
    parts.push(cmd);
  } else if (safeInput.path !== undefined) {
    parts.push(String(safeInput.path));
    if (safeInput.offset !== undefined) parts.push(`offset=${Number(safeInput.offset)}`);
    if (safeInput.limit !== undefined) parts.push(`limit=${Number(safeInput.limit)}`);
  } else if (typeof safeInput.edits === "object" && safeInput.edits !== null) {
    const edits = safeInput.edits as Array<Record<string, unknown>>;
    parts.push(`${edits.length} edit block(s)`);
  } else if (safeInput.content !== undefined) {
    const content = String(safeInput.content);
    parts.push(`${content.split("\n").length} lines`);
  } else {
    parts.push(JSON.stringify(safeInput).slice(0, 60));
  }

  return parts.join(", ");
}

const toolRunningRenderer: EntryRenderer<PendingToolData> = (entry, _options, theme) => {
  const data = entry.data as PendingToolData;
  const box = new Box(1, 1);

  let headerText: string;
  if (data.toolName.includes("✅") || data.toolName.includes("❌")) {
    // Done row
    const resultIcon = data.toolName.includes("✅") ? "✅" : "❌";
    const toolNameClean = data.toolName.replace(/[✅❌]/g, "").trim();
    headerText = theme.fg(data.toolName.includes("✅") ? "success" : "error", 
      resultIcon + "") +
      " " +
      theme.bold(theme.fg("toolTitle", toolNameClean));
  } else {
    // Pending row
    headerText = theme.fg("warning", "⏳ ") + theme.bold(data.toolName);
  }
  box.addChild(new Text(headerText, 0, 0));

  if (data.argsSummary) {
    box.addChild(new Text(theme.fg("dim", "  " + data.argsSummary), 0, 0));
  }

  return box;
};

export default function (pi: ReturnType<typeof import("@earendil-works/pi-coding-agent").ExtensionAPI>) {
  // Register entry renderer — displays tool rows in the TUI chat transcript
  pi.registerEntryRenderer<PendingToolData>("tool-running", toolRunningRenderer);

  const activeTools = new Set<string>();

  pi.on("turn_start", async (_event, ctx) => {
    if (!ctx.hasUI || ctx.mode !== "tui") return;
    activeTools.clear();
  });

  pi.on("tool_execution_start", async (event: ToolExecutionStartEvent, ctx) => {
    if (!ctx.hasUI || ctx.mode !== "tui") return;

    const key = event.toolCallId ?? `${event.toolName}-${Date.now()}`;
    if (activeTools.has(key)) return;
    activeTools.add(key);

    const toolName = event.toolName;
    const input = event.args ?? {};
    const argsSummary = getArgsSummary(toolName, input);

    try {
      pi.appendEntry<PendingToolData>("tool-running", {
        toolName: `${toolName}`,
        argsSummary,
      });
    } catch (err) {
      // ignore during startup or when no active session
    }
  });

  pi.on("tool_execution_end", async (event, ctx) => {
    if (!ctx.hasUI || ctx.mode !== "tui") return;

    const toolName = event.toolName;
    const isError = event.isError as boolean;

    try {
      pi.appendEntry<PendingToolData>("tool-running", {
        toolName: `${toolName} ${isError ? "❌" : "✅"}`,
        argsSummary: isError ? "completed with error" : "completed successfully",
      });
    } catch (err) {
      // ignore during startup or when no active session
    }

    const key = event.toolCallId ?? `${toolName}`;
    activeTools.delete(key);
  });
}
