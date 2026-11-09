import { createPortal } from "react-dom";
import { ErrorNotice } from "@shared/components/error-notice";
import { useFullscreenElement } from "../../hooks/use-fullscreen-element.hook";
import { useFullscreenHost } from "./hooks/use-fullscreen-host.hook";
import { useRoomSession } from "../../stores/room-session";
import styles from "./room-error.component.module.css";

/**
 * The room's problem, in one line over the bottom of the middle; in fullscreen only the player can
 * be seen, so it goes over the player's top instead.
 */
export function RoomError() {
  const { error } = useRoomSession();
  const fullscreen = useFullscreenElement();
  const overPage = useFullscreenHost();
  if (!error) return null;
  if (!fullscreen) {
    return (
      <div className={styles.below}>
        <ErrorNotice floating>{error}</ErrorNotice>
      </div>
    );
  }
  return createPortal(
    <div className={styles.over}>
      <ErrorNotice floating>{error}</ErrorNotice>
    </div>,
    overPage,
  );
}
