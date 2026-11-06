import { Icon } from "@shared/components/icon";
import { shortAgo } from "@shared/utils/time-ago.util";
import { ACTIVITY_TICK_MS } from "../../constants/activity.constants";
import { useNow } from "../../hooks/use-now.hook";
import styles from "./header-activity-list.component.module.css";
import type { HeaderActivityListProps } from "./types/header-activity-list.types";
import { activityIconOf } from "./utils/activity-icon.util";
import { activityRow } from "./utils/activity-row.util";

/**
 * Everything that happened in the room, newest first. An event about a stream that's still live is
 * a button: WATCH puts it on the stage, WATCHING marks the one there.
 */
export function HeaderActivityList({
  events,
  people,
  meId,
  unseen,
  isLive,
  watching,
  onWatch,
}: HeaderActivityListProps) {
  const now = useNow(ACTIVITY_TICK_MS);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "Someone";

  return (
    <ul className={styles.list}>
      {[...events].reverse().map((e) => {
        const row = activityRow(e, { nameOf, meId, isLive, watching });
        const inside = (
          <>
            <span className={styles.icon} data-stream={row.isStream || undefined}>
              <Icon name={activityIconOf(e)} size={13} />
            </span>
            <span className={styles.text}>{row.text}</span>
            {row.watchable && <span className={styles.act}>{row.watched ? "WATCHING" : "WATCH"}</span>}
            <time className={styles.time}>{shortAgo(e.at, now)}</time>
          </>
        );
        const unseenMark = unseen.has(e.id) || undefined;
        return (
          <li key={e.id}>
            {row.watchable ? (
              <button
                type="button"
                className={`${styles.row} ${styles.link}`}
                aria-label={`${row.text}: ${row.watched ? "watching" : "watch"}`}
                data-watching={row.watched || undefined}
                data-unseen={unseenMark}
                onClick={() => onWatch(e.actorId, row.kind)}
              >
                {inside}
              </button>
            ) : (
              <div className={styles.row} data-unseen={unseenMark}>
                {inside}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
