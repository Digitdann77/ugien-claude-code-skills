import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

function renderTool(overrides: Record<string, unknown> = {}) {
  const defaults = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result" as const,
    result: "Success",
  };
  return render(<ToolCallDisplay tool={{ ...defaults, ...overrides } as any} />);
}

test("shows 'Created' and path for completed str_replace_editor create", () => {
  renderTool();

  expect(screen.getByText("Created")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
  // Path should be in a <code> element with font-mono
  const code = screen.getByText("/App.jsx");
  expect(code.tagName).toBe("CODE");
  expect(code.className).toContain("font-mono");
});

test("shows 'Creating' with spinner for in-progress create", () => {
  const { container } = renderTool({ state: "call", result: undefined });

  expect(screen.getByText("Creating")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  // Should NOT have green dot
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot for completed tool call", () => {
  const { container } = renderTool();

  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows 'Edited' for completed str_replace", () => {
  renderTool({ args: { command: "str_replace", path: "/App.jsx" } });

  expect(screen.getByText("Edited")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
});

test("shows 'Edited' for completed insert", () => {
  renderTool({ args: { command: "insert", path: "/App.jsx" } });

  expect(screen.getByText("Edited")).toBeDefined();
});

test("shows 'Editing' for in-progress str_replace", () => {
  renderTool({
    args: { command: "str_replace", path: "/App.jsx" },
    state: "call",
    result: undefined,
  });

  expect(screen.getByText("Editing")).toBeDefined();
});

test("shows 'Viewed' for completed view", () => {
  renderTool({ args: { command: "view", path: "/App.jsx" } });

  expect(screen.getByText("Viewed")).toBeDefined();
});

test("shows 'Undid edit to' for completed undo_edit", () => {
  renderTool({ args: { command: "undo_edit", path: "/App.jsx" } });

  expect(screen.getByText("Undid edit to")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
});

test("shows 'Deleted' for completed file_manager delete", () => {
  renderTool({
    toolName: "file_manager",
    args: { command: "delete", path: "/utils.js" },
  });

  expect(screen.getByText("Deleted")).toBeDefined();
  expect(screen.getByText("/utils.js")).toBeDefined();
});

test("shows 'Renamed' with both paths for completed rename", () => {
  const { container } = renderTool({
    toolName: "file_manager",
    args: { command: "rename", path: "/Old.jsx", new_path: "/New.jsx" },
  });

  const span = container.querySelector(".text-neutral-700")!;
  expect(span.textContent).toContain("Renamed");
  expect(span.textContent).toContain("/Old.jsx");
  expect(span.textContent).toContain("/New.jsx");
  // Both paths should be in <code> elements
  const codes = span.querySelectorAll("code");
  expect(codes).toHaveLength(2);
  expect(codes[0].textContent).toBe("/Old.jsx");
  expect(codes[1].textContent).toBe("/New.jsx");
});

test("falls back to raw tool name when args are missing", () => {
  renderTool({ args: {} });

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("falls back to raw tool name for unknown tool", () => {
  renderTool({ toolName: "unknown_tool", args: { command: "foo" } });

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("handles partial-call state gracefully", () => {
  const { container } = renderTool({
    state: "partial-call",
    result: undefined,
    args: { command: "create", path: "/App.jsx" },
  });

  expect(screen.getByText("Creating")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});
