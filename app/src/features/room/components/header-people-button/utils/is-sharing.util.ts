import type { SharingOf } from "../types/header-people-button.types";

/** Whether a person shares anything: their face shows they're on air. */
export function isSharing(shares: SharingOf[string] | undefined): boolean {
  return Boolean(shares?.screen || shares?.camera);
}
