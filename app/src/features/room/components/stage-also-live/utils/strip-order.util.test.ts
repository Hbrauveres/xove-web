import { expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { stripOrder } from "./strip-order.util";

it("lists the newest first, so a stream that starts enters at the far end and moves none already there", () => {
  const rafa = aSharer({ since: 1_000 });
  const ana = aSharer({ since: 3_000 });
  const bruno = aSharer({ since: 9_000 });
  expect(stripOrder([rafa, ana])).toEqual([ana, rafa]);
  // Bruno starts: he comes first; Ana and Rafa keep their order beside the places.
  expect(stripOrder([rafa, ana, bruno])).toEqual([bruno, ana, rafa]);
});
