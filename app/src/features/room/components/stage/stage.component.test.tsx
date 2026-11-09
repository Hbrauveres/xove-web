import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StreamControls } from "@features/room/types/stream-controls.types";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { aRoomSession } from "../../../../testing/factories/room-session.factory";
import { useStage } from "../../hooks/use-stage.hook";
import { RoomSessionContext } from "../../stores/room-session";
import type { Sharer } from "../../types/room-view.types";
import { Stage } from "./stage.component";

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
