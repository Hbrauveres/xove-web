import { Button } from "@shared/components/button";
import { Headline } from "@shared/components/headline";
import { LabelPill } from "@shared/components/label-pill";
import { LiveDot } from "@shared/components/live-dot";
import { PageShell } from "@shared/components/page-shell";
import { PageText } from "@shared/components/page-text";
import { Wordmark } from "@shared/components/wordmark";
import { MARK_PAGE_PX } from "@shared/constants/mark.constants";
import { useNow } from "@shared/hooks/use-now.hook";
import { PLEASE_WAIT, RECONNECTING, TICK_MS, TRY_AGAIN } from "./constants/cant-reach.constants";
import styles from "./cant-reach.page.module.css";
import type { CantReachProps } from "./types/cant-reach.types";
import { pageView } from "./utils/page-view.util";

/**
 * When Xovê can't tell who's signed in: out of reach, it counts down to the next try with nothing to
 * press, then offers Try again once it stopped; on a failure, Try again, which waits while it tries.
 * Plain words only, never why.
 */
export function CantReachPage({ state, onRetry }: CantReachProps) {
  const view = pageView(state, useNow(TICK_MS));

  return (
    <PageShell variant="form">
      <p className={styles.brand}>
        <Wordmark height={MARK_PAGE_PX} />
      </p>
      <Headline level="page" className={styles.title}>
        {view.headline}
      </Headline>
      <PageText variant="lead">
        <output aria-live={view.action === "reconnecting" ? "off" : undefined}>{view.line}</output>
      </PageText>
      <div className={styles.act}>
        {view.action === "reconnecting" ? (
          <LabelPill tone="quiet" size="m" lead={<LiveDot size="m" tone="quiet" pulse />}>
            {RECONNECTING}
          </LabelPill>
        ) : view.action === "pleaseWait" ? (
          <Button key="wait" variant="ghost" disabled aria-disabled="true" className={styles.waiting}>
            <span className={styles.spinner} aria-hidden="true" />
            {PLEASE_WAIT}
          </Button>
        ) : (
          <Button key="try" variant="primary" onClick={onRetry}>
            {TRY_AGAIN}
          </Button>
        )}
      </div>
    </PageShell>
  );
}
