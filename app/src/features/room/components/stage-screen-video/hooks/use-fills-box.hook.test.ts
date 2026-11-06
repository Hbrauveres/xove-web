import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFillsBox } from "./use-fills-box.hook";

/** The video's box and its picture's size, as the browser would report them. */
function sized(video: HTMLVideoElement, box: [number, number], picture: [number, number]) {
  Object.defineProperty(video, "clientWidth", { value: box[0], configurable: true });
  Object.defineProperty(video, "clientHeight", { value: box[1], configurable: true });
  Object.defineProperty(video, "videoWidth", { value: picture[0], configurable: true });
  Object.defineProperty(video, "videoHeight", { value: picture[1], configurable: true });
  act(() => {
    fireEvent(video, new Event("loadedmetadata"));
  });
}

describe("the stage's picture filling its box", () => {
  it("fills once the picture's shape matches its box's, and stops when it no longer does", () => {
    const video = { current: document.createElement("video") };
    const hook = renderHook(() => useFillsBox(video));
    expect(hook.result.current).toBe(false);
    sized(video.current, [1756.44, 987.98], [1920, 1080]);
    expect(hook.result.current).toBe(true);
    sized(video.current, [1600, 900], [1080, 1920]);
    expect(hook.result.current).toBe(false);
  });
});
