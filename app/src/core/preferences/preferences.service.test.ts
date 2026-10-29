import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE } from "./constants/preferences.constants";
import {
  loadAmbilight,
  loadCameraDevice,
  loadHearing,
  loadAllStreamSettings,
  loadStreamSettings,
  loadVoicePrefs,
  saveAmbilight,
  saveCameraDevice,
  saveHearing,
  saveStreamSettings,
  saveVoicePrefs,
} from "./preferences.service";

describe("choices saved before", () => {
  it("are read from the keys this browser already holds", () => {
    const saved: Record<string, string> = {
      "xove.share.quality": "480p",
      "xove.share.mode": "sharp",
      "xove.camera.quality": "480p",
      "xove.camera.mode": "sharp",
      "xove.camera.device": "cam-9",
      "xove.ambilight.on": "false",
      "xove.ambilight.brightness": "0.3",
      "xove.watch.volume": "0.2",
      "xove.watch.muted": "true",
      "xove.voice.volume": "0.6",
      "xove.voice.muted": "true",
      "xove.mic.device": "mic-9",
      "xove.mic.processing": JSON.stringify({ echoCancellation: false, sensitivity: 0.5 }),
    };
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);

    expect(loadStreamSettings("screen")).toEqual({ quality: "480p", mode: "sharp" });
    expect(loadStreamSettings("camera")).toEqual({ quality: "480p", mode: "sharp" });
    expect(loadCameraDevice()).toBe("cam-9");
    expect(loadAmbilight()).toEqual({ on: false, brightness: 0.3 });
    expect(loadHearing("stream")).toEqual({ volume: 0.2, muted: true });
    expect(loadHearing("voice")).toEqual({ volume: 0.6, muted: true });
    expect(loadVoicePrefs()).toMatchObject({ micId: "mic-9", echoCancellation: false, sensitivity: 0.5 });
  });
});

describe("the sharer's choices", () => {
  it("reads what this browser saved before", () => {
    localStorage.setItem("xove.share.quality", "720p");
    localStorage.setItem("xove.share.mode", "sharp");
    expect(loadStreamSettings("screen")).toEqual({ quality: "720p", mode: "sharp" });
  });

  it("are read for the screen and the camera together", () => {
    saveStreamSettings("camera", { quality: "720p", mode: "sharp" });
    expect(loadAllStreamSettings()).toEqual({
      screen: loadStreamSettings("screen"),
      camera: { quality: "720p", mode: "sharp" },
    });
  });

  it("default to 1080p Smooth", () => {
    expect(loadStreamSettings("screen")).toEqual({ quality: "1080p", mode: "smooth" });
  });

  it("are remembered", () => {
    saveStreamSettings("screen", { quality: "720p", mode: "sharp" });
    expect(loadStreamSettings("screen")).toEqual({ quality: "720p", mode: "sharp" });
  });

  it("ignore a value that isn't one of the choices", () => {
    localStorage.setItem("xove.share.quality", "4k");
    localStorage.setItem("xove.share.mode", "blurry");
    expect(loadStreamSettings("screen")).toEqual({ quality: "1080p", mode: "smooth" });
  });
});

describe("the camera's choices", () => {
  it("default to 720p Smooth", () => {
    expect(loadStreamSettings("camera")).toEqual({ quality: "720p", mode: "smooth" });
  });

  it("are remembered apart from the screen's", () => {
    saveStreamSettings("screen", { quality: "1080p", mode: "sharp" });
    saveStreamSettings("camera", { quality: "480p", mode: "smooth" });
    expect(loadStreamSettings("camera")).toEqual({ quality: "480p", mode: "smooth" });
    expect(loadStreamSettings("screen")).toEqual({ quality: "1080p", mode: "sharp" });
  });

  it("never go above 720p", () => {
    localStorage.setItem("xove.camera.quality", "1080p");
    expect(loadStreamSettings("camera").quality).toBe("720p");
  });
});

describe("the camera picked", () => {
  it("is none until one is picked, then remembered", () => {
    expect(loadCameraDevice()).toBeNull();
    saveCameraDevice("cam-2");
    expect(loadCameraDevice()).toBe("cam-2");
  });
});

describe("the viewer's choices", () => {
  it("default to full volume, not muted", () => {
    expect(loadHearing("stream")).toEqual({ volume: 1, muted: false });
  });

  it("are remembered", () => {
    saveHearing("stream", { volume: 0.35, muted: true });
    expect(loadHearing("stream")).toEqual({ volume: 0.35, muted: true });
  });

  it("keep the volume between 0 and 1", () => {
    localStorage.setItem("xove.watch.volume", "7");
    expect(loadHearing("stream").volume).toBe(1);
    localStorage.setItem("xove.watch.volume", "nonsense");
    expect(loadHearing("stream").volume).toBe(1);
  });
});

describe("when the browser's storage fails", () => {
  it("uses the defaults and doesn't break the page", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => saveStreamSettings("screen", { quality: "480p", mode: "sharp" })).not.toThrow();
    expect(() => saveHearing("stream", { volume: 0.5, muted: false })).not.toThrow();
    expect(loadStreamSettings("screen")).toEqual({ quality: "1080p", mode: "smooth" });
    expect(loadHearing("stream")).toEqual({ volume: 1, muted: false });
  });
});

describe("the ambilight", () => {
  it("is on at 90% until changed, then remembered", () => {
    expect(loadAmbilight()).toEqual({ on: true, brightness: 0.9 });
    saveAmbilight({ on: false, brightness: 0.4 });
    expect(loadAmbilight()).toEqual({ on: false, brightness: 0.4 });
  });

  it("ignores a brightness out of range", () => {
    localStorage.setItem("xove.ambilight.brightness", "7");
    expect(loadAmbilight().brightness).toBe(0.9);
  });
});

describe("my voice's choices", () => {
  it("starts with the browser's cleaning on, isolation off and a low line", () => {
    expect(loadVoicePrefs()).toEqual(DEFAULT_VOICE);
    expect(DEFAULT_VOICE).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      voiceIsolation: false,
    });
  });

  it("remembers the mic, the processing and the line", () => {
    saveVoicePrefs({ ...DEFAULT_VOICE, micId: "mic-2", echoCancellation: false, sensitivity: 0.4 });
    expect(loadVoicePrefs()).toEqual({ ...DEFAULT_VOICE, micId: "mic-2", echoCancellation: false, sensitivity: 0.4 });
  });

  it("ignores what it can't read, and keeps the line between 0 and 1", () => {
    localStorage.setItem("xove.mic.processing", "{not json");
    expect(loadVoicePrefs()).toEqual(DEFAULT_VOICE);
    localStorage.setItem("xove.mic.processing", JSON.stringify({ sensitivity: 7, echoCancellation: "yes" }));
    expect(loadVoicePrefs()).toMatchObject({ sensitivity: 1, echoCancellation: true });
  });

  it("remembers how I hear a voice: its volume and mute, the volume kept between 0 and 1", () => {
    expect(loadHearing("voice")).toEqual({ volume: 1, muted: false });
    saveHearing("voice", { volume: 0.3, muted: true });
    expect(loadHearing("voice")).toEqual({ volume: 0.3, muted: true });
    localStorage.setItem("xove.voice.volume", "9");
    expect(loadHearing("voice").volume).toBe(1);
  });
});
