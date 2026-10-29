import { useEffect, useRef } from "react";
import type { StreamKind } from "@core/api/types/api.types";
import { KINDS } from "../constants/room.constants";
import { useMySteps } from "./use-my-steps.hook";
import type { StreamSyncInputs } from "../types/stream-sync.types";

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
}: StreamSyncInputs) {
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
