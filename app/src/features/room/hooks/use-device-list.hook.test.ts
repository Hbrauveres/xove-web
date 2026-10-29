import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeviceList } from "./use-device-list.hook";

const camera = (deviceId: string, label: string) => ({ kind: "videoinput", deviceId, label }) as MediaDeviceInfo;

describe("the devices list", () => {
  it("lists the browser's devices, and again when one is plugged in", async () => {
    const devices = new EventTarget();
    let found = [camera("cam-1", "Logitech C920")];
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: Object.assign(devices, { enumerateDevices: async () => found }),
    });
    const hook = renderHook(() => useDeviceList("first"));
    await waitFor(() => expect(hook.result.current.cameras).toHaveLength(1));

    found = [...found, camera("cam-2", "Integrated Webcam")];
    devices.dispatchEvent(new Event("devicechange"));

    await waitFor(() =>
      expect(hook.result.current.cameras.map((c) => c.label)).toEqual(["Logitech C920", "Integrated Webcam"]),
    );
  });
});
