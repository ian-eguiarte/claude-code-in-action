import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

function makeInvocation(overrides: Partial<ToolInvocation>): ToolInvocation {
  return {
    toolCallId: "call-1",
    toolName: "str_replace_editor",
    args: {},
    state: "result",
    result: "Success",
    ...overrides,
  } as ToolInvocation;
}

test("shows 'Creating <path>' while a create call is in progress", () => {
  const toolInvocation = makeInvocation({
    state: "call",
    args: { command: "create", path: "src/components/Card.tsx" },
  });

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating src/components/Card.tsx")).toBeDefined();
});

test("shows 'Created <path>' once a create call resolves", () => {
  const toolInvocation = makeInvocation({
    state: "result",
    result: "File created",
    args: { command: "create", path: "src/components/Card.tsx" },
  });

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Created src/components/Card.tsx")).toBeDefined();
});

test("shows 'Editing <path>' / 'Edited <path>' for str_replace calls", () => {
  const inProgress = makeInvocation({
    state: "call",
    args: { command: "str_replace", path: "src/App.tsx" },
  });
  const { unmount } = render(<ToolCallBadge toolInvocation={inProgress} />);
  expect(screen.getByText("Editing src/App.tsx")).toBeDefined();
  unmount();

  const done = makeInvocation({
    state: "result",
    result: "OK",
    args: { command: "str_replace", path: "src/App.tsx" },
  });
  render(<ToolCallBadge toolInvocation={done} />);
  expect(screen.getByText("Edited src/App.tsx")).toBeDefined();
});

test("treats insert commands the same as edits", () => {
  const toolInvocation = makeInvocation({
    state: "result",
    result: "OK",
    args: { command: "insert", path: "src/App.tsx" },
  });

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Edited src/App.tsx")).toBeDefined();
});

test("shows a rename message including both paths", () => {
  const toolInvocation = makeInvocation({
    toolName: "file_manager",
    state: "result",
    result: { success: true },
    args: {
      command: "rename",
      path: "old/Name.tsx",
      new_path: "new/Name.tsx",
    },
  });

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(
    screen.getByText("Renamed old/Name.tsx to new/Name.tsx")
  ).toBeDefined();
});

test("shows a delete message for file_manager delete calls", () => {
  const toolInvocation = makeInvocation({
    toolName: "file_manager",
    state: "call",
    args: { command: "delete", path: "src/old.tsx" },
  });

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting src/old.tsx")).toBeDefined();
});

test("falls back to the raw tool name for unknown tools", () => {
  const toolInvocation = makeInvocation({
    toolName: "some_other_tool",
    args: { command: "create", path: "x.tsx" },
  });

  expect(getToolCallLabel(toolInvocation)).toBe("some_other_tool");
});

test("falls back to a generic message when no path is provided", () => {
  const inProgress = makeInvocation({
    state: "call",
    args: { command: "create" },
  });
  expect(getToolCallLabel(inProgress)).toBe("Updating file");

  const done = makeInvocation({
    state: "result",
    result: "OK",
    args: { command: "create" },
  });
  expect(getToolCallLabel(done)).toBe("Updated file");
});

test("shows a green dot once the call has a result, a spinner while pending", () => {
  const inProgress = makeInvocation({
    state: "call",
    args: { command: "create", path: "a.tsx" },
  });
  const { container, unmount } = render(
    <ToolCallBadge toolInvocation={inProgress} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
  unmount();

  const done = makeInvocation({
    state: "result",
    result: "OK",
    args: { command: "create", path: "a.tsx" },
  });
  const { container: doneContainer } = render(
    <ToolCallBadge toolInvocation={done} />
  );
  expect(screen.getByText("Created a.tsx")).toBeDefined();
  expect(doneContainer.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(doneContainer.querySelector(".animate-spin")).toBeNull();
});
