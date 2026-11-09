import type { StreamKind } from "@services/xove-api-service";
import type { Sharer } from "@features/room/types/room-view.types";
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

/** Me sharing my screen from this browser (a local track), new on every call; anything else laid over. */
export function aMe(extra: Partial<Sharer> = {}): Sharer {
  return {
    person: { id: "user-99", name: "Henrique", hue: 210, online: true },
    isMe: true,
    since: Date.now(),
    screen: { kind: "screen", startedAt: Date.now(), settings: { quality: "1080p", mode: "smooth" }, local: aTrack() },
    hasSound: false,
    ...extra,
  };
}
