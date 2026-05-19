import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationPill } from "../ToolInvocationPill";

afterEach(() => {
  cleanup();
});

test("str_replace_editor create renders 'Creating {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace renders 'Editing {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Card.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert renders 'Editing {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/Card.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor view renders 'Viewing {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "view", path: "/App.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Viewing App.jsx")).toBeDefined();
});

test("str_replace_editor undo_edit renders 'Undoing edit in {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/App.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

test("file_manager rename renders 'Renaming {old} → {new}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/Old.jsx",
          new_path: "/New.jsx",
        },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Renaming Old.jsx → New.jsx")).toBeDefined();
});

test("file_manager delete renders 'Deleting {file}'", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "delete", path: "/Old.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
});

test("nested path preserves directory and strips leading slash", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Card.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Creating components/Card.jsx")).toBeDefined();
});

test("unknown tool falls back to raw toolName", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "future_tool",
        args: {},
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("future_tool")).toBeDefined();
});

test("partial-call with missing args falls back to raw toolName", () => {
  render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: {},
        state: "partial-call",
      }}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("result state with truthy result shows green dot, no spinner", () => {
  const { container } = render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("call state shows spinner, no green dot", () => {
  const { container } = render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("result state with falsy result still shows spinner", () => {
  const { container } = render(
    <ToolInvocationPill
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: undefined,
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
