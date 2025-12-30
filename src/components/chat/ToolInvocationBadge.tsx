"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args?: {
    command?: string;
    path?: string;
    new_path?: string;
  };
  state: string;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolDescription(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;
  const fileName = args?.path ? getFileName(args.path) : "file";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return `Creating ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      case "str_replace":
        return `Editing ${fileName}`;
      case "insert":
        return `Inserting code in ${fileName}`;
      case "undo_edit":
        return `Undoing changes in ${fileName}`;
      default:
        return `Editing ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename":
        const newFileName = args?.new_path ? getFileName(args.new_path) : "file";
        return `Renaming ${fileName} to ${newFileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const description = getToolDescription(toolInvocation);
  const isComplete = toolInvocation.state === "result" && toolInvocation.result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{description}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{description}</span>
        </>
      )}
    </div>
  );
}
