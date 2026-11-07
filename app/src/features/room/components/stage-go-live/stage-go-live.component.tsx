import { useRef, useState } from "react";
import { ActionPill } from "@shared/components/action-pill";
import { MenuRow } from "@shared/components/menu-row";
import { useFloating } from "@shared/stores/floating-store";
import { NO_SCREEN } from "../../constants/stream-words.constants";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import styles from "./stage-go-live.component.module.css";
import type { StageGoLiveProps } from "./types/stage-go-live.types";

/**
 * Go live, where my mic would be over someone else's stream: an M action pill with the live dot. Its
 * menu holds the ways to start (greyed where they can't, saying why) and the settings, which open
 * over it.
 */
export function StageGoLive({ canShareScreen, full, onStart, onSettings }: StageGoLiveProps) {
  const anchor = useSettingsAnchor();
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useFloating({
    open: menu,
    kind: "opened",
    close: () => setMenu(false),
    area: () => box.current,
    anchor: () => box.current,
  });
  const pick = (then: () => void) => () => {
    setMenu(false);
    then();
  };
  return (
    <span ref={box} className={styles.anchor}>
      <ActionPill
        size="m"
        fill="glass"
        lead="dot"
        ref={anchor?.cog}
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => setMenu((m) => !m)}
      >
        Go live
      </ActionPill>
      {menu && (
        <div className={styles.menu} role="menu">
          <MenuRow
            role="menuitem"
            icon={canShareScreen ? "screen-on" : "screen-off"}
            label="Share your screen"
            unavailable={canShareScreen ? full : NO_SCREEN}
            onPick={pick(() => onStart("screen"))}
          />
          <MenuRow
            role="menuitem"
            icon={full ? "camera-off" : "camera-on"}
            label="Turn on your camera"
            unavailable={full}
            onPick={pick(() => onStart("camera"))}
          />
          <span className={styles.sep} />
          <MenuRow role="menuitem" icon="cog" label="Settings" onPick={pick(onSettings)} />
        </div>
      )}
    </span>
  );
}
