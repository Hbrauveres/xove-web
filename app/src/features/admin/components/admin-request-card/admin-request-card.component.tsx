import { Button } from "@shared/components/button";
import { Face } from "@shared/components/face";
import { PersonRow } from "@shared/components/person-row";
import { timeAgo } from "@shared/utils/time-ago.util";
import styles from "./admin-request-card.component.module.css";
import type { AdminRequestCardProps } from "./types/admin-request-card.types";

/** Someone asking to get in: who, when, their note, and Approve or Decline. */
export function AdminRequestCard({ request, busy, onApprove, onDecline }: AdminRequestCardProps) {
  return (
    <li className={styles.card}>
      <PersonRow
        face={<Face name={request.name || request.email} photo={request.avatarUrl} size={36} />}
        name={request.name ?? request.email}
        line={request.email}
        end={
          <time className={styles.time} dateTime={request.createdAt}>
            {timeAgo(Date.parse(request.createdAt))}
          </time>
        }
      />
      {request.message && <p className={styles.message}>“{request.message}”</p>}
      <div className={styles.actions}>
        <Button size="sm" onClick={() => onApprove(request.id)} disabled={busy}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDecline(request.id)} disabled={busy}>
          Decline
        </Button>
      </div>
    </li>
  );
}
