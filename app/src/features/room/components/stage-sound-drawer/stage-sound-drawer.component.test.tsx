import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageSoundDrawer } from "./stage-sound-drawer.component";

const heard = { volume: 1, muted: false };
const props = (over = {}) => ({
  open: true,
  hearing: { sound: heard, voice: heard },
  drawer: { shown: "voice" as const, leaving: null, entering: false, left: vi.fn(), entered: vi.fn() },
  label: "Ana's voice volume",
  onVolume: vi.fn(),
  ...over,
});

describe("a preview's row's drawer", () => {
  it("sets the shown sound's volume", () => {
    const p = props();
    render(<StageSoundDrawer {...p} />);
    fireEvent.change(screen.getByRole("slider", { name: "Ana's voice volume" }), { target: { value: "0.3" } });
    expect(p.onVolume).toHaveBeenCalledWith("voice", 0.3);
  });

  it("switching, offers only the new sound's slider while the old one shrinks away", () => {
    render(
      <StageSoundDrawer
        {...props({
          drawer: { shown: "sound", leaving: "voice", entering: true, left: vi.fn(), entered: vi.fn() },
          label: "Ana's screen sound volume",
        })}
      />,
    );
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(screen.getByRole("slider", { name: "Ana's screen sound volume" })).toBeInTheDocument();
  });
});
