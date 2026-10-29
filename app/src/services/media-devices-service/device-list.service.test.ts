import { describe, expect, it, vi } from "vitest";
import { listDevices, watchDevices } from "./device-list.service";

const device = (kind: MediaDeviceKind, deviceId: string, label = "") => ({ kind, deviceId, label }) as MediaDeviceInfo;

describe("the browser's devices", () => {
  it("lists cameras and mics by name, numbering the unnamed ones, without the default mic twice", async () => {
    const enumerateDevices = vi.fn(async () => [
      device("videoinput", "cam-1", "FaceTime HD"),
      device("videoinput", "cam-2"),
      device("audioinput", "default", "Default"),
      device("audioinput", "mic-1", "USB mic"),
      device("audiooutput", "out-1", "Speakers"),
    ]);
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { enumerateDevices } });

    expect(await listDevices()).toEqual({
      cameras: [
        { deviceId: "cam-1", label: "FaceTime HD" },
        { deviceId: "cam-2", label: "Camera 2" },
      ],
      mics: [{ deviceId: "mic-1", label: "USB mic" }],
    });
  });

  it("lists nothing where the browser can't", async () => {
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: undefined });
    expect(await listDevices()).toEqual({ cameras: [], mics: [] });
  });

  it("calls back when a device is plugged in, until stopped", () => {
    const target = new EventTarget();
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: target });
    const onChange = vi.fn();

    const stop = watchDevices(onChange);
    target.dispatchEvent(new Event("devicechange"));
    stop();
    target.dispatchEvent(new Event("devicechange"));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
