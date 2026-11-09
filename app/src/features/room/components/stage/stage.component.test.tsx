import { act, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import type { StreamControls } from "@features/room/types/stream-controls.types";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { aRoomSession } from "../../../../testing/factories/room-session.factory";
import { useStage } from "../../hooks/use-stage.hook";
import { RoomSessionContext } from "../../stores/room-session";
import type { Sharer } from "../../types/room-view.types";
import { Stage } from "./stage.component";
import { installFakeApi, someoneSharing } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { REPORT_RETRY_MS, REPORT_STILL_MS } from "../../stores/room-session/constants/watch-report.constants";
import {
  member,
  pass,
  minutesAgo,
  connected,
  renderStage,
  readyRoom,
  startSharing,
} from "../../../../testing/factories/stage-steps.factory";
/** The stage as the room shows it: its pick kept by the room's own hook, the settings open. */
function Room({ sharers, controls = aStreamControls() }: { sharers: Sharer[]; controls?: StreamControls }) {
  const stage = useStage(sharers);
  return (
    <RoomSessionContext.Provider
      value={aRoomSession({ stage: { sharers, stage, controls }, settings: { open: true } })}
    >
      <Stage />
    </RoomSessionContext.Provider>
  );
}

const stage = () => screen.getByRole("region", { name: "Shared screen" });

describe("the stage", () => {
  it("stands by with nobody live, with the settings in its corner and fullscreen", () => {
    render(<Room sharers={[]} />);
    expect(within(stage()).getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("plays the person sharing longest, with what I hear from them", () => {
    render(<Room sharers={[aSharer({ hasSound: true })]} />);
    expect(within(stage()).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
  });

  it("holds the settings panel inside the player, so it comes along in fullscreen", () => {
    render(<Room sharers={[]} />);
    expect(within(stage()).getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("is 16:9 while empty and while a stream loads, then takes the picture's shape", () => {
    const shapeOf = () => Number((stage().firstElementChild as HTMLElement).style.getPropertyValue("--shape"));
    const { rerender } = render(<Room sharers={[]} />);
    expect(shapeOf()).toBeCloseTo(16 / 9);
    const bruno = aSharer();
    const screenFeed = bruno.screen!;
    rerender(
      <Room
        sharers={[
          { ...bruno, screen: { kind: "screen", startedAt: screenFeed.startedAt, settings: screenFeed.settings } },
        ]}
      />,
    );
    expect(within(stage()).getByText(/Loading Bruno's screen/)).toBeInTheDocument();
    expect(shapeOf()).toBeCloseTo(16 / 9);
    rerender(<Room sharers={[bruno]} />);
    const video = within(stage()).getByLabelText("Bruno's shared screen");
    const pictureSize = (width: number, height: number) =>
      act(() => {
        Object.defineProperty(video, "videoWidth", { configurable: true, get: () => width });
        Object.defineProperty(video, "videoHeight", { configurable: true, get: () => height });
        video.dispatchEvent(new Event("resize"));
      });
    pictureSize(1840, 1000);
    expect(shapeOf()).toBeCloseTo(1.84);
    // A portrait monitor: taller than 16:9.
    pictureSize(1080, 1920);
    expect(shapeOf()).toBeCloseTo(0.5625);
  });

  it("swaps my own screen and camera from my small view", () => {
    const me = { ...aSharer({ id: "me", kinds: ["screen", "camera"] }), isMe: true };
    const mine = (feed: NonNullable<Sharer["screen"]>) => ({
      kind: feed.kind,
      startedAt: feed.startedAt,
      settings: feed.settings,
      local: feed.remote!.video,
    });
    render(<Room sharers={[{ ...me, screen: mine(me.screen!), camera: mine(me.camera!) }]} />);
    const facecam = () => within(stage()).getByRole("application", { name: /Your/ });
    expect(within(facecam()).getByLabelText("Your camera")).toBeInTheDocument();
    act(() => within(facecam()).getByRole("button", { name: "Swap views" }).click());
    expect(within(facecam()).getByLabelText("Your shared screen")).toBeInTheDocument();
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: watching", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("plays the sharer's screen once their video arrives", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderStage();
    await connected();

    expect(await screen.findByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByText(/loading bruno's screen/i)).toBeInTheDocument();

    let track!: ReturnType<ReturnType<typeof lastRoom>["publishScreen"]>;
    act(() => {
      track = lastRoom().publishScreen("user-7");
    });

    const video = await screen.findByLabelText("Bruno's shared screen");
    expect(track.attached).toContain(video);
  });
});

describe("room: the sharer sees what they send", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("plays my own screen on the stage, without its sound", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();

    await startSharing(user);

    const video = await screen.findByLabelText("Your shared screen");
    const local = lastRoom().localParticipant;
    expect(local.screens[0]!.track.attached).toContain(video);
    // No browser picture-in-picture button over the player (Edge adds one).
    expect(video).toHaveAttribute("disablepictureinpicture");
    expect(video).toHaveProperty("muted", true);
    // My own sound would echo: it isn't played back to me.
    expect(local.screenAudio?.track.attached ?? []).toHaveLength(0);
  });
});

describe("room: what's on my stage is reported", () => {
  beforeEach(() => {
    onFakeClock();
  });

  async function anaAndBruno() {
    const server = installFakeApi({ me: member() });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderStage();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Ana's shared screen");
    return server;
  }
  const watchCalls = (server: { calls: { method: string; path: string }[] }) =>
    server.calls.filter((c) => c.method === "PUT" && c.path === "/api/streams/watching");

  it("reports whose stream is on my stage, once it settles", async () => {
    const server = await anaAndBruno();

    await pass(REPORT_STILL_MS);
    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }));
    expect(watchCalls(server)).toHaveLength(1);
  });

  it("reports nothing while the stream is still loading", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Ana Souza", 3)];
    renderStage();
    await connected();
    await screen.findByRole("heading", { name: "Ana" });

    // Longer than a report waits for stillness, and than a retry: had anything been sent, it would be by now.
    await pass(REPORT_STILL_MS + REPORT_RETRY_MS);
    expect(watchCalls(server)).toHaveLength(0);

    act(() => {
      lastRoom().publishScreen("user-3");
    });
    await pass(REPORT_STILL_MS);
    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }));
  });
});
