import { Icon } from "@shared/components/icon";
import { useState, type ReactNode } from "react";
import type { CameraDevice, ScreenSurface } from "@services/media-devices-service";
import { usePinnedRow } from "../../hooks/usePinnedRow";
import type { StreamKind } from "@services/xove-api-service";
import { DropUp } from "../ui/DropUp";
import drop from "../ui/DropUp.module.css";
import { Picker } from "../ui/Picker";
import round from "./RoundButton.module.css";
import styles from "./PlayerButtons.module.css";
import { Tooltip } from "../ui/Tooltip";

export const FULL_ROOM = "6 streams are live, the most at once. You can start yours when one stops.";
/** Why the screen button and the Screen tab are greyed out where the browser can't share a screen. */
export const NO_SCREEN = "This browser can't share a screen";
export const NO_SOUND =
  "No sound is being shared. Share a tab, or a window with “Share this app's audio too”, with Change.";

type Props = {
  /** Which of my streams are live. */
  mine: Record<StreamKind, boolean>;
  /** Stream places left of the 6. */
  free: number;
  /** The browser's cameras, and the one in use. */
  cameras: CameraDevice[];
  camera: string | null;
  /** False where the browser can't share a screen: its button is greyed out, not hidden. */
  canShareScreen: boolean;
  /** I'm sharing my screen, but my browser gave no sound. */
  noSound?: boolean;
  /** What my screen share shows: a window, a tab or the whole screen. */
  screenSurface?: ScreenSurface;
  /** A request is on its way: the buttons wait. */
  busy?: boolean;
  onStart: (kind: StreamKind) => void;
  onStop: (kind: StreamKind) => void;
  onChangeWindow: () => void;
  onPickCamera: (deviceId: string) => void;
  /** The settings panel is open; the cog opens and closes it (spec 0107). */
  settingsOpen: boolean;
  onSettings: () => void;
  /** My voice is on, and turning it on or off (spec 0123). */
  voice?: boolean;
  onVoice?: () => void;
  /** With the settings open, a live button's gesture goes to its setting there (spec 0115). */
  onGoTo?: (kind: StreamKind) => void;
  /** A drop-up's list opened or closed: the player keeps its controls shown while one is open. */
  onMenuChange?: (open: boolean) => void;
  /** After my screen and camera, before the cog: my mic (spec 0123). */
  extra?: ReactNode;
};

/** What the room passes on to my buttons: the stage adds the viewer's part. */
export type StreamControls = Omit<Props, "onMenuChange" | "extra">;

const LABEL: Record<StreamKind, { start: string; stop: string; quick: string }> = {
  screen: { start: "Share your screen", stop: "Stop sharing your screen", quick: "What you share" },
  camera: { start: "Turn on your camera", stop: "Turn off your camera", quick: "Your camera" },
};

const SURFACE: Record<ScreenSurface, string> = { window: "A window", browser: "A tab", monitor: "Your whole screen" };

/**
 * The player's centred row of round buttons (specs 0098, 0101, 0106 and 0107): the volume
 * while watching someone, my screen and camera, and the cog for the settings. A click on mine
 * starts or stops; while one is live, resting the pointer on it unrolls its quick access.
 */
