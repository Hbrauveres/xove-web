import { XoveIcon } from "../../components/brand/XoveIcon";
import { BigScreenArt } from "./big-screen-art";
import styles from "./phone-notice.page.module.css";

/** The icon's box: its viewfinder draws 22 px tall in it, as in the sketch (the icon has room around it). */
const MARK_PX = 36;

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
