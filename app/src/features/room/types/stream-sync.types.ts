import type { SharingConnection, StreamKind } from "@core/api/types/api.types";
import type { ConnectionState } from "@core/livekit/types/livekit.types";
import type { RoomStore } from "../state/room.store";
import type { RoomModel } from "./room.types";
import type { SettingsQueue } from "../utils/settings-queue.util";

export type StreamSyncInputs = {
  store: RoomStore;
  model: RoomModel;
  /** My streams the API lists as live, and the ones this browser sends. */
  live: Record<StreamKind, boolean>;
  publishing: Record<StreamKind, boolean>;
  connection: ConnectionState;
  connectionOf: (kind: StreamKind) => SharingConnection | null;
  stopSending: (kind: StreamKind) => Promise<void>;
  queue: SettingsQueue;
};
