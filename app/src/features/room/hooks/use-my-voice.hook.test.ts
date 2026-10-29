import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE } from "../../../core/preferences/constants/preferences.constants";
import { currentToast } from "../../../components/ui/toast";
import { useMyVoice } from "./use-my-voice.hook";
import { MIC_DEVICE_KEY } from "../../../core/preferences/constants/preferences.constants";

/** The hook with its own video commands: the mic answers `problem` (nothing by default). */
function myVoice(voice = false, sending = true, problem: "blocked" | "missing" | "failed" | null = null) {
  const commands = {
    startVoice: vi.fn(async () => problem),
    stopVoice: vi.fn(async () => {}),
    applyVoice: vi.fn(async () => {}),
    setVoiceLine: vi.fn(),
  };
  const hook = renderHook(({ v, s }) => useMyVoice({ voice: v, sending: s, ...commands }), {
    initialProps: { v: voice, s: sending },
  });
  return { hook, ...commands };
}

describe("my voice", () => {
  it("starts with my remembered mic and processing, and stops when it's on", async () => {
    const { hook, startVoice, stopVoice } = myVoice();
    await act(async () => hook.result.current.toggleVoice());
    expect(startVoice).toHaveBeenCalledWith(DEFAULT_VOICE);

    hook.rerender({ v: true, s: true });
    await act(async () => hook.result.current.toggleVoice());
    expect(stopVoice).toHaveBeenCalled();
  });

  it("says why when the mic is blocked", async () => {
    const { hook } = myVoice(false, true, "blocked");
    await act(async () => hook.result.current.toggleVoice());
    expect(currentToast()?.text).toContain("Your browser blocked the microphone.");
  });

  it("moves the line live, and restarts the mic only for another mic or processing", () => {
    const { hook, setVoiceLine, applyVoice } = myVoice(true);
    act(() => hook.result.current.setVoicePrefs({ ...DEFAULT_VOICE, sensitivity: 0.5 }));
    expect(setVoiceLine).toHaveBeenLastCalledWith(0.5);
    expect(applyVoice).not.toHaveBeenCalled();

    act(() => hook.result.current.setVoicePrefs({ ...DEFAULT_VOICE, sensitivity: 0.5, micId: "mic-2" }));
    expect(applyVoice).toHaveBeenCalledWith(expect.objectContaining({ micId: "mic-2" }));
    expect(localStorage.getItem(MIC_DEVICE_KEY)).toBe("mic-2");
  });

  it("stops when I stop sending both my screen and my camera", () => {
    const { hook, stopVoice } = myVoice(true, true);
    hook.rerender({ v: true, s: false });
    expect(stopVoice).toHaveBeenCalled();
  });

  it("gives the same value while nothing changes", () => {
    const { hook } = myVoice();
    const before = hook.result.current;
    hook.rerender({ v: false, s: true });
    expect(hook.result.current).toBe(before);
  });

  it("asks for the mic once, even when clicked again while it's being asked", async () => {
    let answer: () => void = () => {};
    const startVoice = vi.fn(() => new Promise<null>((resolve) => (answer = () => resolve(null))));
    const inputs = {
      voice: false,
      sending: true,
      startVoice,
      stopVoice: vi.fn(),
      applyVoice: vi.fn(),
      setVoiceLine: vi.fn(),
    };
    const hook = renderHook(() => useMyVoice(inputs));
    act(() => hook.result.current.toggleVoice());
    act(() => hook.result.current.toggleVoice());
    await act(async () => answer());
    expect(startVoice).toHaveBeenCalledTimes(1);
  });

  it("says when there's no mic, or the voice couldn't be sent", async () => {
    const missing = myVoice(false, true, "missing");
    await act(async () => missing.hook.result.current.toggleVoice());
    expect(currentToast()?.text).toBe("No microphone found.");
    const failed = myVoice(false, true, "failed");
    await act(async () => failed.hook.result.current.toggleVoice());
    expect(currentToast()?.text).toBe("Your voice couldn't be sent. Try again in a moment.");
  });
});
