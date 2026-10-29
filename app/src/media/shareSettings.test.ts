import { describe, expect, it } from "vitest";
import { viewerQualities } from "./shareSettings";

describe("what a viewer can pick", () => {
  it("offers the sharer's quality and the ones below it, down to 480p", () => {
    expect(viewerQualities(1080)).toEqual(["1080p", "720p", "480p"]);
    expect(viewerQualities(720)).toEqual(["720p", "480p"]);
    expect(viewerQualities(480)).toEqual(["480p"]);
  });

  it("goes by the sharer's real height, which can be a bit smaller than the preset", () => {
    // A 16:10 or ultrawide screen captured into 1920x1080 comes out shorter.
    expect(viewerQualities(1012)).toEqual(["1080p", "720p", "480p"]);
    expect(viewerQualities(700)).toEqual(["720p", "480p"]);
    expect(viewerQualities(0)).toEqual(["480p"]);
  });

  it("never offers more than the sharer's chosen quality", () => {
    expect(viewerQualities(1080, 3, "720p")).toEqual(["720p", "480p"]);
    expect(viewerQualities(1080, 3, "480p")).toEqual(["480p"]);
    expect(viewerQualities(720, 3, "1080p")).toEqual(["720p", "480p"]);
  });

  it("offers only one quality when the sharer sends one layer", () => {
    expect(viewerQualities(1080, 1)).toEqual(["1080p"]);
  });
});
