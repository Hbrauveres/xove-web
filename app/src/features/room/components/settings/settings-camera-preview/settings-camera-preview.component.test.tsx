import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CAMERA_BLOCKED } from "@services/media-devices-service";
import { SettingsCameraPreview } from "./settings-camera-preview.component";

const track = () => ({ attach: vi.fn((el: HTMLMediaElement) => el), detach: vi.fn((el: HTMLMediaElement) => el) });

describe("the camera's preview", () => {
  it("plays my camera, only mine while it's not sent", () => {
    const video = track();
    render(<SettingsCameraPreview video={video} live={false} />);
    expect(video.attach).toHaveBeenCalledWith(screen.getByLabelText("Your camera"));
    expect(screen.getByText("Only you see this")).toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });

  it("says LIVE while it's sent", () => {
    render(<SettingsCameraPreview video={track()} live />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.queryByText("Only you see this")).not.toBeInTheDocument();
  });

  it("announces in the picture's place that the camera was refused, and how to allow it", () => {
    render(<SettingsCameraPreview live={false} problem="blocked" />);
    expect(screen.getByRole("status")).toHaveTextContent(CAMERA_BLOCKED);
    expect(screen.queryByLabelText("Your camera")).not.toBeInTheDocument();
  });
});
