// The app's room with fake people and moving pictures, in a real browser.
// Query: ?s=live|portrait|facecam|empty (who is live),
// &mycam=portrait or #mycam (my own camera held upright),
// &page=home|request|pending|admin|waiting (the other pages, and the room's queue); &page=home&error=<code>
// shows the sign-in page's error.
// &admin=1: in the room as an admin (my menu shows Admin)
// &still=1: the pictures drawn once and held, for comparing screenshots
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import "@shared/styles/tokens.css";
import "@shared/styles/global.css";
import { AuthProvider } from "@shared/stores/auth-store";
import { AppRoutes } from "@routes/app-routes";
import { isHandheld } from "@services/media-devices-service";
import { PhoneNoticePage } from "@features/phone-notice";
import { aUser, installFakeApi, MY_USER_ID, someoneSharing } from "@testing/fakeApi";
import { FakeTrack, lastRoom, rooms } from "@testing/fakeLiveKit";
import { POLL_MS } from "@features/room/constants/room.constants";
import { installRoomPanel } from "./room";

type Scene = { w: number; h: number; draw: (c: CanvasRenderingContext2D, t: number) => void };
const scenes: Record<string, Scene> = {
  game: {
    w: 1920,
    h: 1080,
    draw(c, t) {
      const g = c.createLinearGradient(0, 0, 0, 1080);
      g.addColorStop(0, "#2b1a5a");
      g.addColorStop(0.55, "#d9576b");
      g.addColorStop(1, "#f6a95a");
      c.fillStyle = g;
      c.fillRect(0, 0, 1920, 1080);
      c.fillStyle = "#ffd27a";
      c.beginPath();
      c.arc(1300, 560 + Math.sin(t / 900) * 20, 150, 0, 7);
      c.fill();
      c.fillStyle = "#1d1430";
      c.beginPath();
      c.moveTo(0, 800);
      c.lineTo(350, 540);
      c.lineTo(620, 700);
      c.lineTo(960, 450);
      c.lineTo(1300, 720);
      c.lineTo(1920, 640);
      c.lineTo(1920, 1080);
      c.lineTo(0, 1080);
      c.fill();
    },
  },
  portraitCam: {
    w: 720,
    h: 1280,
    draw(c, t) {
      const g = c.createRadialGradient(360, 300, 50, 360, 600, 900);
      g.addColorStop(0, "#e9d9c0");
      g.addColorStop(1, "#5a4636");
      c.fillStyle = g;
      c.fillRect(0, 0, 720, 1280);
      c.fillStyle = "#2c2f3a";
      c.fillRect(250, 520, 220, 380 + Math.sin(t / 700) * 10);
      c.fillStyle = "#c58c6a";
      c.beginPath();
      c.arc(360, 450, 70, 0, 7);
      c.fill();
    },
  },
  faceCam: {
    w: 1280,
    h: 720,
    draw(c, t) {
      const g = c.createRadialGradient(900, 150, 50, 640, 360, 900);
      g.addColorStop(0, "#e9a86b");
      g.addColorStop(1, "#1c1412");
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.fillStyle = "#c58c6a";
      c.beginPath();
      c.arc(640, 330 + Math.sin(t / 600) * 6, 140, 0, 7);
      c.fill();
    },
  },
  code: {
    w: 1920,
    h: 1080,
    draw(c) {
      c.fillStyle = "#1e1f24";
      c.fillRect(0, 0, 1920, 1080);
      const cols = ["#c792ea", "#82aaff", "#c3e88d", "#f78c6c", "#89ddff", "#ffcb6b"];
      for (let i = 0; i < 24; i++) {
        c.fillStyle = cols[i % cols.length] ?? "#fff";
        c.fillRect(380 + (i % 4) * 60, 80 + i * 38, 300 + ((i * 97) % 500), 18);
      }
    },
  },
};
const STILL = new URLSearchParams(location.search).get("still") === "1";
const pictureOf = new WeakMap<object, string>();
const streamFor = new Map<string, MediaStream>();
function stream(name: string) {
  let s = streamFor.get(name);
  if (s) return s;
  const sc = scenes[name];
  if (!sc) throw new Error(`No scene called ${name}`);
  const cv = document.createElement("canvas");
  cv.width = sc.w;
  cv.height = sc.h;
  const ctx = cv.getContext("2d")!;
  // &still=1: every picture drawn once and held, so screenshots of two runs can be compared.
  const tick = (t: number) => {
    sc.draw(ctx, t);
    requestAnimationFrame(tick);
  };
  if (!STILL) requestAnimationFrame(tick);
  sc.draw(ctx, 0);
  s = cv.captureStream(24);
  streamFor.set(name, s);
  return s;
}
const attach = FakeTrack.prototype.attach;
FakeTrack.prototype.attach = function (el: HTMLMediaElement) {
  // My own camera (the settings' preview, or sending it): a face too.
  // My own screen (the picker gives a drawn page) and my own camera: pictures too.
  const source = (this as unknown as { source?: string }).source;
  // &mycam=portrait, or #mycam on a published build, where a link can't carry a query:
  // my camera is a phone's, held upright.
  const upright = new URLSearchParams(location.search).get("mycam") === "portrait" || location.hash === "#mycam";
  const myCam = upright ? "portraitCam" : "faceCam";
  const name = pictureOf.get(this) ?? (source === "camera" ? myCam : source === "screen_share" ? "code" : undefined);
  if (name && el instanceof HTMLVideoElement) {
    el.srcObject = stream(name);
    void el.play().catch(() => {});
  }
  return attach.call(this, el);
};

