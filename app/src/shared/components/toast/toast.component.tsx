import { useEffect, useState, useSyncExternalStore } from "react";
import { toastStore, type ToastMessage } from "@shared/stores/toast-store";
import { FADE_MS } from "./constants/toast.constants";
import styles from "./toast.component.module.css";

/**
 * The toast: a frosted pill at the top centre of what holds it, with an
 * icon and a short message, read once by screen readers. The live region is always there,
 * so a message that arrives is announced.
 */
export function Toast() {
  const message = useSyncExternalStore(toastStore.subscribe, toastStore.current, toastStore.current);
  // Keeps the last message drawn while it fades out.
  const [shown, setShown] = useState<ToastMessage | null>(message);
  if (message && message !== shown) setShown(message);
  useEffect(() => {
    if (message) return;
    const gone = window.setTimeout(() => setShown(null), FADE_MS);
    return () => window.clearTimeout(gone);
  }, [message]);

  return (
    <output className={styles.toast} aria-live="polite" data-show={message ? true : undefined}>
      {shown && (
        <>
          {shown.icon && (
            <span className={styles.icon} aria-hidden="true">
              {shown.icon}
            </span>
          )}
          <span key={shown.id} className={styles.text}>
            {shown.text}
          </span>
        </>
      )}
    </output>
  );
}
