import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { resetTv } from "../components/stage/staticBands";
import { floatingStore } from "@shared/stores/floating-store";
import { resetToast } from "../components/ui/toast";
import { resetTooltipWarmth } from "@shared/components/tooltip/utils/warmth.util";
import { fakeCameras, fakeMics, resetFakeLiveKit, rooms } from "./fakeLiveKit";

// findBy and waitFor give up after 1 s: a wait that needs longer is a delay that belongs on fake
// timers, and a stuck test fails fast instead of hiding for seconds.
configure({ asyncUtilTimeout: 1000 });

// Testing Library moves fake timers along while findBy and waitFor wait, but only when it sees Jest's
// global: this one hands it Vitest's, so a test on a fake clock (factories/clock.factory.ts) waits the same way.
(globalThis as { jest?: unknown }).jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };

// No WebRTC in jsdom: every test gets the fake LiveKit instead of the real package.
vi.mock("livekit-client", () => import("./fakeLiveKit"));

/** Everything one test can leave behind, put back after every test, so no test sees another's.
 * Spies, stubbed globals and variables are the runner's (vite.config.ts); a new piece of shared
 * state in the app gets a reset beside it, called here. */
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!name) continue;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
  resetFakeLiveKit();
  resetToast();
  floatingStore.reset();
  resetTooltipWarmth();
  resetTv();
  resetBrowserStandIns();
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
// Media queries: a desktop window that matches none of them. Put back after every test, since a test
// may swap it for a phone's or a tablet's.
const desktopMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});
Object.defineProperty(window, "matchMedia", { writable: true, value: desktopMatchMedia });

/** The browser stand-ins a test may replace, back as setup made them: the media queries, and none of
 * what jsdom lacks and a test defines for itself (fullscreen). */
function resetBrowserStandIns() {
  window.matchMedia = desktopMatchMedia as never;
  for (const own of ["fullscreenElement", "exitFullscreen"])
    delete (document as unknown as Record<string, unknown>)[own];
}
