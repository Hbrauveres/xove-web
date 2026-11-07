import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StagePictureLayer } from "./stage-picture-layer.component";

function layer(compact: boolean) {
  const setLayer = vi.fn();
  render(
    <StagePictureLayer setLayer={setLayer} compact={compact} fullscreen={<button>Fullscreen</button>}>
      <button>Mute the screen's sound</button>
    </StagePictureLayer>,
  );
  const el = screen.getByRole("button", { name: "Fullscreen" }).closest("[data-on-picture]");
  return { setLayer, el };
}

describe("the picture's layer", () => {
  it("holds the fullscreen button and the bar, and hands itself to what measures it", () => {
    const { setLayer, el } = layer(false);
    expect(el).toContainElement(screen.getByRole("button", { name: "Mute the screen's sound" }));
    expect(setLayer).toHaveBeenCalledWith(el);
  });

  it("asks for the compact size only when my row needs it", () => {
    expect(layer(true).el).toHaveAttribute("data-compact");
  });
});
