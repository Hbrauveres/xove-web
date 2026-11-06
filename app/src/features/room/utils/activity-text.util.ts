import type { ActivityEvent } from "../types/room-view.types";

/** What happened, in words: "Ana started sharing", "You joined", "Reconnected". */
export function describeEvent(e: ActivityEvent, nameOf: (id: string) => string, meId: string): string {
  const actor = e.actorId === meId ? "You" : nameOf(e.actorId);
  const whose = e.actorId === meId ? "your" : "their";
  switch (e.kind) {
    case "joined":
      return `${actor} joined`;
    case "left":
      return `${actor} left`;
    case "started":
      return e.stream === "camera" ? `${actor} turned on ${whose} camera` : `${actor} started sharing`;
    case "stopped":
      return e.stream === "camera" ? `${actor} turned off ${whose} camera` : `${actor} stopped sharing`;
    case "reconnected":
      return "Reconnected";
  }
}
