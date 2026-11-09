import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import { StageInfo } from "./stage-info.component";

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
});
