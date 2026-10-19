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
import { arrowEnd, liftButtons, liftOverRow, makeRoom, ROOM_GAP as SHEET_GAP } from "./makeRoom";
import { AlsoLive } from "./AlsoLive";
import { Ambilight } from "./Ambilight";
import { CornerGlow } from "./CornerGlow";
import { NowWatching, STREAM_PLACES } from "./NowWatching";
// The component, not the type of the same name from ../../types.
import { LiveFeed as LiveNowFeed } from "./LiveFeed";
import { HereCards } from "./HereCards";
import { Toast } from "../ui/Toast";
import { Tooltip } from "../ui/Tooltip";
import { useVideoShape } from "../../hooks/useVideoShape";
import { useStageSwipe } from "../../hooks/useStageSwipe";
import { useKeyboardLast, useTapToggle } from "../../hooks/useTapToggle";
import { stepOnStage } from "../../media/stagePick";
import { choose, hearingOf, type Choices } from "../../media/hearing";
import { StageDots } from "./StageDots";
import { StreamsRow } from "./StreamsRow";
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
  /**
   * The phone's layouts: upright (spec 0158), the compact info row then the feed or who's here;
   * sideways (spec 0160), the stage filling the screen with a top bar and the streams row.
   */
  layout?: "phone" | "sideways";
  /** Sideways: the people button, the bell and my account, on the right of the top bar. */
  topRight?: ReactNode;
  /**
   * On a phone or tablet (spec 0171): the fullscreen button opens and leaves the full-screen
   * view instead of the player's fullscreen; `hidden` sideways, where the room is already in it.
   */
  fullView?: { on: boolean; toggle: () => void; hidden: boolean };
  /** On the phone: who has this person's stream on their stage, for the feed's cards. */
  watchersOf?: (personId: string) => Friend[];
  /** On the phone, with nobody live: everyone in the room, me included, and when they arrived. */
  people?: Friend[];
  meId?: string;
  arrivedAt?: Record<string, number>;
  /**
   * The settings panel, over the cog (spec 0107): inside the player, so it comes along in
   * fullscreen; sideways on the stage, which is the screen, so it sits above the top bar too.
   */
  settingsPanel?: ReactNode;
  /** The settings sheet is open over the stage: the upright full view makes room for the player. */
  sheetOpen?: boolean;
};

const NOBODY: Friend[] = [];
const NO_ARRIVALS: Record<string, number> = {};
const nobodyWatching = () => NOBODY;

/** How long the player's labels and bars stay after the mouse stops moving. */
export const CHROME_IDLE_MS = 2500;

/** Watching a camera: there's no screen to hear. */
const NO_SCREEN_SOUND = "No screen sound";
const NO_SOUND_HERE = "No sound in this stream";

/** iPhones and iPads ignore a page's volume (only their buttons change it). */
const canSetVolume = () =>
  !/iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** The light's grid for a shape: a new grid starts a fresh light (spec 0107). */
const gridKey = (shape: number) => {
  const { cols, rows } = gridFor(shape);
  return `${cols}x${rows}`;
};

const what = (feed: LiveFeed) => (feed.kind === "camera" ? "camera" : "shared screen");

