import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NO_SOUND } from "../../../constants/stream-words.constants";
import { SettingsScreenTab } from "./settings-screen-tab.component";

const stream = () => ({ prefs: { quality: "1080p" as const, mode: "smooth" as const }, onChange: vi.fn() });

describe("the Screen tab", () => {
  it("while not sharing: a line saying these are used next time, then quality and mode, and no Change", () => {
    render(<SettingsScreenTab live={false} onChangeWindow={() => {}} stream={stream()} />);
    expect(screen.getByText(/You're not sharing\. These are used the next time you do/)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Screen quality" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
  });

  it("while sharing: what's shared, with Change", async () => {
    const onChangeWindow = vi.fn();
    render(<SettingsScreenTab live surface="window" onChangeWindow={onChangeWindow} stream={stream()} />);
    expect(screen.getByText("A window")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(onChangeWindow).toHaveBeenCalledOnce();
    expect(screen.queryByText(NO_SOUND)).not.toBeInTheDocument();
  });

  it("says how to share sound when my screen has none", () => {
    render(<SettingsScreenTab live noSound onChangeWindow={() => {}} stream={stream()} />);
    expect(screen.getByText(NO_SOUND)).toBeInTheDocument();
  });

  it("can't change while a change is under way", () => {
    render(<SettingsScreenTab live onChangeWindow={() => {}} stream={{ ...stream(), busy: true }} />);
    expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
  });

  it("cues Change when asked to, keeping the same button", () => {
    const { rerender } = render(<SettingsScreenTab live onChangeWindow={() => {}} stream={stream()} />);
    const change = screen.getByRole("button", { name: "Change" });
    expect(change.querySelector("[data-cue]")).toBeNull();
    rerender(<SettingsScreenTab live onChangeWindow={() => {}} cue={1} stream={stream()} />);
    expect(screen.getByRole("button", { name: "Change" })).toBe(change);
    expect(change.querySelector("[data-cue]")).not.toBeNull();
  });
});
