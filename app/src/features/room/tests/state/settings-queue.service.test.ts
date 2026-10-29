import { describe, expect, it, vi } from "vitest";
import type { StreamSettings } from "@core/api/types/api.types";
import { SettingsQueue } from "../../state/settings-queue.service";

const s = (quality: StreamSettings["quality"], mode: StreamSettings["mode"] = "smooth"): StreamSettings => ({
  quality,
  mode,
});
const start = () => new SettingsQueue({ screen: s("1080p"), camera: s("720p") });

describe("the settings queue", () => {
  it("applies changes one after another, in the order they were made", async () => {
    const queue = start();
    const order: string[] = [];
    const apply = (label: string) => async () => {
      order.push(label);
      return true;
    };
    void queue.change("screen", s("720p"), apply("720p"), vi.fn());
    await queue.change("screen", s("480p"), apply("480p"), vi.fn());
    expect(order).toEqual(["720p", "480p"]);
    expect(queue.acceptedFor("screen")).toEqual(s("480p"));
  });

  it("puts a refused change back to the last accepted settings", async () => {
    const queue = start();
    const putBack = vi.fn(async () => {});
    await queue.change("screen", s("480p"), async () => false, putBack);
    expect(putBack).toHaveBeenCalledWith(s("1080p"));
    expect(queue.acceptedFor("screen")).toEqual(s("1080p"));
  });

  it("lets a newer change of the same stream decide, instead of putting back an older refusal", async () => {
    const queue = start();
    const putBack = vi.fn(async () => {});
    void queue.change("screen", s("480p"), async () => false, putBack);
    await queue.change("screen", s("720p", "sharp"), async () => true, putBack);
    expect(putBack).not.toHaveBeenCalled();
    expect(queue.acceptedFor("screen")).toEqual(s("720p", "sharp"));
  });

  it("puts a refused screen change back even when the camera changes right after", async () => {
    const queue = start();
    const putBack = vi.fn(async () => {});
    void queue.change("screen", s("480p"), async () => false, putBack);
    await queue.change("camera", s("480p"), async () => true, vi.fn());
    expect(putBack).toHaveBeenCalledWith(s("1080p"));
    expect(queue.acceptedFor("camera")).toEqual(s("480p"));
  });

  it("goes on with the next change when one fails on its way", async () => {
    const queue = start();
    const failed = queue.change("screen", s("480p"), async () => Promise.reject(new Error("offline")), vi.fn());
    await expect(failed).rejects.toThrow("offline");
    await queue.change("screen", s("720p"), async () => true, vi.fn());
    expect(queue.acceptedFor("screen")).toEqual(s("720p"));
  });
});
