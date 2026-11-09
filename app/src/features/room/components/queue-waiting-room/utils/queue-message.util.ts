import type { SeatState } from "../../../types/room.types";
import {
  FULL_TITLE,
  KEEP_OPEN,
  LEFT_TEXT,
  LEFT_TITLE,
  LOOKING,
  NEXT_IN_LINE,
} from "../constants/queue-waiting-room.constants";
import type { QueueMessage } from "../types/queue-waiting-room.types";

/** What the waiting room says for my place: looking, left the queue, or my place in the line. */
export function queueMessage(status: SeatState): QueueMessage {
  if (status === null) return { title: null, text: LOOKING, canRejoin: false };
  if (status.status === "left") return { title: LEFT_TITLE, text: LEFT_TEXT, canRejoin: true };
  const place = status.status === "waiting" ? status.place : 1;
  const line = place === 1 ? NEXT_IN_LINE : `You're number ${place} in line.`;
  return { title: FULL_TITLE, text: `${line} ${KEEP_OPEN}`, canRejoin: false };
}
