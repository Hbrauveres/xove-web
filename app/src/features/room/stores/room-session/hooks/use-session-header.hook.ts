import { useMemo } from "react";
import { liveIn, onMyStage, sharingOf } from "../utils/sharing.util";
import type { Account, HeaderSession, Light, SessionCore, StageSession } from "../types/room-session.types";

/** The header's part: the activity (which can put someone on my stage), the people, my account. */
export function useSessionHeader(
  core: SessionCore,
  stage: StageSession,
  account: Account,
  ambilight: Light,
): HeaderSession {
  const pick = stage.stage;
  // What each person shares, for the people panel and the activity's links.
  const sharing = useMemo(() => sharingOf(core.sharers), [core.sharers]);
  const { video } = core;
  return useMemo(() => {
    const isLive = liveIn(sharing);
    const watching = onMyStage(pick);
    return {
      activity: {
        events: core.activity,
        people: core.knownPeople,
        meId: core.me.id,
        connection: video.connection,
        isLive,
        watching,
        onWatch: pick.pick,
      },
      people: {
        people: core.people,
        meId: core.me.id,
        meTalking: video.voiceSpeaking,
        sharing,
        watchingOf: core.watchingOf,
        seats: core.seats,
      },
      me: {
        me: core.me,
        isAdmin: account.isAdmin,
        connection: video.connection,
        ambilight: ambilight.value,
        onAmbilightChange: ambilight.change,
        onSignOut: account.onSignOut,
      },
    };
  }, [core, video, sharing, pick, account, ambilight]);
}
