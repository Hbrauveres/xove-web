import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { START } from "../../../core/livekit/constants/livekit.constants";
import { aLiveStream, anAnswer } from "../../../test/factories/streams-state.factory";
import { initialRoom, withMe, withStreams, withVideo } from "../state/room.model";
import { useRoomView } from "./use-room-view.hook";

const AT = Date.parse("2026-10-29T10:05:00Z");

describe("what the room shows", () => {
  it("lists me first and knows which of my streams are live", () => {
    let model = withMe(initialRoom(), "user-7", "Henrique Brauveres");
    model = withVideo(model, [{ identity: "user-2", name: "Marina Souza" }], "connected", AT);
    model = withStreams(model, anAnswer({ streams: [aLiveStream({ userId: 7, mine: true })] }), AT);

    const view = renderHook(() => useRoomView(model, START, "Henrique Brauveres")).result.current;

    expect(view.people.map((p) => p.name)).toEqual(["Henrique", "Marina"]);
    expect(view.myLive).toEqual({ screen: true, camera: false });
    expect(view.sharers.map((s) => s.isMe)).toEqual([true]);
  });

  it("shows me with my account's name before the room names me", () => {
    const view = renderHook(() => useRoomView(initialRoom(), START, "Henrique Brauveres")).result.current;
    expect(view.me.name).toBe("Henrique");
    expect(view.people[0]?.name).toBe("Henrique");
  });

  it("gives the same value while nothing changes", () => {
    const model = withMe(initialRoom(), "user-7", "Henrique");
    const hook = renderHook(() => useRoomView(model, START, "Henrique"));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
