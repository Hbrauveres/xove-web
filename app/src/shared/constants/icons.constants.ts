import type { IconDrawing } from "../types/icon.types";

/** A line drawn round at its ends and corners, in the text's colour. */
const LINE = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** The round buttons' set: a 20 × 20 grid, lines 1.75 px wide with round ends, set on the whole drawing. */
const BUTTON = { ...LINE, strokeWidth: 1.75 } as const;
/** The small icons' lines, set on each shape. */
const SMALL = { ...LINE, strokeWidth: 1.8 } as const;
const SPEAKER = "M3.5 8v4h3l4 3.5v-11l-4 3.5z";
const MONITOR = "M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 17.5h6M10 14.5v3";
const CAMERA = "M3 6h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM13 9l5-3v8l-5-3";
const SWAP = "M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3";
const HEAD = "M2.5 17c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2";

/** Every icon the app draws, each exactly as it was drawn where it's used. */
export const ICONS = {
  /** Sharing my screen: the plain monitor. */
  "screen-on": {
    svg: BUTTON,
    parts: [
      ["rect", { x: "2.5", y: "3.5", width: "15", height: "10", rx: "1.5" }],
      ["path", { d: "M7 16.5h6M10 13.5v3" }],
    ],
  },
  /** Not sharing: the monitor, crossed (its outline breaks where the slash crosses it). */
  "screen-off": {
    svg: BUTTON,
    parts: [
      [
        "path",
        {
          d:
            "M6 3.5h10a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1 1.4M13.5 13.5H4" +
            "A1.5 1.5 0 012.5 12V5c0-.6.3-1 .8-1.3M7 16.5h6M10 13.5v3M3 3l14 14",
        },
      ],
    ],
  },
  /** What a click does while not sharing: a screen with an arrow up out of it. */
  "screen-share": {
    svg: BUTTON,
    parts: [
      ["rect", { x: "2.5", y: "3.5", width: "15", height: "10", rx: "1.5" }],
      ["path", { d: "M7 16.5h6M10 13.5v3M10 11V6.2M7.8 8.2L10 6l2.2 2.2" }],
    ],
  },
  "camera-on": {
    svg: BUTTON,
    parts: [
      ["rect", { x: "2.5", y: "5", width: "11", height: "10", rx: "1.5" }],
      ["path", { d: "M13.5 9l4-2.5v7l-4-2.5" }],
    ],
  },
  "camera-off": {
    svg: BUTTON,
    parts: [
      [
        "path",
        {
          d:
            "M8 5h4a1.5 1.5 0 011.5 1.5v3.5M13.5 13.5a1.5 1.5 0 01-1.5 1.5H4" +
            "a1.5 1.5 0 01-1.5-1.5v-7A1.5 1.5 0 014 5M13.5 9l4-2.5v7l-2.2-1.4M3 3" +
            "l14 14",
        },
      ],
    ],
  },
  /** Settings: a cog with teeth, on its own 24 × 24 grid at 2 px (1.67 px at 20). */
  cog: {
    viewBox: "0 0 24 24",
    svg: { ...LINE, strokeWidth: 2 },
    parts: [
      [
        "path",
        {
          d:
            "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0" +
            "l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1" +
            "a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73" +
            "l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25" +
            "a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18" +
            "a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73" +
            "l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5" +
            "a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38" +
            "a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4" +
            "a2 2 0 0 0-2-2z",
        },
      ],
      ["circle", { cx: "12", cy: "12", r: "3" }],
    ],
  },
  /** The sound plays: a speaker with its waves. */
  volume: {
    svg: BUTTON,
    parts: [
      ["path", { d: SPEAKER }],
      ["path", { d: "M13.5 7.5a3.5 3.5 0 010 5M15.5 5.5a6.5 6.5 0 010 9" }],
    ],
  },
  /** Muted, or no sound: the speaker, crossed. */
  "volume-off": {
    svg: BUTTON,
    parts: [
      ["path", { d: SPEAKER }],
      ["path", { d: "M13.5 8l4 4M17.5 8l-4 4" }],
    ],
  },
  /** A screen's sound playing: the speaker with one wave. */
  sound: {
    svg: BUTTON,
    parts: [
      ["path", { d: SPEAKER }],
      ["path", { d: "M13.5 7.5a3.5 3.5 0 010 5" }],
    ],
  },
  /** My mic: a mic always means my own. */
  mic: {
    svg: BUTTON,
    parts: [
      ["rect", { x: "7.5", y: "2.5", width: "5", height: "9", rx: "2.5" }],
      ["path", { d: "M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5" }],
    ],
  },
  /** My mic muted, or none: the mic, crossed. */
  "mic-off": {
    svg: BUTTON,
    parts: [
      [
        "path",
        {
          d:
            "M12.5 8.5v-3.5a2.5 2.5 0 00-5 0v4.5a2.5 2.5 0 003.6 2.2M4.5 9.5" +
            "a5.5 5.5 0 008.6 4.5M15.3 11.2a5.6 5.6 0 00.2-1.7M10 15v2.5M3 3l14 14",
        },
      ],
    ],
  },
  /** Someone's voice, heard: a speaking head. */
  voice: {
    svg: BUTTON,
    parts: [
      ["circle", { cx: "8", cy: "7", r: "3" }],
      ["path", { d: HEAD }],
      ["path", { d: "M13.8 4.6a3.6 3.6 0 010 4.8M16.3 2.8a6.6 6.6 0 010 8.4" }],
    ],
  },
  /** Someone's voice, muted or not there: the speaking head, its waves crossed. */
  "voice-off": {
    svg: BUTTON,
    parts: [
      ["circle", { cx: "8", cy: "7", r: "3" }],
      ["path", { d: HEAD }],
      ["path", { d: "M13.5 5l4 4M17.5 5l-4 4" }],
    ],
  },
  /** The window or tab being shared. */
  window: {
    svg: BUTTON,
    parts: [
      ["rect", { x: "2.5", y: "4", width: "11", height: "8", rx: "1.2" }],
      ["path", { d: "M6.5 16h11v-8" }],
    ],
  },
  /** Closes a panel. */
  close: { svg: BUTTON, parts: [["path", { d: "M5 5l10 10M15 5L5 15" }]] },
  /** A screen, small: what someone shares, in a list. */
  "stream-screen": { parts: [["path", { d: MONITOR, ...SMALL }]] },
  /** A camera, small: what someone shares, in a list. */
  "stream-camera": { parts: [["path", { d: CAMERA, ...SMALL }]] },
  /** Someone came in: a door with an arrow in. */
  joined: { parts: [["path", { d: "M8 10h9M13 6l4 4-4 4M8 3H4v14h4", ...SMALL }]] },
  /** Someone left: a door with an arrow out. */
  left: { parts: [["path", { d: "M17 10H8M12 6l-4 4 4 4M12 3h4v14h-4", ...SMALL }]] },
  /** Back after a dropped connection: a turning arrow. */
  reconnected: { parts: [["path", { d: "M16 6a7 7 0 1 0 1.5 6M16 2.5V6h-3.5", ...SMALL }]] },
  /** Swap two pictures: two arrows, opposite ways. */
  swap: { parts: [["path", { d: SWAP, ...SMALL }]] },
  /** Fill the screen: four corners pointing out. */
  "fullscreen-enter": {
    parts: [
      [
        "path",
        {
          d: "M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
        },
      ],
    ],
  },
  /** Leave the full screen: four corners pointing in. */
  "fullscreen-exit": {
    parts: [
      [
        "path",
        {
          d: "M8 3v5H3M17 8h-5V3M12 17v-5h5M3 12h5v5",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
        },
      ],
    ],
  },
  /** The facecam: a camera with a filled lens. */
  facecam: {
    parts: [
      [
        "rect",
        {
          x: "3",
          y: "5",
          width: "10",
          height: "10",
          rx: "2",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.8",
        },
      ],
      ["path", { d: "M13 9l4-2v6l-4-2z", fill: "currentColor" }],
    ],
  },
  /** Make small: one line. */
  minimize: {
    parts: [
      ["path", { d: "M5 10h10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }],
    ],
  },
  /** Who's here: two people. */
  people: {
    parts: [
      ["circle", { cx: "7.5", cy: "7", r: "3", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }],
      [
        "path",
        {
          d: "M2 16c.6-2.8 2.8-4.3 5.5-4.3S12.4 13.2 13 16",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.6",
          strokeLinecap: "round",
        },
      ],
      ["circle", { cx: "14", cy: "6.5", r: "2.4", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }],
      [
        "path",
        {
          d: "M14.5 11.3c1.9.3 3.1 1.6 3.5 3.7",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round",
        },
      ],
    ],
  },
  /** What happened lately: a bell. */
  bell: {
    parts: [
      [
        "path",
        {
          d: "M5 13V9a5 5 0 0 1 10 0v4l1.5 2h-13zM8 17a2 2 0 0 0 4 0",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.6",
          strokeLinejoin: "round",
        },
      ],
    ],
  },
  /** Opens a list: an arrow down, fine. */
  chevron: { viewBox: "0 0 12 12", parts: [["path", { d: "M3 4.5L6 7.5L9 4.5", ...LINE, strokeWidth: "1.5" }]] },
  /** Opens a list: an arrow down, a touch heavier. */
  "chevron-bold": {
    viewBox: "0 0 12 12",
    parts: [
      [
        "path",
        { d: "M3 4.5 6 7.5l3-3", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" },
      ],
    ],
  },
} as const satisfies Record<string, IconDrawing>;
