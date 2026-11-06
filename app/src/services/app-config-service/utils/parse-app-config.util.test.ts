import { describe, expect, it } from "vitest";
import { parseAppConfig } from "./parse-app-config.util";

describe("parseAppConfig", () => {
  it("keeps stream places from 1 to 6", () => {
    expect(parseAppConfig({ streamPlaces: 1 })).toEqual({ streamPlaces: 1 });
    expect(parseAppConfig({ streamPlaces: 4 })).toEqual({ streamPlaces: 4 });
    expect(parseAppConfig({ streamPlaces: 6 })).toEqual({ streamPlaces: 6 });
  });

  it("leaves out stream places outside 1 to 6, not whole, or not a number", () => {
    for (const wrong of [0, 7, -1, 2.5, "4", null, undefined])
      expect(parseAppConfig({ streamPlaces: wrong })).toEqual({ streamPlaces: null });
  });

  it("says nothing for a file that isn't an object", () => {
    expect(parseAppConfig(null)).toEqual({ streamPlaces: null });
    expect(parseAppConfig("6")).toEqual({ streamPlaces: null });
  });
});
