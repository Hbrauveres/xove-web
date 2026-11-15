import { useNavigate } from "react-router";
import { Button } from "@shared/components/button";
import { Face } from "@shared/components/face";
import { PageShell } from "@shared/components/page-shell";
import { PersonRow } from "@shared/components/person-row";
import { Wordmark } from "@shared/components/wordmark";
import { MARK_PAGE_PX } from "@shared/constants/mark.constants";
import { useAuth } from "@shared/stores/auth-store";
import { RequestAccessForm } from "../request-access-form";
import { RequestAccessWaiting } from "../request-access-waiting";
import { useApprovalCheck } from "./hooks/use-approval-check.hook";
import styles from "./request-access.page.module.css";

/** "You need access", like Google Drive's: ask once, then wait for the owner; or switch accounts. */
export function RequestAccessPage() {
  const { state, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const me = state.status === "signedIn" ? state.me : null;
  useApprovalCheck(me?.status === "PENDING", refresh);

  if (!me) return null;

  const useAnotherAccount = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <PageShell variant="form">
      <p className={styles.brand}>
        <Wordmark height={MARK_PAGE_PX} />
      </p>
      {me.status === "PENDING" ? (
        <RequestAccessWaiting />
      ) : (
        <RequestAccessForm declined={me.status === "DECLINED"} onSent={refresh} />
      )}
      <PersonRow
        className={styles.account}
        face={<Face name={me.name || me.email} photo={me.avatarUrl} size={32} />}
        label="Signed in as"
        name={me.email}
        end={
          <Button variant="quiet" onClick={useAnotherAccount}>
            Use another account
          </Button>
        }
      />
    </PageShell>
  );
}
