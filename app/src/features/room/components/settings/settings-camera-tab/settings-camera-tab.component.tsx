import { useState } from "react";
import { ControlLabel } from "@shared/components/control-label";
import { Picker } from "@shared/components/picker";
import { SettingsCameraPreview } from "../settings-camera-preview";
import { SettingsQualityMode } from "../settings-quality-mode";
import styles from "./settings-camera-tab.component.module.css";
import type { SettingsCameraTabProps } from "./types/settings-camera-tab.types";

/**
 * The Camera tab: my camera's preview in its own group, then the camera's picker, then quality and
 * mode. Cued from the live camera button, its picker opens, once per request.
 */
export function SettingsCameraTab({ live, video, problem, cameras, cue, stream }: SettingsCameraTabProps) {
  // The list as last left (`open`), and the request it was left at: a newer one opens it.
  const [list, setList] = useState({ open: false, cue });
  const open = cue !== undefined && cue !== list.cue && !stream.busy ? true : list.open;
  return (
    <>
      <div className={styles.group}>
        <ControlLabel>Preview</ControlLabel>
        <SettingsCameraPreview video={video} live={live} problem={problem} />
      </div>
      {cameras.list.length > 0 && (
        <div className={styles.group}>
          <ControlLabel>Camera</ControlLabel>
          <div className={styles.cueBox}>
            <Picker
              label="Camera"
              options={cameras.list.map((c) => ({ value: c.deviceId, label: c.label || "Camera" }))}
              value={cameras.chosen ?? cameras.list[0]?.deviceId ?? ""}
              disabled={stream.busy}
              onChange={cameras.onPick}
              open={open}
              onOpenChange={(next) => setList({ open: next, cue })}
              // Cued round the pill and its open list together.
              cue={cue}
            />
          </div>
        </div>
      )}
      <SettingsQualityMode kind="camera" {...stream} />
    </>
  );
}
