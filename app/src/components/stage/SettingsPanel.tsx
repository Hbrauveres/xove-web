import { ControlLabel } from "@shared/components/control-label";
import { Panel } from "@shared/components/panel";
import { IconButton } from "@shared/components/icon-button";
import { LiveBadge } from "@shared/components/live-badge";
import { Switch } from "@shared/components/switch";
import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cameraProblemWords } from "@features/room/utils/camera-problem.util";
import { CAMERA_QUALITIES, SHARE_QUALITIES } from "@services/media-devices-service";
import type { CameraDevice, CameraProblem, MicDevice, ScreenSurface } from "@services/media-devices-service";
import type { VoicePrefs } from "@services/preferences-service";
import { useMicLevel } from "@features/room/hooks/use-mic-level.hook";
import { MODE_OPTIONS } from "@features/room/constants/stream-modes.constants";
import type { StreamKind, StreamMode, StreamQuality, StreamSettings } from "@services/xove-api-service";
import type { MediaTrack } from "@services/livekit-service";
import { Cue } from "@shared/components/cue";
import { Picker } from "@shared/components/picker";
import { Segmented } from "@shared/components/segmented";
import { toastStore } from "@shared/stores/toast-store";
import { NO_SCREEN, NO_SOUND } from "@features/room/constants/stream-words.constants";
import { StageScreenSource } from "@features/room/components/stage-controls/stage-screen-source";
import styles from "./SettingsPanel.module.css";
import { MicTest } from "./MicTest";
import { Tooltip } from "@shared/components/tooltip";
import { Tabs } from "@shared/components/tabs";
import { useRoomSession } from "@features/room/stores/room-session";

/** How long it takes to come in or go out; it leaves the page once it's out. */
const PANEL_MS = 260;

type Tab = "screen" | "camera" | "voice";

export type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  /** False where the browser can't share a screen: the Screen tab is greyed out. */
  screenTab: boolean;
  /** Which of my streams are live. */
  mine: Record<StreamKind, boolean>;
  prefs: Record<StreamKind, StreamSettings>;
  onPrefsChange: (kind: StreamKind, prefs: StreamSettings) => void;
  /** What my screen share shows. */
  screenSurface?: ScreenSurface | undefined;
  onChangeWindow: () => void;
  cameras: CameraDevice[];
  cameraId: string | null;
  onPickCamera: (deviceId: string) => void;
  /** My camera: the one being sent, or the preview's. */
  cameraVideo?: MediaTrack | undefined;
  /** Turns the camera on for the preview only, or off again. */
  onPreviewCamera: (on: boolean) => void;
  /** The camera was refused or there's none: said in the preview's place. */
  cameraProblem?: CameraProblem | undefined;
  busy?: boolean | undefined;
  /** I'm sharing my screen without sound: the Screen tab says how to share it. */
  noSound?: boolean | undefined;
  /** A live button's gesture with the panel open: go to this setting and cue it (spec 0115). */
  goTo?: { kind: StreamKind; n: number } | undefined;
  /** My voice (spec 0123): on or off, how it's captured, the mics, and its own track for the level. */
  voice?: boolean | undefined;
  voicePrefs?: VoicePrefs | undefined;
  onVoicePrefs?: ((prefs: VoicePrefs) => void) | undefined;
  mics?: MicDevice[] | undefined;
  localVoice?: MediaTrack | undefined;
  /** The microphone itself, before the gate: what the level meter reads. */
  micInput?: MediaStreamTrack | undefined;
};

/** The cue's two 1 s pulses (design decision 2); then it stays lit until the next press (spec 0123). */
export const CUE_MS = 2000;
type Cue = { kind: Tab; n: number } | null;

/**
 * The settings for what I send (spec 0107): tabs Screen and Camera, a red marker sliding to
 * the chosen one and a red dot on what's live. Changes apply at once and are remembered. The
 * Camera tab shows my camera; while it's off, only I see it, and only while the tab is open.
 */
