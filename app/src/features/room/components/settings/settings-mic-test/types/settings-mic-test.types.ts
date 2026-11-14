import type { MediaTrack } from "@services/livekit-service";

export interface SettingsMicTestProps {
  /** The mic's live level, 0 to 1. */
  level: number;
  /** My voice, sent: what Test plays back. Without it, nothing can be tested. */
  track?: MediaTrack | undefined;
  /** The line: sound under it isn't sent. */
  sensitivity: number;
  onSensitivity: (next: number) => void;
}
