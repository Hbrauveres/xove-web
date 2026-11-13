import { expect, it } from "vitest";
import { usableTabs } from "./usable-tabs.util";

it("leaves out Screen where a screen can't be shared", () => {
  expect(usableTabs({ screenTab: true })).toEqual(["screen", "camera", "voice"]);
  expect(usableTabs({ screenTab: false })).toEqual(["camera", "voice"]);
});
