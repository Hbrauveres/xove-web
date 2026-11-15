import { useEffect } from "react";
import { APPROVAL_CHECK_MS } from "../constants/request-access.constants";

/** While the request waits, asks every 20 s, so an approval takes the person straight to the room. */
export function useApprovalCheck(waiting: boolean, refresh: () => Promise<void>) {
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, APPROVAL_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [waiting, refresh]);
}
