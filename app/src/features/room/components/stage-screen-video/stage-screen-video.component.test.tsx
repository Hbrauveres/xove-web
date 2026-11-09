import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../../testing/fakeLiveKit";
import { StageScreenVideo } from "./stage-screen-video.component";
const track = () => new FakeTrack() as unknown as MediaTrack & FakeTrack;

describe("the stage's video", () => {
  it("plays the picture, named for whose it is, silent itself", () => {
    const video = track();
    render(<StageScreenVideo video={video} label="Bruno's shared screen" />);
    const el = screen.getByLabelText("Bruno's shared screen") as HTMLVideoElement;
    expect(video.attached).toEqual([el]);
    expect(el.muted).toBe(true);
  });

  it("plays the screen's sound at this browser's volume", () => {
    const sound = track();
    const { container } = render(
      <StageScreenVideo video={track()} sound={sound} label="Bruno's shared screen" volume={0.5} muted={false} />,
    );
    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(sound.attached).toEqual([audio]);
    expect(audio.volume).toBe(0.5);
  });

  it("hands its video element out for the light, and takes it back when it goes", () => {
    const onVideo = vi.fn();
    const { unmount } = render(<StageScreenVideo video={track()} label="Bruno's camera" onVideo={onVideo} />);
    expect(onVideo).toHaveBeenLastCalledWith(screen.getByLabelText("Bruno's camera"));
    unmount();
    expect(onVideo).toHaveBeenLastCalledWith(null);
  });
});
