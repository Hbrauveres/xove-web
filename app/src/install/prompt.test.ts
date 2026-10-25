import { describe, expect, it, vi } from "vitest";
import { installPrompt, listenForInstall, onInstalled, resetInstallPrompt } from "./prompt";

/** Chrome's install prompt event, as far as the page sees it. */
function promptEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void> };
  event.prompt = vi.fn(async () => {});
  return event;
}

describe("the browser's install prompt (spec 0171)", () => {
  it("keeps the prompt, so the Get Xovê button can open it later", () => {
    listenForInstall();
    expect(installPrompt()).toBeNull();
    const event = promptEvent();
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(installPrompt()).toBe(event);
  });

  it("says when the app was installed, and forgets the used prompt", () => {
    listenForInstall();
    window.dispatchEvent(promptEvent());
    const seen = vi.fn();
    const stop = onInstalled(seen);
    window.dispatchEvent(new Event("appinstalled"));
    expect(seen).toHaveBeenCalledTimes(1);
    expect(installPrompt()).toBeNull();
    stop();
    window.dispatchEvent(new Event("appinstalled"));
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it("resets to not listening: nothing kept, nobody told, and listening starts again", () => {
    listenForInstall();
    const seen = vi.fn();
    onInstalled(seen);
    resetInstallPrompt();
    window.dispatchEvent(promptEvent());
    window.dispatchEvent(new Event("appinstalled"));
    expect(installPrompt()).toBeNull();
    expect(seen).not.toHaveBeenCalled();
    listenForInstall();
    const event = promptEvent();
    window.dispatchEvent(event);
    expect(installPrompt()).toBe(event);
  });
});