export function SettingsPanel() {
  const props = useRoomSession().settings;
  const { open, onClose, screenTab, mine, onPreviewCamera } = props;
  // Both tabs always show; one that can't be used here is greyed out, not hidden (design decision 2).
  const tabs: Tab[] = ["screen", "camera", "voice"];
  const usable: Tab[] = screenTab ? tabs : ["camera", "voice"];
  const [chosen, setTab] = useState<Tab>(usable[0]);
  // Told to go to a setting: its tab, and the control cued until the next press (never a tab that can't be used).
  const [cue, setCue] = useState<Cue>(null);
  const [lastGoTo, setLastGoTo] = useState(props.goTo?.n);
  if (props.goTo && props.goTo.n !== lastGoTo) {
    setLastGoTo(props.goTo.n);
    if (open && usable.includes(props.goTo.kind as Tab)) {
      setTab(props.goTo.kind);
      setCue({ kind: props.goTo.kind, n: props.goTo.n });
    }
  }
  if (!open && cue) setCue(null);
  // Lit until the next press anywhere but the live buttons (an option, outside) or the panel
  // closing (spec 0123, design decision 11): two pulses alone were over before the eye got there.
  useEffect(() => {
    if (!cue) return;
    const off = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-dropup]")) setCue(null);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [cue]);
  const tab: Tab = usable.includes(chosen) ? chosen : (usable[0] ?? "camera");

  // In the page while open, and for its slide out after.
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(false);
  if (open && !present) setPresent(true);
  if (!open && shown) setShown(false);
  useEffect(() => {
    if (open) {
      const next = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(next);
    }
    const gone = window.setTimeout(() => setPresent(false), PANEL_MS);
    return () => window.clearTimeout(gone);
  }, [open]);

  // The camera's preview: on only while the Camera tab is open and the camera isn't live.
  const wantPreview = open && tab === "camera" && !mine.camera;
  const previewing = useRef(false);
  const preview = useRef(onPreviewCamera);
  useEffect(() => {
    preview.current = onPreviewCamera;
  });
  useEffect(() => {
    if (wantPreview === previewing.current) return;
    previewing.current = wantPreview;
    preview.current(wantPreview);
  }, [wantPreview]);
  useEffect(
    () => () => {
      if (previewing.current) preview.current(false);
      // React may mount it again (StrictMode, in development): start from off.
      previewing.current = false;
    },
    [],
  );

  // The keyboard: opening moves the focus to the chosen tab; closing gives it back to what
  // opened it (the cog), if it was inside.
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      // Not scrolled into view: the panel is still coming in, and the page would jump.
      root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
      return;
    }
    if (root.current?.contains(document.activeElement)) opener.current?.focus();
  }, [open, present]);

  if (!present) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <Panel
      ref={root}
      className={styles.panel}
      role="dialog"
      aria-label="Settings"
      data-open={shown || undefined}
      inert={!open || undefined}
      onKeyDown={onKeyDown}
    >
      <div className={styles.head}>
        <h2>Settings</h2>
        <IconButton variant="close" aria-label="Close settings" onClick={onClose}>
          <Icon name="close" size={20} />
        </IconButton>
      </div>
      <Tabs
        tabs={tabs.map((t) => ({
          key: t,
          label: t === "screen" ? "Screen" : t === "camera" ? "Camera" : "Voice",
          icon: t === "screen" ? "screen-share" : t === "camera" ? "camera-on" : "mic",
          live: Boolean(t === "voice" ? props.voice : mine[t]),
          unavailable: usable.includes(t) ? undefined : { reason: NO_SCREEN, icon: "screen-off" },
        }))}
        chosen={tab}
        onChoose={setTab}
        className={styles.tabs}
        panelsClassName={styles.panes}
        panelClassName={styles.body}
        slimScroll
        panel={(t) =>
          t === "screen" ? (
            <ScreenTab {...props} cue={cue?.kind === "screen" ? cue.n : undefined} />
          ) : t === "camera" ? (
            <CameraTab {...props} cue={cue?.kind === "camera" ? cue.n : undefined} />
          ) : (
            <VoiceTab {...props} shown={open && tab === "voice"} />
          )
        }
      />
    </Panel>
  );
}

