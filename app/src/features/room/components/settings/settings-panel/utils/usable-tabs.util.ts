import { SETTINGS_TABS } from "../../../../constants/settings-tabs.constants";
import type { SettingsSession, SettingsTab } from "../../../../types/settings.types";

/** The tabs that can be used here: Screen only where a screen can be shared. */
export function usableTabs(s: Pick<SettingsSession, "screenTab">): SettingsTab[] {
  return SETTINGS_TABS.map((t) => t.key).filter((k) => s.screenTab || k !== "screen");
}
