import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StreamKind } from "../../types";
import { Range } from "../ui/Range";
import { showToast } from "../ui/toast";
import { FULL_ROOM } from "./PlayerButtons";
import { CameraOffIcon, CameraOnIcon, CogIcon, MicIcon, MicOffIcon, ScreenOffIcon, ScreenOnIcon, SoundIcon, VoiceIcon, VoiceOffIcon, VolumeOffIcon } from "./icons";
import styles from "./ViewerBar.module.css";

/** One sound you hear from the person you watch (spec 0123): its volume and mute. */
export type Sound = { volume: number; muted: boolean };
export type HearSound = Sound & { unavailable?: string; onChange: (s: Sound) => void };

/** How long a resting mouse waits before the slider unrolls, as the drop-ups (spec 0107). */
const REST_MS = 120;
/** A finger holds this long to open the slider, as the drop-ups. */
const HOLD_MS = 500;
/** The slider closes by itself after this long without a touch. */
const IDLE_MS = 4000;

type Props = {
  /** What you hear from them, at the left: their screen's sound and their voice. */
  sound?: HearSound;
  voice?: HearSound & { name: string; talking?: boolean };
  /** You, at the right: your mic while you're live, or Go live. */
  live: boolean;
  micOn?: boolean;
  onMic?: () => void;
  canShareScreen: boolean;
  /** All 6 places are taken: Go live's ways to start are greyed, saying why. */
  full?: boolean;
  onStart: (kind: StreamKind) => void;
  onSettings: () => void;
  /** Where the browser can't set a page's volume (iPhones): a tap turns a sound on and off, no slider. */
  canSetVolume: boolean;
  /** Only the settings at the right (nobody live). */
  settingsOnly?: boolean;
};

/**
 * The bar over someone else's stream (spec 0123, design decision 1): the left corner is what you hear from
 * them, the right corner is you. Your stream's own controls live only on your stream.
 */
