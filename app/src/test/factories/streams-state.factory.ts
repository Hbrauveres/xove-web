import type { LiveStream, StreamsState } from "@core/api/types/api.types";

/** A live stream as the API lists it: someone's 1080p screen since 10:00, unless said otherwise. */
export const aLiveStream = (overrides: Partial<LiveStream> = {}): LiveStream => ({
  kind: "screen",
  userId: 2,
  name: "Marina Souza",
  avatarUrl: null,
  since: "2026-10-29T10:00:00Z",
  settings: { quality: "1080p", mode: "smooth" },
  mine: false,
  ...overrides,
});

/** The API's streams answer: nobody live, everyone seated, unless said otherwise. */
export const anAnswer = (overrides: Partial<StreamsState> = {}): StreamsState => ({
  streams: [],
  free: 6,
  seated: true,
  ...overrides,
});
