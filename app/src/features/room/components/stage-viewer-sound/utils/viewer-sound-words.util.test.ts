import { describe, expect, it, vi } from "vitest";
import { viewerSoundWords } from "./viewer-sound-words.util";

const sound = (over = {}) => ({ volume: 1, muted: false, onChange: vi.fn(), ...over });

describe("viewerSoundWords", () => {
  it("names the screen's sound and their voice, and what a click does", () => {
    expect(viewerSoundWords("sound", sound())).toEqual({
      tip: "Screen sound",
      label: "Mute the screen's sound",
      volume: "Screen sound volume",
    });
    expect(viewerSoundWords("voice", sound({ muted: true }), "Bruno").label).toBe("Unmute Bruno's voice");
  });

  it("says why a sound can't be heard", () => {
    expect(viewerSoundWords("sound", sound({ unavailable: "No screen sound" })).label).toBe("No screen sound");
  });
});
