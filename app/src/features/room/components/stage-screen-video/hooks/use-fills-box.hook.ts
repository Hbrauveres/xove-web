import { useEffect, useState, type RefObject } from "react";
import { fillsBox } from "../utils/fills-box.util";

/** Whether the video's picture fills its box, checked again whenever either changes size. */
export function useFillsBox(video: RefObject<HTMLVideoElement | null>): boolean {
  const [fill, setFill] = useState(false);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const check = () => setFill(fillsBox(el.clientWidth / el.clientHeight, el.videoWidth / el.videoHeight));
    check();
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    watch?.observe(el);
    el.addEventListener("loadedmetadata", check);
    el.addEventListener("resize", check);
    return () => {
      watch?.disconnect();
      el.removeEventListener("loadedmetadata", check);
      el.removeEventListener("resize", check);
    };
  }, [video]);
  return fill;
}
