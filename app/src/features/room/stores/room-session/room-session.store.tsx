import { useMemo } from "react";
import { useAuth } from "@shared/stores/auth-store";
import { useAmbilight } from "./hooks/use-ambilight.hook";
import { useRememberedCamera } from "./hooks/use-remembered-camera.hook";
import { RoomSessionContext } from "./hooks/use-room-session.hook";
import { useSessionCore } from "./hooks/use-session-core.hook";
import { useSessionHeader } from "./hooks/use-session-header.hook";
import { useSessionSettings } from "./hooks/use-session-settings.hook";
import { useSessionStage } from "./hooks/use-session-stage.hook";
import { useSettingsOpen } from "./hooks/use-settings-open.hook";
import type { RoomSessionProviderProps } from "./types/room-session.types";

/**
 * The room once I'm in, shared with its areas: the header, the stage and the settings each read
 * their own part, so the page only lays them out.
 */
export function RoomSessionProvider({ room, devices, onSignOut, children }: RoomSessionProviderProps) {
  const { state } = useAuth();
  const isAdmin = state.status === "signedIn" && state.me.admin;
  const camera = useRememberedCamera(room.store.video);
  const core = useSessionCore(room, devices, camera);
  const settingsOpen = useSettingsOpen();
  const [ambilight, setAmbilight] = useAmbilight();
  const stage = useSessionStage(room, core, settingsOpen, ambilight);
  const account = useMemo(() => ({ isAdmin, onSignOut }), [isAdmin, onSignOut]);
  const light = useMemo(() => ({ value: ambilight, change: setAmbilight }), [ambilight, setAmbilight]);
  const header = useSessionHeader(core, stage, account, light);
  const settings = useSessionSettings(core, settingsOpen);
  const value = useMemo(() => ({ header, stage, settings, error: core.error }), [header, stage, settings, core.error]);
  return <RoomSessionContext.Provider value={value}>{children}</RoomSessionContext.Provider>;
}
