import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../testing/fakeLiveKit";
import type { Playback } from "../types/played-track.types";
import { usePlayedTrack } from "./use-played-track.hook";

function Player({ track, playback }: { track: FakeTrack | undefined; playback?: Playback }) {
  const ref = usePlayedTrack<HTMLAudioElement>(track as unknown as MediaTrack | undefined, playback);
  return <audio ref={ref} />;
}

describe("a track played in an element", () => {
  it("is attached while there, and let go on a new track or on leaving", () => {
    const first = new FakeTrack();
    const second = new FakeTrack();
    const { container, rerender, unmount } = render(<Player track={first} />);
    const audio = container.querySelector("audio");
    expect(first.attached).toEqual([audio]);
    rerender(<Player track={second} />);
    expect(first.attached).toEqual([]);
    expect(second.attached).toEqual([audio]);
    unmount();
    expect(second.attached).toEqual([]);
  });

  it("plays at this browser's volume and mute, following changes", () => {
    const track = new FakeTrack();
    const { container, rerender } = render(<Player track={track} playback={{ volume: 0.4, muted: false }} />);
    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio.volume).toBe(0.4);
    rerender(<Player track={track} playback={{ volume: 0.4, muted: true }} />);
    expect(audio.muted).toBe(true);
  });

  it("does nothing without a track", () => {
    expect(() => render(<Player track={undefined} />)).not.toThrow();
  });
});
