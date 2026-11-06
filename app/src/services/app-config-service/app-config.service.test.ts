import { describe, expect, it, vi } from "vitest";
import { appConfig } from "./app-config.service";

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
    expect(fetch).toHaveBeenCalledWith("/config.json", { cache: "no-store" });
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
});
