import { StatPill } from "@shared/components/stat-pill";
import { LiveBadge } from "@shared/components/live-badge";
import { Face } from "@shared/components/face";
import { useElapsed } from "./hooks/use-elapsed.hook";
import { MAX_AVATARS } from "./constants/stage-now-watching.constants";
import styles from "./stage-now-watching.component.module.css";
import type { StageNowWatchingProps } from "./types/stage-now-watching.types";
import { whatOf } from "./utils/what-of.util";
import { whoIsHere } from "./utils/who-is-here.util";
import { Tooltip } from "@shared/components/tooltip";

/**
 * The left of the info row: who is on the stage, LIVE, what they share,
 * for how long and who's watching, like YouTube's title row. Or, with nobody live, an
 * invitation with who's here.
 */
export function StageNowWatching({ sharer, watchers = [], others = [] }: StageNowWatchingProps) {
  const elapsed = useElapsed(sharer?.since ?? null);
  if (!sharer) {
    return (
      <div className={styles.now}>
        {/* An empty circle where the live person's photo goes. */}
        <span className={`${styles.nobody} ${styles.nobodyBig}`} aria-hidden="true" />
        <div className={styles.text}>
          <h2 className={styles.name}>Nobody is sharing yet</h2>
          <p className={styles.meta}>
            {others.length > 0 && (
              <span className={styles.row}>
                {others.slice(0, MAX_AVATARS).map((p) => (
                  <span key={p.id} data-here className={styles.face}>
                    <Face name={p.name} hue={p.hue} size={22} />
                  </span>
                ))}
              </span>
            )}
            <span className={styles.here}>{whoIsHere(others.map((p) => p.name))}</span>
          </p>
        </div>
      </div>
    );
  }
  const name = sharer.isMe ? "You" : sharer.person.name;
  return (
    <div className={styles.now}>
      <Face name={sharer.person.name} hue={sharer.person.hue} size={52} onAir ring="inside" />
      <div className={styles.text}>
        <h2 className={styles.name}>{name}</h2>
        <p className={styles.meta}>
          <LiveBadge variant="stage" />
          <span>{whatOf(sharer)}</span>
          <span className={styles.elapsed}>{elapsed}</span>
          {watchers.length > 0 && (
            <Tooltip text={watchers.map((p) => p.name).join(", ")}>
              <span className={styles.watchers}>
                <StatPill
                  lead={watchers.slice(0, MAX_AVATARS).map((p) => (
                    <span key={p.id} data-watcher className={styles.face}>
                      <Face name={p.name} hue={p.hue} size={20} />
                    </span>
                  ))}
                  count={watchers.length}
                  unit="watching"
                />
              </span>
            </Tooltip>
          )}
        </p>
      </div>
    </div>
  );
}
