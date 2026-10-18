import type { Friend, StreamKind } from "../../types";
import { XoveIcon } from "../brand/XoveIcon";
import { CameraOnIcon, ScreenOffIcon, ScreenOnIcon } from "./icons";
import { showToast } from "../ui/toast";
import styles from "./EmptyStage.module.css";

type Props = {
  canShareScreen?: boolean;
  /** The others in the room, for "Marina and Rafa are here". */
  here?: Friend[];
  onStart?: (kind: StreamKind) => void;
};

/**
 * Nobody is live (spec 0123, round 142): the room's dark with a soft, still light, Xovê's mark,
 * who's here, and the two ways to start, big and centred. Where the browser can't share a screen
 * (phones), the camera comes first and the screen is greyed with its reason. Prototype (ADR-0070).
 */
export function EmptyStage({ canShareScreen = true, here = [], onStart }: Props) {
  const names = here.map((p) => p.name);
  const who = !names.length
    ? "Nobody else is here yet"
    : names.length === 1
      ? `${names[0]} is here`
      : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are here`;
  const screen = (
    <button
      type="button"
      className={canShareScreen ? styles.primary : styles.unavailable}
      aria-disabled={canShareScreen ? undefined : true}
      title={canShareScreen ? undefined : "This browser can't share a screen"}
      onClick={() => (canShareScreen ? onStart?.("screen") : showToast("This browser can't share a screen", <ScreenOffIcon />))}
    >
      {canShareScreen ? <ScreenOnIcon /> : <ScreenOffIcon />}
      Share your screen
    </button>
  );
  const camera = (
    <button type="button" className={canShareScreen ? styles.ghost : styles.primary} onClick={() => onStart?.("camera")}>
      <CameraOnIcon />
      Turn on your camera
    </button>
  );
  return (
    <div className={styles.empty} data-empty>
      <span className={styles.mark}>
        <XoveIcon size={56} />
      </span>
      <h2 className={styles.title}>Nobody's live yet</h2>
      <p className={styles.copy}>
        {canShareScreen
          ? "Share your screen or turn on your camera, and the room sees it at once."
          : "Turn on your camera and the room sees you at once."}
      </p>
      {here.length > 0 && (
        <span className={styles.here}>
          {here.slice(0, 3).map((p) => (
            <span key={p.id} className={styles.av} style={{ background: `hsl(${p.hue} 42% 36%)` }} aria-hidden="true">
              {p.name.slice(0, 1)}
            </span>
          ))}
          {who}
        </span>
      )}
      <div className={styles.go}>
        {canShareScreen ? (
          <>
            {screen}
            {camera}
          </>
        ) : (
          <>
            {camera}
            {screen}
          </>
        )}
      </div>
    </div>
  );
}
