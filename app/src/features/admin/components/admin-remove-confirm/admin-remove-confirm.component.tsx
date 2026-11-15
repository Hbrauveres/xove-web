import { Button } from "@shared/components/button";
import styles from "./admin-remove-confirm.component.module.css";
import type { AdminRemoveConfirmProps } from "./types/admin-remove-confirm.types";

/** Remove, asked first: "Remove Ana" or Cancel. */
export function AdminRemoveConfirm({ firstName, asking, busy, onAsk, onRemove }: AdminRemoveConfirmProps) {
  if (!asking) {
    return (
      <Button size="sm" variant="ghost" onClick={() => onAsk(true)}>
        Remove
      </Button>
    );
  }
  return (
    <span className={styles.confirm}>
      <Button size="sm" variant="danger" onClick={onRemove} disabled={busy}>
        Remove {firstName}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAsk(false)}>
        Cancel
      </Button>
    </span>
  );
}
