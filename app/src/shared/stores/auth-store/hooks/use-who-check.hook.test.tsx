import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { aUser, installFakeApi } from "../../../../testing/fakes/api.fake";
import { CHECK_TIMEOUT_MS, RETRY_COOLDOWN_MS, RETRY_DELAYS_MS } from "../constants/auth-check.constants";
import { useWhoCheck } from "./use-who-check.hook";

const ME = "GET /api/me";
/** Lets the fake clock run `ms` on, and what was waiting on it happen. */
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const checks = (server: ReturnType<typeof installFakeApi>) =>
  server.calls.filter((c) => c.method === "GET" && c.path === "/api/me").length;

describe("checking who's signed in, and trying again", () => {
  it("tries again after 2, 4, 8, 16, 30 and 30 s while the API can't be reached, then stops", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    expect(checks(server)).toBe(1);

    for (const [i, wait] of RETRY_DELAYS_MS.entries()) {
      expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: Date.now() + wait });
      await pass(wait - 1);
      expect(checks(server)).toBe(i + 1);
      await pass(1);
      expect(checks(server)).toBe(i + 2);
    }
    expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: null });
    await pass(10 * 60_000);
    expect(checks(server)).toBe(RETRY_DELAYS_MS.length + 1);
  });

  it("counts a check that hangs as no answer once it has waited long enough", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.hanging.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(CHECK_TIMEOUT_MS - 1);
    expect(result.current.state.status).toBe("loading");
    await pass(1);
    expect(result.current.state.status).toBe("unreachable");
  });

  it("goes on as soon as a try gets an answer", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser({ email: "ana@example.com" }) });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    await pass(RETRY_DELAYS_MS[0] ?? 0);
    server.unreachable.clear();
    await pass(RETRY_DELAYS_MS[1] ?? 0);
    expect(result.current.state).toMatchObject({ status: "signedIn", me: { email: "ana@example.com" } });
  });

  it("can't be made to try sooner while it waits; once it stopped, a press starts a new round", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    act(() => result.current.retry());
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(1);

    await pass(RETRY_DELAYS_MS.reduce((a, b) => a + b, 0));
    const stopped = checks(server);
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(stopped + 1);
    expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: Date.now() + (RETRY_DELAYS_MS[0] ?? 0) });
  });

  it("on a failure, tries once a press, ignores presses while it tries and for a while after it fails again", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.failures.set(ME, { status: 500 });
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    expect(result.current.state).toEqual({ status: "failed", busy: false });

    act(() => result.current.retry());
    act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: "failed", busy: true });
    await pass(0);
    expect(checks(server)).toBe(2);

    await pass(RETRY_COOLDOWN_MS - 1);
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(2);
    expect(result.current.state).toEqual({ status: "failed", busy: true });
    await pass(1);
    expect(result.current.state).toEqual({ status: "failed", busy: false });
  });

  it("signs out on the API's 'nobody is signed in'", async () => {
    onFakeClock();
    installFakeApi({ me: null });
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    expect(result.current.state).toEqual({ status: "signedOut" });
  });

  it("stops trying once the page is gone", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { unmount } = renderHook(() => useWhoCheck());
    await pass(0);
    unmount();
    await pass(60_000);
    expect(checks(server)).toBe(1);
  });

  it("runs one round only when mounted twice, as StrictMode does", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    renderHook(() => useWhoCheck(), { wrapper: StrictMode });
    await pass(RETRY_DELAYS_MS.reduce((a, b) => a + b, 0) + 60_000);
    // The first mount's check, then one round: its first check and its retries.
    expect(checks(server)).toBe(RETRY_DELAYS_MS.length + 2);
  });

  it("ignores a second press in the same moment, once stopped and after a failure", async () => {
    onFakeClock();
    const down = installFakeApi({ me: aUser() });
    down.unreachable.add(ME);
    const stopped = renderHook(() => useWhoCheck());
    await pass(RETRY_DELAYS_MS.reduce((a, b) => a + b, 0));
    const before = checks(down);
    act(() => {
      stopped.result.current.retry();
      stopped.result.current.retry();
    });
    await pass(0);
    expect(checks(down)).toBe(before + 1);
    stopped.unmount();

    const failing = installFakeApi({ me: aUser() });
    failing.failures.set(ME, { status: 500 });
    const failed = renderHook(() => useWhoCheck());
    await pass(0);
    act(() => {
      failed.result.current.retry();
      failed.result.current.retry();
    });
    await pass(0);
    expect(checks(failing)).toBe(2);
  });

  it("hands out the same value while nothing changes", async () => {
    onFakeClock();
    installFakeApi({ me: aUser() });
    const { result, rerender } = renderHook(() => useWhoCheck());
    await pass(0);
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
