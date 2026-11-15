import { PageText } from "@shared/components/page-text";
import { SectionHeading } from "@shared/components/section-heading";
import { AdminMemberRow } from "../admin-member-row";
import styles from "./admin-members.component.module.css";
import type { AdminMembersProps } from "./types/admin-members.types";

/** Who's in, counted, and what removing one does. */
export function AdminMembers({ members, busy, asking, onAsk, onRemove }: AdminMembersProps) {
  return (
    <section aria-labelledby="members-title">
      <SectionHeading id="members-title" className={styles.heading} count={members.length}>
        Members
      </SectionHeading>
      <ul className={styles.list}>
        {members.map((m) => (
          <AdminMemberRow
            key={m.id}
            member={m}
            busy={busy}
            asking={asking === m.id}
            onAsk={onAsk}
            onRemove={onRemove}
          />
        ))}
      </ul>
      <PageText variant="note" className={styles.hint}>
        Removing someone signs them out everywhere. They can ask for access again.
      </PageText>
    </section>
  );
}
