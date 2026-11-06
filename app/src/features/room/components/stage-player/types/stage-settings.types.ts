import type { RefObject } from "react";
import type { SettingsAnchor } from "../../../types/settings-anchor.types";

/** What the settings' place needs: the player, the settings' state, who's big, and the chrome's hold. */
export interface StageSettingsInput {
  frame: RefObject<HTMLElement | null>;
  open: boolean;
  /** Opens or closes the settings. */
  onToggle: () => void;
  /** Who is on the stage: another stream there closes the settings. */
  bigId: string | null;
  hold: (what: string, open: boolean) => void;
}

/** The anchor to hand the controls, and the settings' own toggle (which holds the controls up). */
export interface StageSettings {
  anchor: SettingsAnchor;
  toggle: () => void;
}
