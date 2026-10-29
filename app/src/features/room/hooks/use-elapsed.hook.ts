import { useEffect, useState } from "react";
import { twoDigits } from "../utils/two-digits.util";
import { MS_PER_SECOND, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from "../../../shared/constants/time.constants";

/** "mm:ss" or "h:mm:ss" since a timestamp, ticking every second. */
export function useElapsed(since: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (since === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), MS_PER_SECOND);
    return () => window.clearInterval(timer);
  }, [since]);

  if (since === null) return "0:00";
  const total = Math.max(0, Math.floor((now - since) / MS_PER_SECOND));
  const h = Math.floor(total / SECONDS_PER_HOUR);
  const m = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = total % SECONDS_PER_MINUTE;
  return h > 0 ? `${h}:${twoDigits(m)}:${twoDigits(s)}` : `${m}:${twoDigits(s)}`;
}
