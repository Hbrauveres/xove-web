import { act, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { Stage } from "@features/room/components/stage";
import { aUser } from "../fakeApi";
import { clockUser } from "./clock.factory";
import { renderInRoom } from "./room-render.factory";

/** What a person does on the stage, for the stage's wiring tests: each step as a person takes it. */

export type User = ReturnType<typeof clockUser>;
export type MenuKind = "Screen" | "Camera" | "Voice";

/** A member who may enter the room. */
export const member = () => aUser({ name: "Henrique Brauveres", status: "MEMBER" });

/** Moves the fake clock on, and lets what was waiting on it happen. */
export const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** A time some minutes before now, on the fake clock. */
export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** The stage: the picture, and my screen and camera buttons on it. */
export const stage = () => screen.getByRole("region", { name: /shared screen/i });

/** The stage shows once I'm in the room. */
export const connected = () => screen.findByRole("region", { name: /shared screen/i });

/** The stage over the real room session, on the fake API and LiveKit. */
export const renderStage = () => renderInRoom(<Stage />);

/** The room, connected, with a free stage (the seats box says "0 of 6 live": quicker than a heading by role). */
export async function readyRoom() {
  renderStage();
  await connected();
  await screen.findByLabelText("0 of 6 live, 6 seats open");
  return clockUser();
}

/** Clicks "Share your screen": the browser's picker, and the pick is sent at once. */
export async function pickScreen(user: User, button: RegExp = /share your screen/i) {
  await user.click(within(stage()).getByRole("button", { name: button }));
}

/** Picks a screen and starts sharing it, with the remembered settings. */
export async function startSharing(user: User) {
  await pickScreen(user);
  await screen.findByRole("heading", { name: "You" });
}

/** The settings panel on a tab: opened from the cog when it isn't. */
export async function openMenu(user: User, kind: MenuKind = "Screen") {
  if (!screen.queryByRole("dialog", { name: "Settings" })) {
    await user.click(within(stage()).getByRole("button", { name: "Settings" }));
  }
  const panel = within(await screen.findByRole("dialog", { name: "Settings" }));
  const tab = panel.getByRole("tab", { name: (name) => name.startsWith(kind) });
  if (tab.getAttribute("aria-selected") !== "true") await user.click(tab);
  return within(panel.getByRole("tabpanel"));
}

/** Picks a quality or mode in the settings, on that stream's tab. */
export async function pickInMenu(user: User, option: string, kind: MenuKind = "Screen") {
  await user.click((await openMenu(user, kind)).getByRole("radio", { name: option }));
}

/** The quality chosen on the settings' open tab. */
export const tickedQuality = (kind: MenuKind = "Screen") =>
  within(screen.getByRole("radiogroup", { name: `${kind} quality` }))
    .getAllByRole<HTMLInputElement>("radio")
    .find((r) => r.checked)?.value;