export function PlayerButtons(props: Props) {
  const { extra, settingsOpen, onSettings } = props;

  // A button that comes or goes never moves the one under the pointer (spec 0106).
  const { ref: rowRef } = usePinnedRow<HTMLDivElement>();

  const kinds: StreamKind[] = ["screen", "camera"];
  return (
    <div className={styles.row}>
      <div className={styles.buttons} ref={rowRef} data-buttons>
        {kinds.map((kind) => (
          <StreamButton key={kind} kind={kind} {...props} />
        ))}
        {extra && <div className={styles.control}>{extra}</div>}
        <div className={styles.control}>
          <div className={round.pill} data-open={settingsOpen || undefined}>
            <Tooltip text="Settings" hidden={settingsOpen}>
              <button
                type="button"
                className={round.main}
                aria-label="Settings"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                onClick={onSettings}
              >
                <Icon name="cog" size={20} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamButton({
  kind,
  mine,
  free,
  cameras,
  camera,
  noSound = false,
  screenSurface,
  busy = false,
  onStart,
  onStop,
  onChangeWindow,
  onPickCamera,
  onMenuChange,
  canShareScreen,
  settingsOpen,
  onGoTo,
}: Props & { kind: StreamKind }) {
  const live = mine[kind];
  // Unavailable, not hidden: where the browser can't share a screen, its button is greyed out, saying why.
  const unavailable = kind === "screen" && !canShareScreen;
  const full = !live && (free <= 0 || unavailable);
  const blocked = full || busy;
  const silent = kind === "screen" && live && noSound;
  const label = live ? LABEL[kind].stop : LABEL[kind].start;
  const tip = unavailable ? NO_SCREEN : full ? FULL_ROOM : silent ? `${label}. ${NO_SOUND}` : label;
  // The camera's list closes when its drop-up is left.
  const [listClosed, setListClosed] = useState(false);
  // Counts what's been done from the drop-up (Change, a camera picked): each one closes it.
  const [done, setDone] = useState(0);

  const button = (
    <div className={styles.control}>
      <div className={`${round.pill} ${live ? round.live : ""} ${full ? round.disabled : ""}`}>
        {/* A live button's drop-up takes its tooltip's place (spec 0107). */}
        <Tooltip text={tip} hidden={live}>
          <button
            type="button"
            className={round.main}
            aria-label={label}
            aria-pressed={live}
            aria-disabled={blocked || undefined}
            onClick={() => {
              if (blocked) return;
              if (live) onStop(kind);
              else onStart(kind);
            }}
          >
            <StreamIcon kind={kind} off={!live} />
          </button>
        </Tooltip>
      </div>
    </div>
  );

  const quick =
    kind === "screen" ? (
      <div className={drop.row}>
        <span className={styles.source}>
          <Icon name="window" size={20} />
          <span>{screenSurface ? SURFACE[screenSurface] : "Your screen"}</span>
        </span>
        <Tooltip text={"Pick another window or tab; viewers keep watching the same stream"}>
          <button
            type="button"
            className={styles.change}
            disabled={busy}
            onClick={() => {
              setDone((n) => n + 1);
              onChangeWindow();
            }}
          >
            Change
          </button>
        </Tooltip>
      </div>
    ) : (
      <Picker
        label="Camera"
        options={cameras.map((c) => ({ value: c.deviceId, label: c.label || "Camera" }))}
        value={camera ?? cameras[0]?.deviceId ?? ""}
        opens="up"
        look="glass"
        disabled={busy}
        closed={listClosed}
        onOpenChange={(open) => {
          if (open) setListClosed(false);
          onMenuChange?.(open);
        }}
        onChange={(deviceId) => {
          setDone((n) => n + 1);
          onPickCamera(deviceId);
        }}
      />
    );

  return (
    <DropUp
      label={LABEL[kind].quick}
      enabled={live && (kind === "screen" || cameras.length > 0)}
      width={kind === "screen" ? 228 : 210}
      onLeave={() => setListClosed(true)}
      closeSignal={done}
      // The settings already show these controls: the gesture goes there instead (spec 0115).
      redirect={settingsOpen && onGoTo ? () => onGoTo(kind) : undefined}
      trigger={button}
    >
      {quick}
    </DropUp>
  );
}

/** The design's icons: plain while live; crossed while off, the screen showing "share" on hover and focus. */
function StreamIcon({ kind, off }: { kind: StreamKind; off: boolean }) {
  if (kind === "camera") return off ? <Icon name="camera-off" size={20} /> : <Icon name="camera-on" size={20} />;
  if (!off) return <Icon name="screen-on" size={20} />;
  return (
    <>
      <span className={round.iconRest}>
        <Icon name="screen-off" size={20} />
      </span>
      <span className={round.iconHover}>
        <Icon name="screen-share" size={20} />
      </span>
    </>
  );
}