/** Where the big stream plays: in a 16:9 box, with the picture's own shape (spec 0107). */
export function Stage({
  sharers,
  controls,
  stage,
  ambilight,
  watchers,
  others,
  layout,
  watchersOf = nobodyWatching,
  people = NOBODY,
  meId = "me",
  arrivedAt = NO_ARRIVALS,
  topRight,
  fullView,
  settingsPanel,
  sheetOpen = false,
}: Props) {
  const phone = layout === "phone";
  const sideways = layout === "sideways";
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
  // It starts at the top right (spec 0111), clear of the round buttons and the fullscreen button
  // at the bottom right; under the top bar where one lies over the player.
  // Until it's moved, it follows the layout (turning the phone, the full view keep one stage).
  const [movedFacecam, setFacecamPlace] = useState<FacecamPlace | null>(null);
  const facecamPlace = movedFacecam ?? {
    x: 0.73,
    y: layout === "sideways" ? 0.18 : 0.04,
  };
  const [facecamCollapsed, setFacecamCollapsed] = useState(false);
  const both = Boolean(big?.screen && big?.camera);
  const main = big ? ((both && swapped ? big.camera : big.screen) ?? big.camera ?? null) : null;
  const small = both && big ? (swapped ? big.screen : big.camera) : undefined;

  // The LIVE label, the name and the bars show while the mouse moves over the player
  // (or after a tap), and fade when it stops, like YouTube.
  const [chromeShown, setChromeShown] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);
  // Nothing fades while a control has the keyboard focus, or a menu or the volume slider is open.
  const held = useRef(new Set<string>());
  // Sideways the top bar is part of it too: its focus, and an open panel (spec 0160).
  const topRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const screenChromeRef = useRef<HTMLDivElement>(null);
  // The fullscreen button and the round buttons. In the upright full view they're the
  // screen's, at its bottom, not the player band's (spec 0112); elsewhere, the player's.
  const onScreen = sideways && Boolean(fullView?.on && !fullView.hidden);

  // The upright full view with the settings sheet open (spec 0107, design decision 6; spec 0112):
  // the round buttons and the fullscreen button, at the bottom of the screen, move up together
  // to just above the sheet; the video moves up between the top bar and the sheet at the same
  // size if it fits there, and stays (never shrunk) if not. The sheet's top is read from the
  // sheet itself: the visible screen isn't always the stage's height on a real phone.
  const makingRoom = sideways && Boolean(fullView?.on && !fullView.hidden) && sheetOpen;
  // The upright normal view (spec 0118): the buttons stay over the player's bottom, and rise
  // over the video to just above the sheet where a tall player reaches under it.
  const roomInPlayer = phone && sheetOpen;
  useLayoutEffect(() => {
    const box = boxRef.current;
    const section = stageRef.current;
    if (!box || !section) return;
    const place = () => {
      const buttons = screenChromeRef.current;
      const frame = frameRef.current;
      const inPlayer = [frame?.querySelector<HTMLElement>("[data-overlay]"), controlsRef.current];
      box.style.translate = "";
      if (buttons) buttons.style.translate = "";
      inPlayer.forEach((el) => el && (el.style.translate = ""));
      if (!makingRoom && !roomInPlayer) return;
      const sheet = document.querySelector<HTMLElement>('[role="dialog"][data-variant="sheet"]');
      if (!sheet) return;
      if (roomInPlayer) {
        const row = controlsRef.current?.querySelector<HTMLElement>("[data-buttons]");
        if (!frame || !row) return;
        // In layout, from the player's top: a lift in place or still sliding isn't counted.
        let y = 0;
        for (let n: HTMLElement | null = row; n && n !== frame; n = n.offsetParent as HTMLElement | null)
          y += n.offsetTop;
        const up = liftButtons({
          rowBottom: frame.getBoundingClientRect().top + y + row.offsetHeight,
          sheetTop: sheet.offsetTop,
          max: y - SHEET_GAP,
        });
        if (up) inPlayer.forEach((el) => el && (el.style.translate = `0 ${-up}px`));
        return;
      }
      // Fixed to the screen: its layout top, which its slide-in (a transform) doesn't change.
      const sheetTop = sheet.offsetTop;
      const s = section.getBoundingClientRect();
      const top = topRef.current;
      const bar = top
        ? Math.max(0, ...[...top.children].map((c) => (c as HTMLElement).offsetTop + (c as HTMLElement).offsetHeight))
        : 0;
      const lift = makeRoom({
        height: s.height,
        bar,
        sheet: s.bottom - sheetTop,
        band: { top: box.offsetTop, height: box.offsetHeight },
      });
      if (lift) box.style.translate = `0 ${-lift}px`;
      const row = buttons?.querySelector<HTMLElement>("[data-buttons]");
      if (!buttons || !row) return;
      // Where the row sits without any lift (layout, not the screen: a lift still sliding would
      // otherwise be measured as already done).
      let y = row.offsetHeight;
      for (let n: HTMLElement | null = row; n && n !== section; n = n.offsetParent as HTMLElement | null)
        y += n.offsetTop;
      const up = liftButtons({ rowBottom: s.top + y, sheetTop });
      if (up) buttons.style.translate = `0 ${-up}px`;
    };
    place();
    window.addEventListener("resize", place);
    // The picture's shape can change with the sheet open (another stream, its real size
    // arriving, the facecam): measure again. A translate doesn't resize, so this can't loop.
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    watch?.observe(box);
    return () => {
      window.removeEventListener("resize", place);
      watch?.disconnect();
    };
  }, [makingRoom, roomInPlayer]);
  // The keyboard's focus keeps the controls; a finger's tap doesn't (spec 0131).
  const keyboardFocus = useKeyboardLast();
  const focusInside = () =>
    held.current.size > 0 ||
    (keyboardFocus() && (frameRef.current?.contains(document.activeElement) ?? false)) ||
    (keyboardFocus() && (topRef.current?.contains(document.activeElement) ?? false)) ||
    (keyboardFocus() && (screenChromeRef.current?.contains(document.activeElement) ?? false)) ||
    Boolean(topRef.current?.querySelector('[aria-expanded="true"]'));
  // An open streams row stays through the idle fade; only a tap hides it, with everything (spec 0131).
  const [rowAway, setRowAway] = useState(false);
  const showChrome = useCallback(() => {
    setChromeShown(true);
    setRowAway(false);
    window.clearTimeout(idleTimer.current);
    const fade = () => {
      if (focusInside()) idleTimer.current = window.setTimeout(fade, CHROME_IDLE_MS);
      else setChromeShown(false);
    };
    idleTimer.current = window.setTimeout(fade, CHROME_IDLE_MS);
  }, []);
  // A finger lifting off fires pointerleave at once: on touch, only the timer hides.
  const leaveChrome = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" || focusInside()) return;
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
  // Another stream on the stage (a preview, a swipe, a stream ending) closes the settings: they
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
    const host = sideways ? stageRef.current : frameRef.current;
    if (!settingsOpen || !host || !controlsRef.current) return;
    const place = () => {
      // Read each time: turning the phone in the full view moves the buttons to another layer.
      const controls = controlsRef.current;
      if (!controls) return;
      const cog = controls.querySelector('button[aria-label="Settings"], [data-settings-anchor]');
      const row = controls.querySelector("[data-buttons]");
      const h = host.getBoundingClientRect();
      if (!cog || !row || !h.width) return;
      // The panel goes where the buttons end up: if the player is still sliding back (turning
      // the phone in the full view with the settings open), take its slide out.
      const box = boxRef.current;
      const sliding =
        box && host !== frameRef.current && box.contains(row)
          ? box.getBoundingClientRect().top - h.top - box.offsetTop
          : 0;
      const c = cog.getBoundingClientRect();
      host.style.setProperty("--cog-x", `${c.left + c.width / 2 - h.left}px`);
      host.style.setProperty("--above-row", `${h.bottom - (row.getBoundingClientRect().top - sliding) + ROW_GAP}px`);
    };
    place();
    window.addEventListener("resize", place);
    // The row changes too (the volume comes and goes with who's on the stage).
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    watch?.observe(host);
    const row = controlsRef.current.querySelector("[data-buttons]");
    if (row) watch?.observe(row);
    // And once the player has finished sliding (a slide doesn't resize anything).
    const box = boxRef.current;
    box?.addEventListener("transitionend", place);
    return () => {
      window.removeEventListener("resize", place);
      watch?.disconnect();
      box?.removeEventListener("transitionend", place);
    };
  }, [settingsOpen, sideways, onScreen]);
  // The streams row's arrow at the bottom-left, on the buttons' line; lifted above the settings sheet,
  // the buttons are off its line and need no room for it.
  const rowArrow = sideways && Boolean(big) && sharers.length > 1 && !makingRoom;
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
    // The whole page may be fullscreen on a phone (spec 0160): only the player's own leaves.
    if (document.fullscreenElement && document.fullscreenElement === frameRef.current) {
      void document.exitFullscreen?.().catch(() => {
        /* Already left. */
      });
      return;
    }
    frameRef.current?.requestFullscreen?.().catch(() => {
      /* Not allowed here (some phones and app views). The stage stays inline. */
    });
  };

  // On the phone, a swipe on the picture goes to the next or previous person live (spec 0159).
  const slideRef = useRef<HTMLDivElement>(null);
  const order = sharers.map((s) => s.person.id);
  const swipe = useStageSwipe(slideRef, {
    // Upright and sideways alike (spec 0160): left and right always changes the stream.
    enabled: (phone || sideways) && order.length > 1,
    onStep: (direction) => {
      const next = stepOnStage(order, bigId, direction);
      if (next) pick(next);
    },
  });

  // Sideways (spec 0160): the streams row, closed at first and each time the phone turns
  // sideways; a swipe up opens it, a swipe down closes it. It hides with the controls and comes back
  // open with them (spec 0131).
  const [rowOpen, setRowOpen] = useState(false);
  const [rowFor, setRowFor] = useState(layout);
  if (rowFor !== layout) {
    setRowFor(layout);
    setRowOpen(false);
  }
  // Nobody live: there's no row to open.
  if (rowOpen && !big) setRowOpen(false);
  // Sideways, the streams row's arrow sits at the screen's bottom-left: the sounds start after it
  // (spec 0131), and go back to the edge when it moves into the open row.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!rowArrow || !stage) return;
    const place = () => {
      const arrow = stage.querySelector<HTMLElement>('[data-arrow="up"]');
      const bar = stage.querySelector<HTMLElement>("[data-viewer-bar]");
      const holder = bar?.offsetParent as HTMLElement | null;
      if (!arrow || !holder) return stage.style.removeProperty("--arrow-end");
      // Where the arrow ends, from the sounds' own layer; the stylesheet keeps them clear of it.
      stage.style.setProperty("--arrow-end", `${arrowEnd(arrow, holder)}px`);
    };
    place();
    window.addEventListener("resize", place);
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    watch?.observe(stage);
    if (frameRef.current) watch?.observe(frameRef.current);
    return () => {
      window.removeEventListener("resize", place);
      watch?.disconnect();
      stage.style.removeProperty("--arrow-end");
    };
  }, [rowArrow, onScreen, rowOpen]);
  // Open and not hidden by a tap: hidden, it's closed for screen readers too, and opens again with
  // the controls.
  const rowShown = rowOpen && !(rowAway && !chromeShown);
  // The streams row open: the buttons rise above it, as above the settings sheet (spec 0131): what
  // comes up from the bottom never covers them.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const place = () => {
      const row = stage.querySelector<HTMLElement>("[data-streams-row]");
      const chrome = screenChromeRef.current;
      const bar = chrome?.querySelector<HTMLElement>("[data-viewer-bar], [data-buttons]");
      if (!rowShown || !row || !chrome || !bar) return stage.style.removeProperty("--row-lift");
      // In layout: where the buttons sit unlifted, from the screen's bottom; the lift is the rest.
      const lift = parseFloat(stage.style.getPropertyValue("--row-lift")) || 0;
      let top = 0;
      for (let n: HTMLElement | null = bar; n && n !== chrome; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      const under = parseFloat(getComputedStyle(chrome).bottom) - lift + (chrome.clientHeight - top - bar.offsetHeight);
      const fade = parseFloat(getComputedStyle(row).paddingTop);
      stage.style.setProperty("--row-lift", `${liftOverRow({ row: row.offsetHeight, fade, under })}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [rowShown, sideways, onScreen]);
  const rowSwipe = useStageSwipe(slideRef, {
    enabled: sideways && Boolean(big),
    axis: "vertical",
    onOpen: () => setRowOpen(true),
    onClose: () => setRowOpen(false),
  });
  // Turning sideways shows the controls, so the top bar is there to start with.
  useEffect(() => {
    if (sideways) showChrome();
  }, [sideways, showChrome]);
  // Touches and moves: the frame's, or sideways the whole screen's, so the black at the
  // stage's sides counts too. A tap toggles the controls, the open streams row with them (spec 0131).
  const tap = useTapToggle({
    shown: chromeShown && playing,
    onShow: showChrome,
    onHide: () => {
      window.clearTimeout(idleTimer.current);
      setChromeShown(false);
      setRowAway(true);
    },
  });
  const gestures = {
    onPointerMove: (e: React.PointerEvent) => {
      tap.move(e);
      swipe.onPointerMove(e);
      rowSwipe.onPointerMove(e);
    },
    onPointerDown: (e: React.PointerEvent) => {
      tap.down(e);
      // Sideways the whole screen listens, but only a drag that starts on the picture swipes (FR-12).
      if (sideways && !slideRef.current?.contains(e.target as Node)) return;
      swipe.onPointerDown(e);
      rowSwipe.onPointerDown(e);
    },
    onPointerUp: (e: React.PointerEvent) => {
      tap.up(e);
      swipe.onPointerUp(e);
      rowSwipe.onPointerUp(e);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      tap.cancel();
      swipe.onPointerCancel(e);
      rowSwipe.onPointerCancel(e);
    },
  };
  // Only over a playing video: notices and the empty stage never fade.
  const chrome = playing ? (chromeShown ? "shown" : "hidden") : undefined;

  const body = () => {
    if (!big || !main)
      return (
        <EmptyStage
          canShareScreen={controls.canShareScreen}
          onStart={startMine}
        />
      );

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
        {/* The picture (and its facecam) moves with a swipe; the buttons stay put. */}
        <div ref={slideRef} className={styles.slide}>
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
      {fullView ? (
        <StageOverlay view fullscreen={fullView.on} onFullscreen={fullView.toggle} hidden={fullView.hidden} />
      ) : (
        <StageOverlay fullscreen={fullscreen} onFullscreen={toggleFullscreen} />
      )}

      {/* Always there: over the empty stage they never fade; over a stream, with the bars. */}
      <div ref={controlsRef} className={styles.controls} data-no-swipe>
        {/* Upright and sideways alike: where you are among the people live (specs 0159, 0160). */}
        {(phone || sideways) && (
          <StageDots people={sharers.map((s) => s.person)} meId={meId} onStage={bigId} onPick={(id) => pick(id)} />
        )}
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
            canSetVolume={canSetVolume()}
          />
        ) : !big ? (
          // Nobody live: the empty stage has the ways to start; the settings sit in the corner.
          <ViewerBar
            live={false}
            settingsOnly
            canShareScreen={controls.canShareScreen}
            onStart={startMine}
            onSettings={toggleSettings}
            canSetVolume={canSetVolume()}
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
    <section
      ref={stageRef}
      className={styles.stage}
      data-layout={layout}
      data-chrome={sideways ? chrome : undefined}
      data-row-arrow={rowArrow || undefined}
      data-no-full={(sideways && fullView?.hidden) || undefined}
      aria-label="Shared screen"
      {...(sideways ? gestures : {})}
    >
      <div
        ref={boxRef}
        className={styles.box}
        data-shape={shape.toFixed(4)}
        style={{ "--shape": shape } as React.CSSProperties}
      >
        {/* The controls' layer (spec 0133): the stage's whole box, whatever the picture's shape. It
            holds the buttons and the view, and takes the taps. */}
        <div
          ref={frameRef}
          className={styles.frame}
          data-chrome={chrome}
          {...(sideways ? {} : gestures)}
          onPointerLeave={leaveChrome}
          onFocus={showChrome}
        >
          {/* The view (spec 0133): the picture in its own shape, centred, with its light behind it. */}
          <div className={styles.view}>
            {/* Behind the picture, outside it: the picture clips what's inside it. */}
            {/* One per stream: a stream the browser won't let it read doesn't darken the next one. */}
            {/* Nobody live: each viewfinder corner glows outward, a blurred L (spec 0123, design decision 7). */}
            {!big && <CornerGlow prefs={ambilight} />}
            <Ambilight
              key={big ? `${big.person.id}|${stage.mainKind}|${gridKey(shape)}` : "none"}
              video={big ? bigVideoEl : null}
              prefs={ambilight}
              shape={shape}
            />
            <div className={styles.picture}>{body()}</div>
          </div>
          {!sideways && chromeLayer}
          {!sideways && settingsPanel}
          {voices.map((v) => (
            <VoiceAudio key={v.id} track={v.track} volume={v.volume} muted={v.muted} />
          ))}
          {/* The previews I turned on (spec 0131): their screens' sound, at their own volume. */}
          {previewSounds.map((p) => (
            <VoiceAudio key={`sound-${p.id}`} track={p.track} volume={p.volume} muted={p.muted} />
          ))}
          {/* A short message to the user, at the top centre of the player (design decision 10). */}
          {!sideways && <Toast />}
        </div>
      </div>

      {/* Sideways (and the upright full view): at the bottom of the screen like the streams row's arrow,
          whatever the picture's shape, moving up together above the sheet or the open row. */}
      {sideways && (
        <div ref={screenChromeRef} className={styles.screenChrome} onFocus={showChrome}>
          {chromeLayer}
        </div>
      )}

      {/* Sideways the stage is the screen: over the top bar as well (design decision 9). */}
      {sideways && settingsPanel}
      {/* Sideways at the top centre of the screen, over the top bar's empty middle. */}
      {sideways && (
        <div className={styles.toastTop}>
          <Toast />
        </div>
      )}

      {sideways ? (
        <>
          {/* Over the top, across the screen: who's on the stage, and my buttons (spec 0160). */}
          <div ref={topRef} className={styles.top} data-fades onFocus={showChrome}>
            <NowWatching compact sharer={big} watchers={watchers} free={controls.free} />
            <div className={styles.topRight} data-no-swipe>
              {topRight}
            </div>
          </div>
          {big && sharers.length > 1 && (
            <StreamsRow
              others={sharers.filter((s) => s !== big)}
              liveCount={STREAM_PLACES - controls.free}
              open={rowShown}
              onOpen={() => {
                setRowOpen(true);
                showChrome();
              }}
              onClose={() => setRowOpen(false)}
              onPick={(id) => pick(id)}
              hearOf={hearOf}
              onHear={setHear}
              swappedOf={(id) => Boolean(swappedFor[id])}
              onSwap={toggleSwap}
            />
          )}
        </>
      ) : phone ? (
        <>
          <div className={styles.info}>
            <NowWatching compact sharer={big} watchers={watchers} free={controls.free} />
          </div>
          {/* Only this scrolls on the phone: the stage and its info row stay put (spec 0158). */}
          <div className={styles.below}>
            {big ? (
              <LiveNowFeed
                others={sharers.filter((s) => s !== big)}
                liveCount={STREAM_PLACES - controls.free}
                watchersOf={watchersOf}
                onPick={(id) => pick(id)}
                hearOf={hearOf}
                onHear={setHear}
                swappedOf={(id) => Boolean(swappedFor[id])}
                onSwap={toggleSwap}
              />
            ) : (
              <HereCards people={people} meId={meId} arrivedAt={arrivedAt} />
            )}
          </div>
        </>
      ) : (
        /* Under the stage, like YouTube's title row (spec 0104). */
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
      )}
    </section>
  );
}
