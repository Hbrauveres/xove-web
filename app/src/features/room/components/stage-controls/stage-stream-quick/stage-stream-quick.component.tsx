import { ActionPill } from "@shared/components/action-pill";
import { DropUpRow } from "@shared/components/drop-up-row";
import { Picker } from "@shared/components/picker";
import { Tooltip } from "@shared/components/tooltip";
import { StageScreenSource } from "../stage-screen-source";
import type { StageStreamQuickProps } from "./types/stage-stream-quick.types";

/**
 * A live stream's quick access, in its button's drop-up: for the screen, what's shared and Change (pick
 * another window or tab); for the camera, the list of cameras.
 */
export function StageStreamQuick(props: StageStreamQuickProps) {
  const { kind, screenSurface, cameras, camera, busy } = props;
  if (kind === "screen")
    return (
      <DropUpRow>
        <StageScreenSource surface={screenSurface} />
        <Tooltip text="Pick another window or tab; viewers keep watching the same stream">
          <ActionPill size="s" fill="dark" disabled={busy} onClick={props.onChangeWindow}>
            Change
          </ActionPill>
        </Tooltip>
      </DropUpRow>
    );
  return (
    <Picker
      label="Camera"
      options={cameras.map((c) => ({ value: c.deviceId, label: c.label || "Camera" }))}
      value={camera ?? cameras[0]?.deviceId ?? ""}
      opens="up"
      look="glass"
      disabled={busy}
      open={props.listOpen}
      onOpenChange={props.onListOpen}
      onChange={props.onPickCamera}
    />
  );
}
