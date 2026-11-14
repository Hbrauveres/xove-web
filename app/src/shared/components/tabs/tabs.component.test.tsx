import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { toastStore } from "@shared/stores/toast-store";
import { Tabs } from "./tabs.component";
import type { TabItem } from "@shared/types/tab-item.types";

type Key = "screen" | "camera" | "voice";
const NO_SCREEN = "This browser can't share a screen";

function Holder({ screenUsable = true, live = [] as Key[] }) {
  const tabs: TabItem<Key>[] = [
    {
      key: "screen",
      label: "Screen",
      icon: "screen-share",
      live: live.includes("screen"),
      unavailable: screenUsable ? undefined : { reason: NO_SCREEN, icon: "screen-off" },
    },
    { key: "camera", label: "Camera", icon: "camera-on", live: live.includes("camera") },
    { key: "voice", label: "Voice", icon: "mic", live: live.includes("voice") },
  ];
  const [chosen, setChosen] = useState<Key>(screenUsable ? "screen" : "camera");
  return <Tabs tabs={tabs} chosen={chosen} onChoose={setChosen} panel={(k) => <p>{k} settings</p>} />;
}

describe("tabs", () => {
  it("are tabs, the chosen one selected, each usable one with its panel", () => {
    render(<Holder />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Screen", "Camera", "Voice"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Screen" })).toHaveTextContent("screen settings");
  });

  it("draw every panel in one cell, only the chosen one seen and reachable", async () => {
    render(<Holder />);
    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(3);
    const hidden = [...panels].filter((p) => p.getAttribute("aria-hidden") === "true");
    expect(hidden).toHaveLength(2);
    hidden.forEach((p) => expect(p).toHaveAttribute("inert"));
    await userEvent.click(screen.getByRole("tab", { name: "Camera" }));
    expect(screen.getByRole("tabpanel", { name: "Camera" })).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("tab", { name: "Camera" })).toHaveAttribute("aria-selected", "true");
  });

  it("grey one that can't be used in place, saying why, with no panel; a click leaves the choice", async () => {
    render(<Holder screenUsable={false} />);
    const tab = screen.getByRole("tab", { name: "Screen" });
    expect(tab).toHaveAttribute("aria-disabled", "true");
    expect(tab).toHaveAccessibleDescription(NO_SCREEN);
    await userEvent.click(tab);
    expect(screen.getByRole("tab", { name: "Camera" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tabpanel", { name: "Screen" })).not.toBeInTheDocument();
  });

  it("say why in a toast when a finger touches one that can't be used", () => {
    render(<Holder screenUsable={false} />);
    const tab = screen.getByRole("tab", { name: "Screen" });
    fireEvent.pointerDown(tab, { pointerType: "touch" });
    fireEvent.click(tab);
    expect(toastStore.current()?.text).toBe(NO_SCREEN);
  });

  it("mark what's live with the dot, which assistive tech doesn't hear", () => {
    render(<Holder live={["camera"]} />);
    expect(screen.getByRole("tab", { name: "Camera" }).querySelector('[aria-hidden="true"]:not(svg)')).not.toBeNull();
    expect(screen.getByRole("tab", { name: "Screen" }).querySelector('[aria-hidden="true"]:not(svg)')).toBeNull();
  });

  it("take one stop of the Tab key, the arrows moving the choice and the focus", async () => {
    render(<Holder />);
    const list = screen.getByRole("tablist");
    expect(
      within(list)
        .getAllByRole("tab")
        .filter((t) => t.tabIndex === 0),
    ).toHaveLength(1);
    screen.getByRole("tab", { name: "Screen" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Voice" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Voice" })).toHaveAttribute("aria-selected", "true");
  });
});
