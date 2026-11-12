import { Wordmark } from "@shared/components/wordmark";
import { useRoomSession } from "../../../stores/room-session";
import { HeaderActivityPill } from "../header-activity-pill";
import { HeaderMyPictureButton } from "../header-my-picture-button";
import { HeaderPeopleButton } from "../header-people-button";
import styles from "./header.component.module.css";

/**
 * The room's header, full width and see-through: the logo at the left, the activity in the middle,
 * people and my account at the right.
 */
export function Header() {
  const { header } = useRoomSession();
  return (
    <header className={styles.header}>
      <span className={styles.logo}>
        <Wordmark height={32} />
      </span>
      <div className={styles.middle}>
        <HeaderActivityPill {...header.activity} />
      </div>
      <div className={styles.right}>
        <HeaderPeopleButton {...header.people} />
        <HeaderMyPictureButton {...header.me} />
      </div>
    </header>
  );
}
