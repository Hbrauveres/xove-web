import type { IconName } from "@shared/types/icon.types";
import type { SettingsTab } from "../types/settings.types";

/** Every tab, always shown: one that can't be used here is greyed, not hidden. */
export const SETTINGS_TABS: { key: SettingsTab; label: string; icon: IconName }[] = [
  { key: "screen", label: "Screen", icon: "screen-share" },
  { key: "camera", label: "Camera", icon: "camera-on" },
  { key: "voice", label: "Voice", icon: "mic" },
];
