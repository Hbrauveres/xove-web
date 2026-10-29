import { useCallback, useMemo, useRef, useState } from "react";
import type { StreamMode, StreamSettings } from "@core/api/types/api.types";
import type { Capture } from "@core/livekit/types/livekit.types";
import { useCaptureLifecycle } from "./use-capture-lifecycle.hook";

type Inputs = {
  capture: (kind: "camera", mode: StreamMode) => Promise<Capture | null>;
  discard: (capture: Capture) => void;
  camera: StreamSettings;
  /** My camera is being sent: no preview needed. */
  cameraSent: boolean;
};

/**
 * My camera, captured for the settings panel's preview and not sent. It stops when the panel no
 * longer wants it (also when the camera answers after the panel closed), when the camera goes away,
 * and when the page closes; the camera button can take it and send it as is.
 */
export function useCameraPreview({ capture, discard, camera, cameraSent }: Inputs) {
  const [preview, setPreviewState] = useState<Capture | null>(null);
  const previewRef = useRef<Capture | null>(null);
  const wanted = useRef(false);
  const setPreview = useCallback((next: Capture | null) => {
    previewRef.current = next;
    setPreviewState(next);
  }, []);

  const previewCamera = useCallback(
    async (on: boolean) => {
      wanted.current = on;
      if (!on) {
        if (previewRef.current) discard(previewRef.current);
        setPreview(null);
        return;
      }
      if (previewRef.current || cameraSent) return;
      const captured = await capture("camera", camera.mode);
      if (!captured) return;
      // Closed (or sent) while the camera was answering: don't leave it on.
      if (!wanted.current || previewRef.current) {
        discard(captured);
        return;
      }
      setPreview(captured);
    },
    [capture, discard, camera.mode, cameraSent, setPreview],
  );

  /** For the camera button: the preview to send as is, or null; a preview still asking is dropped. */
  const takePreview = useCallback(() => {
    wanted.current = false;
    const taken = previewRef.current;
    setPreview(null);
    return taken;
  }, [setPreview]);

  /** Captures again (another camera was picked); nothing when there's no preview. */
  const restart = useCallback(async () => {
    if (!previewRef.current) return;
    discard(previewRef.current);
    setPreview(null);
    await previewCamera(true);
  }, [discard, setPreview, previewCamera]);

  const clear = useCallback(() => setPreview(null), [setPreview]);
  useCaptureLifecycle(preview, previewRef, discard, clear);

  return useMemo(
    () => ({
      cameraPreview: preview?.preview,
      previewCamera: (on: boolean) => void previewCamera(on),
      takePreview,
      restart,
    }),
    [preview, previewCamera, takePreview, restart],
  );
}
