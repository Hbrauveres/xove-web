import { useState } from "react";
import { Button } from "@shared/components/button";
import styles from "./admin-remove-confirm.component.module.css";
import type { AdminRemoveConfirmProps } from "./types/admin-remove-confirm.types";

/** Remove, asked first: "Remove Ana" or Cancel. */
export function AdminRemoveConfirm({ firstName, busy, onRemove }: AdminRemoveConfirmProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setAsking(true)}>
        Remove
      </Button>
    );
  }

  const remove = async () => {
    await onRemove();
    setAsking(false);
  };

  return (
    <span className={styles.confirm}>
      <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
        Remove {firstName}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </span>
  );
}
