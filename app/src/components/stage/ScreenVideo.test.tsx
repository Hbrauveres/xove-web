import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FakeTrack } from "../../test/fakeLiveKit";
import type { MediaTrack } from "@core/livekit/livekit.types";
import { ScreenVideo } from "./ScreenVideo";

/** The video's box and its picture's size, as the browser would report them. */
function sized(video: HTMLVideoElement, box: [number, number], picture: [number, number]) {
  Object.defineProperty(video, "clientWidth", { value: box[0], configurable: true });
  Object.defineProperty(video, "clientHeight", { value: box[1], configurable: true });
  Object.defineProperty(video, "videoWidth", { value: picture[0], configurable: true });
  Object.defineProperty(video, "videoHeight", { value: picture[1], configurable: true });
  fireEvent(video, new Event("loadedmetadata"));
}

describe("the stage's picture (spec 0123, design decision 14)", () => {
  it("fills its box when the shapes match within 1%, so no black line shows at an edge", () => {
    render(<ScreenVideo video={new FakeTrack() as unknown as MediaTrack} label="Bruno's shared screen" />);
    const video = screen.getByLabelText("Bruno's shared screen") as HTMLVideoElement;
    // A 16:9 stage in fractional pixels, a 16:9 picture.
    sized(video, [1756.44, 987.98], [1920, 1080]);
    expect(video).toHaveAttribute("data-fill");
  });

  it("keeps the whole picture, with bars, when the shapes differ", () => {
    render(<ScreenVideo video={new FakeTrack() as unknown as MediaTrack} label="Bruno's shared screen" />);
    const video = screen.getByLabelText("Bruno's shared screen") as HTMLVideoElement;
    sized(video, [1600, 900], [1080, 1920]);
    expect(video).not.toHaveAttribute("data-fill");
  });
});
