import type { StreamKind, StreamMode, StreamSettings } from "@core/api/types/api.types";
import type { LiveKitAdapter } from "@core/livekit/livekit.adapter";
import type { Capture } from "@core/livekit/types/livekit.types";
import type { RoomStore } from "../state/room.store";
import type { MyStreamStep } from "./room.types";
import type { SettingsQueue } from "../utils/settings-queue.util";

export type MyStreamsInputs = {
  store: RoomStore;
  video: Pick<LiveKitAdapter, "publishCapture" | "stop">;
  capture: (kind: StreamKind, mode: StreamMode) => Promise<Capture | null>;
  prefs: Record<StreamKind, StreamSettings>;
  queue: SettingsQueue;
  /** The camera's preview, to send as is. */
  takePreview: () => Capture | null;
  mine: Record<StreamKind, MyStreamStep>;
};
