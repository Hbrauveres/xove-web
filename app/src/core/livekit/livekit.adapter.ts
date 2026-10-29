import {
  type ConnectionState as LkState,
  Room,
  RoomEvent,
  type Participant,
  type RemoteParticipant,
} from "livekit-client";
import { CaptureService } from "./capture.service";
import { CANT_CONNECT, CONNECTION, PRESENCE_KEPT, START } from "./livekit.constants";
import type { Capture, CapturedTracks, LocalMedia, RoomContext, VideoRoomState } from "./livekit.types";
import { readLocalMedia } from "./local-media.util";
import { RemoteMediaReader } from "./remote-media.util";
import { withLocal, withOthers, withPerson, withSpeakers } from "./room-state.util";
import { ScreenChangeService } from "./screen-change.service";
import { SendService } from "./send.service";
import { VoiceService } from "./voice.service";

/**
 * The video server, without React: connects with the access it's given, keeps the room's state
 * person by person, and takes plain commands. Listeners hear every change; an event changes only
 * the part of the state it's about. Its methods keep their `this`, so they can be handed around.
 */
export class LiveKitAdapter {
  private room: Room | null = null;
  private state = START;
  private presenceCount = 0;
  private readonly listeners = new Set<() => void>();
  private readonly reader = new RemoteMediaReader();
  private readonly ctx: RoomContext = {
    room: () => this.room,
    state: () => this.state,
    update: (patch) => this.update(patch),
    refreshLocal: (known) => this.refreshLocal(known),
    captures: new WeakMap<Capture, CapturedTracks>(),
  };
  private readonly captures = new CaptureService(this.ctx);
  private readonly sending = new SendService(this.ctx);
  private readonly screens = new ScreenChangeService(this.ctx, this.sending);
  private readonly voice = new VoiceService(this.ctx);

  getState = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  capture = this.captures.capture.bind(this.captures);
  discardCapture = this.captures.discard.bind(this.captures);
  publishCapture = this.sending.publish.bind(this.sending);
  applySettings = this.sending.applySettings.bind(this.sending);
  stop = this.sending.stop.bind(this.sending);
  pickCamera = this.sending.pickCamera.bind(this.sending);
  connectionOf = this.sending.connectionOf.bind(this.sending);
  participantSid = this.sending.participantSid.bind(this.sending);
  changeScreen = this.screens.changeScreen.bind(this.screens);
  startVoice = this.voice.startVoice.bind(this.voice);
  stopVoice = this.voice.stopVoice.bind(this.voice);
  applyVoice = this.voice.applyVoice.bind(this.voice);
  setVoiceLine = this.voice.setVoiceLine.bind(this.voice);

  /** Joins the room with the access the API gave. A later `connect` or `disconnect` replaces it. */
  connect = async (url: string, token: string) => {
    const next = new Room({ adaptiveStream: true, dynacast: true });
    this.listen(next);
    this.room = next;
    this.state = { ...START, cameraProblem: this.state.cameraProblem };
    try {
      await next.connect(url, token);
    } catch {
      if (this.room === next) this.fail(CANT_CONNECT);
      return;
    }
    if (this.room !== next) return;
    this.update({ connection: "connected" });
    for (const p of next.remoteParticipants.values()) this.refreshPerson(p);
    this.refreshLocal();
  };

  /** Leaves the room. */
  disconnect = () => {
    const left = this.room;
    this.room = null;
    this.voice.closeVoice();
    void left?.disconnect();
    if (left) this.update({ connection: "disconnected" });
  };

  /** The room can't be joined: says why. */
  fail = (message: string) => this.update({ connection: "disconnected", error: message });

  /** Browsers block sound until the person clicks or types; this asks again after one. */
  unlockAudio = () => {
    if (this.room && this.room.canPlaybackAudio !== true) void this.room.startAudio().catch(() => {});
  };

  /** Changes the state, or nothing at all when every part of `patch` is already there. */
  private update(patch: Partial<VideoRoomState>) {
    const changed = Object.entries(patch).some(([key, value]) => Reflect.get(this.state, key) !== value);
    if (!changed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private people(r: Room) {
    return [...r.remoteParticipants.values()].map((p) => ({ identity: p.identity, name: p.name || p.identity }));
  }

  private refreshPerson(p: RemoteParticipant) {
    if (!this.room) return;
    const remote = withPerson(this.state.remote, p.identity, this.reader.read(p));
    const others = withOthers(this.state.others, this.people(this.room));
    if (remote !== this.state.remote || others !== this.state.others) this.update({ remote, others });
  }

  private refreshLocal(known?: Pick<LocalMedia, "micInput">) {
    const me = this.room?.localParticipant;
    if (!me) {
      if (known) this.update(known);
      return;
    }
    const before: LocalMedia = this.state;
    const micInput = known ? known.micInput : this.state.micInput;
    const now = withLocal(before, readLocalMedia(me, micInput));
    if (now !== before) this.update(now);
  }

  private presence(kind: "joined" | "left", p: Participant) {
    return [
      ...this.state.presence.slice(1 - PRESENCE_KEPT),
      { id: ++this.presenceCount, kind, identity: p.identity, at: Date.now() },
    ];
  }

  private left(r: Room, p: RemoteParticipant) {
    this.update({
      presence: this.presence("left", p),
      remote: withPerson(this.state.remote, p.identity, undefined),
      others: withOthers(this.state.others, this.people(r)),
    });
  }

  private listen(r: Room) {
    const here = () => r === this.room;
    const byPerson = (p: RemoteParticipant) => here() && this.refreshPerson(p);
    // Muting is told for anyone, me included: only someone else's entry changes.
    const remoteOf = (p: Participant) => {
      const remote = r.remoteParticipants.get(p.identity);
      if (remote) byPerson(remote);
    };
    r.on(RoomEvent.ConnectionStateChanged, (s: LkState) => here() && this.update({ connection: CONNECTION[s] }))
      .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        if (!here()) return;
        this.update({ presence: this.presence("joined", p) });
        this.refreshPerson(p);
      })
      .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => here() && this.left(r, p))
      .on(RoomEvent.TrackPublished, (_pub, p) => byPerson(p))
      .on(RoomEvent.TrackUnpublished, (_pub, p) => byPerson(p))
      .on(RoomEvent.TrackSubscribed, (_track, _pub, p) => byPerson(p))
      .on(RoomEvent.TrackUnsubscribed, (_track, _pub, p) => byPerson(p))
      .on(RoomEvent.TrackMuted, (_pub, p) => remoteOf(p))
      .on(RoomEvent.TrackUnmuted, (_pub, p) => remoteOf(p))
      .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (here()) this.update({ remote: withSpeakers(this.state.remote, new Set(speakers.map((s) => s.identity))) });
      })
      .on(RoomEvent.LocalTrackPublished, () => here() && this.refreshLocal())
      // Also fires when the person clicks the browser's own "Stop sharing" bar.
      .on(RoomEvent.LocalTrackUnpublished, () => here() && this.refreshLocal());
  }
}
