import { MAX_STREAM_PLACES } from "../constants/app-config.constants";
import type { AppConfig } from "../types/app-config.types";

const isPlaces = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_STREAM_PLACES;

/** The file's settings, each one kept only when it's what it should be; anything else is left out. */
export function parseAppConfig(raw: unknown): AppConfig {
  const places = typeof raw === "object" && raw !== null && "streamPlaces" in raw ? raw.streamPlaces : null;
  return { streamPlaces: isPlaces(places) ? places : null };
}
