import type { StreamKind } from "@core/api/types/api.types";
import { COULDNT } from "../constants/livekit.constants";

export const isDomError = (e: unknown, name: string) => e instanceof DOMException && e.name === name;

/** What a failed start says, for a screen or a camera. */
export const startFailed = (kind: StreamKind) => (kind === "screen" ? COULDNT.share : COULDNT.camera);
