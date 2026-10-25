import { XoveIcon } from "../../components/brand/XoveIcon";
import { BigScreenArt } from "./big-screen-art";
import { MARK_PX } from "./constants/phone-notice.constants";
import styles from "./phone-notice.page.module.css";

/** What a phone or a tablet sees on every page: Xovê is for a laptop or a desktop, for now. */
export function PhoneNoticePage() {
  return (
    <main className={styles.page}>
      <XoveIcon size={MARK_PX} />
      <div className={styles.middle}>
        <BigScreenArt />
        <h1 className={styles.title}>
          See you on the <em>big screen</em>.
        </h1>
        <p className={styles.copy}>
          Sorry, Xovê doesn't work on phones or tablets yet. Open <code>xove.app</code> on your laptop or desktop to
          watch and share with your friends.
        </p>
      </div>
    </main>
  );
}
