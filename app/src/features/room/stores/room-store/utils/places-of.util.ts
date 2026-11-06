import type { StreamsState } from "@services/xove-api-service";

/**
 * How many streams can be live at once: the app's own setting (`/config.json`),
 * else the API's answer, else, from an older API, its free places plus its live streams.
 */
export const placesOf = (setting: number | null, answer: StreamsState): number =>
  setting ?? answer.places ?? answer.free + answer.streams.length;
