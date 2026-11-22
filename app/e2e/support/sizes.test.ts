import { describe, expect, it } from "vitest";
import { PHONE, PHONE_TAG } from "./sizes.ts";

describe("the phone's tag", () => {
  it("is picked by the pattern the config runs the phone's cases with", () => {
    expect(PHONE.test(`F-phone-notice.1 a phone gets the notice ${PHONE_TAG}`)).toBe(true);
    expect(PHONE.test("F-stage.1 a desktop case")).toBe(false);
  });
});
