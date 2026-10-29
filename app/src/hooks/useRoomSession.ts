import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadStreamSettings,
  loadVoicePrefs,
  saveStreamSettings,
  saveVoicePrefs,
} from "@core/preferences/preferences.service";
import type { VoicePrefs } from "@core/preferences/preferences.types";
import type { ConnectionState, MediaTrack } from "@core/livekit/livekit.types";
import type { ActivityEvent, Friend, Sharer } from "../types";
import type { CameraDevice, CameraProblem, MicDevice, ScreenSurface } from "@core/devices/devices.types";
import type { RoomSeatsState, StreamKind, StreamSettings } from "@core/api/api.types";
import type { RoomStoreValue } from "@features/room/hooks/use-room-store.hook";
import { KINDS } from "@features/room/state/room.constants";
import { firstName, withMyStep } from "@features/room/state/room.model";
import {
  activityOf,
  knownPeopleOf,
  myLiveOf,
  peopleOf,
  personOf,
  sharersOf,
  watchingOf as watchesOf,
} from "@features/room/state/room.selectors";
import type { MyStreamStep } from "@features/room/state/room.types";
import type { Capture } from "@core/livekit/livekit.types";
import { showToast } from "../components/ui/toast";

/**
 * Everything the room page shows, read from the room's store (the API's news and the video
 * room's), and the room's flows: starting, the preview, the settings, the voice, the watch report.
 */
export type RoomSession = {
  me: Friend;
  /** Me first, then everyone connected to the room. */
  people: Friend[];
  /** Everyone the feed may mention, including people who already left. */
  knownPeople: Friend[];
  /** Everyone with a live stream, the longest sharing first (spec 0060). */
  sharers: Sharer[];
  /** Which of my streams are live. */
  mine: Record<StreamKind, boolean>;
  /** Stream places left of the 6. */
  free: number;
  /** How I send my screen and my camera (remembered); changing them while live applies at once. */
  prefs: Record<StreamKind, StreamSettings>;
  setPrefs: (kind: StreamKind, prefs: StreamSettings) => void;
  /**
   * Opens the browser's picker (screen) or asks for the camera, and sends the pick at once
   * with the remembered settings (spec 0107). A closed picker changes nothing.
   */
  start: (kind: StreamKind) => void;
  /** My camera while it's sent, for the settings panel. */
  myCamera: MediaTrack | undefined;
  /** My camera, captured for the settings panel's preview but not sent. */
  cameraPreview: MediaTrack | undefined;
  /** Turns the camera on for the preview only, or off again. */
  previewCamera: (on: boolean) => void;
  stop: (kind: StreamKind) => void;
  /** Opens the browser's picker again and swaps what my screen shares, without stopping it (spec 0098). */
  changeScreen: () => void;
  /** This browser's cameras, the one in use, and switching to another while live. */
  cameras: CameraDevice[];
  cameraId: string | null;
  pickCamera: (deviceId: string) => void;
  /** What my screen share shows: a window, a tab or the whole screen. */
  screenSurface?: ScreenSurface;
  /** The camera was refused or there's none: the Camera tab says so. */
  cameraProblem: CameraProblem;
  /** I'm sharing my screen, but my browser gave no sound with it. */
  noSound: boolean;
  /** False when the API doesn't know I'm in the room (it restarted): enter again. Null until known. */
  seated: boolean | null;
  /** My connection to the video room, to confirm my seat when entering again. */
  participantSid: () => string | undefined;
  activity: ActivityEvent[];
  /** How full the room is, when the API says (spec 0104). */
  seats: RoomSeatsState | null;
  /** Per person (by their id in the room): whose stream is on their stage (spec 0104). */
  watchingOf: Record<string, { sharerId: string; kind: StreamKind }>;
  /** Per person (by their id in the room): when they arrived, in ms (spec 0158). Empty from an older API. */
  arrivedAt: Record<string, number>;
  /** What's on my stage, for everyone's people panel (spec 0104); null for an empty stage. */
  watchStage: (target: { personId: string; kind: StreamKind } | null) => void;
  connection: ConnectionState;
  error: string | null;
  busy: boolean;
  /** My voice (spec 0123): sent only while it's on, alongside my screen or camera. */
  voice: boolean;
  toggleVoice: () => void;
  /** How my voice is captured (remembered); a change applies at once while it's on. */
  voicePrefs: VoicePrefs;
  setVoicePrefs: (prefs: VoicePrefs) => void;
  mics: MicDevice[];
  /** My mic's own track, for its live level in the settings. */
  localVoice: MediaTrack | undefined;
  /** The microphone itself, before the gate: what the level meter reads. */
  micInput: MediaStreamTrack | undefined;
};

