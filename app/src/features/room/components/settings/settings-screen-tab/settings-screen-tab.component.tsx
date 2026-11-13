import { ActionPill } from "@shared/components/action-pill";
import { ControlLabel } from "@shared/components/control-label";
import { Cue } from "@shared/components/cue";
import { DropUpRow } from "@shared/components/drop-up-row";
import { Tooltip } from "@shared/components/tooltip";
import { NO_SOUND } from "../../../constants/stream-words.constants";
import { StageScreenSource } from "../../stage-controls/stage-screen-source";
import { SettingsHint } from "../settings-hint";
import { SettingsQualityMode } from "../settings-quality-mode";
import styles from "./settings-screen-tab.component.module.css";
import type { SettingsScreenTabProps } from "./types/settings-screen-tab.types";

/**
 * The Screen tab: what's shared and Change while sharing (or a line saying when these apply), then
 * quality and mode.
 */
export function SettingsScreenTab({ live, surface, noSound, onChangeWindow, cue, stream }: SettingsScreenTabProps) {
  return (
    <>
      {live ? (
        <div className={styles.group}>
          <ControlLabel>Window</ControlLabel>
          <DropUpRow look="panel">
            <StageScreenSource surface={surface} />
            <Tooltip text="Pick another window or tab; viewers keep watching the same stream">
              <ActionPill
                size="xs"
                fill="dark"
                className={styles.change}
                disabled={stream.busy}
                onClick={onChangeWindow}
              >
                <Cue request={cue} />
                Change
              </ActionPill>
            </Tooltip>
          </DropUpRow>
          {noSound && <SettingsHint>{NO_SOUND}</SettingsHint>}
        </div>
      ) : (
        <SettingsHint>
          You're not sharing. These are used the next time you do; the browser shows a preview when you pick what to
          share.
        </SettingsHint>
      )}
      <SettingsQualityMode kind="screen" {...stream} />
    </>
  );
}
