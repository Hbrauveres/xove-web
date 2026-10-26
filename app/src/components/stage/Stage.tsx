import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  loadVoiceHearing,
  loadWatchPrefs,
  saveVoiceHearing,
  saveWatchPrefs,
  type WatchPrefs,
} from "../../media/preferences";
import { viewerQualities } from "../../media/shareSettings";
import type { StagePick } from "../../hooks/useStagePick";
import type { AmbilightPrefs } from "../../media/preferences";
import type { Friend, LiveFeed, Sharer } from "../../types";
import { EmptyStage } from "./EmptyStage";
import { Facecam, type FacecamPlace } from "./Facecam";
import { ScreenVideo } from "./ScreenVideo";
import { StageNotice } from "./StageNotice";
import { StageOverlay } from "./StageOverlay";
import { PlayerButtons, type StreamControls } from "./PlayerButtons";
import { VoiceAudio } from "./VoiceAudio";
import type { Hearing } from "./HearToggles";
import { ViewerBar, type Sound } from "./ViewerBar";
import { MicIcon, MicOffIcon } from "./icons";
import round from "./RoundButton.module.css";
import { AlsoLive } from "./AlsoLive";
import { Ambilight } from "./Ambilight";
import { CornerGlow } from "./CornerGlow";
import { StaticGlow } from "./StaticGlow";
import { NowWatching, STREAM_PLACES } from "./NowWatching";
import { Toast } from "../ui/Toast";
import { Tooltip } from "../ui/Tooltip";
import { useVideoShape } from "../../hooks/useVideoShape";
import { useKeyboardLast } from "@shared/hooks/use-keyboard-last.hook";
import { choose, hearingOf, type Choices } from "../../media/hearing";
import { gridFor } from "../../media/ambilight";
import styles from "./Stage.module.css";

/** The settings over the cog sit this far above the round buttons (design decision 9). */
const ROW_GAP = 10;

type Props = {
  /** Everyone with a live stream, the longest sharing first. */
  sharers: Sharer[];
  /** My screen and camera: the round buttons over the bottom of the stage (spec 0098). */
  controls: StreamControls;
  /** Who is on the stage, kept by the room (spec 0104). */
  stage: StagePick;
  /** The light around the stage (spec 0104). */
  ambilight: AmbilightPrefs;
  /** Who has the person on the stage on theirs, me included, never that person (spec 0107). */
  watchers?: Friend[];
  /** The others in the room, for an empty stage's invitation (spec 0107). */
  others?: Friend[];
  /** The settings panel, over the cog: inside the player, so it comes along in fullscreen. */
  settingsPanel?: ReactNode;
};

/** Where the facecam starts, as shares of the stage: the top right, clear of the buttons. */
const FACECAM_START: FacecamPlace = { x: 0.73, y: 0.04 };

/** How long the player's labels and bars stay after the mouse stops moving. */
export const CHROME_IDLE_MS = 2500;

/** Watching a camera: there's no screen to hear. */
const NO_SCREEN_SOUND = "No screen sound";
const NO_SOUND_HERE = "No sound in this stream";

/** The light's grid for a shape: a new grid starts a fresh light (spec 0107). */
const gridKey = (shape: number) => {
  const { cols, rows } = gridFor(shape);
  return `${cols}x${rows}`;
};

const what = (feed: LiveFeed) => (feed.kind === "camera" ? "camera" : "shared screen");

