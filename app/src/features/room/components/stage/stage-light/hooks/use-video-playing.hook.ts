import { useEffect, useState } from "react";
import { PLAY_EVENTS } from "../constants/stage-light.constants";

/** Whether the video plays, from its own events; false without one. */
export function useVideoPlaying(video: HTMLVideoElement | null): boolean {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!video) return;
    const follow = () => setPlaying(!video.paused);
    follow();
    PLAY_EVENTS.forEach((e) => video.addEventListener(e, follow));
    return () => PLAY_EVENTS.forEach((e) => video.removeEventListener(e, follow));
  }, [video]);
  return Boolean(video) && playing;
}
