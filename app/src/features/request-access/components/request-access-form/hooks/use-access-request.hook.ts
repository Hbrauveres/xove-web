import { useCallback, useMemo, useState } from "react";
import { api, apiErrorMessage } from "@services/xove-api-service";
import { SEND_FAILED } from "../constants/request-access-form.constants";

/** The request's note, sending it, and what went wrong; `onSent` tells the page it went. */
export function useAccessRequest(onSent: () => Promise<void>) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      await api.requestAccess(message);
      // Sent: a failed check of who's signed in after it says nothing here (no cause is shown); the
      // page's approval check asks again.
      await onSent().catch(() => undefined);
    } catch (err) {
      setError(apiErrorMessage(err, SEND_FAILED));
    } finally {
      setSending(false);
    }
  }, [message, onSent]);

  return useMemo(() => ({ message, setMessage, sending, error, send }), [message, sending, error, send]);
}
