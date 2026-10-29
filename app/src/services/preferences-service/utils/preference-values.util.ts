import type { StreamMode } from "@services/xove-api-service/types/api.types";
import type { VoicePrefs } from "../types/preferences.types";

/** A stored number kept between 0 and 1, or the fallback when it isn't a number. */
export function between0and1(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

/** A stored text that is one of the stream modes. */
export function isMode(value: string | null): value is StreamMode {
  return value === "smooth" || value === "sharp";
}

/** The voice processing saved as JSON, or nothing when it can't be read. */
export function processingFrom(text: string | null): Partial<Record<keyof VoicePrefs, unknown>> {
  try {
    const parsed: unknown = JSON.parse(text ?? "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
