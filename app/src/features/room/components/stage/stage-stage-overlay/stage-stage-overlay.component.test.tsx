import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { StageStageOverlay } from "./stage-stage-overlay.component";
import userEvent from "@testing-library/user-event";
it("enters fullscreen, and once in, offers to leave it", async () => {
  const onFullscreen = vi.fn();
  const { rerender } = render(<StageStageOverlay fullscreen={false} onFullscreen={onFullscreen} />);
  await userEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
  expect(onFullscreen).toHaveBeenCalledOnce();
  rerender(<StageStageOverlay fullscreen onFullscreen={onFullscreen} />);
  expect(screen.getByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();
});
