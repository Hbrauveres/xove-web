import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGoLiveWidth } from "../../hooks/use-go-live-width.hook";
import { StagePictureLayer } from "./stage-picture-layer.component";
/** What fits on the picture, nothing folded, its ref and report as fakes. */
const aPictureFit = () => ({
  setLayer: vi.fn(),
  setGoLive: vi.fn(),
  fit: { folded: [], size: "l" as const, beside: false },
  smallView: true,
});

/** Inside the layer, where Go live would report its width. */
function GoLive() {
  useGoLiveWidth()?.(83);
  return <button>Go live</button>;
}

describe("the picture's layer", () => {
  // The layer is layout only, with nothing for a screen reader: its ref says which element it is.
  it("holds the fullscreen button and the bar, and hands itself to what measures it", () => {
    const picture = aPictureFit();
    render(
      <StagePictureLayer picture={picture} fullscreen={<button>Fullscreen</button>}>
        <GoLive />
      </StagePictureLayer>,
    );
    const el = picture.setLayer.mock.calls[0]?.[0] as HTMLElement;
    expect(el).toContainElement(screen.getByRole("button", { name: "Fullscreen" }));
    expect(el).toContainElement(screen.getByRole("button", { name: "Go live" }));
  });

  it("passes Go live's width to what decides the fold", () => {
    const picture = aPictureFit();
    render(
      <StagePictureLayer picture={picture} fullscreen={null}>
        <GoLive />
      </StagePictureLayer>,
    );
    expect(picture.setGoLive).toHaveBeenCalledWith(83);
  });
});
