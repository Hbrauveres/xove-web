import type { SharingConnection, StreamKind } from "@services/xove-api-service";
import type { ConnectionState } from "@services/livekit-service";
import type { RoomStore } from "../stores/room-store";
import type { RoomModel } from "./room.types";
import type { SettingsQueue } from "../../../services/settings-queue-service";

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
