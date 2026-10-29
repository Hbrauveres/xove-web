import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useAuth } from "@core/auth/use-auth.hook";
import { AccountButton } from "../components/room/AccountButton";
import { ActivityPill } from "../components/room/ActivityPill";
import { PeopleButton } from "../components/room/PeopleButton";
import { RoomFooter } from "../components/room/RoomFooter";
import { RoomHeader } from "../components/room/RoomHeader";
import { WaitingRoom } from "../components/room/WaitingRoom";
import { loadAmbilight } from "@core/preferences/preferences.service";
import { canShareScreen } from "@core/devices/screen-picker.util";
import { SettingsPanel } from "../components/stage/SettingsPanel";
import { Stage } from "../components/stage/Stage";
import { useFullscreenElement, useFullscreenHost } from "../hooks/useFullscreenElement";
import { useRoomStore, type RoomStoreValue } from "@features/room/hooks/use-room-store.hook";
import { roomEntry } from "@features/room/utils/room-entry.util";
import { useStage } from "@features/room/hooks/use-stage.hook";
import { useActivityFeed } from "@features/room/hooks/use-activity-feed.hook";
import { useMySending } from "@features/room/hooks/use-my-sending.hook";
import { useMyVoice } from "@features/room/hooks/use-my-voice.hook";
import { useStreamSync } from "@features/room/hooks/use-stream-sync.hook";
import { useRoomView } from "@features/room/hooks/use-room-view.hook";
import { useWatchReport } from "@features/room/hooks/use-watch-report.hook";
import type { StreamKind } from "@core/api/api.types";
import styles from "./RoomPage.module.css";

type Props = {
  /** How often to ask the API which streams are live. Tests pass a short one. */
  pollMs?: number;
};

/**
 * The whole app is one room: the stage, its controls, and who's here. Members only.
 * Up to 20 people at once (spec 0060): whoever comes next waits for a seat.
 */
export function RoomPage({ pollMs }: Props = {}) {
  const { signOut, state } = useAuth();
  const navigate = useNavigate();
  const me = state.status === "signedIn" ? state.me : null;
  const room = useRoomStore(me?.name ?? me?.email ?? "You", pollMs);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const entry = roomEntry(room.model, room.video);
  if (!entry.ready) return <WaitingRoom seat={{ ...room.seat, status: entry.waiting }} onSignOut={handleSignOut} />;
  return <Room room={room} onSignOut={handleSignOut} />;
}

