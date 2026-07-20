"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function isToolCallDone(toolInvocation: ToolInvocation): boolean {
  return toolInvocation.state === "result" && Boolean(toolInvocation.result);
}

export function getToolCallLabel(toolInvocation: ToolInvocation): string {
  const isDone = isToolCallDone(toolInvocation);
  const args = (toolInvocation.args ?? {}) as Record<string, unknown>;
  const path = typeof args.path === "string" ? args.path : undefined;

  if (toolInvocation.toolName === "str_replace_editor") {
    if (!path) return isDone ? "Updated file" : "Updating file";

    switch (args.command) {
      case "create":
        return isDone ? `Created ${path}` : `Creating ${path}`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited ${path}` : `Editing ${path}`;
      case "view":
        return isDone ? `Viewed ${path}` : `Viewing ${path}`;
      case "undo_edit":
        return isDone ? `Reverted edit to ${path}` : `Reverting edit to ${path}`;
      default:
        return isDone ? `Updated ${path}` : `Updating ${path}`;
    }
  }

  if (toolInvocation.toolName === "file_manager") {
    if (!path) return isDone ? "Updated file" : "Updating file";
    const newPath = typeof args.new_path === "string" ? args.new_path : undefined;

    switch (args.command) {
      case "rename":
        return newPath
          ? isDone
            ? `Renamed ${path} to ${newPath}`
            : `Renaming ${path} to ${newPath}`
          : isDone
          ? `Renamed ${path}`
          : `Renaming ${path}`;
      case "delete":
        return isDone ? `Deleted ${path}` : `Deleting ${path}`;
      default:
        return isDone ? `Updated ${path}` : `Updating ${path}`;
    }
  }

  return toolInvocation.toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const isDone = isToolCallDone(toolInvocation);
  const label = getToolCallLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
