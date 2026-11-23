/** What the page says and offers: its headline, its line, and the one thing beneath. */
export interface PageView {
  headline: string;
  line: string;
  /** reconnecting: the status, nothing to press; tryAgain: the button; pleaseWait: the button, off. */
  action: "reconnecting" | "tryAgain" | "pleaseWait";
}
