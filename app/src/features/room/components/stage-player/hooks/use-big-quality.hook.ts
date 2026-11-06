import { useEffect, useRef } from "react";
import type { LiveFeed } from "../../../types/room-view.types";
import { askedQuality } from "../utils/asked-quality.util";

/**
 * Watching is always Auto: the size it's shown at, stepping down when the connection can't keep
 * up. Asked for as soon as the big video arrives, and whenever its sharer's cap changes: Auto never
 * asks for more than the cap, so the server stops sending the layers above it. Leaving the big
 * player (to a thumbnail): back to Auto, so it comes in small. My own stream asks for nothing.
 */
export function useBigQuality(main: LiveFeed | null, isMe: boolean): void {
  const remote = isMe ? undefined : main?.remote;
  // A new function arrives with every update from the server; the video it's about is what matters.
  const setQuality = useRef(remote?.setQuality);
  useEffect(() => {
    setQuality.current = remote?.setQuality;
  });
  const video = remote?.video;
  const request = askedQuality(main);
  useEffect(() => {
    const set = setQuality.current;
    if (!video || !set) return;
    set(request);
    return () => set("auto");
  }, [video, request]);
}
