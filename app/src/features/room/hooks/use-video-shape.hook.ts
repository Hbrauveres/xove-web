import { useEffect, useState } from "react";
import { IGNORE_SHAPE, WIDESCREEN } from "../constants/video-shape.constants";
import type { ShapeRead } from "../types/video-shape.types";

/**
 * The shape of a video's picture, width ÷ height: 16:9 until its size is known,
 * then the picture's own, following it when the sharer resizes or switches the window.
 */
export function useVideoShape(video: HTMLVideoElement | null): number {
  // The shape read, and the video it was read from: another video starts again at 16:9.
  const [read, setRead] = useState<ShapeRead | null>(null);

  useEffect(() => {
    if (!video) return;
    const update = () => {
      const { videoWidth: w, videoHeight: h } = video;
      if (!w || !h) return;
      const next = w / h;
      setRead((prev) =>
        prev?.video === video && Math.abs(next - prev.shape) / prev.shape < IGNORE_SHAPE
          ? prev
          : { video, shape: next },
      );
    };
    update();
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("resize", update);
    return () => {
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("resize", update);
    };
  }, [video]);

  return video && read?.video === video ? read.shape : WIDESCREEN;
}
