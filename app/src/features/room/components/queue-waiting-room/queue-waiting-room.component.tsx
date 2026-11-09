import { Button } from "@shared/components/button";
import { PageShell } from "@shared/components/page-shell";
import { Panel } from "@shared/components/panel";
import { QueueSeatOffer } from "../queue-seat-offer";
import { JOIN_AGAIN } from "./constants/queue-waiting-room.constants";
import styles from "./queue-waiting-room.component.module.css";
import type { QueueWaitingRoomProps } from "./types/queue-waiting-room.types";
import { queueMessage } from "./utils/queue-message.util";

/**
 * Every seat is taken: my place in the queue, in order of arrival. When a seat frees, a popup
 * offers it to me.
 */
export function QueueWaitingRoom({ seat, onSignOut }: QueueWaitingRoomProps) {
  const { status } = seat;
  const message = queueMessage(status);
  return (
    <PageShell variant="waiting">
      <Panel as="output" className={styles.card} aria-live="polite">
        {message.title && <h1 className={styles.title}>{message.title}</h1>}
        <p className={styles.text}>{message.text}</p>
        {message.canRejoin && (
          <div className={styles.actions}>
            <Button onClick={seat.rejoin}>{JOIN_AGAIN}</Button>
          </div>
        )}
        {seat.error && <p className={styles.error}>{seat.error}</p>}
      </Panel>
      <button type="button" className={styles.signOut} onClick={onSignOut}>
        Sign out
      </button>
      {status?.status === "offered" && (
        <QueueSeatOffer seconds={status.seconds} onEnter={seat.accept} onCancel={seat.cancel} />
      )}
    </PageShell>
  );
}
