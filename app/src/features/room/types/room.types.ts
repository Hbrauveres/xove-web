import type { VideoRoomState } from "@services/livekit-service";
import type { RoomSeatsState, SeatStatus, StreamKind, StreamSettings } from "@services/xove-api-service";
import type { ConnectionState } from "@services/livekit-service";
import type { ActivityEvent } from "@features/room/types/room-view.types";

/** Everyone's id in the room, me included: their identity on the video server ("user-42"). */
export type PersonId = string;

/**
 * Where one of my streams is: off; the browser's picker or the camera being asked; sent and
 * waiting for the API; live; being stopped.
 */
export type MyStreamStep = "off" | "picking" | "starting" | "live" | "stopping";

/** My seat: null until the API answers; "left" after Cancel. */
export type SeatState = SeatStatus | { status: "left" } | null;

/** A live stream, as the API lists it, by its person's id. */
export type RoomStream = { personId: PersonId; kind: StreamKind; since: number; settings: StreamSettings };

/** Who watches what: a person has someone's screen or camera on their stage. */
export type Watch = { sharerId: PersonId; kind: StreamKind };

/** The room as data. Changed only by the functions in `room.model.ts`. */
export type RoomModel = {
  /** My id, once the video access or the API names me. */
  me: PersonId | null;
  /** Everyone the room has seen, by id: their first name. */
  names: Record<PersonId, string>;
  /** Everyone else connected to the video room, in the order they came. */
  present: PersonId[];
  /** When the streams' regular poll last answered, in ms: a poll that changed nothing still happened. */
  polledAt: number;
  /** The live streams, oldest first; null until the API's first answer. */
  streams: RoomStream[] | null;
  /** Stream places left of the 6. */
  free: number;
  /** How full the room is; null from an older API. */
  seats: RoomSeatsState | null;
  /** False when the API doesn't know I'm in the room (it restarted); null until it says. */
  seated: boolean | null;
  /** Who has whose stream on their stage; null from an older API. */
  watching: Record<PersonId, Watch> | null;
  /** When each person arrived, in ms. */
  arrivedAt: Record<PersonId, number>;
  seat: SeatState;
  /** The last seat request's failure, safe to show. */
  seatError: string | null;
  /** The last start, change or stop's failure, safe to show. */
  streamsError: string | null;
  /** A start, change or stop is on its way to the API. */
  streamsBusy: boolean;
  /** What happened, oldest first, the last few kept. */
  activity: ActivityEvent[];
  /** How many events the room has made, for their ids. */
  eventCount: number;
  /** Where each of my streams is. */
  mine: Record<StreamKind, MyStreamStep>;
  /** My video connection, as last seen: a drop and its return is an event. */
  connection: ConnectionState;
};

/** What the waiting screen shows and does. */
export type RoomSeat = {
  /** Null until the API answers (and while the room gets ready); "left" after Cancel. */
  status: SeatState;
  /** Message from the last failed request, safe to show. */
  error: string | null;
  /** "Enter room" on the popup. */
  accept: () => void;
  /** "Cancel" on the popup: leaves the queue. */
  cancel: () => void;
  /** Joins the queue again after leaving it. */
  rejoin: () => void;
};

/** What the room's page reads: the room as data, and the video room. */
export type RoomSnapshot = { model: RoomModel; video: VideoRoomState };

/** How a start, change or stop at the API ended. */
export type CallOutcome = "ok" | "full" | "failed";
