import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../../../testing/fakeLiveKit";
import { HEAR_S, SECOND_MS } from "./constants/settings-mic-test.constants";
import { SettingsMicTest } from "./settings-mic-test.component";

const voice = () => new FakeTrack() as unknown as MediaTrack;
const slider = () => screen.getByRole("slider", { name: "Mic sensitivity" });

describe("the mic test", () => {
  it("draws the level green when it's over the line (sent), and faint without a voice", () => {
    const { rerender } = render(
      <SettingsMicTest level={0.5} track={voice()} sensitivity={0.2} onSensitivity={() => {}} />,
    );
    expect(slider()).toHaveAttribute("data-sent");
    rerender(<SettingsMicTest level={0.5} sensitivity={0.2} onSensitivity={() => {}} />);
    expect(slider()).not.toHaveAttribute("data-sent");
  });

  it("moves the sensitivity with its line", () => {
    const onSensitivity = vi.fn();
    render(<SettingsMicTest level={0} sensitivity={0.12} onSensitivity={onSensitivity} />);
    fireEvent.change(slider(), { target: { value: "0.3" } });
    expect(onSensitivity).toHaveBeenCalledWith(0.3);
  });

  it("can't test until the voice is on, and says so", () => {
    render(<SettingsMicTest level={0} sensitivity={0.12} onSensitivity={() => {}} />);
    const test = screen.getByRole("button", { name: "Test: hear yourself" });
    expect(test).toBeDisabled();
    expect(test.parentElement).toHaveAccessibleDescription("Turn your voice on to hear yourself");
  });

  it("plays my voice back to me, counting down, and Stop ends it", () => {
    vi.useFakeTimers();
    const track = new FakeTrack();
    render(
      <SettingsMicTest level={0} track={track as unknown as MediaTrack} sensitivity={0.12} onSensitivity={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Test: hear yourself", pressed: false }));
    expect(track.attached).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Stop hearing yourself", pressed: true })).toHaveTextContent(
      `Stop · ${HEAR_S}`,
    );
    // Each second is counted after the last one shows.
    for (let s = 0; s < HEAR_S; s++) act(() => vi.advanceTimersByTime(SECOND_MS));
    expect(track.attached).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Test: hear yourself" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop hearing yourself" }));
    expect(track.attached).toHaveLength(0);
  });
});
