import type { MediaTrack, RemoteMedia } from "@services/livekit-service/types/livekit.types";

/** A track a test can tell apart from any other. */
export const aTrack = (): MediaTrack => ({ attach: (e) => e, detach: (e) => e });

/** Someone's media, fresh on every call: nothing on, unless `overrides` says so. */
export const someMedia = (overrides: Partial<RemoteMedia> = {}): RemoteMedia => ({
  hasSound: false,
  setSoundOn: () => {},
  hasVoice: false,
  speaking: false,
  setVoiceOn: () => {},
  ...overrides,
});
