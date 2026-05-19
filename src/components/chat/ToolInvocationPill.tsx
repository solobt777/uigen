import { Loader2 } from "lucide-react";

interface ToolInvocationLike {
  toolName: string;
  args?: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

interface ToolInvocationPillProps {
  toolInvocation: ToolInvocationLike;
}

function stripLeadingSlash(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function describeToolInvocation(
  toolName: string,
  args: Record<string, unknown> | undefined
): string {
  const command = args?.command as string | undefined;
  const path = args?.path as string | undefined;
  const newPath = args?.new_path as string | undefined;

  if (toolName === "str_replace_editor" && command && path) {
    const file = stripLeadingSlash(path);
    switch (command) {
      case "create":
        return `Creating ${file}`;
      case "str_replace":
      case "insert":
        return `Editing ${file}`;
      case "view":
        return `Viewing ${file}`;
      case "undo_edit":
        return `Undoing edit in ${file}`;
    }
  }

  if (toolName === "file_manager" && command && path) {
    const file = stripLeadingSlash(path);
    if (command === "rename" && newPath) {
      return `Renaming ${file} → ${stripLeadingSlash(newPath)}`;
    }
    if (command === "delete") {
      return `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolInvocationPill({ toolInvocation }: ToolInvocationPillProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = describeToolInvocation(toolName, args);
  const isComplete = state === "result" && Boolean(result);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
