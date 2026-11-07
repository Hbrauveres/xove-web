import type { IconName } from "@shared/types/icon.types";

/** My mic's button: what a click does, and its icon (a mic always means my own). */
export function micState(on: boolean): { label: string; icon: IconName } {
  return on ? { label: "Mute your voice", icon: "mic" } : { label: "Share your voice", icon: "mic-off" };
}