// The headless browser has no screen to capture: the picker returns a drawn picture.
if (navigator.mediaDevices) {
  navigator.mediaDevices.getDisplayMedia = async () => stream("code").clone();
  // Nor cameras: six to pick from in the settings and the camera's drop-up, so a list scrolls.
  // &cams=emeet: Henrique's two cameras, with long names.
  const cams = new URLSearchParams(location.search).get("cams");
  const emeet = cams === "emeet";
  // One name too long for a picker's option, cut there.
  const long =
    cams === "long" ? [{ deviceId: "cam-7", label: "Logitech BRIO Ultra HD Pro Business Webcam (046d:085e)" }] : [];
  navigator.mediaDevices.enumerateDevices = async () =>
    (emeet
      ? [
          { deviceId: "cam-1", label: "EMEET STUDIO Virtual Camera" },
          { deviceId: "cam-2", label: "EMEET PIXY (328f:00c0)" },
        ]
      : [
          { deviceId: "cam-1", label: "Webcam C920" },
          { deviceId: "cam-2", label: "MacBook Pro camera" },
          { deviceId: "cam-3", label: "OBS Virtual Camera" },
          { deviceId: "cam-4", label: "Elgato Facecam" },
          { deviceId: "cam-5", label: "Iriun Webcam" },
          { deviceId: "cam-6", label: "Continuity Camera" },
          ...long,
        ]
    )
      .map((c) => ({ ...c, kind: "videoinput", groupId: "", toJSON: () => c }))
      // And two microphones.
      .concat(
        [
          { deviceId: "mic-1", label: "Headset (USB)" },
          { deviceId: "mic-2", label: "MacBook Pro microphone" },
        ].map((m) => ({ ...m, kind: "audioinput", groupId: "", toJSON: () => m })),
      ) as MediaDeviceInfo[];
}
const params = new URLSearchParams(location.search);
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const scenario = params.get("s") ?? "empty";

// &page=: the pages other than the room, to check them on every device too.
const page = params.get("page");
const server = installFakeApi({
  me:
    page === "home"
      ? null
      : aUser({
          name: "Henrique Brauveres",
          status: page === "request" ? "NONE" : page === "pending" ? "PENDING" : "MEMBER",
          admin: page === "admin" || params.get("admin") === "1",
        }),
  ...(page === "admin"
    ? {
        requests: [
          {
            id: 1,
            name: "Marina Costa",
            email: "marina@example.com",
            avatarUrl: null,
            message: "Hi, it's Marina from the Friday games.",
            createdAt: ago(90),
          },
        ],
        members: [{ id: 2, name: "Rafa Lima", email: "rafa@example.com", avatarUrl: null, admin: false }],
      }
    : {}),
});
// The room is full: I'm second in the queue.
if (page === "waiting") server.seat = { status: "waiting", place: 2 };
server.here = [
  { userId: MY_USER_ID, since: ago(24), mine: true },
  { userId: 2, since: ago(18), mine: false },
  { userId: 3, since: ago(0.2), mine: false },
];
server.seatsInfo = { total: 20, taken: 3, waiting: 0 };
// Ana shares her camera there: she's here too, in a seat of her own.
if (scenario === "live") {
  server.here = [...server.here, { userId: 4, since: ago(2), mine: false }];
  server.seatsInfo = { ...server.seatsInfo, taken: 4 };
}
if (scenario === "live")
  server.streams = [
    someoneSharing("Marina", 2, "screen", undefined, new Date(Date.now() - 4_360_000)),
    someoneSharing("Rafa", 3, "screen", undefined, new Date(Date.now() - 2_285_000)),
    someoneSharing("Ana", 4, "camera", undefined, new Date(Date.now() - 95_000)),
  ];
// Two others watch Marina's screen: the stage's info row shows who.
if (scenario === "live")
  server.watching = [3, 4].map((userId) => ({ userId, sharerId: 2, kind: "screen" as const, mine: false }));
// Marina shares her screen and her camera: the camera is the facecam over her screen.
if (scenario === "facecam")
  server.streams = [
    someoneSharing("Marina", 2, "screen", undefined, new Date(Date.now() - 4_360_000)),
    someoneSharing("Marina", 2, "camera", undefined, new Date(Date.now() - 4_300_000)),
  ];
if (scenario === "portrait")
  server.streams = [
    someoneSharing("Matheus", 2, "camera", undefined, new Date(Date.now() - 212_000)),
    someoneSharing("Ana", 3, "camera", undefined, new Date(Date.now() - 95_000)),
  ];
