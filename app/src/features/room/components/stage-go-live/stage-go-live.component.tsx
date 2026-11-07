import { useCallback, useRef, useState } from "react";
import { ActionPill } from "@shared/components/action-pill";
import { useFloating } from "@shared/stores/floating-store";
import { useGoLiveWidth } from "../../hooks/use-go-live-width.hook";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { StageBarMenu } from "../stage-bar-menu";
import { StageGoLiveRows } from "../stage-go-live-rows";
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
  const box = useRef<HTMLSpanElement | null>(null);
  const report = useGoLiveWidth();
  // Its width, for the fold into "…" on a narrow picture: it's laid out once it's there.
  const setBox = useCallback(
    (el: HTMLSpanElement | null) => {
      box.current = el;
      const width = Math.ceil(el?.getBoundingClientRect().width ?? 0);
      if (width > 0) report?.(width);
    },
    [report],
  );
  useFloating({
    open: menu,
    kind: "opened",
    close: () => setMenu(false),
    area: () => box.current,
    anchor: () => box.current,
  });
  return (
    <span ref={setBox} className={styles.anchor}>
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
        <StageBarMenu kind="menu">
          <StageGoLiveRows
            role="menuitem"
            canShareScreen={canShareScreen}
            full={full}
            onStart={onStart}
            onSettings={onSettings}
            onPicked={() => setMenu(false)}
          />
        </StageBarMenu>
      )}
    </span>
  );
}
