import { describe, expect, it } from "vitest";
import { problems } from "./check-size.ts";

const budget = { js: 295, css: 19 };

describe("the size budget", () => {
  it("passes sizes within the budget, today's included", () => {
    expect(problems({ js: 267.5, css: 17.2 }, budget)).toEqual([]);
    expect(problems({ js: 295, css: 19 }, budget)).toEqual([]);
  });

  it("fails a size over its budget", () => {
    expect(problems({ js: 296, css: 17 }, budget)).toEqual(["js: 296.0 kB, over its 295 kB budget"]);
  });

  it("asks for the budget to come down when the app got much lighter", () => {
    expect(problems({ js: 200, css: 17 }, budget)).toEqual([
      "js: 200.0 kB, well under its 295 kB budget: lower it to 220 kB",
    ]);
  });
});
