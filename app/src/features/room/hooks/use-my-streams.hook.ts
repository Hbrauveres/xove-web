import { useCallback, useMemo, useState } from "react";
import type { StreamKind, StreamSettings } from "@services/xove-api-service";
import type { Capture } from "@services/livekit-service";
import { BUSY_STEPS, KINDS } from "../constants/room.constants";
import { useMySteps } from "./use-my-steps.hook";
import type { MyStreamsInputs } from "../types/my-streams.types";

/**
 * Starting and stopping my screen and camera. One click: the browser's picker, or the camera (the
 * preview, when it's on), sent at once with the remembered settings, then told to the API. Each
 * stream moves along its steps in the room's model. Also whether my screen goes out without sound.
 */
export function useMyStreams({ store, video, capture, prefs, queue, takePreview, mine }: MyStreamsInputs) {
  const [noSound, setNoSound] = useState(false);
  const { step, busy } = useMySteps(store);

  const send = useCallback(
    async (captured: Capture, chosen: StreamSettings) => {
      const kind = captured.kind;
      step(kind, "starting");
      const sending = await video.publishCapture(captured, chosen);
      if (!sending) return;
      const { hasSound, ...connection } = sending;
      if ((await store.startStream(kind, connection, chosen)) !== "ok") {
        await video.stop(kind);
        return;
      }
      step(kind, "live");
      queue.accept(kind, chosen);
      if (kind === "screen") setNoSound(!hasSound);
    },
    [video, store, step, queue],
  );

  const start = useCallback(
    async (kind: StreamKind) => {
      step(kind, "picking");
      try {
        const preview = kind === "camera" ? takePreview() : null;
        const captured = preview ?? (await capture(kind, prefs[kind].mode));
        if (captured) await send(captured, prefs[kind]);
      } finally {
        if (busy(kind)) step(kind, "off");
      }
    },
    [step, busy, takePreview, capture, prefs, send],
  );

  const stop = useCallback(
    async (kind: StreamKind) => {
      step(kind, "stopping");
      try {
        await video.stop(kind);
        await store.stopStream(kind);
      } finally {
        step(kind, "off");
      }
    },
    [video, store, step],
  );

  /** A new pick of my screen says whether it has sound. */
  const onScreenSound = useCallback((hasSound: boolean) => setNoSound(!hasSound), []);

  const starting = KINDS.some((kind) => BUSY_STEPS.includes(mine[kind]));
  return useMemo(
    () => ({
      start: (kind: StreamKind) => void start(kind),
      stop: (kind: StreamKind) => void stop(kind),
      noSound,
      onScreenSound,
      busy: starting,
    }),
    [start, stop, noSound, onScreenSound, starting],
  );
}
