// The room panel: a tab at the right edge that sets the app's state and makes the
// fake people enter, leave and start or stop their screen and camera, so a published build of
// the harness can be clicked through without the query string. Hidden with ?panel=0 (screenshots).
import { MY_USER_ID, someoneSharing } from "@testing/fakeApi";
import type { Room as FakeRoom } from "@testing/fakeLiveKit";

type Server = {
  streams: ReturnType<typeof someoneSharing>[];
  here?: { userId: number; since: string; mine: boolean }[] | undefined;
  seatsInfo?: { total: number; taken: number; waiting: number } | undefined;
};
type Kind = "screen" | "camera";
const PEOPLE: Record<number, { name: string; screen: string; camera: string }> = {
  2: { name: "Marina", screen: "game", camera: "faceCam" },
  3: { name: "Rafa", screen: "code", camera: "faceCam" },
  4: { name: "Ana", screen: "code", camera: "faceCam" },
  5: { name: "Bruno", screen: "game", camera: "faceCam" },
};
const SOURCE = { screen: "screen_share", camera: "camera" } as const;
// Who talks when: a beat every 260 ms, each person on their own pattern.
const TALK = [
  [1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1],
  [0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0],
  [1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1],
];

/** How loud a fake voice speaks: well over the room's line for "speaking". */
const SPEAKING_GAIN = 0.3;
/** Over this, a voice's tone is sounding (its silence is exactly 0). */
const SOUNDING = 0.01;
let audio: AudioContext | null = null;
let ears: AudioContext | null = null;

/** A tone for one person's voice, silent until the beat says they speak; `level` reads it as it sounds. */
function speaker(id: number): { track: MediaStreamTrack; gain: GainNode; level: () => number } | undefined {
  if (typeof AudioContext === "undefined") return undefined;
  audio ??= new AudioContext();
  const tone = audio.createOscillator();
  tone.frequency.value = 180 + id * 40;
  const gain = audio.createGain();
  gain.gain.value = 0;
  const out = audio.createMediaStreamDestination();
  tone.connect(gain).connect(out);
  tone.start();
  const [track] = out.stream.getAudioTracks();
  if (!track) return undefined;
  // The voice as a listener gets it: its published track, through a context of its own, as the app
  // reads it and as its audio element plays it (the same buffering, the same delay).
  ears ??= new AudioContext();
  const ear = ears.createAnalyser();
  ears.createMediaStreamSource(new MediaStream([track])).connect(ear);
  const samples = new Float32Array(ear.fftSize);
  const level = () => {
    ear.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  };
  return { track, gain, level };
}

