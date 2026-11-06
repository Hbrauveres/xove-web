import { expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { hasRow } from "./has-row.util";

it("gives a row to anyone else's preview, and to mine only when I share both", () => {
  expect(hasRow(aSharer())).toBe(true);
  expect(hasRow(aSharer({ isMe: true }))).toBe(false);
  expect(hasRow(aSharer({ isMe: true, kinds: ["screen", "camera"] }))).toBe(true);
});
