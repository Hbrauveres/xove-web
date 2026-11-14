import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsQualityMode } from "./settings-quality-mode.component";

const labels = (group: string) =>
  within(screen.getByRole("radiogroup", { name: group }))
    .getAllByRole<HTMLInputElement>("radio")
    .map((r) => r.labels?.[0]?.textContent);

describe("a stream's quality and mode", () => {
  it("offer a screen 1080p, 720p and 480p, and the modes with what each keeps in its tooltip", async () => {
    const onChange = vi.fn();
    render(<SettingsQualityMode kind="screen" prefs={{ quality: "1080p", mode: "smooth" }} onChange={onChange} />);
    expect(labels("Screen quality")).toEqual(["1080p", "720p", "480p"]);
    expect(labels("Screen mode")).toEqual(["Smooth", "Sharp"]);
    await userEvent.click(screen.getByRole("radio", { name: "720p" }));
    expect(onChange).toHaveBeenLastCalledWith({ quality: "720p", mode: "smooth" });
    const sharp = screen.getByRole("radio", { name: "Sharp" });
    expect(sharp).toHaveAccessibleDescription("Keeps detail sharp when the connection is tight: text, code");
    await userEvent.click(sharp);
    expect(onChange).toHaveBeenLastCalledWith({ quality: "1080p", mode: "sharp" });
  });

  it("offer a camera 720p and 480p", async () => {
    const onChange = vi.fn();
    render(<SettingsQualityMode kind="camera" prefs={{ quality: "720p", mode: "smooth" }} onChange={onChange} />);
    expect(labels("Camera quality")).toEqual(["720p", "480p"]);
    await userEvent.click(screen.getByRole("radio", { name: "480p" }));
    expect(onChange).toHaveBeenLastCalledWith({ quality: "480p", mode: "smooth" });
  });
});
