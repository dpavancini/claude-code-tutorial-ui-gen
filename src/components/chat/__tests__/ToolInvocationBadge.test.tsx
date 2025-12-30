import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolDescription } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// Tests for getToolDescription function
test("getToolDescription returns 'Creating' for str_replace_editor create command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Button.tsx" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Creating Button.tsx");
});

test("getToolDescription returns 'Reading' for str_replace_editor view command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "view", path: "/src/App.jsx" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Reading App.jsx");
});

test("getToolDescription returns 'Editing' for str_replace_editor str_replace command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/lib/utils.ts" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Editing utils.ts");
});

test("getToolDescription returns 'Inserting code' for str_replace_editor insert command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/index.tsx" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Inserting code in index.tsx");
});

test("getToolDescription returns 'Renaming' for file_manager rename command", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: { command: "rename", path: "/old.tsx", new_path: "/new.tsx" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Renaming old.tsx to new.tsx");
});

test("getToolDescription returns 'Deleting' for file_manager delete command", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: { command: "delete", path: "/unused.ts" },
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Deleting unused.ts");
});

test("getToolDescription returns toolName for unknown tools", () => {
  const toolInvocation = {
    toolName: "unknown_tool",
    args: {},
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("unknown_tool");
});

test("getToolDescription handles missing args gracefully", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    state: "result",
  };
  expect(getToolDescription(toolInvocation)).toBe("Editing file");
});

// Tests for ToolInvocationBadge component
test("renders with loading state", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.tsx" },
    state: "pending",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.tsx")).toBeDefined();
  // Check for spinner (Loader2 component)
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
});

test("renders with completed state", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "create", path: "/Button.tsx" },
    state: "result",
    result: "File created",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
  // Check for green dot (completed indicator)
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
});

test("renders correct description for editing operation", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/components/Header.tsx" },
    state: "result",
    result: "Replaced 1 occurrence",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing Header.tsx")).toBeDefined();
});

test("renders correct description for delete operation", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: { command: "delete", path: "/temp/unused.ts" },
    state: "result",
    result: "File deleted",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting unused.ts")).toBeDefined();
});

test("renders correct description for rename operation", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: { command: "rename", path: "/OldName.tsx", new_path: "/NewName.tsx" },
    state: "result",
    result: "File renamed",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming OldName.tsx to NewName.tsx")).toBeDefined();
});

test("has correct styling classes", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: { command: "create", path: "/test.tsx" },
    state: "result",
    result: "done",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  const badge = container.firstChild as HTMLElement;
  expect(badge.className).toContain("inline-flex");
  expect(badge.className).toContain("items-center");
  expect(badge.className).toContain("bg-neutral-50");
  expect(badge.className).toContain("rounded-lg");
  expect(badge.className).toContain("font-mono");
});
