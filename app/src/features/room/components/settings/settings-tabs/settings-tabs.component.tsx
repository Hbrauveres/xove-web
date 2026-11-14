import { Tabs } from "@shared/components/tabs";
import { SettingsCameraTab } from "../settings-camera-tab";
import { SettingsScreenTab } from "../settings-screen-tab";
import { SettingsVoiceTab } from "../settings-voice-tab";
import styles from "./settings-tabs.component.module.css";
import type { SettingsTabsProps } from "./types/settings-tabs.types";
import { cueIn, settingsStreamOf, settingsTabItems } from "./utils/settings-tab-items.util";

/** The settings' three tabs, each handed only what it uses from the room session. */
export function SettingsTabs({ settings: s, usable, chosen, onChoose, cue }: SettingsTabsProps) {
  const panels = {
    screen: (
      <SettingsScreenTab
        live={s.mine.screen}
        surface={s.screenSurface}
        noSound={s.noSound}
        onChangeWindow={s.onChangeWindow}
        cue={cueIn(cue, "screen")}
        stream={settingsStreamOf(s, "screen")}
      />
    ),
    camera: (
      <SettingsCameraTab
        live={s.mine.camera}
        video={s.cameraVideo}
        problem={s.cameraProblem}
        cameras={{ list: s.cameras, chosen: s.cameraId, onPick: s.onPickCamera }}
        cue={cueIn(cue, "camera")}
        stream={settingsStreamOf(s, "camera")}
      />
    ),
    voice: s.voicePrefs && s.onVoicePrefs && (
      <SettingsVoiceTab
        shown={s.open && chosen === "voice"}
        prefs={s.voicePrefs}
        onPrefs={s.onVoicePrefs}
        mics={s.mics ?? []}
        voice={s.localVoice}
        micInput={s.micInput}
      />
    ),
  };
  return (
    <Tabs
      tabs={settingsTabItems(s, usable)}
      chosen={chosen}
      onChoose={onChoose}
      focused={s.open}
      className={styles.tabs}
      panelsClassName={styles.panes}
      panelClassName={styles.body}
      slimScroll
      panel={(key) => panels[key]}
    />
  );
}
