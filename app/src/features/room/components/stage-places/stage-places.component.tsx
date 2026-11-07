import { Tooltip } from "@shared/components/tooltip";
import styles from "./stage-places.component.module.css";
import type { StagePlacesProps } from "./types/stage-places.types";
import { seatsOpen } from "./utils/seats-open.util";

/** The places as little screens, red for each stream live, saying how many; gone when none is free. */
export function StagePlaces({ liveCount, places, free }: StagePlacesProps) {
  if (free <= 0) return null;
  const said = `${liveCount} of ${places} live`;
  return (
    <Tooltip text={`${said} · ${seatsOpen(free)}`}>
      <figure className={styles.free} aria-label={`${said}, ${seatsOpen(free)}`}>
        {Array.from({ length: places }, (_, i) => (
          <i key={i} data-on={i < liveCount || undefined} />
        ))}
      </figure>
    </Tooltip>
  );
}
