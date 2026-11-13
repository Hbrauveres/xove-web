import { useId } from "react";
import { Icon } from "@shared/components/icon";
import { LiveDot } from "@shared/components/live-dot";
import { Tooltip } from "@shared/components/tooltip";
import type { CssVars } from "@shared/types/css-vars.types";
import { ICON_SIZE } from "./constants/tabs.constants";
import { useTabFocus } from "./hooks/use-tab-focus.hook";
import { useTabKeys } from "./hooks/use-tab-keys.hook";
import { useTouchReason } from "./hooks/use-touch-reason.hook";
import styles from "./tabs.component.module.css";
import { panelAttributes, tabAttributes } from "./utils/tab-attributes.util";
import type { TabsProps } from "./types/tabs.types";

/**
 * Tabs with icons and words: a red marker sliding under the chosen one, a live dot on what's live,
 * and one that can't be used greyed in place. Every panel is drawn in one cell, the hidden ones
 * invisible, so the box is as tall as the tallest and switching never moves the tabs.
 */
export function Tabs<K extends string>(props: TabsProps<K>) {
  const {
    tabs,
    chosen,
    onChoose,
    panel,
    focused = false,
    className,
    panelsClassName,
    panelClassName,
    slimScroll,
  } = props;
  const ids = useId();
  const idOf = (key: K) => `${ids}-${key}`;
  const usable = tabs.filter((t) => !t.unavailable).map((t) => t.key);
  const { refOf, focusOn } = useTabFocus(chosen, focused);
  const onKeyDown = useTabKeys(usable, chosen, onChoose, focusOn);
  const { onPointerDown, sayWhy } = useTouchReason();
  const place: CssVars = { "--n": tabs.length, "--i": tabs.findIndex((t) => t.key === chosen) };

  return (
    <>
      <div className={[styles.tabs, className].filter(Boolean).join(" ")} role="tablist" style={place}>
        <span className={styles.marker} aria-hidden="true" />
        {tabs.map((t) => (
          <Tooltip key={t.key} text={t.unavailable?.reason}>
            <button
              ref={refOf(t.key)}
              type="button"
              className={styles.tab}
              {...tabAttributes(idOf(t.key), t.key === chosen, Boolean(t.unavailable))}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onClick={() => (t.unavailable ? sayWhy(t.unavailable.reason, t.unavailable.icon) : onChoose(t.key))}
            >
              <Icon name={t.icon} size={ICON_SIZE} />
              {t.label}
              {t.live && <LiveDot size="s" className={styles.dot} />}
            </button>
          </Tooltip>
        ))}
      </div>
      <div
        className={[styles.panels, panelsClassName].filter(Boolean).join(" ")}
        data-scroll={slimScroll ? "slim" : undefined}
      >
        {usable.map((key) => (
          // A list opening in a panel floats over its controls, masking what's behind it.
          <div
            key={key}
            className={[styles.panel, panelClassName].filter(Boolean).join(" ")}
            data-list-host
            {...panelAttributes(idOf(key), key === chosen)}
          >
            {panel(key)}
          </div>
        ))}
      </div>
    </>
  );
}
