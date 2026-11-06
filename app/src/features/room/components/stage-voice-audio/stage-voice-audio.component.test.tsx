import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../../testing/fakeLiveKit";
import { StageVoiceAudio } from "./stage-voice-audio.component";

describe("a voice played", () => {
  it("plays its track at this browser's volume, and lets it go when it leaves", () => {
    const track = new FakeTrack();
    const { container, unmount } = render(
      <StageVoiceAudio track={track as unknown as MediaTrack} volume={0.3} muted={false} />,
    );
    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(track.attached).toEqual([audio]);
    expect(audio.volume).toBe(0.3);
    unmount();
    expect(track.attached).toEqual([]);
  });
});