function QualityAndMode({
  kind,
  prefs,
  onPrefsChange,
  busy,
}: { kind: StreamKind } & Pick<SettingsPanelProps, "prefs" | "onPrefsChange" | "busy">) {
  const mine = prefs[kind];
  const qualities = (kind === "camera" ? CAMERA_QUALITIES : SHARE_QUALITIES).map((q) => ({ value: q.id, label: q.id }));
  const name = kind === "camera" ? "Camera" : "Screen";
  return (
    <>
      <div className={styles.group}>
        <ControlLabel>Quality</ControlLabel>
        <Segmented<StreamQuality>
          label={`${name} quality`}
          options={qualities}
          value={mine.quality}
          disabled={busy}
          onChange={(quality) => onPrefsChange(kind, { ...mine, quality })}
        />
      </div>
      <div className={styles.group}>
        <ControlLabel>Mode</ControlLabel>
        <Segmented<StreamMode>
          label={`${name} mode`}
          options={MODE_OPTIONS}
          value={mine.mode}
          disabled={busy}
          onChange={(mode) => onPrefsChange(kind, { ...mine, mode })}
        />
      </div>
    </>
  );
}

/** `cue`: the request the tab's control is cued for, if any. */
function ScreenTab(props: SettingsPanelProps & { cue?: number }) {
  const { mine, screenSurface, onChangeWindow, busy, noSound } = props;
  return (
    <>
      {/* What you pick (design decision 9). */}
      <div className={styles.lead}>
        {mine.screen ? (
          <div className={styles.group}>
            <ControlLabel>Window</ControlLabel>
            <div className={styles.fieldRow}>
              <StageScreenSource surface={screenSurface} />
              <Tooltip text={"Pick another window or tab; viewers keep watching the same stream"}>
                <button type="button" className={styles.button} disabled={busy} onClick={onChangeWindow}>
                  <Cue request={props.cue} />
                  Change
                </button>
              </Tooltip>
            </div>
            {noSound && <p className={styles.hint}>{NO_SOUND}</p>}
          </div>
        ) : (
          <p className={styles.hint}>
            You're not sharing. These are used the next time you do; the browser shows a preview when you pick what to
            share.
          </p>
        )}
      </div>
      <QualityAndMode kind="screen" {...props} />
    </>
  );
}

