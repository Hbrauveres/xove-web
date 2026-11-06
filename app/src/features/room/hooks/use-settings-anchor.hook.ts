import { createContext, useContext } from "react";
import type { SettingsAnchor } from "../types/settings-anchor.types";

/** Offered by the stage, so the controls on it can say where the settings open from. */
export const SettingsAnchorContext = createContext<SettingsAnchor | null>(null);

/** The stage's settings anchor, or null outside a stage. */
export function useSettingsAnchor(): SettingsAnchor | null {
  return useContext(SettingsAnchorContext);
}
