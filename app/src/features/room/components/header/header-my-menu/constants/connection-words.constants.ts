import type { ConnectionState } from "@services/livekit-service";

/** The connection, in words, under my name. */
export const CONNECTION_WORDS: Record<ConnectionState, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
  disconnected: "Video offline",
};