function CameraTab(props: SettingsPanelProps & { cue?: number }) {
  const { mine, cameras, cameraId, onPickCamera, cameraVideo, busy, cameraProblem } = props;
  // Gone to from the live camera button: its list opens, once per request.
  const [listOpen, setListOpen] = useState(false);
  const [lastCue, setLastCue] = useState<number | undefined>(undefined);
  if (props.cue !== lastCue) {
    setLastCue(props.cue);
    if (props.cue !== undefined && !busy) setListOpen(true);
  }
  const problem = cameraVideo ? null : cameraProblemWords(cameraProblem);
  return (
    <>
      {/* What you see (spec 0111, design decisions 3 and 4). */}
      <div className={styles.lead}>
        <div className={styles.group}>
          <ControlLabel>Preview</ControlLabel>
          <div className={styles.preview} data-problem={problem ? true : undefined}>
            {problem ? (
              <p className={styles.problem} role="status">
                {problem}
              </p>
            ) : (
              <>
                <Preview video={cameraVideo} />
                {mine.camera ? (
                  <LiveBadge variant="preview" className={styles.live} />
                ) : (
                  <span className={styles.badge}>Only you see this</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {cameras.length > 0 && (
        <div className={styles.group}>
          <ControlLabel>Camera</ControlLabel>
          <div className={styles.cueBox}>
            <Picker
              label="Camera"
              options={cameras.map((c) => ({
                value: c.deviceId,
                label: c.label || "Camera",
              }))}
              value={cameraId ?? cameras[0].deviceId}
              disabled={busy}
              onChange={onPickCamera}
              open={listOpen}
              onOpenChange={setListOpen}
              // Cued round the pill and its open list together (spec 0123).
              cue={props.cue}
            />
          </div>
        </div>
      )}
      <QualityAndMode kind="camera" {...props} />
    </>
  );
}

/** My camera, as it is sent. */
function Preview({ video }: { video?: MediaTrack }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !video) return;
    video.attach(el);
    return () => {
      video.detach(el);
    };
  }, [video]);
  return (
    <video
      ref={ref}
      className={styles.video}
      autoPlay
      playsInline
      muted
      disablePictureInPicture
      aria-label="Your camera"
    />
  );
}

/** Voice isolation is only in recent Chrome (spec 0123): elsewhere its switch is greyed with this. */
const NO_ISOLATION = "This browser can't isolate a voice";
const canIsolate = () => {
  try {
    return Boolean(
      (navigator.mediaDevices?.getSupportedConstraints?.() as Record<string, boolean> | undefined)?.voiceIsolation,
    );
  } catch {
    return false;
  }
};

/** The Voice tab (spec 0123, design decision 9): the microphone, its level with the line and Test, then Voice processing. */
function VoiceTab(props: SettingsPanelProps & { shown: boolean }) {
  const { voicePrefs, onVoicePrefs, mics = [], localVoice, micInput, shown } = props;
  const level = useMicLevel(micInput, shown);
  if (!voicePrefs || !onVoicePrefs) return null;
  const set = (patch: Partial<VoicePrefs>) => onVoicePrefs({ ...voicePrefs, ...patch });
  const isolate = canIsolate();
  const SWITCHES: {
    key: keyof Omit<VoicePrefs, "micId" | "sensitivity">;
    label: string;
    hint: string;
    unavailable?: string;
  }[] = [
    {
      key: "echoCancellation",
      label: "Echo cancellation",
      hint: "Stops your speakers coming back through the mic",
    },
    {
      key: "noiseSuppression",
      label: "Noise suppression",
      hint: "Quiets fans, keyboards and hum",
    },
    {
      key: "autoGainControl",
      label: "Automatic volume",
      hint: "Keeps your voice at an even level",
    },
    {
      key: "voiceIsolation",
      label: "Voice isolation",
      hint: "Keeps only speech",
      unavailable: isolate ? undefined : NO_ISOLATION,
    },
  ];
  return (
    <>
      <div className={styles.lead}>
        <div className={styles.group}>
          <ControlLabel>Microphone</ControlLabel>
          {mics.length > 0 ? (
            <Picker
              label="Microphone"
              options={mics.map((m) => ({ value: m.deviceId, label: m.label }))}
              value={voicePrefs.micId ?? mics[0].deviceId}
              onChange={(micId) => set({ micId })}
            />
          ) : (
            <p className={styles.hint}>The browser lists your microphones once you turn your voice on.</p>
          )}
        </div>
        <div className={styles.group}>
          <ControlLabel>Mic level</ControlLabel>
          <MicTest
            level={level}
            track={localVoice}
            sensitivity={voicePrefs.sensitivity}
            onSensitivity={(sensitivity) => set({ sensitivity })}
          />
        </div>
      </div>
      <div className={styles.group}>
        <ControlLabel>Voice processing</ControlLabel>
        {SWITCHES.map((s) => (
          <Tooltip key={s.key} text={s.unavailable ?? s.hint}>
            <Switch
              label={s.label}
              checked={voicePrefs[s.key]}
              unavailable={Boolean(s.unavailable)}
              onToggle={() =>
                s.unavailable
                  ? toastStore.show(s.unavailable, <Icon name="mic" size={20} />)
                  : set({ [s.key]: !voicePrefs[s.key] })
              }
            />
          </Tooltip>
        ))}
      </div>
    </>
  );
}
