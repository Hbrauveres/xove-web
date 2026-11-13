import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Tabs } from "./tabs.component";
import type { TabItem } from "./types/tabs.types";

type Key = "screen" | "camera" | "voice";

/** The settings' three tabs, on a panel. */
function Example({ live = [] as Key[], screenUsable = true }) {
  const tabs: TabItem<Key>[] = [
    {
      key: "screen",
      label: "Screen",
      icon: "screen-share",
      live: live.includes("screen"),
      unavailable: screenUsable ? undefined : { reason: "This browser can't share a screen", icon: "screen-off" },
    },
    { key: "camera", label: "Camera", icon: "camera-on", live: live.includes("camera") },
    { key: "voice", label: "Voice", icon: "mic", live: live.includes("voice") },
  ];
  const [chosen, setChosen] = useState<Key>(screenUsable ? "screen" : "camera");
  return (
    <div style={{ width: 300, padding: "var(--space-2-5)", background: "var(--panel)", color: "var(--text)" }}>
      <Tabs
        tabs={tabs}
        chosen={chosen}
        onChoose={setChosen}
        panel={(k) => <p style={{ margin: "var(--space-3) 0", fontSize: "var(--text-xs)" }}>The {k} settings.</p>}
      />
    </div>
  );
}

const meta = {
  title: "Shared/Tabs",
  component: Example,
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three tabs, the first chosen. */
export const Default: Story = {};
/** The live dot on what's live. */
export const Live: Story = { args: { live: ["screen", "voice"] } };
/** One that can't be used here, greyed in place. */
export const Unavailable: Story = { args: { screenUsable: false } };
