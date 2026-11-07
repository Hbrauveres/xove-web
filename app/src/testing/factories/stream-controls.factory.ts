import { vi } from "vitest";
import type { StreamControls } from "@features/room/types/stream-controls.types";

/** My controls, nothing live, every place free, every action a spy; anything given is laid over. */
export function aStreamControls(over: Partial<StreamControls> = {}): StreamControls {
  return {
    mine: { screen: false, camera: false },
    places: 6,
    free: 6,
    cameras: [],
    camera: null,
    canShareScreen: true,
    onStart: vi.fn(),
    onStop: vi.fn(),
    onChangeWindow: vi.fn(),
    onPickCamera: vi.fn(),
    settingsOpen: false,
    onSettings: vi.fn(),
    voice: false,
    onVoice: vi.fn(),
    ...over,
  };
}
