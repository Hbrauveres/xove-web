import type { ActivityEvent } from "@features/room/types/room-view.types";
import { ACTIVITY_KEPT } from "../../../constants/room.constants";
import type { RoomModel } from "../../../types/room.types";

export function withEvents(model: RoomModel, events: Omit<ActivityEvent, "id">[]): RoomModel {
  if (!events.length) return model;
  const numbered = events.map((e, i) => ({ ...e, id: `room${model.eventCount + i + 1}` }));
  return {
    ...model,
    activity: [...model.activity, ...numbered].slice(-ACTIVITY_KEPT),
    eventCount: model.eventCount + events.length,
  };
}
