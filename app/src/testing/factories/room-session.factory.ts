import { vi } from "vitest";
import type { RoomSession } from "@features/room/stores/room-session";
import type { StagePick } from "@features/room/types/stage.types";
import type { Friend } from "@features/room/types/room-view.types";
import { aStreamControls } from "./stream-controls.factory";

const ME: Friend = { id: "me-1", name: "Henrique", hue: 210, online: true };

/** Nobody on the stage, each action a spy. */
export function aStagePick(over: Partial<StagePick> = {}): StagePick {
  return {
    big: null,
    mainKind: null,
    playing: false,
    swappedFor: {},
    pick: vi.fn(),
    toggleSwap: vi.fn(),
    ...over,
  } as StagePick;
}

/** A session for one area: me alone in a quiet room, every action a spy; each part laid over. */
export function aRoomSession(over: { [K in keyof RoomSession]?: Partial<RoomSession[K]> } = {}): RoomSession {
  return {
    header: {
      activity: {
        events: [],
        people: [ME],
        meId: ME.id,
        connection: "connected",
        isLive: () => false,
        watching: null,
        onWatch: vi.fn(),
      },
      people: { people: [ME], meId: ME.id, sharing: {}, watchingOf: {}, seats: null },
      me: {
        me: ME,
        isAdmin: false,
        connection: "connected",
        ambilight: { on: true, brightness: 0.9 },
        onAmbilightChange: vi.fn(),
        onSignOut: vi.fn(),
      },
      ...over.header,
    },
    stage: {
      sharers: [],
      stage: aStagePick(),
      ambilight: { on: true, brightness: 0.9 },
      watchers: [],
      others: [],
      controls: aStreamControls(),
      ...over.stage,
    },
    settings: {
      open: false,
      onClose: vi.fn(),
      screenTab: true,
      mine: { screen: false, camera: false },
      prefs: { screen: { quality: "1080p", mode: "sharp" }, camera: { quality: "720p", mode: "smooth" } },
      onPrefsChange: vi.fn(),
      onChangeWindow: vi.fn(),
      cameras: [],
      cameraId: null,
      onPickCamera: vi.fn(),
      onPreviewCamera: vi.fn(),
      ...over.settings,
    },
    error: null,
    ...(over.error !== undefined ? { error: over.error as string | null } : {}),
  };
}
