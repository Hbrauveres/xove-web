import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EYE_DOT, EYE_RING } from "./constants/eye.constants";
import { StageEmptyScene } from "./stage-empty-scene.component";

describe("the empty stage's scene", () => {
  it("draws the eye of Xovê's mark: its ring and its dot, no corners", () => {
    const { container } = render(<StageEmptyScene />);
    const eye = container.querySelector('[data-part="eye"]');
    const [ring, dot] = [...(eye?.querySelectorAll("circle") ?? [])];
    expect(eye?.querySelectorAll("polyline")).toHaveLength(0);
    expect(ring).toHaveAttribute("r", String(EYE_RING.r));
    expect(dot).toHaveAttribute("r", String(EYE_DOT.r));
  });

  it("lays a grid on the floor, and is only a picture: hidden from assistive tech, no canvas", () => {
    const { container } = render(<StageEmptyScene />);
    expect(container.querySelector('[data-part="grid"]')).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("canvas")).toBeNull();
  });
});
