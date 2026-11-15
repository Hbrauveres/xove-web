import { PageText } from "@shared/components/page-text";
import { SectionHeading } from "@shared/components/section-heading";
import { AdminRequestCard } from "../admin-request-card";
import styles from "./admin-requests.component.module.css";
import type { AdminRequestsProps } from "./types/admin-requests.types";

/** Who's waiting to get in, counted in red while anyone is. */
export function AdminRequests({ requests, busy, onApprove, onDecline }: AdminRequestsProps) {
  return (
    <section aria-labelledby="requests-title">
      <SectionHeading
        id="requests-title"
        className={styles.heading}
        count={requests.length}
        attention={requests.length > 0}
      >
        Waiting for access
      </SectionHeading>
      {requests.length === 0 ? (
        <PageText variant="note">No one is waiting right now.</PageText>
      ) : (
        <ul className={styles.list}>
          {requests.map((r) => (
            <AdminRequestCard key={r.id} request={r} busy={busy} onApprove={onApprove} onDecline={onDecline} />
          ))}
        </ul>
      )}
    </section>
  );
}
