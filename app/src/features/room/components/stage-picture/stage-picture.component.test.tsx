import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { aFold } from "@testing/factories/small-view-fold.factory";
import type { StagePictureProps } from "./types/stage-picture.types";
import { StagePicture } from "./stage-picture.component";

function renderPicture(over: Partial<StagePictureProps> = {}) {
  const big = over.big ?? aSharer();
  const props: StagePictureProps = {
    big,
    main: big.screen ?? big.camera!,
    sound: { volume: 1, muted: false },
    facecamPlace: { x: 0.7, y: 0.1 },
    onFacecamMove: vi.fn(),
    fold: aFold(),
    onSwap: vi.fn(),
    onVideo: vi.fn(),
    ...over,
  };
  render(<StagePicture {...props} />);
  return props;
}

describe("what plays on the stage", () => {
  it("plays someone's stream, named for whose it is", () => {
    renderPicture();
    expect(screen.getByLabelText("Bruno's shared screen").tagName).toBe("VIDEO");
  });

  it("says it's loading until their video arrives", () => {
    const big = aSharer();
    renderPicture({ big, main: { kind: "screen", startedAt: 0, settings: { quality: "1080p", mode: "smooth" } } });
    expect(screen.getByRole("status")).toHaveTextContent("Loading Bruno's screen…");
  });

  it("says mine is starting until my own video is there", () => {
    const big = { ...aSharer(), isMe: true };
    renderPicture({ big, main: { kind: "screen", startedAt: 0, settings: { quality: "1080p", mode: "smooth" } } });
    expect(screen.getByRole("status")).toHaveTextContent("Starting your share…");
  });

  it("puts the other stream in the small view, and swaps them on its button", async () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    const props = renderPicture({ big, main: big.screen!, small: big.camera });
    expect(screen.getByRole("application", { name: /Bruno's camera/ })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Swap views" }));
    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });
});