function Room({ room, onSignOut }: { room: RoomStoreValue; onSignOut: () => void }) {
  const { state } = useAuth();
  const isAdmin = state.status === "signedIn" && state.me.admin;
  const { store, model, video } = room;
  const view = useRoomView(model, video, store.myName);
  const sending = useMySending(room, view.myLive);
  useStreamSync({
    store,
    model,
    live: view.myLive,
    publishing: video.publishing,
    connection: video.connection,
    connectionOf: store.video.connectionOf,
    stopSending: store.video.stop,
    queue: sending.queue,
  });
  const voice = useMyVoice({
    voice: video.voice,
    sending: video.publishing.screen || video.publishing.camera,
    startVoice: store.video.startVoice,
    stopVoice: store.video.stopVoice,
    applyVoice: store.video.applyVoice,
    setVoiceLine: store.video.setVoiceLine,
  });
  const activity = useActivityFeed(model.activity, video.presence);
  const watchStage = useWatchReport({
    watching: model.watching,
    me: model.me,
    inRoom: model.seated === true && video.connection === "connected",
    report: store.reportWatching,
  });
  // What the room's parts are given, until each reads the room's hooks itself.
  const session = {
    ...view,
    ...sending,
    ...voice,
    activity,
    mine: view.myLive,
    error: model.streamsError ?? video.error,
    free: model.free,
    seats: model.seats,
    myCamera: video.local.camera,
    cameras: room.devices.cameras,
    mics: room.devices.mics,
    cameraId: video.cameraId || room.camera.savedCamera,
    screenSurface: video.screenSurface,
    cameraProblem: video.cameraProblem,
    connection: video.connection,
    voice: video.voice,
    localVoice: video.localVoice,
    micInput: video.micInput,
  };
  // Who is on the stage: the stage, the previews and the activity list can change it.
  const stage = useStage(session.sharers);
  // A stream still loading counts as nothing watched yet ("In the room").
  const stagePersonId = stage.playing ? (stage.big?.person.id ?? null) : null;
  useEffect(() => {
    watchStage(stagePersonId && stage.mainKind ? { personId: stagePersonId, kind: stage.mainKind } : null);
  }, [watchStage, stagePersonId, stage.mainKind]);
  // In fullscreen only the player can be seen: the setup window and errors go inside it (spec 0101).
  const fullscreen = useFullscreenElement();
  const overPage = useFullscreenHost();
  const [ambilight, setAmbilight] = useState(loadAmbilight);
  // What each person shares, for the people panel; and whether a stream is still live.
  const sharing = useMemo(
    () =>
      Object.fromEntries(
        session.sharers.map((s) => [s.person.id, { screen: Boolean(s.screen), camera: Boolean(s.camera) }]),
      ),
    [session.sharers],
  );
  const isLive = (personId: string, kind: StreamKind) => Boolean(sharing[personId]?.[kind]);
  // Under the stage (spec 0107): who has its person on their stage (me included, never that
  // person), and, for an empty stage, the others in the room.
  const bigId = stage.big?.person.id;
  const { people, watchingOf } = session;
  const meId = session.me.id;
  const watchers = useMemo(
    () => (bigId ? people.filter((p) => p.id !== bigId && watchingOf[p.id]?.sharerId === bigId) : []),
    [people, watchingOf, bigId],
  );
  const others = useMemo(() => people.filter((p) => p.id !== meId), [people, meId]);
  const watching = stage.big && stage.mainKind ? { personId: stage.big.person.id, kind: stage.mainKind } : null;

  // The settings for what I send, from the cog: a popover over it.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleSettings = useCallback(() => setSettingsOpen((open) => !open), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  // A live button's gesture with the settings open: go to that setting (spec 0115). The counter
  // makes the same request twice still count.
  const [goTo, setGoTo] = useState<{ kind: StreamKind; n: number }>();
  const goToSetting = useCallback((kind: StreamKind) => setGoTo((was) => ({ kind, n: (was?.n ?? 0) + 1 })), []);
  const settingsPanel = (
    <SettingsPanel
      open={settingsOpen}
      onClose={closeSettings}
      screenTab={canShareScreen()}
      mine={session.mine}
      prefs={session.prefs}
      onPrefsChange={session.setPrefs}
      screenSurface={session.screenSurface}
      noSound={session.noSound}
      onChangeWindow={session.changeScreen}
      cameras={session.cameras}
      cameraId={session.cameraId}
      onPickCamera={session.pickCamera}
      cameraVideo={session.mine.camera ? session.myCamera : session.cameraPreview}
      onPreviewCamera={session.previewCamera}
      cameraProblem={session.cameraProblem}
      busy={session.busy}
      goTo={goTo}
      voice={session.voice}
      voicePrefs={session.voicePrefs}
      onVoicePrefs={session.setVoicePrefs}
      mics={session.mics}
      localVoice={session.localVoice}
      micInput={session.micInput}
    />
  );

  // People, then me at the far right.
  const myButtons = (
    <>
      <PeopleButton
        people={session.people}
        meId={session.me.id}
        sharing={sharing}
        watchingOf={session.watchingOf}
        seats={session.seats}
      />
      <AccountButton
        me={session.me}
        isAdmin={isAdmin}
        connection={session.connection}
        ambilight={ambilight}
        onAmbilightChange={setAmbilight}
        onSignOut={onSignOut}
      />
    </>
  );

  return (
    <div className={styles.theater} data-room>
      <RoomHeader
        middle={
          <ActivityPill
            events={session.activity}
            people={session.knownPeople}
            meId={session.me.id}
            connection={session.connection}
            isLive={isLive}
            watching={watching}
            onWatch={stage.pick}
          />
        }
        right={myButtons}
      />

      {/* One column as wide as the stage can be: the stage and its info row share its edges. */}
      <main className={styles.middle}>
        <div className={styles.column}>
          <Stage
            sharers={session.sharers}
            stage={stage}
            ambilight={ambilight}
            watchers={watchers}
            others={others}
            controls={{
              mine: session.mine,
              free: session.free,
              cameras: session.cameras,
              camera: session.cameraId,
              canShareScreen: canShareScreen(),
              noSound: session.noSound,
              screenSurface: session.screenSurface,
              busy: session.busy,
              onStart: session.start,
              onStop: session.stop,
              onChangeWindow: session.changeScreen,
              onPickCamera: session.pickCamera,
              settingsOpen,
              onSettings: toggleSettings,
              onGoTo: goToSetting,
              voice: session.voice,
              onVoice: session.toggleVoice,
            }}
            settingsPanel={settingsPanel}
          />
        </div>
        {/* Over the bottom of the middle: the column is sized exactly, nothing may push it. */}
        {session.error && !fullscreen && (
          <p className={`${styles.error} ${styles.errorBelow}`} role="alert">
            {session.error}
          </p>
        )}
      </main>

      <RoomFooter />

      {fullscreen &&
        session.error &&
        createPortal(
          <p className={`${styles.error} ${styles.errorOver}`} role="alert">
            {session.error}
          </p>,
          overPage,
        )}
    </div>
  );
}
