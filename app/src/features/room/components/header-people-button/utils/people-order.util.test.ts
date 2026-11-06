import { describe, expect, it } from "vitest";
import type { Friend } from "../../../types/room-view.types";
import { peopleOrder } from "./people-order.util";

const person = (id: string): Friend => ({ id, name: id, hue: 0, online: true });

describe("the people's order", () => {
  it("puts the sharers first, in the order they started, then me, then everyone else", () => {
    const people = ["me", "diego", "ana", "bruno"].map(person);
    const sharing = { bruno: { screen: true, camera: false }, ana: { screen: false, camera: true } };
    expect(peopleOrder(people, "me", sharing).map((p) => p.id)).toEqual(["bruno", "ana", "me", "diego"]);
  });

  it("keeps me with the sharers when I share", () => {
    const people = ["me", "diego"].map(person);
    expect(peopleOrder(people, "me", { me: { screen: true, camera: false } }).map((p) => p.id)).toEqual([
      "me",
      "diego",
    ]);
  });
});
