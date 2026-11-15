import { Headline } from "@shared/components/headline";
import { LabelPill } from "@shared/components/label-pill";
import { LiveDot } from "@shared/components/live-dot";
import { PageText } from "@shared/components/page-text";
import styles from "./request-access-waiting.component.module.css";

/** "Request sent": the owner has it, and the page waits, its dot beating. */
export function RequestAccessWaiting() {
  return (
    <>
      <Headline level="page" className={styles.title}>
        Request sent
      </Headline>
      <PageText variant="lead">
        The owner has your request. Keep this page open: it moves you into the room as soon as you're approved.
      </PageText>
      <output className={styles.status}>
        <LabelPill tone="soft" size="m" lead={<LiveDot size="m" pulse />}>
          Waiting for approval
        </LabelPill>
      </output>
    </>
  );
}
