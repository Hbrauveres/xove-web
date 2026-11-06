import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageCornerGlow } from "./stage-corner-glow.component";

describe("the empty stage's corner glow", () => {
  it("lights its four corners at the ambilight's brightness", () => {
    const { container } = render(<StageCornerGlow prefs={{ on: true, brightness: 0.7 }} />);
    const glow = container.firstElementChild as HTMLElement;
    expect(glow.querySelectorAll("i")).toHaveLength(4);
    expect(glow.style.opacity).toBe("0.7");
  });

  it("goes dark with the ambilight's switch", () => {
    const { container } = render(<StageCornerGlow prefs={{ on: false, brightness: 0.7 }} />);
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe("0");
  });
});