export function ViewerBar(props: Props) {
  const { sound, voice, live, micOn, onMic, canShareScreen, full, onStart, onSettings, canSetVolume, settingsOnly } = props;
  const [open, setOpen] = useState<"sound" | "voice" | null>(null);
  const [menu, setMenu] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  // A press anywhere else closes the slider and the menu.
  useEffect(() => {
    if (!open && !menu) return;
    const outside = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) {
        setOpen(null);
        setMenu(false);
      }
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open, menu]);

  return (
    <div ref={bar} className={styles.bar} data-buttons>
      <div className={styles.left}>
        {sound && <Hear kind="sound" s={sound} open={open === "sound"} setOpen={setOpen} canSetVolume={canSetVolume} />}
        {voice && <Hear kind="voice" s={voice} open={open === "voice"} setOpen={setOpen} canSetVolume={canSetVolume} name={voice.name} talking={voice.talking} />}
      </div>
      <div className={styles.right}>
        {settingsOnly ? (
          <button type="button" className={styles.round} aria-label="Settings" title="Settings" onClick={onSettings}>
            <CogIcon />
          </button>
        ) : live ? (
          <button
            type="button"
            className={styles.round}
            data-on={micOn || undefined}
            aria-pressed={Boolean(micOn)}
            aria-label={micOn ? "Mute your voice" : "Share your voice"}
            title={micOn ? "Mute your voice" : "Share your voice"}
            onClick={onMic}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </button>
        ) : (
          <span className={styles.anchor}>
            {/* The settings, opened from its menu, open over it (design decision 5). */}
            <button
              type="button"
              className={styles.golive}
              data-settings-anchor
              aria-expanded={menu}
              aria-haspopup="menu"
              onClick={() => setMenu((m) => !m)}
            >
              <i aria-hidden="true" />
              Go live
            </button>
            {menu && (
              <div className={styles.menu} role="menu">
                <MenuItem
                  icon={canShareScreen ? <ScreenOnIcon /> : <ScreenOffIcon />}
                  label="Share your screen"
                  unavailable={!canShareScreen ? "This browser can't share a screen" : full ? FULL_ROOM : undefined}
                  onPick={() => {
                    setMenu(false);
                    onStart("screen");
                  }}
                />
                <MenuItem
                  icon={full ? <CameraOffIcon /> : <CameraOnIcon />}
                  label="Turn on your camera"
                  unavailable={full ? FULL_ROOM : undefined}
                  onPick={() => {
                    setMenu(false);
                    onStart("camera");
                  }}
                />
                <span className={styles.sep} />
                <MenuItem icon={<CogIcon />} label="Settings" onPick={() => { setMenu(false); onSettings(); }} />
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, unavailable, onPick }: { icon: ReactNode; label: string; unavailable?: string; onPick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={unavailable ? true : undefined}
      title={unavailable}
      onClick={() => (unavailable ? showToast(unavailable, icon) : onPick())}
    >
      {icon}
      {label}
    </button>
  );
}

/** One sound: a tap mutes it; resting the mouse or holding opens its own slider (design decision 3). */
function Hear({
  kind,
  s,
  open,
  setOpen,
  canSetVolume,
  name,
  talking,
}: {
  kind: "sound" | "voice";
  s: HearSound;
  open: boolean;
  setOpen: (k: "sound" | "voice" | null) => void;
  canSetVolume: boolean;
  name?: string;
  talking?: boolean;
}) {
  const rest = useRef<number | undefined>(undefined);
  const leave = useRef<number | undefined>(undefined);
  const hold = useRef<number | undefined>(undefined);
  const idle = useRef<number | undefined>(undefined);
  const swallow = useRef(false);
  const pointer = useRef("mouse");
  const restart = () => {
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setOpen(null), IDLE_MS);
  };
  const show = () => {
    if (!canSetVolume || s.unavailable) return;
    setOpen(kind);
    restart();
  };
  useEffect(() => () => [rest, leave, hold, idle].forEach((t) => window.clearTimeout(t.current)), []);

  const silent = Boolean(s.unavailable) || s.muted || s.volume === 0;
  const label = s.unavailable ?? (kind === "sound" ? `${s.muted ? "Unmute" : "Mute"} the screen's sound` : `${s.muted ? "Unmute" : "Mute"} ${name}'s voice`);
  const icon = kind === "sound" ? (silent ? <VolumeOffIcon /> : <SoundIcon />) : silent ? <VoiceOffIcon /> : <VoiceIcon />;
  return (
    <span
      className={styles.anchor}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        window.clearTimeout(leave.current);
        rest.current = window.setTimeout(show, REST_MS);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        window.clearTimeout(rest.current);
        leave.current = window.setTimeout(() => open && setOpen(null), 300);
      }}
    >
      <button
        type="button"
        className={styles.round}
        data-voice={kind === "voice" || undefined}
        data-talking={(kind === "voice" && talking && !silent) || undefined}
        data-silent={(kind === "voice" && !talking && !silent) || undefined}
        aria-disabled={s.unavailable ? true : undefined}
        aria-pressed={s.unavailable ? undefined : s.muted}
        aria-label={label}
        title={kind === "sound" ? s.unavailable ?? "Screen sound" : s.unavailable ?? `${name}'s voice`}
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
          if (e.pointerType === "mouse") return;
          hold.current = window.setTimeout(() => {
            swallow.current = true;
            show();
          }, HOLD_MS);
        }}
        onPointerUp={() => window.clearTimeout(hold.current)}
        onContextMenu={(e) => e.preventDefault()}
        onFocus={(e) => {
          try {
            if (e.currentTarget.matches(":focus-visible")) show();
          } catch {
            /* old browsers */
          }
        }}
        onClick={() => {
          if (swallow.current) {
            swallow.current = false;
            return;
          }
          if (s.unavailable) {
            if (pointer.current !== "mouse") showToast(s.unavailable, kind === "sound" ? <VolumeOffIcon /> : <VoiceOffIcon />);
            return;
          }
          s.onChange({ ...s, muted: !s.muted });
          if (open) restart();
        }}
      >
        {icon}
      </button>
      {canSetVolume && !s.unavailable && (
        <span className={styles.slider} data-open={open || undefined} data-muted={s.muted || undefined} inert={!open}>
          <Range
            className={styles.range}
            min={0}
            max={1}
            step={0.05}
            aria-label={kind === "sound" ? "Screen sound volume" : `${name}'s voice volume`}
            aria-orientation="vertical"
            value={s.volume}
            onChange={(e) => {
              s.onChange({ volume: Number(e.target.value), muted: false });
              restart();
            }}
          />
        </span>
      )}
    </span>
  );
}
