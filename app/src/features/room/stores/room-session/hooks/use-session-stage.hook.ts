import { useMemo } from "react";
import type { AmbilightPrefs } from "@services/preferences-service";
import { canShareScreen } from "@services/media-devices-service";
import { useStage } from "../../../hooks/use-stage.hook";
import { useWatchReport } from "./use-watch-report.hook";
import type { RoomStoreValue } from "../types/room-store.types";
import type { SessionCore, SettingsOpen, StageSession } from "../types/room-session.types";

/**
 * The stage's part: who's on it (the stage, the previews and the activity can change it, and the
 * API hears of it), who watches it, the others for an empty stage, and my buttons on it.
 */
export function useSessionStage(
  room: RoomStoreValue,
  core: SessionCore,
  settings: SettingsOpen,
  ambilight: AmbilightPrefs,
): StageSession {
  const { store, model, video } = room;
  const stage = useStage(core.sharers);
  // A stream still loading counts as nothing watched yet ("In the room").
  const stagePersonId = stage.playing ? (stage.big?.person.id ?? null) : null;
  const onStage = useMemo(
    () => (stagePersonId && stage.mainKind ? { personId: stagePersonId, kind: stage.mainKind } : null),
    [stagePersonId, stage.mainKind],
  );
  useWatchReport({
    watching: model.watching,
    me: model.me,
    inRoom: model.seated === true && video.connection === "connected",
    report: store.reportWatching,
    onStage,
  });
  const bigId = stage.big?.person.id;
  const { people, watchingOf, me } = core;
  // Who has the person on the stage on theirs (me included, never that person).
  const watchers = useMemo(
    () => (bigId ? people.filter((p) => p.id !== bigId && watchingOf[p.id]?.sharerId === bigId) : []),
    [people, watchingOf, bigId],
  );
  const others = useMemo(() => people.filter((p) => p.id !== me.id), [people, me.id]);
  const controls = useMemo(
    () => ({
      mine: core.mine,
      places: core.places,
      free: core.free,
      cameras: core.cameras,
      camera: core.cameraId,
      canShareScreen: canShareScreen(),
      noSound: core.noSound,
      screenSurface: video.screenSurface,
      busy: core.busy,
      onStart: core.start,
      onStop: core.stop,
      onChangeWindow: core.changeScreen,
      onPickCamera: core.pickCamera,
      settingsOpen: settings.open,
      onSettings: settings.toggle,
      onGoTo: settings.goToSetting,
      voice: video.voice,
      speaking: video.voiceSpeaking,
      soundHeld: video.soundHeld,
      onVoice: core.toggleVoice,
    }),
    [core, video, settings],
  );
  return useMemo(
    () => ({ sharers: core.sharers, stage, ambilight, watchers, others, controls }),
    [core.sharers, stage, ambilight, watchers, others, controls],
  );
}
