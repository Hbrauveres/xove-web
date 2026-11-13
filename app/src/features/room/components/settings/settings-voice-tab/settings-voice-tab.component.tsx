import { ControlLabel } from "@shared/components/control-label";
import { Icon } from "@shared/components/icon";
import { Picker } from "@shared/components/picker";
import { Switch } from "@shared/components/switch";
import { Tooltip } from "@shared/components/tooltip";
import { toastStore } from "@shared/stores/toast-store";
import { canIsolateVoice } from "@services/media-devices-service";
import { useMicLevel } from "./hooks/use-mic-level.hook";
import { SettingsHint } from "../settings-hint";
import { SettingsMicTest } from "../settings-mic-test";
import { NO_ISOLATION, TOAST_ICON_SIZE, VOICE_SWITCHES } from "./constants/voice-switches.constants";
import styles from "./settings-voice-tab.component.module.css";
import type { SettingsVoiceTabProps } from "./types/settings-voice-tab.types";

/**
 * The Voice tab: the microphone, its level with the line and Test, then the voice's processing,
 * each switch saying what it does. Changes apply at once.
 */
export function SettingsVoiceTab({ shown, prefs, onPrefs, mics, voice, micInput }: SettingsVoiceTabProps) {
  const level = useMicLevel(micInput, shown);
  const isolate = canIsolateVoice();
  return (
    <>
      <div className={styles.group}>
        <ControlLabel>Microphone</ControlLabel>
        {mics.length > 0 ? (
          <Picker
            label="Microphone"
            options={mics.map((m) => ({ value: m.deviceId, label: m.label }))}
            value={prefs.micId ?? mics[0]?.deviceId ?? ""}
            onChange={(micId) => onPrefs({ ...prefs, micId })}
          />
        ) : (
          <SettingsHint>The browser lists your microphones once you turn your voice on.</SettingsHint>
        )}
      </div>
      <div className={styles.group}>
        <ControlLabel>Mic level</ControlLabel>
        <SettingsMicTest
          level={level}
          track={voice}
          sensitivity={prefs.sensitivity}
          onSensitivity={(sensitivity) => onPrefs({ ...prefs, sensitivity })}
        />
      </div>
      <div className={styles.group}>
        <ControlLabel>Voice processing</ControlLabel>
        {VOICE_SWITCHES.map((s) => {
          const unavailable = s.key === "voiceIsolation" && !isolate;
          return (
            <Tooltip key={s.key} text={unavailable ? NO_ISOLATION : s.hint}>
              <Switch
                label={s.label}
                checked={prefs[s.key]}
                unavailable={unavailable}
                onToggle={() =>
                  unavailable
                    ? toastStore.show(NO_ISOLATION, <Icon name="mic" size={TOAST_ICON_SIZE} />)
                    : onPrefs({ ...prefs, [s.key]: !prefs[s.key] })
                }
              />
            </Tooltip>
          );
        })}
      </div>
    </>
  );
}
