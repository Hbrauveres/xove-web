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
    render(<StageInfo sharers={sharers} stage={stage} hearing={hearing} free={4} />);
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Also live" })).toBeInTheDocument();
  });
});
