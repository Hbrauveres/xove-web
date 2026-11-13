import type { SettingsCue, SettingsSession, SettingsTab } from "../../../../types/settings.types";

export interface SettingsTabsProps {
  /** The room session's settings, each tab handed only what it uses. */
  settings: SettingsSession;
  /** The tabs that can be used here. */
  usable: SettingsTab[];
  chosen: SettingsTab;
  onChoose: (tab: SettingsTab) => void;
  cue: SettingsCue | null;
}
