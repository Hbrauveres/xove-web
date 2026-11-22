// Starting a stream as a person does: my own button on the stage when it's there (I'm already live),
// otherwise Go live's menu (nobody live, or watching someone).
import type { Page } from "@playwright/test";
import { stageOf } from "./stage.ts";

const WORDS = { screen: "Share your screen", camera: "Turn on your camera" } as const;

/** Starts my screen or my camera from the stage. */
export async function startMine(page: Page, kind: keyof typeof WORDS): Promise<void> {
  const name = WORDS[kind];
  const own = stageOf(page).getByRole("button", { name, exact: true });
  if (await own.count()) return own.first().click();
  await stageOf(page).getByRole("button", { name: "Go live" }).click();
  await page.getByRole("menuitem", { name }).click();
}
