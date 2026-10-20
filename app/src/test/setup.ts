import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { fakeCameras, fakeMics, rooms } from "./fakeLiveKit";

// findBy and waitFor wait up to 3 s, not 1 s: CI's runners are slower than a laptop,
// and a room test waiting on a few polls ran out there.
configure({ asyncUtilTimeout: 3000 });

// No WebRTC in jsdom: every test gets the fake LiveKit instead of the real package.
vi.mock("livekit-client", () => import("./fakeLiveKit"));

afterEach(() => {
  cleanup();
  rooms.length = 0;
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

// jsdom lacks these browser APIs.
// No canvas: drawing is the browser's to prove. Without this jsdom warns on every render of the
// standby screen's static (spec 0136); a test that draws stubs its own context.
HTMLCanvasElement.prototype.getContext = (() => null) as never;
// The screen picker: the last fake room plays it (`nextPicker`, `nextPickerAudio`).
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    getDisplayMedia: (request?: unknown) => rooms[rooms.length - 1].localParticipant.getDisplayMedia(request),
    enumerateDevices: async () => [
      ...fakeCameras.map((c) => ({ ...c, kind: "videoinput", groupId: "" })),
      ...fakeMics.map((m) => ({ ...m, kind: "audioinput", groupId: "" })),
    ],
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
