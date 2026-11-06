import type { AmbilightPrefs } from "@services/preferences-service";
import type { ConnectionState } from "@services/livekit-service";
import type { Friend } from "./room-view.types";

/** What my menu shows and does, given by the room; my picture button passes it on. */
export interface MyMenuData {
  me: Friend;
  isAdmin: boolean;
  connection: ConnectionState;
  ambilight: AmbilightPrefs;
  onAmbilightChange: (prefs: AmbilightPrefs) => void;
  onSignOut: () => void;
}
