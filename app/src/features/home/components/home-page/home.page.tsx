import { useSearchParams } from "react-router";
import { GOOGLE_LOGIN_URL } from "@services/xove-api-service";
import { Button } from "@shared/components/button";
import { ErrorNotice } from "@shared/components/error-notice";
import { Headline } from "@shared/components/headline";
import { PageShell } from "@shared/components/page-shell";
import { PageText } from "@shared/components/page-text";
import { Wordmark } from "@shared/components/wordmark";
import { MARK_PAGE_PX } from "@shared/constants/mark.constants";
import { HomeGoogleMark } from "../home-google-mark";
import styles from "./home.page.module.css";
import { signInError } from "./utils/sign-in-error.util";

/** The front door: what Xovê is, and one way in. */
export function HomePage() {
  const [params] = useSearchParams();
  const error = signInError(params.get("error"));

  return (
    <PageShell variant="home" labelledBy="home-title">
      <div className={styles.lead}>
        <p className={styles.brand}>
          <Wordmark height={MARK_PAGE_PX} />
        </p>
        <Headline level="page" id="home-title" className={styles.title}>
          Go <em>live</em> with
          <br />
          your friends.
        </Headline>
      </div>
      <div className={styles.act}>
        <PageText variant="lead">
          Share your screen or camera in sharp, fast streams. Watch them play, hang out, help out. Invite only.
        </PageText>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <Button variant="light" href={GOOGLE_LOGIN_URL} className={styles.google}>
          <HomeGoogleMark />
          Continue with Google
        </Button>
        <PageText variant="note">New here? Sign in and ask for access. The owner approves each person.</PageText>
      </div>
    </PageShell>
  );
}
