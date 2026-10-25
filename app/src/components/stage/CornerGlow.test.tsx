import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CornerGlow } from "./CornerGlow";

describe("the empty stage's corner glow (spec 0123, design decision 7)", () => {
  it("goes dark with the ambilight's switch", () => {
    const { container } = render(<CornerGlow prefs={{ on: false, brightness: 0.7 }} />);
    expect((container.querySelector("[data-corner-glow]") as HTMLElement).style.opacity).toBe("0");
  });
});
