import { useState } from "react";
import { api, apiErrorMessage } from "@services/xove-api-service";
import { SEND_FAILED } from "../constants/request-access-form.constants";

/** The request's note, sending it, and what went wrong; `onSent` tells the page it went. */
export function useAccessRequest(onSent: () => Promise<void>) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await api.requestAccess(message);
      await onSent();
    } catch (err) {
      setError(apiErrorMessage(err, SEND_FAILED));
    } finally {
      setSending(false);
    }
  };

  return { message, setMessage, sending, error, send };
}
