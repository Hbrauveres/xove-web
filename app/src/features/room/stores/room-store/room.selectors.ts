import type { StreamKind } from "@services/xove-api-service";
import type { VideoRoomState } from "@services/livekit-service";
import type { ActivityEvent, Friend, Sharer } from "@features/room/types/room-view.types";
import { hueOf } from "./utils/person-colour.util";
import { ACTIVITY_KEPT } from "../../constants/room.constants";
import type { PersonId, RoomModel, RoomStream, Watch } from "../../types/room.types";
import { feedOf } from "./utils/feed.util";

/** Someone as the room shows them: their first name and their colour, the same on every screen. */
export const personOf = (model: Pick<RoomModel, "names">, id: PersonId): Friend => ({
  id,
  name: model.names[id] ?? "Someone",
  hue: hueOf(id),
  online: true,
});

/** Me first, then everyone connected to the video room. */
export function peopleOf(model: Pick<RoomModel, "me" | "present" | "names">): Friend[] {
  const ids = model.me ? [model.me, ...model.present.filter((id) => id !== model.me)] : model.present;
  return ids.map((id) => personOf(model, id));
}

/** Everyone the activity may name: who's here, then who was here or shared before. */
export function knownPeopleOf(model: Pick<RoomModel, "me" | "present" | "names">): Friend[] {
  const here = peopleOf(model);
  const gone = Object.keys(model.names).filter((id) => !here.some((p) => p.id === id));
  return [...here, ...gone.map((id) => personOf(model, id))];
}

/** Which of my streams the API lists as live. */
export function myLiveOf(model: Pick<RoomModel, "streams" | "me">): Record<StreamKind, boolean> {
  const live = (kind: StreamKind) => (model.streams ?? []).some((s) => s.personId === model.me && s.kind === kind);
  return { screen: live("screen"), camera: live("camera") };
}

/** Everyone with a live stream, the longest sharing first, with what the video room has of them. */
export function sharersOf(model: Pick<RoomModel, "streams" | "me" | "names">, video: VideoRoomState): Sharer[] {
  const byPerson = new Map<PersonId, RoomStream[]>();
  for (const s of model.streams ?? []) byPerson.set(s.personId, [...(byPerson.get(s.personId) ?? []), s]);
  return [...byPerson].map(([id, streams]) => {
    const isMe = id === model.me;
    const media = isMe ? undefined : video.remote[id];
    const screen = feedOf(streams, "screen", video, isMe);
    const camera = feedOf(streams, "camera", video, isMe);
    return {
      person: personOf(model, id),
      isMe,
      since: streams[0]?.since ?? 0,
      ...(screen ? { screen } : {}),
      ...(camera ? { camera } : {}),
      ...(media
        ? {
            ...(media.sound ? { sound: media.sound } : {}),
            hasSound: media.hasSound,
            setSoundOn: media.setSoundOn,
            ...(media.voice ? { voice: media.voice } : {}),
            hasVoice: media.hasVoice,
            speaking: media.speaking,
            setVoiceOn: media.setVoiceOn,
          }
        : {}),
    };
  });
}

/** Who watches what, per person; empty from an older API. */
export const watchingOf = (model: Pick<RoomModel, "watching">): Record<PersonId, Watch> => model.watching ?? {};

/** What happened, oldest first: the room's own events and the video room's joins and leaves. */
export function activityOf(model: Pick<RoomModel, "activity">, presence: ActivityEvent[]): ActivityEvent[] {
  return [...presence, ...model.activity].sort((a, b) => a.at - b.at).slice(-ACTIVITY_KEPT);
}
