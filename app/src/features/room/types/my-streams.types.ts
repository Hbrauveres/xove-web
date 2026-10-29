import type { StreamKind, StreamMode, StreamSettings } from "@services/xove-api-service";
import type { LiveKitAdapter } from "@services/livekit-service";
import type { Capture } from "@services/livekit-service";
import type { RoomStore } from "../stores/room-store";
import type { MyStreamStep } from "./room.types";
import type { SettingsQueue } from "../../../services/settings-queue-service";

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
