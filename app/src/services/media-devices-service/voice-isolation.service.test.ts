import { describe, expect, it, vi } from "vitest";
import { canIsolateVoice } from "./voice-isolation.service";

const withConstraints = (getSupportedConstraints: () => object) =>
  vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getSupportedConstraints } });

describe("whether this browser can isolate a voice", () => {
  it("says yes only where the browser supports it", () => {
    withConstraints(() => ({ voiceIsolation: true, echoCancellation: true }));
    expect(canIsolateVoice()).toBe(true);
    withConstraints(() => ({ echoCancellation: true }));
    expect(canIsolateVoice()).toBe(false);
  });

  it("says no where the browser has no devices to ask, or asking fails", () => {
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: undefined });
    expect(canIsolateVoice()).toBe(false);
    withConstraints(() => {
      throw new Error("not allowed");
    });
    expect(canIsolateVoice()).toBe(false);
  });
});
