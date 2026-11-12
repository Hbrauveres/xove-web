import styles from "./header-seats.component.module.css";
import type { HeaderSeatsProps } from "./types/header-seats.types";

/** The room's seats, in the people panel: how many are taken and free, and a bar filling as they go. */
export function HeaderSeats({ seats }: HeaderSeatsProps) {
  return (
    <>
      <div className={styles.line}>
        <span>Seats</span>
        <span>
          <b>{seats.taken}</b> of {seats.total} · {Math.max(0, seats.total - seats.taken)} free
        </span>
      </div>
      <progress className={styles.bar} aria-label="Seats taken" max={seats.total} value={seats.taken} />
    </>
  );
}
