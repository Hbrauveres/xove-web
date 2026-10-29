import type { StreamKind } from "@core/api/api.types";
import type { Sharer } from "../../types";
import { aTrack } from "./track.factory";

type SharerOptions = Partial<Sharer> & { id?: string; name?: string; kinds?: StreamKind[] };

/**
 * Someone else sharing, new on every call, with fresh tracks: Bruno's screen unless told otherwise.
 * `kinds` picks the streams; anything else (sound, voice, since) is laid over the result.
 */
export function aSharer({ id = "user-7", name = "Bruno", kinds = ["screen"], ...extra }: SharerOptions = {}): Sharer {
  const feeds = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      {
        kind,
        startedAt: Date.now(),
        settings: { quality: "1080p", mode: "smooth" },
        remote: { video: aTrack(), setQuality: () => {} },
      },
    ]),
  );
  return {
    person: { id, name, hue: 100, online: true },
    isMe: false,
    since: Date.now(),
    hasSound: false,
    ...feeds,
    ...extra,
  };
}
