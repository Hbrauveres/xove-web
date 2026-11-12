import type { RemoteVideo } from "@services/livekit-service";
import type { LiveFeed } from "../../../../types/room-view.types";
import { viewerQualities } from "./viewer-qualities.util";

/**
 * What to ask of the big stream: Auto, unless its sharer caps it below their best, then the best
 * the cap allows (Auto would ask the server for the layers above it).
 */
export function askedQuality(feed: LiveFeed | null): Parameters<RemoteVideo["setQuality"]>[0] {
  const cap = feed?.settings.quality;
  if (!cap || cap === "1080p") return "auto";
  return viewerQualities(feed.remote?.height ?? 0, feed.remote?.layers, cap)[0] ?? "auto";
}