/** A person's user id at the API, from their id in the room ("user-42"). */
const userIdOf = (personId: string) => Number(personId.slice("user-".length));

const BUSY_STEPS: readonly MyStreamStep[] = ["picking", "starting"];

const loadPrefs = (): Record<StreamKind, StreamSettings> => ({
  screen: loadStreamSettings("screen"),
  camera: loadStreamSettings("camera"),
});

export function useRoomSession(room: RoomStoreValue): RoomSession {
  const { store, model, video } = room;
  // The video room as the room's flows use it: its state, its commands, the devices and the camera.
  const lk = useMemo(
    () => ({
      ...video,
      cameras: room.devices.cameras,
      mics: room.devices.mics,
      cameraId: video.cameraId || room.camera.savedCamera,
      capture: room.camera.capture,
      pickCamera: room.camera.pickCamera,
      publishCapture: store.video.publishCapture,
      discardCapture: store.video.discardCapture,
      applySettings: store.video.applySettings,
      stop: store.video.stop,
      changeScreen: store.video.changeScreen,
      connectionOf: store.video.connectionOf,
      participantSid: store.video.participantSid,
      startVoice: store.video.startVoice,
      stopVoice: store.video.stopVoice,
      applyVoice: store.video.applyVoice,
      setVoiceLine: store.video.setVoiceLine,
    }),
    [video, room.devices, room.camera, store],
  );

  const loaded = model.streams !== null;
  const seated = model.seated;
  const { streams, me: myId, names, present, watching, activity: events } = model;
  const myLive = useMemo(() => myLiveOf({ streams, me: myId }), [streams, myId]);
  const me = useMemo(
    () => (myId ? personOf({ names }, myId) : { ...personOf({ names }, ""), name: firstName(store.myName) }),
    [myId, names, store],
  );
  const sharers = useMemo<Sharer[]>(
    () => sharersOf({ streams, me: myId, names }, video),
    [streams, myId, names, video],
  );
  const people = useMemo(() => peopleOf({ me: myId, present, names }), [myId, present, names]);
  const knownPeople = useMemo(() => knownPeopleOf({ me: myId, present, names }), [myId, present, names]);
  const presence = useMemo(
    () => video.presence.map((p): ActivityEvent => ({ id: `lk${p.id}`, at: p.at, kind: p.kind, actorId: p.identity })),
    [video.presence],
  );
  const activity = useMemo(() => activityOf({ activity: events }, presence), [events, presence]);
  const watchingOf = useMemo(() => watchesOf({ watching }), [watching]);
  const arrivedAt = model.arrivedAt;

  // Where each of my streams is: one explicit step at a time, in the room's model.
  const step = useCallback(
    (kind: StreamKind, next: MyStreamStep) => store.change((m) => withMyStep(m, kind, next)),
    [store],
  );
  const busyStarting = useCallback(
    (kind: StreamKind) => BUSY_STEPS.includes(store.getState().model.mine[kind]),
    [store],
  );

  // What's on my stage, reported to the API after 1 s of stillness (quick clicks send one
  // report), and again when the API lost it (a restart). Undefined until the room says.
  const [onStage, setOnStage] = useState<{ personId: string; kind: StreamKind } | null | undefined>(undefined);
  const watchStage = useCallback((target: { personId: string; kind: StreamKind } | null) => setOnStage(target), []);
  const wantedKey = useMemo(() => {
    if (onStage === undefined) return undefined;
    if (onStage === null) return "none";
    const userId = userIdOf(onStage.personId);
    return Number.isNaN(userId) ? undefined : `${userId}|${onStage.kind}`;
  }, [onStage]);
  const mineWatch = model.me ? model.watching?.[model.me] : undefined;
  // An older API doesn't list watches: nothing to compare with, report on change only.
  const apiKey =
    model.watching === null ? undefined : mineWatch ? `${userIdOf(mineWatch.sharerId)}|${mineWatch.kind}` : "none";
  const sentKey = useRef<string | undefined>(undefined);
  // A failed report is tried again a moment later.
  const [retries, setRetries] = useState(0);
  // Only the page that's really in the video room reports: a second tab of mine, or one
  // that LiveKit disconnected, would overwrite it back and forth (the API keeps one per person).
  const reporting = seated === true && lk.connection === "connected";
  useEffect(() => {
    if (wantedKey === undefined || !reporting) return;
    if (apiKey === undefined ? sentKey.current === wantedKey : apiKey === wantedKey) return;
    const timer = window.setTimeout(() => {
      sentKey.current = wantedKey;
      const [sharerId, kind] = wantedKey.split("|");
      const target = wantedKey === "none" ? null : { sharerId: Number(sharerId), kind: kind as StreamKind };
      store.reportWatching(target).catch(() => {
        sentKey.current = undefined;
        window.setTimeout(() => setRetries((n) => n + 1), 2000);
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [wantedKey, apiKey, reporting, retries, store]);

  // ---- keeping my streams and the API in step ----

  const isStarting = KINDS.some((kind) => BUSY_STEPS.includes(model.mine[kind]));
  const [prefs, setPrefsState] = useState<Record<StreamKind, StreamSettings>>(loadPrefs);
  const [noSound, setNoSound] = useState(false);

  // The camera captured for the settings panel's preview, not sent (spec 0107). Also kept
  // in a ref, so the camera button can send it as is, and leaving the page can stop it.
  const [preview, setPreviewState] = useState<Capture | null>(null);
  const previewRef = useRef<Capture | null>(null);
  const setPreview = useCallback((capture: Capture | null) => {
    previewRef.current = capture;
    setPreviewState(capture);
  }, []);
  // Whether the panel still wants it: the camera may answer after the panel closed.
  const wantPreview = useRef(false);

  // The settings the API last accepted for each of my streams: what a refused change goes back to.
  const accepted = useRef<Record<StreamKind, StreamSettings>>(prefs);
  // Changes made while live run one after the other, in the order they were made.
  // Each stream knows its own latest change, so a refused one goes back even when the
  // other stream changed meanwhile.
  const changes = useRef<Promise<void>>(Promise.resolve());
  const latestChange = useRef<Record<StreamKind, number>>({ screen: 0, camera: 0 });

  // Sends a capture with these settings, then tells the API.
  const send = useCallback(
    async (capture: Capture, chosen: StreamSettings) => {
      const kind = capture.kind;
      step(kind, "starting");
      const sending = await lk.publishCapture(capture, chosen);
      if (!sending) return;
      const { hasSound, ...connection } = sending;
      const ok = (await store.startStream(kind, connection, chosen)) === "ok";
      if (!ok) {
        await lk.stop(kind);
        return;
      }
      step(kind, "live");
      accepted.current = { ...accepted.current, [kind]: chosen };
      if (kind === "screen") setNoSound(!hasSound);
    },
    [lk, store, step],
  );

  // One click (spec 0107): the browser's picker, or the camera, sent at once with the
  // remembered settings. A camera already on for the preview is sent as is.
  const start = useCallback(
    async (kind: StreamKind) => {
      step(kind, "picking");
      // A preview still asking for the camera is dropped when it answers: this click asks itself.
      if (kind === "camera") wantPreview.current = false;
      try {
        let capture: Capture | null = null;
        if (kind === "camera" && previewRef.current) {
          capture = previewRef.current;
          wantPreview.current = false;
          setPreview(null);
        }
        capture ??= await lk.capture(kind, prefs[kind].mode);
        if (capture) await send(capture, prefs[kind]);
      } finally {
        if (busyStarting(kind)) step(kind, "off");
      }
    },
    [lk, prefs, send, setPreview, step, busyStarting],
  );

  const previewCamera = useCallback(
    async (on: boolean) => {
      wantPreview.current = on;
      if (!on) {
        if (previewRef.current) lk.discardCapture(previewRef.current);
        setPreview(null);
        return;
      }
      if (previewRef.current || lk.publishing.camera) return;
      const capture = await lk.capture("camera", prefs.camera.mode);
      if (!capture) return;
      // Closed (or sent) while the camera was answering: don't leave it on.
      if (!wantPreview.current || previewRef.current) {
        lk.discardCapture(capture);
        return;
      }
      setPreview(capture);
    },
    [lk, prefs, setPreview],
  );

  // Another camera: sent at once while live, remembered either way; a preview restarts with it.
  const pickCamera = useCallback(
    async (deviceId: string) => {
      await lk.pickCamera(deviceId, prefs.camera);
      if (!previewRef.current) return;
      lk.discardCapture(previewRef.current);
      setPreview(null);
      await previewCamera(true);
    },
    [lk, prefs, setPreview, previewCamera],
  );

  // The camera going away during the preview (unplugged, or the browser's own control).
  useEffect(() => {
    if (!preview) return;
    return preview.onEnded(() => {
      lk.discardCapture(preview);
      setPreview(null);
    });
  }, [preview, lk, setPreview]);

  // Leaving the page with the preview on: nothing was sent, so stop the camera.
  const discardCapture = lk.discardCapture;
  useEffect(
    () => () => {
      if (previewRef.current) discardCapture(previewRef.current);
    },
    [discardCapture],
  );

  // "Change window": the same stream, another pick. Its sound may come or go.
  const [isChanging, setChanging] = useState(false);
  const changeScreen = useCallback(async () => {
    setChanging(true);
    try {
      const changed = await lk.changeScreen(prefs.screen);
      if (changed) setNoSound(!changed.hasSound);
    } finally {
      setChanging(false);
    }
  }, [lk, prefs]);

  // While live, a new quality or mode applies at once: LiveKit right away, and the
  // API, which tells every viewer's app on its next poll. Changes go one after the
  // other; if the API refuses the latest one, the last accepted settings go back.
  const setPrefs = useCallback(
    (kind: StreamKind, next: StreamSettings) => {
      setPrefsState((prev) => ({ ...prev, [kind]: next }));
      saveStreamSettings(kind, next);
      if (!(myLive[kind] && lk.publishing[kind])) return;
      const change = ++latestChange.current[kind];
      changes.current = changes.current.then(async () => {
        await lk.applySettings(kind, next);
        if (await store.changeStreamSettings(kind, next)) {
          accepted.current = { ...accepted.current, [kind]: next };
          return;
        }
        if (change !== latestChange.current[kind]) return; // a newer change of this stream follows
        const back = accepted.current[kind];
        await lk.applySettings(kind, back);
        setPrefsState((prev) => ({ ...prev, [kind]: back }));
        saveStreamSettings(kind, back);
      });
    },
    [myLive, lk, store],
  );

  const stop = useCallback(
    async (kind: StreamKind) => {
      step(kind, "stopping");
      await lk.stop(kind);
      await store.stopStream(kind);
      step(kind, "off");
    },
    [lk, store, step],
  );

  // ---- my voice (spec 0123): only by my choice, only while I share a screen or a camera ----
  const [voicePrefs, setVoicePrefsState] = useState<VoicePrefs>(loadVoicePrefs);
  // One start at a time: a second tap while the mic is being asked for does nothing.
  const startingVoice = useRef(false);
  const toggleVoice = useCallback(async () => {
    if (lk.voice) return lk.stopVoice();
    if (startingVoice.current) return;
    startingVoice.current = true;
    try {
      const problem = await lk.startVoice(voicePrefs);
      if (problem === "blocked")
        showToast("Your browser blocked the microphone. Allow it in the site's settings, then try again.");
      if (problem === "missing") showToast("No microphone found.");
      if (problem === "failed") showToast("Your voice couldn't be sent. Try again in a moment.");
    } finally {
      startingVoice.current = false;
    }
  }, [lk, voicePrefs]);
  const setVoicePrefs = useCallback(
    (next: VoicePrefs) => {
      setVoicePrefsState(next);
      saveVoicePrefs(next);
      // The sensitivity is the gate's line: it moves live. The rest restarts the mic.
      const { sensitivity: line, ...mic } = next;
      const { sensitivity: _was, ...was } = voicePrefs;
      lk.setVoiceLine(line);
      if (lk.voice && JSON.stringify(mic) !== JSON.stringify(was)) void lk.applyVoice(next);
    },
    [lk, voicePrefs],
  );
  // Stopping both my screen and my camera turns my voice off: a voice never travels alone.
  const sending = lk.publishing.screen || lk.publishing.camera;
  useEffect(() => {
    if (!sending && lk.voice) void lk.stopVoice();
  }, [sending, lk]);

  // The API lost a stream I'm still sending (it restarted, and every deploy restarts
  // it): register it again. If the places filled up meanwhile, stop sending it; any
  // other failure (the API still starting) is tried again on the next poll.
  const registering = useRef<Record<StreamKind, boolean>>({ screen: false, camera: false });
  useEffect(() => {
    if (!loaded || !seated) return;
    for (const kind of KINDS) {
      if (!lk.publishing[kind] || myLive[kind] || busyStarting(kind) || registering.current[kind]) continue;
      const connection = lk.connectionOf(kind);
      if (!connection) continue;
      registering.current[kind] = true;
      void store
        .startStream(kind, connection, accepted.current[kind])
        .then((outcome) => (outcome === "full" ? lk.stop(kind) : undefined))
        .finally(() => {
          registering.current[kind] = false;
        });
    }
    // Again after each answer from the API: a failed registration is tried on the next poll.
  }, [loaded, seated, lk, myLive, store, busyStarting, model.polledAt]);

  // The API lists a stream of mine that nothing is sending (the browser's own "Stop
  // sharing" bar, the camera going away, or a page reload): end it.
  useEffect(() => {
    if (lk.connection !== "connected" || model.streamsBusy) return;
    for (const kind of KINDS) {
      if (myLive[kind] && !lk.publishing[kind] && !busyStarting(kind)) void store.stopStream(kind);
    }
  }, [myLive, lk.connection, lk.publishing, model.streamsBusy, store, busyStarting]);

  return {
    me,
    people,
    knownPeople,
    sharers,
    mine: myLive,
    free: model.free,
    prefs,
    setPrefs,
    start: (kind: StreamKind) => void start(kind),
    myCamera: lk.local.camera,
    cameraPreview: preview?.preview,
    previewCamera: (on: boolean) => void previewCamera(on),
    stop: (kind: StreamKind) => void stop(kind),
    changeScreen: () => void changeScreen(),
    cameras: lk.cameras,
    cameraId: lk.cameraId,
    pickCamera: (deviceId: string) => void pickCamera(deviceId),
    screenSurface: lk.screenSurface,
    cameraProblem: lk.cameraProblem,
    // Only while my screen is actually going out.
    noSound: noSound && myLive.screen && lk.publishing.screen,
    seated,
    participantSid: lk.participantSid,
    activity,
    seats: model.seats,
    watchingOf,
    arrivedAt,
    watchStage,
    connection: lk.connection,
    error: model.streamsError ?? lk.error,
    busy: model.streamsBusy || isStarting || isChanging,
    voice: lk.voice,
    toggleVoice: () => void toggleVoice(),
    voicePrefs,
    setVoicePrefs,
    mics: lk.mics,
    localVoice: lk.localVoice,
    micInput: lk.micInput,
  };
}
