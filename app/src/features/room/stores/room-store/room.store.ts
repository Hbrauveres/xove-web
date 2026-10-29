import { ApiError, api } from "@services/xove-api-service/xove-api.service";
import type {
  SharingConnection,
  StreamKind,
  StreamSettings,
  StreamsState,
  WatchingTarget,
} from "@services/xove-api-service/types/api.types";
import { LiveKitAdapter } from "@services/livekit-service/livekit.adapter";
import { CANT_CONNECT } from "@services/livekit-service/constants/livekit.constants";
import { DEFAULT_ERROR_MESSAGE } from "@services/xove-api-service/constants/api.constants";
import { POLL_MS, SEAT_FAILED } from "../../constants/room.constants";
import { initialRoom, withMe, withSeat, withStreams, withStreamsCall, withVideo } from "./room.model";
import type { CallOutcome, RoomModel, RoomSnapshot, SeatState } from "../../types/room.types";
import { waitingFor } from "./utils/seat.util";

/**
 * The room's one place for news and actions: the seat, the streams and entering again are
 * asked here, each on its own timer; the video room is joined here once I have a seat. An
 * answer that was already on its way when a newer action happened is dropped.
 */
export class RoomStore {
  readonly video: LiveKitAdapter;
  /** My name as my account has it, until the room names me. */
  readonly myName: string;
  private readonly pollMs: number;
  private model = initialRoom();
  private snapshot: RoomSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly timers = new Map<"seat" | "streams" | "reenter", number>();
  private seatAsking: Promise<void> | null = null;
  private seatGeneration = 0;
  private streamsVersion = 0;
  private inRoom = false;
  /** Closed with its page: an answer still on its way changes nothing and starts nothing. */
  private closed = false;
  private stopVideo: (() => void) | null = null;

  constructor(myName: string, pollMs: number = POLL_MS, video = new LiveKitAdapter()) {
    this.myName = myName;
    this.pollMs = pollMs;
    this.video = video;
    this.snapshot = { model: this.model, video: video.getState() };
  }

  getState = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  /** Starts asking for a seat, and listens to the video room. */
  open = () => {
    this.closed = false;
    this.stopVideo = this.video.subscribe(() => this.onVideo());
    window.addEventListener("pagehide", this.leaving);
    this.afterSeat();
  };

  /** Stops every timer and leaves the video room. */
  close = () => {
    this.closed = true;
    for (const timer of this.timers.values()) window.clearInterval(timer);
    this.timers.clear();
    this.stopVideo?.();
    this.stopVideo = null;
    window.removeEventListener("pagehide", this.leaving);
    this.inRoom = false;
    this.video.disconnect();
  };

  /** "Enter room" on the seat offer. */
  accept = async () => {
    this.seatGeneration += 1;
    try {
      this.setSeat(await api.room.accept());
    } catch (e) {
      this.setSeat(this.model.seat, e instanceof ApiError ? e.message : DEFAULT_ERROR_MESSAGE);
      void this.askSeat();
    }
  };

  /** "Cancel" on the offer: leaves the queue, after a poll on its way, so it can't put me back. */
  cancel = async () => {
    this.seatGeneration += 1;
    this.setSeat({ status: "left" });
    await this.seatAsking;
    await api.room.cancel().catch(() => undefined);
  };

  /** Joins the queue again after leaving it. */
  rejoin = () => this.setSeat(null);

  /** Starts one of my streams at the API, with where it comes from. */
  startStream = (kind: StreamKind, connection: SharingConnection, settings: StreamSettings) =>
    this.call(() => api.streams.start(kind, connection, settings));

  changeStreamSettings = async (kind: StreamKind, settings: StreamSettings) =>
    (await this.call(() => api.streams.settings(kind, settings))) === "ok";

  stopStream = async (kind: StreamKind) => (await this.call(() => api.streams.stop(kind))) === "ok";

  /** Tells the API what's on my stage: someone's stream, or nothing. */
  reportWatching = (target: WatchingTarget) => api.streams.watching(target);

  /** Changes the room's model with one of its functions. */
  change = (next: (model: RoomModel) => RoomModel) => this.setModel(next(this.model));

  private setModel(model: RoomModel) {
    if (this.closed || model === this.model) return;
    this.model = model;
    this.publish();
  }

  private publish() {
    const video = this.video.getState();
    if (this.snapshot.model === this.model && this.snapshot.video === video) return;
    this.snapshot = { model: this.model, video };
    this.listeners.forEach((listener) => listener());
  }

