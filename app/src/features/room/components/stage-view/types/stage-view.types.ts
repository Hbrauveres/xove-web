import type { AmbilightPrefs } from "@services/preferences-service";
import type { StreamKind } from "@services/xove-api-service";
import type { Playback } from "../../../types/played-track.types";
import type { LiveFeed, Sharer } from "../../../types/room-view.types";

export interface StageViewProps {
  /** Who is on the stage, or nobody. */
  big: Sharer | null;
  main: LiveFeed | null;
  small?: LiveFeed | undefined;
  /** How I hear their screen's sound. */
  sound: Playback;
  ambilight: AmbilightPrefs;
  /** The picture's shape, width ÷ height. */
  shape: number;
  /** A new key starts a fresh light: another person, stream or grid. */
  lightKey: string;
  /** The big video, for the light to read. */
  video: HTMLVideoElement | null;
  onVideo: (el: HTMLVideoElement | null) => void;
  onSwap: () => void;
  /** For the empty stage. */
  canShareScreen: boolean;
  onStart: (kind: StreamKind) => void;
}
