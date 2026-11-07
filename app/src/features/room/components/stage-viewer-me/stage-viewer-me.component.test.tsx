import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageViewerMe } from "./stage-viewer-me.component";

const props = (over = {}) => ({ live: false, canShareScreen: true, onStart: vi.fn(), onSettings: vi.fn(), ...over });

describe("me, over someone else's stream", () => {
  it("offers Go live while I'm not live", () => {
    render(<StageViewerMe {...props()} />);
    expect(screen.getByRole("button", { name: "Go live" })).toBeInTheDocument();
  });

  it("shows my mic while I'm live, pressed while it's on", async () => {
    const onMic = vi.fn();
    render(<StageViewerMe {...props({ live: true, micOn: true, onMic })} />);
    await userEvent.click(screen.getByRole("button", { pressed: true }));
    expect(onMic).toHaveBeenCalledOnce();
  });

  it("with nobody live, is only the settings", async () => {
    const p = props({ settingsOnly: true });
    render(<StageViewerMe {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(p.onSettings).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Go live" })).not.toBeInTheDocument();
  });
});
