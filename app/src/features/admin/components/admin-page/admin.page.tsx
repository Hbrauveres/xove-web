import { ErrorNotice } from "@shared/components/error-notice";
import { PageShell } from "@shared/components/page-shell";
import { useAdmin } from "../../stores/admin-store";
import { AdminHeader } from "../admin-header";
import { AdminMembers } from "../admin-members";
import { AdminRequests } from "../admin-requests";
import styles from "./admin.page.module.css";

/** Who's waiting to get in, and who's in. Only admins reach this page. */
export function AdminPage() {
  const { lists, error, busy, approve, decline, remove } = useAdmin();

  if (!lists && !error) return <PageShell variant="message">Loading…</PageShell>;

  return (
    <PageShell variant="wide">
      <AdminHeader />
      {error && (
        <div className={styles.error}>
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}
      {lists && (
        <div className={styles.columns}>
          <AdminRequests requests={lists.requests} busy={busy} onApprove={approve} onDecline={decline} />
          <AdminMembers members={lists.members} busy={busy} onRemove={remove} />
        </div>
      )}
    </PageShell>
  );
}
