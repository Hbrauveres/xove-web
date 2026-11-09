import { render, renderHook, screen, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { aMe, aSharer } from "../../../../testing/factories/sharer.factory";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import { StageInfo } from "./stage-info.component";
import { installFakeApi, someoneSharing } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { REPORT_STILL_MS } from "../../stores/room-session/constants/watch-report.constants";
import { member, pass, connected, renderStage } from "../../../../testing/factories/stage-steps.factory";
describe("the row under the stage", () => {
  it("says who's on the stage, and holds the other streams", () => {
    const sharers = [aSharer(), aSharer({ id: "user-3", name: "Ana", kinds: ["camera"] })];
    const stage = renderHook(() => useStage(sharers)).result.current;
    const hearing = renderHook(() => useHearing(sharers, stage.big?.person.id ?? null)).result.current;
    render(<StageInfo sharers={sharers} stage={stage} hearing={hearing} places={6} free={4} />);
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Also live" })).toBeInTheDocument();
  });

  it("rings the face on the stage green only when it's mine and my voice is sent", () => {
    const mine = [aSharer({ isMe: true })];
    const stage = renderHook(() => useStage(mine)).result.current;
    const hearing = renderHook(() => useHearing(mine, stage.big?.person.id ?? null)).result.current;
    const { container, rerender } = render(
      <StageInfo sharers={mine} stage={stage} hearing={hearing} places={6} free={5} meTalking />,
    );
    expect(container.querySelector("[data-talking]")).not.toBeNull();
    const theirs = [aSharer()];
    const theirStage = renderHook(() => useStage(theirs)).result.current;
    rerender(<StageInfo sharers={theirs} stage={theirStage} hearing={hearing} places={6} free={5} meTalking />);
    expect(container.querySelector("[data-talking]")).toBeNull();
  });

  it("hands my speaking to my own preview while someone else is on the stage", () => {
    const sharers = [aSharer(), aMe()];
    const stage = renderHook(() => useStage(sharers)).result.current;
    const hearing = renderHook(() => useHearing(sharers, stage.big?.person.id ?? null)).result.current;
    render(<StageInfo sharers={sharers} stage={stage} hearing={hearing} places={6} free={4} meTalking />);
    const mine = screen.getByRole("button", { name: /^Watch You/ }).closest("li");
    expect(mine).toHaveAttribute("data-talking");
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: under the stage", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("shows who's watching the stage: me included, never the sharer", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    // Ana watches Bruno; Bruno's own stage shows himself, which doesn't count.
    server.watching = [
      { userId: 3, sharerId: 7, kind: "screen", mine: false },
      { userId: 7, sharerId: 7, kind: "screen", mine: false },
    ];
    renderStage();
    await connected();
    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
      lastRoom().publishScreen("user-7");
    });

    expect(
      await screen.findByText((_, el) => el?.textContent?.endsWith("1 watching") === true && el.children.length === 3),
    ).toBeInTheDocument();
    // Once my stage is reported (after a second of stillness), I count too.
    await pass(REPORT_STILL_MS);
    expect(
      await screen.findByText((_, el) => el?.textContent?.endsWith("2 watching") === true && el.children.length === 3),
    ).toBeInTheDocument();
  });

  it("invites someone to go live on an empty stage, naming who's here", async () => {
    installFakeApi({ me: member() });
    renderStage();
    await connected();
    expect(await screen.findByText("Nobody else is here yet.")).toBeInTheDocument();

    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
    });

    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(await screen.findByText("Ana and Bruno are here.")).toBeInTheDocument();
  });
});
