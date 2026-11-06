import { describe, expect, it, vi } from "vitest";
import { appConfig } from "./app-config.service";
import { APP_CONFIG_WAIT_MS } from "./constants/app-config.constants";

const answering = (body: string, ok = true) =>
  vi.fn(async () => new Response(body, { status: ok ? 200 : 404, headers: { "Content-Type": "application/json" } }));

describe("the app's config", () => {
  it("says nothing before it's read", () => {
    expect(appConfig.read()).toEqual({ streamPlaces: null });
  });

  it("reads /config.json once, never from the cache, and keeps what it says", async () => {
    const fetch = answering('{"streamPlaces":4}');
    vi.stubGlobal("fetch", fetch);
    await appConfig.load();
    expect(fetch).toHaveBeenCalledWith("/config.json", expect.objectContaining({ cache: "no-store" }));
    expect(appConfig.read()).toEqual({ streamPlaces: 4 });
  });

  it("says nothing when the file is missing, isn't JSON, or can't be reached", async () => {
    for (const fetch of [
      answering("Not found", false),
      answering("<html>"),
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    ]) {
      vi.stubGlobal("fetch", fetch);
      await expect(appConfig.load()).resolves.toBeUndefined();
      expect(appConfig.read()).toEqual({ streamPlaces: null });
    }
  });

  it("gives up on a file that doesn't come in time, so the app still shows", async () => {
    const wait = vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        if (init.signal?.aborted) throw new DOMException("timed out", "TimeoutError");
        return Response.json({ streamPlaces: 4 });
      }),
    );
    await appConfig.load();
    expect(wait).toHaveBeenCalledWith(APP_CONFIG_WAIT_MS);
    expect(appConfig.read()).toEqual({ streamPlaces: null });
  });
});
