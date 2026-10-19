import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CornerGlow } from "./CornerGlow";

describe("the empty stage's corner glow (spec 0123, design decision 7)", () => {
  it("is an L at each corner, at the ambilight's brightness", () => {
    const { container } = render(<CornerGlow prefs={{ on: true, brightness: 0.7 }} />);
    const glow = container.querySelector("[data-corner-glow]") as HTMLElement;
    expect([...glow.querySelectorAll("i")].map((i) => i.dataset.at)).toEqual(["tl", "tr", "bl", "br"]);
    expect(glow.style.opacity).toBe("0.7");
    expect(glow).toHaveAttribute("aria-hidden", "true");
  });

  it("goes dark with the ambilight's switch", () => {
    const { container } = render(<CornerGlow prefs={{ on: false, brightness: 0.7 }} />);
    expect((container.querySelector("[data-corner-glow]") as HTMLElement).style.opacity).toBe("0");
  });
});
