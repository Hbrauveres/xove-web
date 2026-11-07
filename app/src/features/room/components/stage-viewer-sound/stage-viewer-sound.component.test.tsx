import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageViewerSound } from "./stage-viewer-sound.component";

const setup = (over = {}) => {
  const onChange = vi.fn();
  const setOpen = vi.fn();
  render(
    <StageViewerSound
      kind="voice"
      sound={{ volume: 1, muted: false, onChange, ...over }}
      open={false}
      quiet={false}
      setOpen={setOpen}
      anchorRef={() => undefined}
      name="Bruno"
    />,
  );
  return { onChange, setOpen };
};

describe("one sound over the stream", () => {
  it("mutes on a click", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ muted: true }));
  });

  it("opens its slider when the keyboard brings the focus", async () => {
    const { setOpen } = setup();
    await userEvent.tab();
    expect(setOpen).toHaveBeenCalledWith("voice");
  });

  it("where there's nothing to hear, has no slider", () => {
    setup({ unavailable: "Bruno's mic is off" });
    expect(screen.queryByRole("slider", { hidden: true })).not.toBeInTheDocument();
  });
});
