import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeTrack } from "../../test/fakeLiveKit";
import type { MediaTrack } from "../../types";
import { MicTest } from "./MicTest";

const meter = () => screen.getByRole("slider", { name: "Mic sensitivity" }).parentElement!;

afterEach(() => vi.useRealTimers());

describe("the Voice tab's mic level (spec 0123)", () => {
  it("shows the level green when it's over the line (sent), faint under it", () => {
    const track = new FakeTrack() as unknown as MediaTrack;
    const { rerender } = render(<MicTest level={0.5} track={track} sensitivity={0.2} onSensitivity={() => {}} />);
    expect(meter()).toHaveAttribute("data-sent");
    expect(meter().style.getPropertyValue("--level")).toBe("50%");
    rerender(<MicTest level={0.1} track={track} sensitivity={0.2} onSensitivity={() => {}} />);
    expect(meter()).not.toHaveAttribute("data-sent");
  });

  it("moves the sensitivity with its line", () => {
    const onSensitivity = vi.fn();
    render(<MicTest level={0} sensitivity={0.12} onSensitivity={onSensitivity} />);
    fireEvent.change(screen.getByRole("slider", { name: "Mic sensitivity" }), { target: { value: "0.3" } });
    expect(onSensitivity).toHaveBeenCalledWith(0.3);
  });

  it("can't test until the voice is on, and says so", () => {
    render(<MicTest level={0} sensitivity={0.12} onSensitivity={() => {}} />);
    const test = screen.getByRole("button", { name: "Test: hear yourself" });
    expect(test).toBeDisabled();
    expect(test.parentElement).toHaveAccessibleDescription("Turn your voice on to hear yourself");
    expect(meter()).not.toHaveAttribute("data-sent");
  });

  it("plays my voice back to me for 5 s, counting down, and Stop ends it", () => {
    vi.useFakeTimers();
    const track = new FakeTrack();
    render(<MicTest level={0} track={track as unknown as MediaTrack} sensitivity={0.12} onSensitivity={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Test: hear yourself" }));
    expect(track.attached).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Stop hearing yourself" })).toHaveTextContent("Stop · 5");
    // Each second is counted after the last one shows.
    const seconds = (n: number) => {
      for (let i = 0; i < n; i++) act(() => vi.advanceTimersByTime(1000));
    };
    seconds(2);
    expect(screen.getByRole("button", { name: "Stop hearing yourself" })).toHaveTextContent("Stop · 3");
    seconds(3);
    expect(track.attached).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Test: hear yourself" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop hearing yourself" }));
    expect(track.attached).toHaveLength(0);
  });
});
