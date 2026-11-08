import { useState } from "react";
import { seenVideo } from "../utils/seen-video.util";

/** Whether the stream on the stage (`key`) is stopping: its video has played, and has gone. */
export function useStopping(key: string, hasVideo: boolean): boolean {
  const [seen, setSeen] = useState<string | null>(null);
  const now = seenVideo(seen, key, hasVideo);
  if (now !== seen) setSeen(now);
  return !hasVideo && now === key;
}
