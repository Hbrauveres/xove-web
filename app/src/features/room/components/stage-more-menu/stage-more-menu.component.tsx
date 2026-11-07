import { useId, useRef, useState } from "react";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { MenuRow } from "@shared/components/menu-row";
import { Tooltip } from "@shared/components/tooltip";
import { useFloating } from "@shared/stores/floating-store";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { StageBarMenu } from "../stage-bar-menu";
import { StageGoLiveRows } from "../stage-go-live-rows";
import { StageMoreSound } from "../stage-more-sound";
import styles from "./stage-more-menu.component.module.css";
import type { StageMoreMenuProps } from "./types/stage-more-menu.types";

/**
 * "…", on a picture too narrow for the whole bar: an M round button whose menu holds what folded into
 * it, each still working: the settings, Go live's rows, and the sounds with their own button and
 * slider. The settings open over it when they came from it.
 */
export function StageMoreMenu({ folded, sound, voice, ...goLive }: StageMoreMenuProps) {
  const anchor = useSettingsAnchor();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();
  const close = () => setOpen(false);
  useFloating({ open, kind: "opened", close, area: () => box.current, anchor: () => box.current });
  const has = (key: (typeof folded)[number]) => folded.includes(key);
  const holdsSettings = has("settings") || has("go-live");
  const sounds = (has("sound") && sound) || (has("voice") && voice);
  return (
    <span ref={box} className={styles.anchor}>
      <Tooltip text="More" hidden={open}>
        <IconButton
          variant="round"
          size="m"
          ref={holdsSettings ? anchor?.cog : undefined}
          aria-label="More controls"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="more" />
        </IconButton>
      </Tooltip>
      {open && (
        <StageBarMenu id={id} role="group" aria-label="More controls" centred>
          {has("settings") && (
            <MenuRow
              icon="cog"
              label="Settings"
              onPick={() => {
                close();
                goLive.onSettings();
              }}
            />
          )}
          {has("go-live") && <StageGoLiveRows {...goLive} onPicked={close} />}
          {holdsSettings && sounds && <hr />}
          {has("sound") && sound && <StageMoreSound kind="sound" sound={sound} />}
          {has("voice") && voice && <StageMoreSound kind="voice" sound={voice} name={voice.name} />}
        </StageBarMenu>
      )}
    </span>
  );
}