  private onVideo() {
    const video = this.video.getState();
    this.model = withVideo(this.model, video.others, video.connection, Date.now());
    this.publish();
  }

  private setSeat(seat: SeatState, error: string | null = null) {
    this.setModel(withSeat(this.model, seat, error));
    this.afterSeat();
  }

  /** Polls while waiting; in the room once seated; out of the video room when back in the queue. */
  private afterSeat() {
    if (this.closed) return;
    const seat = this.model.seat;
    this.every("seat", waitingFor(seat), () => void this.askSeat());
    if (seat?.status === "in") this.enterRoom();
    else if (this.inRoom) this.leaveRoom();
  }

  /** Asks for my seat; with my video connection when I'm already in, which confirms it. */
  private async askSeat(participantSid?: string) {
    if (this.seatAsking) return;
    const askedIn = this.seatGeneration;
    this.seatAsking = (async () => {
      try {
        const answer = await api.room.enter(participantSid);
        if (askedIn === this.seatGeneration) this.setSeat(answer);
        else this.setSeat(this.model.seat);
      } catch (e) {
        this.setSeat(this.model.seat, e instanceof ApiError ? e.message : SEAT_FAILED);
      }
    })();
    await this.seatAsking;
    this.seatAsking = null;
  }

  private enterRoom() {
    if (this.inRoom) return;
    this.inRoom = true;
    this.every("streams", true, () => void this.refreshStreams(true));
    void this.joinVideo();
  }

  /** Back to the queue: the room starts afresh when I'm in again, as a new page would. */
  private leaveRoom() {
    this.inRoom = false;
    this.setModel({ ...initialRoom(), seat: this.model.seat, seatError: this.model.seatError });
    this.every("streams", false, () => {});
    this.every("reenter", false, () => {});
    this.video.disconnect();
  }

  /** The video access names me; then the video room is joined with it. */
  private async joinVideo() {
    try {
      const access = await api.liveKitToken();
      if (!this.inRoom || this.closed) return;
      this.setModel(withMe(this.model, access.identity, this.myName));
      await this.video.connect(access.url, access.token);
    } catch (e) {
      if (this.inRoom) this.video.fail(e instanceof ApiError ? e.message : CANT_CONNECT);
    }
  }

  /** The streams again: on the poll's timer (`polled`), or at once after a failed call. */
  private async refreshStreams(polled = false) {
    const askedAt = this.streamsVersion;
    try {
      const answer = await api.streams.current();
      if (askedAt === this.streamsVersion && this.inRoom) this.onStreams(answer, polled);
    } catch {
      // A missed poll is fine: the next one tries again.
    }
  }

  /** The API forgot my seat (it restarted): enter again with my video connection until it knows. */
  private onStreams(answer: StreamsState, polled: boolean) {
    const next = withStreams(this.model, answer, Date.now(), polled);
    // The API may name me before the video access does: I keep my account's name.
    this.setModel(next.me && !(next.me in next.names) ? withMe(next, next.me, this.myName) : next);
    this.every("reenter", answer.seated === false, () => void this.askSeat(this.video.participantSid()));
  }

  private async call(request: () => Promise<StreamsState>): Promise<CallOutcome> {
    this.streamsVersion += 1;
    this.setModel(withStreamsCall(this.model, true, null));
    try {
      const answer = await request();
      this.onStreams(answer, false);
      this.setModel(withStreamsCall(this.model, false, null));
      return "ok";
    } catch (e) {
      this.setModel(withStreamsCall(this.model, false, e instanceof ApiError ? e.message : DEFAULT_ERROR_MESSAGE));
      void this.refreshStreams();
      return e instanceof ApiError && e.reason === "full" ? "full" : "failed";
    }
  }

  /** Runs `tick` now and then every poll interval while `on`; stops it when not. */
  private every(name: "seat" | "streams" | "reenter", on: boolean, tick: () => void) {
    const running = this.timers.get(name);
    if (on && running === undefined) {
      tick();
      this.timers.set(name, window.setInterval(tick, this.pollMs));
    } else if (!on && running !== undefined) {
      window.clearInterval(running);
      this.timers.delete(name);
    }
  }

  // Closing the waiting tab keeps my place for 30 seconds (instead of 60 after the last poll).
  private readonly leaving = () => {
    const status = this.model.seat?.status;
    if (status === "waiting" || status === "offered") void api.room.leave().catch(() => undefined);
  };
}
