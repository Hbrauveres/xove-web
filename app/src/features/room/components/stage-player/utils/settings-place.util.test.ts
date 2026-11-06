import { describe, expect, it } from "vitest";
import { settingsPlace } from "./settings-place.util";

describe("where the settings open", () => {
  it("is centred on the cog, 10 px above the row of buttons", () => {
    const player = DOMRect.fromRect({ x: 100, y: 50, width: 1600, height: 900 });
    const cog = DOMRect.fromRect({ x: 900, y: 860, width: 40, height: 40 });
    const row = DOMRect.fromRect({ x: 700, y: 850, width: 400, height: 60 });
    expect(settingsPlace(player, cog, row)).toEqual({ "--cog-x": "820px", "--above-row": "110px" });
  });
});
