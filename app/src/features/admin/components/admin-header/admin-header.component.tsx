import { Button } from "@shared/components/button";
import { Wordmark } from "@shared/components/wordmark";
import { MARK_BAR_PX } from "@shared/constants/mark.constants";
import styles from "./admin-header.component.module.css";

/** Admin's bar: the mark with "admin" beside it, and the way back to the room. */
export function AdminHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        <Wordmark height={MARK_BAR_PX} /> <span className={styles.section}>admin</span>
      </span>
      <Button variant="quiet" to="/room">
        Back to the room
      </Button>
    </header>
  );
}
