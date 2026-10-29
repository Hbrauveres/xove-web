import type { DeviceList } from "./devices.types";

/** This browser's cameras and microphones, named (a device without a name gets a number). */
export async function listDevices(): Promise<DeviceList> {
  const all = (await navigator.mediaDevices?.enumerateDevices?.()) ?? [];
  const cameras = all.filter((d) => d.kind === "videoinput" && d.deviceId);
  const mics = all.filter((d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "default");
  return {
    cameras: cameras.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })),
    mics: mics.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })),
  };
}

/** Calls `onChange` when a device is plugged in or out. Returns the way to stop watching. */
export function watchDevices(onChange: () => void): () => void {
  const devices = navigator.mediaDevices;
  devices?.addEventListener?.("devicechange", onChange);
  return () => devices?.removeEventListener?.("devicechange", onChange);
}
