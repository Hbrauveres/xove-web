import { useMemo } from "react";
import type { VideoRoomState } from "@core/livekit/types/livekit.types";
import { firstName } from "../state/room.model";
import { knownPeopleOf, myLiveOf, peopleOf, personOf, sharersOf, watchingOf } from "../state/room.selectors";
import type { RoomModel } from "../state/room.types";

/** What the room shows, from the store: me, who's here and was, the sharers with their media, my live streams. */
export function useRoomView(model: RoomModel, video: VideoRoomState, myName: string) {
  const { streams, me: myId, names, present, watching } = model;
  const myLive = useMemo(() => myLiveOf({ streams, me: myId }), [streams, myId]);
  // Until the room names me (only when the video access failed), my account's name stands in.
  const me = useMemo(
    () => (myId ? personOf({ names }, myId) : { ...personOf({ names }, ""), name: firstName(myName) }),
    [myId, names, myName],
  );
  const sharers = useMemo(() => sharersOf({ streams, me: myId, names }, video), [streams, myId, names, video]);
  const people = useMemo(
    () => (myId ? peopleOf({ me: myId, present, names }) : [me, ...peopleOf({ me: null, present, names })]),
    [myId, present, names, me],
  );
  const knownPeople = useMemo(() => knownPeopleOf({ me: myId, present, names }), [myId, present, names]);
  const watches = useMemo(() => watchingOf({ watching }), [watching]);
  return useMemo(
    () => ({ me, people, knownPeople, sharers, myLive, watchingOf: watches }),
    [me, people, knownPeople, sharers, myLive, watches],
  );
}
