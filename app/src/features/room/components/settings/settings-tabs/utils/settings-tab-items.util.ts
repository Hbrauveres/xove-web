import type { TabItem } from "@shared/types/tab-item.types";
import type { StreamKind } from "@services/xove-api-service";
import { NO_SCREEN } from "../../../../constants/stream-words.constants";
import type { SettingsCue, SettingsSession, SettingsStream, SettingsTab } from "../../../../types/settings.types";
import { SETTINGS_TABS } from "../../../../constants/settings-tabs.constants";

/** The tabs as the settings show them: a dot on what I send, Screen greyed where it can't be used. */
export function settingsTabItems(s: SettingsSession, usable: SettingsTab[]): TabItem<SettingsTab>[] {
  return SETTINGS_TABS.map((t) => ({
    ...t,
    live: Boolean(t.key === "voice" ? s.voice : s.mine[t.key]),
    unavailable: usable.includes(t.key) ? undefined : { reason: NO_SCREEN, icon: "screen-off" },
  }));
}

/** A stream's quality and mode, as its tab hands them on. */
export function settingsStreamOf(s: SettingsSession, kind: StreamKind): SettingsStream {
  return { prefs: s.prefs[kind], onChange: (prefs) => s.onPrefsChange(kind, prefs), busy: s.busy };
}

/** The request a tab's control is cued for, if the cue is in that tab. */
export function cueIn(cue: SettingsCue | null, tab: SettingsTab): number | undefined {
  return cue?.kind === tab ? cue.n : undefined;
}