export function installRoomPanel(server: Server, room: FakeRoom, picture: (track: object, name: string) => void) {
  if (new URLSearchParams(location.search).get("panel") === "0") return;
  const identity = (id: number) => `user-${id}`;
  const here = (id: number) => (server.here ?? []).some((h) => h.userId === id);
  const live = (id: number, kind: Kind) => server.streams.some((s) => s.userId === id && s.kind === kind);
  const voiced = new Set<number>();
  const talking = (id: number) => voiced.has(id);
  // Each voice really speaks: a tone whose loudness follows the person's pattern, so the app hears
  // (and measures) what it plays.
  const sounds = new Map<number, { gain: GainNode; on: boolean }>();
  const levels = new Map<string, () => number>();
  // Whether a voice sounds now, as the page's audio plays it (what a listener hears, this frame).
  (window as unknown as { __xoveSounding: (who: string) => boolean }).__xoveSounding = (who) =>
    (levels.get(who)?.() ?? 0) > SOUNDING;
  function voice(id: number, on: boolean) {
    if (on === voiced.has(id)) return;
    if (on) {
      if (!live(id, "screen") && !live(id, "camera")) return; // a voice comes with a screen or a camera
      voiced.add(id);
      const sound = speaker(id);
      room.publishVoice(identity(id), sound?.track);
      if (sound) {
        sounds.set(id, { gain: sound.gain, on: false });
        levels.set(identity(id), sound.level);
      }
    } else {
      voiced.delete(id);
      sounds.get(id)?.gain.gain.setValueAtTime(0, 0);
      sounds.delete(id);
      levels.delete(identity(id));
      room.unpublish(identity(id), "microphone");
    }
  }
  let beat = 0;
  setInterval(() => {
    beat = (beat + 1) % 16;
    for (const id of voiced) {
      // Only the sound says who speaks: the video server's own guess isn't sent (the app doesn't read it).
      const on = Boolean(TALK[id % 3]?.[(beat + id * 5) % 16]);
      const sound = sounds.get(id);
      if (sound && sound.on !== on) {
        sound.gain.gain.setValueAtTime(on ? SPEAKING_GAIN : 0, sound.gain.context.currentTime);
        sound.on = on;
      }
    }
  }, 260);
  const seats = () => {
    if (server.seatsInfo) server.seatsInfo = { ...server.seatsInfo, taken: (server.here ?? []).length };
  };

  function enter(id: number) {
    if (here(id)) return;
    room.join(identity(id), PEOPLE[id]?.name ?? `Person ${id}`);
    server.here = [...(server.here ?? []), { userId: id, since: new Date().toISOString(), mine: false }];
    seats();
  }
  function leave(id: number) {
    if (!here(id)) return;
    set(id, "screen", false);
    set(id, "camera", false);
    room.leave(identity(id));
    server.here = (server.here ?? []).filter((h) => h.userId !== id);
    seats();
  }
  function set(id: number, kind: Kind, on: boolean) {
    if (on === live(id, kind)) return;
    if (on) {
      if (server.streams.length >= 6) return;
      enter(id);
      server.streams = [
        ...server.streams,
        someoneSharing(PEOPLE[id]?.name ?? `Person ${id}`, id, kind, undefined, new Date()),
      ];
      const track =
        kind === "screen" ? room.publishScreen(identity(id), { withSound: true }) : room.publishCamera(identity(id));
      picture(track, PEOPLE[id]?.[kind] ?? "faceCam");
    } else {
      room.unpublish(identity(id), SOURCE[kind]);
      server.streams = server.streams.filter((s) => !(s.userId === id && s.kind === kind));
      if (!live(id, "screen") && !live(id, "camera")) voice(id, false);
    }
  }
  // My own streams go through the app's own buttons, as a click would.
  const LABELS: Record<Kind, { start: string[]; stop: string[] }> = {
    screen: { start: ["Share your screen"], stop: ["Stop sharing your screen"] },
    camera: { start: ["Turn on your camera"], stop: ["Turn off your camera"] },
  };
  function mine(kind: Kind, on: boolean) {
    if (on === server.streams.some((s) => s.userId === MY_USER_ID && s.kind === kind)) return;
    for (const label of LABELS[kind][on ? "start" : "stop"]) {
      const b = document.querySelector<HTMLButtonElement>(`#root button[aria-label="${label}"]`);
      if (b && b.getAttribute("aria-disabled") !== "true") {
        b.click();
        return;
      }
    }
    // Over someone else's stream: Go live, then its menu; or the empty stage's own buttons.
    const text = on ? (kind === "screen" ? "Share your screen" : "Turn on your camera") : "";
    const byText = (t: string) =>
      [...document.querySelectorAll<HTMLButtonElement>("#root button")].find(
        (b) => b.textContent?.trim() === t && b.getAttribute("aria-disabled") !== "true",
      );
    if (on) {
      const direct = byText(text);
      if (direct) {
        direct.click();
        return;
      }
      const go = byText("Go live");
      if (go) {
        go.click();
        setTimeout(() => byText(text)?.click(), 50);
        return;
      }
    } else {
      // Stopping mine: from my own stream, where my buttons are.
      const tile = document.querySelector<HTMLButtonElement>('#root button[aria-label^="Watch your"]');
      if (tile) {
        tile.click();
        setTimeout(() => mine(kind, false), 300);
      }
    }
  }
  const watch = (name: string) =>
    document.querySelector<HTMLButtonElement>(`#root button[aria-label^="Watch ${name}"]`)?.click();
  const later = (f: () => void, ms = 2400) => setTimeout(f, ms);
  const STATES: Record<string, () => void> = {
    Watching: () => {
      mine("screen", false);
      mine("camera", false);
      for (const id of [2, 3, 4]) enter(id);
      set(2, "screen", true);
      set(2, "camera", true);
      set(3, "screen", true);
      set(4, "camera", true);
      set(4, "screen", false);
      voice(2, true);
      voice(4, true);
    },
    Sharing: () => {
      for (const id of [2, 4]) {
        set(id, "screen", false);
        set(id, "camera", false);
      }
      set(3, "screen", true);
      mine("screen", true);
      later(() => mine("camera", true), 900);
    },
    "Sharing and watching": () => {
      set(2, "screen", true);
      set(2, "camera", true);
      voice(2, true);
      mine("screen", true);
      later(() => watch("Marina"));
    },
    "Nobody live": () => {
      mine("screen", false);
      mine("camera", false);
      for (const id of [2, 3, 4, 5]) {
        set(id, "screen", false);
        set(id, "camera", false);
      }
    },
  };

  const css = `
  #xr-tab { position: fixed; right: 0; top: 50%; z-index: 2147483000; transform: translateY(-50%); writing-mode: vertical-rl; padding: 12px 7px; border: 1px solid #2c2c2f; border-right: 0; border-radius: 10px 0 0 10px; background: rgba(18,18,20,.92); color: #ebebec; font: 600 12px "IBM Plex Sans", system-ui; letter-spacing: .06em; cursor: pointer; }
  #xr-panel { position: fixed; right: 0; top: 50%; z-index: 2147483001; transform: translateY(-50%); width: 300px; max-height: 92vh; overflow: auto; padding: 14px; border: 1px solid #2c2c2f; border-right: 0; border-radius: 14px 0 0 14px; background: rgba(18,18,20,.96); backdrop-filter: blur(16px); color: #ebebec; font: 13px "IBM Plex Sans", system-ui; box-shadow: 0 10px 40px rgba(0,0,0,.6); display: none; }
  #xr-panel.open { display: block; }
  #xr-panel h3 { margin: 0 0 10px; font: 800 15px "Bricolage Grotesque", system-ui; display: flex; justify-content: space-between; align-items: center; }
  #xr-panel h4 { margin: 14px 0 6px; font: 500 10.5px "IBM Plex Mono", monospace; letter-spacing: .1em; text-transform: uppercase; color: #66666b; }
  #xr-panel button { height: 28px; padding: 0 9px; border: 1px solid #2c2c2f; border-radius: 8px; background: #161617; color: #ebebec; font: 12px "IBM Plex Sans", system-ui; cursor: pointer; }
  #xr-panel button:hover { background: #1b1b1d; }
  #xr-panel button[aria-pressed="true"] { background: #ef4b4b; border-color: #ef4b4b; color: #3a0808; }
  #xr-panel .row { display: grid; grid-template-columns: 54px 1fr 1fr 1fr 1fr; gap: 4px; align-items: center; margin-bottom: 5px; }
  #xr-panel { width: 340px; }
  #xr-panel .states { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  #xr-panel .x { border: 0; background: transparent; font-size: 18px; color: #9a9a9f; height: auto; }
  #xr-panel p { margin: 10px 0 0; font-size: 11.5px; color: #9a9a9f; line-height: 1.45; }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  const tab = document.createElement("button");
  tab.id = "xr-tab";
  tab.textContent = "Room";
  const panel = document.createElement("div");
  panel.id = "xr-panel";
  document.body.append(tab, panel);
  tab.onclick = () => panel.classList.add("open");

  function paint() {
    panel.innerHTML = `<h3>Room <button class="x" data-x aria-label="Close">×</button></h3>
      <h4>App state</h4><div class="states">${Object.keys(STATES)
        .map((s) => `<button data-state="${s}">${s}</button>`)
        .join("")}</div>
      <h4>People</h4>${Object.entries(PEOPLE)
        .map(
          ([id, p]) => `<div class="row"><b>${p.name}</b>
        <button data-here="${id}" aria-pressed="${here(+id)}">${here(+id) ? "Here" : "Away"}</button>
        <button data-kind="screen" data-id="${id}" aria-pressed="${live(+id, "screen")}">Screen</button>
        <button data-kind="camera" data-id="${id}" aria-pressed="${live(+id, "camera")}">Camera</button>
        <button data-voice="${id}" aria-pressed="${talking(+id)}" ${live(+id, "screen") || live(+id, "camera") ? "" : "disabled"}>Voice</button></div>`,
        )
        .join("")}
      <p>${server.streams.length} of 6 live · ${(server.here ?? []).length} here. Your own screen, camera and voice are the app's buttons. A voice comes with a screen or a camera; it talks on its own pattern. The app catches up within 2 s, as it polls the room.</p>`;
  }
  panel.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (!b) return;
    if (b.dataset.x !== undefined) {
      panel.classList.remove("open");
      return;
    }
    if (b.dataset.state) STATES[b.dataset.state]?.();
    if (b.dataset.here) {
      const id = +b.dataset.here;
      if (here(id)) leave(id);
      else enter(id);
    }
    if (b.dataset.kind) {
      const id = +b.dataset.id!;
      const kind = b.dataset.kind as Kind;
      set(id, kind, !live(id, kind));
    }
    if (b.dataset.voice) {
      const id = +b.dataset.voice;
      voice(id, !voiced.has(id));
    }
    paint();
  });
  setInterval(() => panel.classList.contains("open") && paint(), 1000);
  paint();
}