/** Where the big stream plays: in a 16:9 box, with the picture's own shape (spec 0107). */
export function Stage({ sharers, controls, stage, ambilight, watchers, others, settingsPanel }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [watch, setWatch] = useState<WatchPrefs>(loadWatchPrefs);
  // How I hear the voice of the person I watch (spec 0123): its own volume and mute, remembered.
  const [voiceSound, setVoiceSoundState] = useState<Sound>(loadVoiceHearing);
  const setVoiceSound = (next: Sound) => {
    setVoiceSoundState(next);
    saveVoiceHearing(next);
  };
  const micOn = Boolean(controls.voice);
  const toggleMic = () => controls.onVoice?.();

  // Who is big comes from the room (spec 0104), which the previews and the activity can change too.
  const { big, swappedFor, pick, toggleSwap } = stage;
  // Starting a stream takes you to your stream (spec 0123): picked once it's there.
  const [toMine, setToMine] = useState(false);
  const meLive = controls.mine.screen || controls.mine.camera;
  const myId = sharers.find((s) => s.isMe)?.person.id;
  useEffect(() => {
    if (!toMine || !myId) return;
    setToMine(false);
    pick(myId);
  }, [toMine, myId, pick]);
  const startMine = useCallback(
    (kind: "screen" | "camera") => {
      controls.onStart(kind);
      setToMine(true);
    },
    [controls],
  );
  const bigId = big?.person.id ?? null;

  // Screen and camera together: the screen big, the camera in the facecam over it,
  // unless the viewer swapped them (for that person). Remembered for this visit only.
  const swapped = big ? Boolean(swappedFor[big.person.id]) : false;
  // It starts at the top right, clear of the round buttons and the fullscreen button at the bottom right.
  const [facecamPlace, setFacecamPlace] = useState<FacecamPlace>(FACECAM_START);
  const [facecamCollapsed, setFacecamCollapsed] = useState(false);
  const both = Boolean(big?.screen && big?.camera);
  const main = big ? ((both && swapped ? big.camera : big.screen) ?? big.camera ?? null) : null;
  const small = both && big ? (swapped ? big.screen : big.camera) : undefined;

  // The LIVE label, the name and the bars show while the mouse moves over the player, and fade
  // when it stops, like YouTube.
  const [chromeShown, setChromeShown] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);
  // Nothing fades while a control has the keyboard focus, or a menu or the volume slider is open.
  const held = useRef(new Set<string>());
  const stageRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  // The keyboard's focus keeps the controls; a click doesn't.
  const keyboardFocus = useKeyboardLast();
  const focusInside = () =>
    held.current.size > 0 || (keyboardFocus() && (frameRef.current?.contains(document.activeElement) ?? false));
  const showChrome = useCallback(() => {
    setChromeShown(true);
    window.clearTimeout(idleTimer.current);
    const fade = () => {
      if (focusInside()) idleTimer.current = window.setTimeout(fade, CHROME_IDLE_MS);
      else setChromeShown(false);
    };
    idleTimer.current = window.setTimeout(fade, CHROME_IDLE_MS);
  }, []);
  const leaveChrome = useCallback((e: React.PointerEvent) => {
    if (focusInside()) return;
    // Fullscreen, there's nothing outside the player to leave to. Some browsers still send
    // "left" while the mouse moves over it (Chrome on Windows, on a tall monitor), which hid
    // the controls for good: only the idle timer hides them there.
    const frame = frameRef.current;
    if (frame && document.fullscreenElement === frame) return;
    // And a "left" while the pointer is still over the player is ignored too.
    const r = frame?.getBoundingClientRect();
    if (r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) return;
    window.clearTimeout(idleTimer.current);
    setChromeShown(false);
  }, []);
  const hold = useCallback(
    (what: string, open: boolean) => {
      if (open) {
        held.current.add(what);
        showChrome();
      } else {
        held.current.delete(what);
      }
    },
    [showChrome],
  );
  const onMenuChange = useCallback((open: boolean) => hold("menu", open), [hold]);
  // The settings panel keeps the controls shown while it's open: held from the cog's click,
  // let go however it closes (the cog, its ✕, Escape).
  const { settingsOpen, onSettings } = controls;
  const toggleSettings = useCallback(() => {
    hold("settings", !settingsOpen);
    onSettings();
  }, [hold, settingsOpen, onSettings]);
  // Another stream on the stage (a preview, a stream ending) closes the settings: they
  // belong to the buttons they opened from, which go with the stream (spec 0123).
  const shownId = useRef(bigId);
  useEffect(() => {
    if (shownId.current === bigId) return;
    shownId.current = bigId;
    if (settingsOpen) toggleSettings();
  }, [bigId, settingsOpen, toggleSettings]);
  useEffect(() => {
    if (!settingsOpen) held.current.delete("settings");
  }, [settingsOpen]);
  // The settings open over the cog (design decision 9), or over Go live where they came from
  // its menu (spec 0123): centred on it, just above the round buttons. The panel reads where
  // they are from two variables on what holds it.
  useLayoutEffect(() => {
    const host = frameRef.current;
    if (!settingsOpen || !host || !controlsRef.current) return;
    const place = () => {
      const controls = controlsRef.current;
      if (!controls) return;
      const cog = controls.querySelector('button[aria-label="Settings"], [data-settings-anchor]');
      const row = controls.querySelector("[data-buttons]");
      const h = host.getBoundingClientRect();
      if (!cog || !row || !h.width) return;
      const c = cog.getBoundingClientRect();
      host.style.setProperty("--cog-x", `${c.left + c.width / 2 - h.left}px`);
      host.style.setProperty("--above-row", `${h.bottom - row.getBoundingClientRect().top + ROW_GAP}px`);
    };
    place();
    window.addEventListener("resize", place);
    // The row changes too (the volume comes and goes with who's on the stage).
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    watch?.observe(host);
    const row = controlsRef.current.querySelector("[data-buttons]");
    if (row) watch?.observe(row);
    return () => {
      window.removeEventListener("resize", place);
      watch?.disconnect();
    };
  }, [settingsOpen]);
  const playing = Boolean(main && (big?.isMe ? main.local : main.remote));
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // The big video, for the ambilight to read.
  const [bigVideoEl, setBigVideoEl] = useState<HTMLVideoElement | null>(null);
  // The picture's shape, for the view and the box's height (specs 0107 and 0133). 16:9 while empty
  // or loading.
  const shape = useVideoShape(bigVideoEl);
  // What I hear from each person (specs 0123 and 0131): their sound and their voice, each with its
  // own volume and one switch that follows them everywhere once touched, for the whole visit.
  const [hearing, setHearing] = useState<Record<string, Choices>>({});
  const hearOf = (id: string): Hearing =>
    hearingOf(hearing[id], id === bigId, { sound: watch.volume, voice: voiceSound.volume });
  const setHear = (id: string, next: Hearing) => {
    const was = hearOf(id);
    setHearing((prev) => ({ ...prev, [id]: choose(prev[id], was, next) }));
    // The stage's volumes are where the next person starts: only a change to whoever is on the stage
    // moves them, so a preview's volume never changes the stage's (spec 0131).
    if (id !== bigId) return;
    changeWatch({ volume: next.sound.volume, muted: false });
    setVoiceSound({ volume: next.voice.volume, muted: false });
  };
  // Downloaded: the person on the stage's sound and voice, muted or not, so unmuting is instant; a
  // preview's only while I hear it (spec 0131, FR-2).
  useEffect(() => {
    for (const s of sharers) {
      if (s.isMe) continue;
      const big = s.person.id === bigId;
      const h = hearingOf(hearing[s.person.id], big, { sound: 0, voice: 0 });
      s.setSoundOn?.(big || !h.sound.muted);
      s.setVoiceOn?.(big || !h.voice.muted);
    }
  }, [sharers, bigId, hearing]);
  const bigHearing = big && !big.isMe ? hearOf(big.person.id) : null;
  // The voices that play: the big person's (muted in place while I mute it) and the previews' I hear;
  // and the previews' screen sounds I hear (the big one's plays with its picture).
  const notMe = sharers.filter((s) => !s.isMe);
  const voices = notMe
    .filter((s) => s.voice && s.hasVoice && (s === big || !hearOf(s.person.id).voice.muted))
    .map((s) => ({ id: s.person.id, track: s.voice!, ...hearOf(s.person.id).voice }));
  const previewSounds = notMe
    .filter((s) => s !== big && s.sound && s.hasSound && !hearOf(s.person.id).sound.muted)
    .map((s) => ({ id: s.person.id, track: s.sound!, ...hearOf(s.person.id).sound }));

  const changeWatch = (next: WatchPrefs) => {
    setWatch(next);
    saveWatchPrefs(next);
  };

  // Watching is always Auto (spec 0107): the size it's shown at, stepping down when the
  // connection can't keep up. Asked for as soon as the big video arrives, and whenever its
  // sharer's cap changes: Auto never asks for more than the cap, so LiveKit stops sending
  // the layers above it.
  const remote = big?.isMe ? undefined : main?.remote;
  // A new function arrives with every LiveKit update; the video it's about is what matters.
  const setQuality = useRef(remote?.setQuality);
  useEffect(() => {
    setQuality.current = remote?.setQuality;
  });
  const bigVideo = remote?.video;
  const cap = main?.settings.quality;
  const offered = viewerQualities(remote?.height ?? 0, remote?.layers, cap);
  const request = cap && cap !== "1080p" ? offered[0] : "auto";
  useEffect(() => {
    const set = setQuality.current;
    if (!bigVideo || !set) return;
    set(request);
    // Leaving the big player (to a thumbnail): back to Auto, so it comes in small.
    return () => set("auto");
  }, [bigVideo, request]);

  // The same button enters and leaves fullscreen; Esc (the browser's own way out) is followed too.
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const follow = () =>
      setFullscreen(document.fullscreenElement != null && document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", follow);
    return () => document.removeEventListener("fullscreenchange", follow);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement && document.fullscreenElement === frameRef.current) {
      void document.exitFullscreen?.().catch(() => {
        /* Already left. */
      });
      return;
    }
    frameRef.current?.requestFullscreen?.().catch(() => {
      /* Not allowed here. The stage stays inline. */
    });
  };

  // Only over a playing video: notices and the empty stage never fade.
  const chrome = playing ? (chromeShown ? "shown" : "hidden") : undefined;

  const body = () => {
    if (!big || !main) return <EmptyStage canShareScreen={controls.canShareScreen} onStart={startMine} />;

    // My own stream as everyone sees it, without its sound (it would echo). Sharing
    // the whole screen shows the page inside itself: sharing a tab or window avoids it.
    const content = big.isMe ? (
      main.local ? (
        // My quality and mode are in my buttons' menus (spec 0098).
        <ScreenVideo video={main.local} label={`Your ${what(main)}`} onVideo={setBigVideoEl} />
      ) : (
        <StageNotice spinner title="Starting your share…" text="Your screen shows here in a moment." />
      )
    ) : main.remote ? (
      <ScreenVideo
        video={main.remote.video}
        sound={big.sound}
        label={`${big.person.name}'s ${what(main)}`}
        volume={bigHearing?.sound.volume ?? watch.volume}
        muted={bigHearing?.sound.muted ?? watch.muted}
        onVideo={setBigVideoEl}
      />
    ) : (
      <StageNotice spinner title={`Loading ${big.person.name}'s ${main.kind}…`} text="The video starts in a moment." />
    );

    return (
      <>
        <div className={styles.slide}>
          {content}
          {small && (
            <Facecam
              video={big.isMe ? small.local : small.remote?.video}
              label={big.isMe ? `Your ${what(small)}` : `${big.person.name}'s ${what(small)}`}
              place={facecamPlace}
              collapsed={facecamCollapsed}
              onSwap={() => toggleSwap(big.person.id)}
              onMove={setFacecamPlace}
              onCollapse={setFacecamCollapsed}
            />
          )}
        </div>
      </>
    );
  };

  const chromeLayer = (
    <>
      {/* Over a stream and over the empty stage alike, so stopping the only stream in
          fullscreen never strands you there (spec 0111). */}
      <StageOverlay fullscreen={fullscreen} onFullscreen={toggleFullscreen} />

      {/* Always there: over the empty stage they never fade; over a stream, with the bars. */}
      <div ref={controlsRef} className={styles.controls}>
        {big && !big.isMe ? (
          // Someone else's stream: what you hear at the left, you at the right (spec 0123, design decision 1).
          <ViewerBar
            sound={{
              ...hearOf(big.person.id).sound,
              onChange: (s) => setHear(big.person.id, { ...hearOf(big.person.id), sound: s }),
              unavailable: !big.screen ? NO_SCREEN_SOUND : big.hasSound ? undefined : NO_SOUND_HERE,
            }}
            voice={{
              ...hearOf(big.person.id).voice,
              onChange: (v) => setHear(big.person.id, { ...hearOf(big.person.id), voice: v }),
              unavailable: big.hasVoice ? undefined : `${big.person.name}'s mic is off`,
              name: big.person.name,
              talking: big.speaking,
            }}
            live={meLive}
            micOn={micOn}
            onMic={toggleMic}
            canShareScreen={controls.canShareScreen}
            full={controls.free <= 0}
            onStart={startMine}
            onSettings={toggleSettings}
          />
        ) : !big ? (
          // Nobody live: the empty stage has the ways to start; the settings sit in the corner, beside
          // fullscreen, as over a stream (spec 0147).
          <ViewerBar
            live={false}
            settingsOnly
            canShareScreen={controls.canShareScreen}
            onStart={startMine}
            onSettings={toggleSettings}
          />
        ) : (
          // Your stream: your controls in the middle, your mic with them.
          <PlayerButtons
            {...controls}
            onStart={startMine}
            onSettings={toggleSettings}
            onMenuChange={onMenuChange}
            extra={
              <div className={`${round.pill} ${micOn ? round.live : ""}`}>
                <Tooltip text={micOn ? "Mute your voice" : "Share your voice"}>
                  <button
                    type="button"
                    className={round.main}
                    aria-pressed={micOn}
                    aria-label={micOn ? "Mute your voice" : "Share your voice"}
                    onClick={toggleMic}
                  >
                    {micOn ? <MicIcon /> : <MicOffIcon />}
                  </button>
                </Tooltip>
              </div>
            }
          />
        )}
      </div>
    </>
  );

  return (
    <section ref={stageRef} className={styles.stage} aria-label="Shared screen">
      <div
        ref={boxRef}
        className={styles.box}
        data-shape={shape.toFixed(4)}
        style={{ "--shape": shape } as React.CSSProperties}
      >
        {/* The controls' layer: the stage's whole box, whatever the picture's shape. It holds the
            buttons and the view. */}
        <div
          ref={frameRef}
          className={styles.frame}
          data-chrome={chrome}
          onPointerMove={showChrome}
          onPointerDown={showChrome}
          onPointerLeave={leaveChrome}
          onFocus={showChrome}
        >
          {/* The view: the picture in its own shape, centred, with its light behind it. */}
          <div ref={viewRef} className={styles.view}>
            {/* Behind the picture, outside it: the picture clips what's inside it. */}
            {/* One per stream: a stream the browser won't let it read doesn't darken the next one. */}
            {/* Nobody live: each viewfinder corner glows outward, a blurred L. */}
            {!big && <CornerGlow prefs={ambilight} />}
            {/* Nobody live: the static's bands light the wall round the stage. */}
            {!big && <StaticGlow prefs={ambilight} />}
            <Ambilight
              key={big ? `${big.person.id}|${stage.mainKind}|${gridKey(shape)}` : "none"}
              video={big ? bigVideoEl : null}
              prefs={ambilight}
              shape={shape}
            />
            <div className={styles.picture}>{body()}</div>
          </div>
          {chromeLayer}
          {settingsPanel}
          {voices.map((v) => (
            <VoiceAudio key={v.id} track={v.track} volume={v.volume} muted={v.muted} />
          ))}
          {/* The previews I turned on: their screens' sound, at their own volume. */}
          {previewSounds.map((p) => (
            <VoiceAudio key={`sound-${p.id}`} track={p.track} volume={p.volume} muted={p.muted} />
          ))}
          {/* A short message to the user, at the top centre of the player. */}
          <Toast />
        </div>
      </div>

      {/* Under the stage, like YouTube's title row. */}
      <div className={styles.info}>
        <NowWatching sharer={big} watchers={watchers} others={others} />
        <AlsoLive
          others={sharers.filter((s) => s !== big)}
          liveCount={STREAM_PLACES - controls.free}
          free={controls.free}
          onPick={(id) => pick(id)}
          hearOf={hearOf}
          onHear={setHear}
          swappedOf={(id) => Boolean(swappedFor[id])}
          onSwap={toggleSwap}
        />
      </div>
    </section>
  );
}
