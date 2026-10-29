import type { LocalMedia, RemoteMedia, RemoteVideo, RoomPerson } from "./livekit.types";

/**
 * The room's state changes person by person: each event rebuilds only what it's about, and
 * anything that didn't change stays the same object, so nothing else on the page redraws.
 */

const sameVideo = (a?: RemoteVideo, b?: RemoteVideo) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.video === b.video &&
    a.height === b.height &&
    a.layers === b.layers &&
    a.setQuality === b.setQuality);

/** Two entries show the same thing (their tracks, flags and actions). */
function sameMedia(a: RemoteMedia, b: RemoteMedia): boolean {
  return (
    sameVideo(a.screen, b.screen) &&
    sameVideo(a.camera, b.camera) &&
    a.sound === b.sound &&
    a.hasSound === b.hasSound &&
    a.setSoundOn === b.setSoundOn &&
    a.voice === b.voice &&
    a.hasVoice === b.hasVoice &&
    a.speaking === b.speaking &&
    a.setVoiceOn === b.setVoiceOn
  );
}

/** Someone's entry replaced by `next` (or removed with undefined); the same record when nothing changed. */
export function withPerson(
  remote: Record<string, RemoteMedia>,
  identity: string,
  next: RemoteMedia | undefined,
): Record<string, RemoteMedia> {
  const before = remote[identity];
  if (!next) {
    if (!before) return remote;
    const { [identity]: _gone, ...rest } = remote;
    return rest;
  }
  if (before && sameMedia(before, next)) return remote;
  return { ...remote, [identity]: next };
}

/** Who's talking now: only the people whose flag changes get a new entry. */
export function withSpeakers(
  remote: Record<string, RemoteMedia>,
  speaking: ReadonlySet<string>,
): Record<string, RemoteMedia> {
  let next = remote;
  for (const [identity, media] of Object.entries(remote)) {
    const now = media.hasVoice && speaking.has(identity);
    if (now !== media.speaking) next = { ...next, [identity]: { ...media, speaking: now } };
  }
  return next;
}

/** The people in the room; the same list when nobody came, left or changed name. */
export function withOthers(before: RoomPerson[], now: RoomPerson[]): RoomPerson[] {
  const same =
    before.length === now.length && before.every((p, i) => p.identity === now[i]?.identity && p.name === now[i]?.name);
  return same ? before : now;
}

/** What I send; the same object when nothing changed. */
export function withLocal(before: LocalMedia, now: LocalMedia): LocalMedia {
  const same =
    before.publishing.screen === now.publishing.screen &&
    before.publishing.camera === now.publishing.camera &&
    before.local.screen === now.local.screen &&
    before.local.camera === now.local.camera &&
    before.screenSurface === now.screenSurface &&
    before.cameraId === now.cameraId &&
    before.voice === now.voice &&
    before.localVoice === now.localVoice &&
    before.micInput === now.micInput;
  return same ? before : now;
}
