import { describe, expect, it } from "vitest";
import { panelAttributes, tabAttributes } from "./tab-attributes.util";

describe("tabs' attributes", () => {
  it("make the chosen tab the one stop of the Tab key, pointing at its panel", () => {
    expect(tabAttributes("t-camera", true, false)).toMatchObject({
      "aria-selected": true,
      "aria-controls": "t-camera-panel",
      tabIndex: 0,
    });
    expect(tabAttributes("t-voice", false, false)).toMatchObject({ "aria-controls": undefined, tabIndex: -1 });
    expect(tabAttributes("t-screen", false, true)["aria-disabled"]).toBe(true);
  });

  it("hide a panel that isn't chosen from sight, assistive tech and the keyboard", () => {
    expect(panelAttributes("t-voice", false)).toMatchObject({ "aria-hidden": true, inert: true, "data-off": true });
    expect(panelAttributes("t-camera", true)).toMatchObject({
      "aria-labelledby": "t-camera",
      "aria-hidden": undefined,
      inert: undefined,
    });
  });
});
