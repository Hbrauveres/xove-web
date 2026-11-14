import { ControlLabel } from "@shared/components/control-label";
import { Segmented } from "@shared/components/segmented";
import { CAMERA_QUALITIES, SHARE_QUALITIES } from "@services/media-devices-service";
import type { StreamMode, StreamQuality } from "@services/xove-api-service";
import { MODE_OPTIONS } from "./constants/stream-modes.constants";
import styles from "./settings-quality-mode.component.module.css";
import type { SettingsQualityModeProps } from "./types/settings-quality-mode.types";

/** A stream's quality and mode, the pair both stream tabs end with. Each change applies at once. */
export function SettingsQualityMode({ kind, prefs, onChange, busy = false }: SettingsQualityModeProps) {
  const qualities = (kind === "camera" ? CAMERA_QUALITIES : SHARE_QUALITIES).map((q) => ({ value: q.id, label: q.id }));
  const name = kind === "camera" ? "Camera" : "Screen";
  return (
    <>
      <div className={styles.group}>
        <ControlLabel>Quality</ControlLabel>
        <Segmented<StreamQuality>
          label={`${name} quality`}
          options={qualities}
          value={prefs.quality}
          disabled={busy}
          onChange={(quality) => onChange({ ...prefs, quality })}
        />
      </div>
      <div className={styles.group}>
        <ControlLabel>Mode</ControlLabel>
        <Segmented<StreamMode>
          label={`${name} mode`}
          options={MODE_OPTIONS}
          value={prefs.mode}
          disabled={busy}
          onChange={(mode) => onChange({ ...prefs, mode })}
        />
      </div>
    </>
  );
}
