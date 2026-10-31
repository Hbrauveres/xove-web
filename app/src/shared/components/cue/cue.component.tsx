import styles from "./cue.component.module.css";
import type { CueProps } from "./types/cue.types";

/** How the app points at a control: a ring of its own over it, drawn anew for each request. */
export function Cue({ request, style }: CueProps) {
  return request ? <span key={request} className={styles.cue} style={style} aria-hidden="true" data-cue /> : null;
}
