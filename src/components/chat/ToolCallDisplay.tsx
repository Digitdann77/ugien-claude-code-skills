import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallDisplayProps {
  tool: ToolInvocation;
}

interface LabelParts {
  action: string;
  path?: string;
  newPath?: string;
}

function getLabelParts(tool: ToolInvocation): LabelParts {
  const { toolName, args, state } = tool;
  const done = state === "result";
  const path = args?.path as string | undefined;
  const command = args?.command as string | undefined;

  if (toolName === "str_replace_editor" && path) {
    switch (command) {
      case "create":
        return { action: done ? "Created" : "Creating", path };
      case "str_replace":
      case "insert":
        return { action: done ? "Edited" : "Editing", path };
      case "view":
        return { action: done ? "Viewed" : "Viewing", path };
      case "undo_edit":
        return { action: done ? "Undid edit to" : "Undoing edit to", path };
    }
  }

  if (toolName === "file_manager" && path) {
    switch (command) {
      case "rename":
        return {
          action: done ? "Renamed" : "Renaming",
          path,
          newPath: args?.new_path as string | undefined,
        };
      case "delete":
        return { action: done ? "Deleted" : "Deleting", path };
    }
  }

  return { action: toolName };
}

export function ToolCallDisplay({ tool }: ToolCallDisplayProps) {
  const label = getLabelParts(tool);
  const done = tool.state === "result" && "result" in tool;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">
        {label.action}
        {label.path && (
          <>
            {" "}
            <code className="font-mono">{label.path}</code>
          </>
        )}
        {label.newPath && (
          <>
            {" to "}
            <code className="font-mono">{label.newPath}</code>
          </>
        )}
      </span>
    </div>
  );
}
