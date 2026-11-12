import { describe, expect, it } from "vitest";
import type { LiveFeed } from "../../../../types/room-view.types";
import { askedQuality } from "./asked-quality.util";

const feed = (quality: "1080p" | "720p" | "480p"): LiveFeed => ({
  kind: "screen",
  startedAt: 0,
  settings: { quality, mode: "sharp" },
  remote: { video: { attach: (el) => el, detach: (el) => el }, height: 1080, layers: 3, setQuality: () => undefined },
});

describe("the quality asked of the big stream", () => {
  it("is Auto for a sharer's best, or nothing on the stage", () => {
    expect(askedQuality(feed("1080p"))).toBe("auto");
    expect(askedQuality(null)).toBe("auto");
  });

  it("is the cap when the sharer sends less", () => {
    expect(askedQuality(feed("720p"))).toBe("720p");
    expect(askedQuality(feed("480p"))).toBe("480p");
  });
});
