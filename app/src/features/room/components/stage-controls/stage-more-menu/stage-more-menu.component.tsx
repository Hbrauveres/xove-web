import { useId, useRef, useState } from "react";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { MenuRow } from "@shared/components/menu-row";
import { Tooltip } from "@shared/components/tooltip";
import { useFloating } from "@shared/stores/floating-store";
import { MORE_CONTROLS, SETTINGS } from "../../../constants/stream-words.constants";
import { useSettingsAnchor } from "../../../hooks/use-settings-anchor.hook";
import { StageBarMenu } from "../stage-bar-menu";
import { StageGoLiveRows } from "../stage-go-live-rows";
import { StageMoreSound } from "../stage-more-sound";
import styles from "./stage-more-menu.component.module.css";
import { moreSections } from "./utils/more-sections.util";
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
  const show = moreSections(folded);
  return (
    <span ref={box} className={styles.anchor}>
      <Tooltip text="More" hidden={open}>
        <IconButton
          variant="round"
          size="m"
          ref={show.holdsSettings ? anchor?.cog : undefined}
          aria-label={MORE_CONTROLS}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="more" />
        </IconButton>
      </Tooltip>
      {open && (
        <StageBarMenu id={id} kind="group" aria-label={MORE_CONTROLS} centred>
          {show.settings && (
            <MenuRow
              icon="cog"
              label={SETTINGS}
              onPick={() => {
                close();
                goLive.onSettings();
              }}
            />
          )}
          {show.goLive && <StageGoLiveRows {...goLive} onPicked={close} />}
          {show.line && <hr />}
          {show.sound && <StageMoreSound kind="sound" sound={sound} />}
          {show.voice && <StageMoreSound kind="voice" sound={voice} />}
        </StageBarMenu>
      )}
    </span>
  );
}
