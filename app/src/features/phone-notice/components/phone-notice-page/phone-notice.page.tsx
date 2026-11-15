import { Headline } from "@shared/components/headline";
import { PageText } from "@shared/components/page-text";
import { Wordmark } from "@shared/components/wordmark";
import { BigScreenArt } from "../big-screen-art";
import { MARK_PX } from "./constants/phone-notice.constants";
import styles from "./phone-notice.page.module.css";

/** What a phone or a tablet sees on every page: Xovê is for a laptop or a desktop, for now. */
export function PhoneNoticePage() {
  return (
    <main className={styles.page}>
      <Wordmark variant="icon" height={MARK_PX} />
      <div className={styles.middle}>
        <BigScreenArt />
        <Headline level="page" className={styles.title}>
          See you on the <em>big screen</em>.
        </Headline>
        <PageText variant="lead">
          Sorry, Xovê doesn't work on phones or tablets yet. Open <code className={styles.address}>xove.app</code> on
          your laptop or desktop to watch and share with your friends.
        </PageText>
      </div>
    </main>
  );
}
