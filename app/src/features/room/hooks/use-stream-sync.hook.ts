import { useEffect, useRef } from "react";
import type { SharingConnection, StreamKind } from "@core/api/api.types";
import type { ConnectionState } from "@core/livekit/livekit.types";
import { KINDS } from "../state/room.constants";
import type { RoomStore } from "../state/room.store";
import type { RoomModel } from "../state/room.types";
import type { SettingsQueue } from "../utils/settings-queue.util";
import { useMySteps } from "./use-my-steps.hook";

type Inputs = {
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

/**
 * Keeps my streams and the API in step: a stream the API lost (it restarted) is registered again,
 * or stops when the places filled up; one the API lists but nothing sends (the browser's own Stop
 * sharing bar, the camera going away, a reload) is ended; a stream that ended outside Stop is off.
 */
export function useStreamSync({
  store,
  model,
  live,
  publishing,
  connection,
  connectionOf,
  stopSending,
  queue,
}: Inputs) {
  const { polledAt, seated, streamsBusy, mine } = model;
  const loaded = model.streams !== null;
  const registering = useRef<Record<StreamKind, boolean>>({ screen: false, camera: false });
  const { step, busy } = useMySteps(store);

  // Again after each poll: a failed registration is tried on the next one.
  useEffect(() => {
    if (!loaded || !seated) return;
    for (const kind of KINDS) {
      if (!publishing[kind] || live[kind] || busy(kind) || registering.current[kind]) continue;
      const sent = connectionOf(kind);
      if (!sent) continue;
      registering.current[kind] = true;
      void store
        .startStream(kind, sent, queue.acceptedFor(kind))
        .then((outcome) => (outcome === "full" ? stopSending(kind) : undefined))
        .finally(() => {
          registering.current[kind] = false;
        });
    }
  }, [loaded, seated, polledAt, publishing, live, connectionOf, stopSending, store, queue, busy]);

  useEffect(() => {
    if (connection !== "connected" || streamsBusy) return;
    for (const kind of KINDS) {
      if (live[kind] && !publishing[kind] && !busy(kind)) void store.stopStream(kind);
    }
  }, [connection, streamsBusy, live, publishing, store, busy]);

  useEffect(() => {
    for (const kind of KINDS) {
      if (mine[kind] === "live" && !publishing[kind]) step(kind, "off");
    }
  }, [mine, publishing, step]);
}
