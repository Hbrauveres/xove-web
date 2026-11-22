/** The cameras and microphones this browser has (`navigator.mediaDevices.enumerateDevices`, see setup.ts). */

const CAMERAS = [
  { deviceId: "cam-1", label: "Logitech C920" },
  { deviceId: "cam-2", label: "Integrated Webcam" },
];
const MICS = [
  { deviceId: "mic-1", label: "Headset (USB)" },
  { deviceId: "mic-2", label: "MacBook Pro microphone" },
];

/** The fake cameras; a test may unplug one or rename it, and the setup puts them back. */
export const fakeCameras = CAMERAS.map((c) => ({ ...c }));
/** The fake microphones; a test may change them, and the setup puts them back. */
export const fakeMics = MICS.map((m) => ({ ...m }));

/** The browser's devices as they were before any test changed them. */
export function resetFakeDevices() {
  fakeCameras.splice(0, fakeCameras.length, ...CAMERAS.map((c) => ({ ...c })));
  fakeMics.splice(0, fakeMics.length, ...MICS.map((m) => ({ ...m })));
}
