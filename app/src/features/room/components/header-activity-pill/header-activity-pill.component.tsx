import { useRef } from "react";
import { Dropdown } from "@shared/components/dropdown";
import { Icon } from "@shared/components/icon";
import { PanelSection } from "@shared/components/panel-section";
import { ACTIVITY_TICK_MS } from "../../constants/activity.constants";
import { useNow } from "../../hooks/use-now.hook";
import { HeaderActivityList } from "../header-activity-list";
import { HeaderActivityTicker } from "../header-activity-ticker";
import { RECONNECTING } from "./constants/activity-pill.constants";
import styles from "./header-activity-pill.component.module.css";
import { useActivitySeen } from "./hooks/use-activity-seen.hook";
import type { HeaderActivityPillProps } from "./types/header-activity-pill.types";
import { activityPillLabel } from "./utils/activity-pill-label.util";
import { latestActivity } from "./utils/latest-activity.util";

/**
 * The middle of the header: the latest thing that happened, always current, with a count of new
 * ones. While the connection is down it says so instead. A click opens the list.
 */
export function HeaderActivityPill({
  events,
  people,
  meId,
  connection,
  isLive,
  watching,
  onWatch,
}: HeaderActivityPillProps) {
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const now = useNow(ACTIVITY_TICK_MS);
  const { open, fresh, newWhenOpened, toggle, close } = useActivitySeen(events);
  const latest = latestActivity(events, people, meId, now);
  const reconnecting = connection === "reconnecting";

  return (
    <div ref={anchor} className={styles.wrap}>
      <button
        ref={button}
        type="button"
        className={`${styles.pill} ${reconnecting ? styles.warn : ""}`}
        aria-label={activityPillLabel(reconnecting, latest, fresh)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        {!reconnecting && <Icon name="bell" size={16} className={styles.bell} />}
        <HeaderActivityTicker reconnecting={reconnecting ? RECONNECTING : null} latest={latest} />{" "}
        {fresh > 0 && !reconnecting && <span className={styles.new}>{fresh}</span>}
        <Icon name="chevron-bold" size={12} className={styles.chev} />
      </button>

      <Dropdown open={open} label="Activity" align="center" anchor={anchor} onClose={close}>
        <PanelSection scroll>
          <HeaderActivityList
            events={events}
            people={people}
            meId={meId}
            unseen={newWhenOpened}
            isLive={isLive}
            watching={watching}
            onWatch={(personId, kind) => {
              onWatch(personId, kind);
              // The list closes; the keyboard stays on the pill.
              close();
              button.current?.focus();
            }}
          />
        </PanelSection>
      </Dropdown>
    </div>
  );
}
