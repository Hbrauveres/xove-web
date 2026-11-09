import { ActionPill } from "@shared/components/action-pill";
import { Cue } from "@shared/components/cue";
import { CLICK_TO_UNMUTE } from "../../constants/stream-words.constants";
import styles from "./stage-unmute.component.module.css";

/**
 * While the browser holds the room's sound back (no click on the page yet): a red pill in the sounds'
 * place, pointed at with the app's cue. Any click or key on the page starts the sound (the room page
 * listens for it), so the button needs no handler of its own; it goes when the sound plays.
 */
export function StageUnmute() {
  return (
    <ActionPill size="m" fill="red" lead="volume-off" className={styles.unmute} data-stays>
      {CLICK_TO_UNMUTE}
      <Cue request={1} />
    </ActionPill>
  );
}
