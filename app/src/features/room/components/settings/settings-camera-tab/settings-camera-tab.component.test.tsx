import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SettingsCameraTabProps } from "./types/settings-camera-tab.types";
import { SettingsCameraTab } from "./settings-camera-tab.component";

function setup(props: Partial<SettingsCameraTabProps> = {}) {
  const onPick = vi.fn();
  const all: SettingsCameraTabProps = {
    live: false,
    cameras: {
      list: [
        { deviceId: "cam-1", label: "Logitech C920" },
        { deviceId: "cam-2", label: "Integrated Webcam" },
      ],
      chosen: "cam-1",
      onPick,
    },
    stream: { prefs: { quality: "720p", mode: "smooth" }, onChange: vi.fn() },
    ...props,
  };
  const view = render(<SettingsCameraTab {...all} />);
  return {
    onPick,
    rerender: (next: Partial<SettingsCameraTabProps>) => view.rerender(<SettingsCameraTab {...all} {...next} />),
  };
}
const pill = () => screen.getByRole("button", { name: /^Camera: / });

describe("the Camera tab", () => {
  it("has the preview alone in its own group, then the camera, quality and mode", () => {
    const { container } = render(
      <SettingsCameraTab
        live={false}
        cameras={{ list: [{ deviceId: "cam-1", label: "C920" }], chosen: null, onPick: () => {} }}
        stream={{ prefs: { quality: "720p", mode: "smooth" }, onChange: () => {} }}
      />,
    );
    const names = ["Preview", "Camera", "Quality", "Mode"];
    expect(
      [...container.querySelectorAll("p")].map((p) => p.textContent).filter((t) => names.includes(t ?? "")),
    ).toEqual(names);
    const preview = within(screen.getByText("Preview").parentElement!);
    expect(preview.getByLabelText("Your camera")).toBeInTheDocument();
    expect(preview.queryByRole("button", { name: /^Camera:/ })).toBeNull();
  });

  it("picks another camera from its picker, opened in place", async () => {
    const { onPick } = setup();
    await userEvent.click(pill());
    expect(pill().closest("[data-picker]")).toHaveAttribute("data-opens", "down");
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Integrated Webcam" }));
    expect(onPick).toHaveBeenCalledWith("cam-2");
  });

  it("opens and cues the picker for a request, once each; a newer one opens it again", async () => {
    const { rerender } = setup();
    expect(pill()).toHaveAttribute("aria-expanded", "false");
    rerender({ cue: 1 });
    expect(pill()).toHaveAttribute("aria-expanded", "true");
    expect(pill().closest("[data-picker]")!.parentElement!.querySelector("[data-cue]")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(pill()).toHaveAttribute("aria-expanded", "false");
    rerender({ cue: 2 });
    expect(pill()).toHaveAttribute("aria-expanded", "true");
  });

  it("doesn't open its picker for a request while a change is under way", () => {
    const { rerender } = setup();
    rerender({ cue: 1, stream: { prefs: { quality: "720p", mode: "smooth" }, onChange: vi.fn(), busy: true } });
    expect(pill()).toHaveAttribute("aria-expanded", "false");
  });
});