/** How long a slow stream's video takes to arrive: two of the room's polls, so it has listed the stream first. */
const SLOW_VIDEO_MS = POLL_MS * 2;
const wait = () =>
  new Promise<void>((r) => {
    const go = () => (rooms.length ? r() : setTimeout(go, 50));
    go();
  });
void wait().then(() =>
  setTimeout(() => {
    const room = lastRoom();
    room.join("user-2", scenario === "portrait" ? "Matheus" : "Marina");
    room.join("user-3", scenario === "portrait" ? "Ana" : "Rafa");
    if (scenario === "live") {
      // &sound=1: Marina's screen comes with its sound (the volume mixer).
      pictureOf.set(room.publishScreen("user-2", { withSound: params.get("sound") === "1" }), "game");
      pictureOf.set(room.publishScreen("user-3"), "code");
      pictureOf.set(room.publishCamera("user-4"), "faceCam");
    }
    if (scenario === "facecam") {
      pictureOf.set(room.publishScreen("user-2"), "game");
      pictureOf.set(room.publishCamera("user-2"), "faceCam");
    }
    if (scenario === "portrait") {
      pictureOf.set(room.publishCamera("user-2", { height: 1280 }), "portraitCam");
      pictureOf.set(room.publishCamera("user-3"), "faceCam");
    }
    // For /validate: things that happen while the pointer rests on the page.
    (window as unknown as { __xove: Record<string, () => unknown> }).__xove = {
      // Everyone stops: the stage goes empty (fullscreen from the empty stage).
      everyoneStops: () => {
        for (const s of server.streams)
          room.unpublish(`user-${s.userId}`, s.kind === "camera" ? "camera" : "screen_share");
        server.streams = [];
        // The watches stay a moment, as the API's may: the app says "Watching" only for someone live.
      },
      // Marina starts sharing her screen (the room then watches her).
      marinaGoesLive: () => {
        server.streams = [...server.streams, someoneSharing("Marina", 2, "screen", undefined, new Date())];
        pictureOf.set(room.publishScreen("user-2"), "game");
      },
      // Marina starts sharing, her video on its way for a moment (the stage's "Loading…" while it starts).
      marinaGoesLiveSlowly: () => {
        server.streams = [...server.streams, someoneSharing("Marina", 2, "screen", undefined, new Date())];
        setTimeout(() => pictureOf.set(room.publishScreen("user-2"), "game"), SLOW_VIDEO_MS);
      },
      // How many times the room was asked to start its sound (LiveKit's startAudio, after a click).
      soundStarts: () => room.startAudio.mock.calls.length,
    };
    // My mic: a real, quiet test tone that rises and falls like speech, so its level moves.
    const createTracks = room.localParticipant.createTracks;
    room.localParticipant.createTracks = (async (options?: { video?: unknown; audio?: unknown }) => {
      const tracks = await createTracks(options);
      if (options?.audio && !options.video && typeof AudioContext !== "undefined") {
        const ctx = new AudioContext();
        const tone = ctx.createOscillator();
        const gain = ctx.createGain();
        const out = ctx.createMediaStreamDestination();
        tone.frequency.value = 220;
        tone.connect(gain).connect(out);
        tone.start();
        let t = 0;
        setInterval(() => {
          t += 1;
          gain.gain.value = 0.02 + 0.12 * Math.abs(Math.sin(t / 3)) * (t % 9 < 6 ? 1 : 0.1);
        }, 80);
        const sent = out.stream.getAudioTracks()[0];
        if (sent) (tracks[0] as unknown as { mediaStreamTrack: MediaStreamTrack }).mediaStreamTrack = sent;
      }
      return tracks;
    }) as typeof createTracks;
    // My voice, heard: while my mic is on, I talk in phrases with pauses, and the room reports me among
    // its active speakers, as LiveKit does (only when that changes). The app reads only the others'
    // speaking today; this is here for when it shows mine.
    let beat = 0;
    setInterval(() => {
      beat = (beat + 1) % 12;
      const me = room.localParticipant as unknown as { identity: string; mic: unknown; isSpeaking?: boolean };
      const speaking = Boolean(me.mic) && beat < 7 && beat !== 3;
      if (me.isSpeaking === speaking) return;
      me.isSpeaking = speaking;
      const others = [...room.remoteParticipants.values()].filter((p) => p.isSpeaking);
      room.emit("activeSpeakersChanged", speaking ? [...others, me] : others);
    }, 300);
    // The room panel: set the states and play the other people from the page itself.
    installRoomPanel(server, room, (track, name) => pictureOf.set(track, name));
  }, 300),
);

// As the app's root: a phone or a tablet (touch emulated by the browser) gets only the notice.
createRoot(document.getElementById("root")!).render(
  isHandheld() ? (
    <PhoneNoticePage />
  ) : (
    <MemoryRouter
      initialEntries={[
        {
          home: params.get("error") ? `/?error=${params.get("error")}` : "/",
          request: "/request-access",
          pending: "/request-access",
          admin: "/admin",
        }[page ?? ""] ?? "/room",
      ]}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  ),
);
