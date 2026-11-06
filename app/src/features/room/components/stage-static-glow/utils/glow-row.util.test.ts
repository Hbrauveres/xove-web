import { describe, expect, it } from "vitest";
import { STRENGTH } from "../../../constants/static-bands.constants";
import { glowRowColour } from "./glow-row.util";

const channels = (colour: string) => (colour.match(/\d+/g) ?? []).map(Number);

describe("a row of the static's light", () => {
  it("is never brighter than the static looks on the screen", () => {
    for (let t = 0; t < 20_000; t += 777) {
      for (let y = 0; y < 36; y++) {
        for (const c of channels(glowRowColour(y, 36, t)))
          expect(c).toBeLessThanOrEqual(Math.ceil(255 * 0.5 * STRENGTH));
      }
    }
  });

  it("has a touch of blue: red and green a little under it", () => {
    const [r = 0, g = 0, b = 0] = channels(glowRowColour(10, 36, 4200));
    expect(r).toBeLessThanOrEqual(g);
    expect(g).toBeLessThanOrEqual(b);
  });
});
