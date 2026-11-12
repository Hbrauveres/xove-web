import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../../../testing/fakeLiveKit";
import { StageSounds } from "./stage-sounds.component";
const sound = (id: string, volume: number) => ({
  id,
  track: new FakeTrack() as unknown as MediaTrack,
  volume,
  muted: false,
});

describe("the sounds I hear", () => {
  it("plays each voice and each preview's screen sound, at its own volume", () => {
    const { container } = render(<StageSounds voices={[sound("ana", 0.5)]} previewSounds={[sound("bruno", 0.2)]} />);
    expect([...container.querySelectorAll("audio")].map((a) => a.volume)).toEqual([0.5, 0.2]);
  });
});
