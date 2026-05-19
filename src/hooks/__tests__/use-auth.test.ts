import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

const mockPush = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as any).mockReturnValue({ push: mockPush });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signIn", () => {
    test("returns the result from signInAction on success", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "password");
      });

      expect(signInAction).toHaveBeenCalledWith("a@b.com", "password");
      expect(returned).toEqual({ success: true });
    });

    test("returns the failure result and does not navigate when signInAction fails", async () => {
      (signInAction as any).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returned).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("sets isLoading to true during the call and false after success", async () => {
      let resolveSignIn: (value: any) => void = () => {};
      (signInAction as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignIn = resolve;
          })
      );
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "password");
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveSignIn({ success: true });
        await signInPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false when signInAction throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("network down"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.signIn("a@b.com", "password")
        ).rejects.toThrow("network down");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("returns the result from signUpAction on success", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("new@user.com", "password");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@user.com", "password");
      expect(returned).toEqual({ success: true });
    });

    test("returns the failure result and does not navigate when signUpAction fails", async () => {
      (signUpAction as any).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("taken@user.com", "password");
      });

      expect(returned).toEqual({
        success: false,
        error: "Email already registered",
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("resets isLoading to false when signUpAction throws", async () => {
      (signUpAction as any).mockRejectedValue(new Error("boom"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.signUp("a@b.com", "password")
        ).rejects.toThrow("boom");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post-auth navigation", () => {
    test("creates a project from anonymous work, clears it, and navigates to the new project", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "x" } },
      };
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(anonWork);
      (createProject as any).mockResolvedValue({ id: "anon-project-id" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(createProject).toHaveBeenCalledTimes(1);
      const createArg = (createProject as any).mock.calls[0][0];
      expect(createArg.messages).toBe(anonWork.messages);
      expect(createArg.data).toBe(anonWork.fileSystemData);
      expect(typeof createArg.name).toBe("string");
      expect(createArg.name).toMatch(/^Design from /);

      expect(clearAnonWork).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      expect(getProjects).not.toHaveBeenCalled();
    });

    test("ignores anonymous work with an empty messages array and navigates to existing project", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      (getProjects as any).mockResolvedValue([
        { id: "recent" },
        { id: "older" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(getProjects).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/recent");
    });

    test("navigates to the first existing project when no anonymous work is found", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([
        { id: "first" },
        { id: "second" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/first");
      expect(createProject).not.toHaveBeenCalled();
      expect(clearAnonWork).not.toHaveBeenCalled();
    });

    test("creates a new project when no anonymous work and no existing projects", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "brand-new" });

      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.42);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(createProject).toHaveBeenCalledTimes(1);
      const arg = (createProject as any).mock.calls[0][0];
      expect(arg.messages).toEqual([]);
      expect(arg.data).toEqual({});
      expect(arg.name).toBe(`New Design #${~~(0.42 * 100000)}`);
      expect(mockPush).toHaveBeenCalledWith("/brand-new");

      randomSpy.mockRestore();
    });

    test("runs post-auth flow after successful signUp the same way as signIn", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "after-signup" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@user.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/after-signup");
    });
  });

  describe("isLoading lifecycle", () => {
    test("isLoading reflects only the most recent call", async () => {
      (signInAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signIn("a@b.com", "password");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
