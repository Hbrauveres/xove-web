import { useEffect, useRef } from "react";

/**
 * Turns the camera on for the preview while it's wanted (the Camera tab open, the camera not live),
 * and off when it no longer is or the panel leaves. Only changes are told, once each.
 */
export function useCameraPreviewSwitch(wanted: boolean, onPreviewCamera: (on: boolean) => void) {
  const previewing = useRef(false);
  const preview = useRef(onPreviewCamera);
  useEffect(() => {
    preview.current = onPreviewCamera;
  });
  useEffect(() => {
    if (wanted === previewing.current) return;
    previewing.current = wanted;
    preview.current(wanted);
  }, [wanted]);
  useEffect(
    () => () => {
      if (previewing.current) preview.current(false);
      // React may mount it again (StrictMode, in development): start from off.
      previewing.current = false;
    },
    [],
  );
}
