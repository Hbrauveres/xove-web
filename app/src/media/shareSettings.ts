import type { StreamMode, StreamQuality } from "@core/api/api.types";
import { BEST_SCREEN, SHARE_QUALITIES } from "@core/devices/devices.constants";

/** What the room's screens show about a stream's quality and mode. How they're sent is in core/livekit. */

const presetOf = (quality: StreamQuality) => SHARE_QUALITIES.find((q) => q.id === quality) ?? BEST_SCREEN;

/** The modes, plain, as the settings show them, with what each keeps in their tooltips (spec 0107). */
export const MODE_OPTIONS: { value: StreamMode; label: string; title: string }[] = [
  { value: "smooth", label: "Smooth", title: "Keeps motion fluid when the connection is tight: games, videos" },
  { value: "sharp", label: "Sharp", title: "Keeps detail sharp when the connection is tight: text, code" },
];

/**
 * The qualities a viewer can receive for a screen whose top layer is `height` pixels
 * tall: the sharer's quality and the ones below it, never above (Auto asks for no more). A screen that
 * isn't 16:9 comes out a bit shorter than its preset, so it counts as the preset
 * just above.
 */
export function viewerQualities(height: number, layers?: number, cap?: StreamQuality): StreamQuality[] {
  const ascending = [...SHARE_QUALITIES].reverse();
  const top = ascending.find((q) => height <= q.height) ?? BEST_SCREEN;
  // The sharer's chosen quality caps what anyone can pick (it can change while sharing).
  const capHeight = presetOf(cap ?? "1080p").height;
  const offered = SHARE_QUALITIES.filter((q) => q.height <= Math.min(top.height, capHeight)).map((q) => q.id);
  // Firefox and Safari sharers send one quality only: picking a lower one would change nothing.
  return layers === 1 ? offered.slice(0, 1) : offered;
}
