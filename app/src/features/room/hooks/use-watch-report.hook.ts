import { useEffect, useRef, useState } from "react";
import { REPORT_RETRY_MS, REPORT_STILL_MS } from "../constants/watch-report.constants";
import type { PersonId, Watch } from "../state/room.types";
import type { OnStage, WatchTarget } from "../types/watch-report.types";
import { knownKeyOf, shouldReport, targetOf, wantedKeyOf } from "../utils/watch-report.util";

type Inputs = {
  /** Who watches what, as the API last said; null from an older API. */
  watching: Record<PersonId, Watch> | null;
  me: PersonId | null;
  /** This page is in the video room (and the API knows my seat). */
  inRoom: boolean;
  report: (target: WatchTarget) => Promise<void>;
  /** What's on my stage now. */
  onStage: OnStage;
};

/**
 * Tells the API what's on my stage, so the people panel can say who watches whom: after a second
 * of stillness (quick clicks send one report), again a moment after a failure, and again when the
 * API lost it (a restart).
 */
export function useWatchReport({ watching, me, inRoom, report, onStage }: Inputs): void {
  const sent = useRef<string | undefined>(undefined);
  const [retries, setRetries] = useState(0);
  const wanted = wantedKeyOf(onStage);
  const known = knownKeyOf(watching, me);

  useEffect(() => {
    if (wanted === undefined || !shouldReport(wanted, known, sent.current, inRoom)) return;
    const timer = window.setTimeout(() => {
      sent.current = wanted;
      report(targetOf(wanted)).catch(() => {
        sent.current = undefined;
        window.setTimeout(() => setRetries((n) => n + 1), REPORT_RETRY_MS);
      });
    }, REPORT_STILL_MS);
    return () => window.clearTimeout(timer);
  }, [wanted, known, inRoom, retries, report]);
}
