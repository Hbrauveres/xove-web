import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageMoreMenu } from "./stage-more-menu.component";

const heard = { volume: 0.7, muted: false, onChange: () => undefined };

const meta = {
  title: "Room/Stage more menu",
  component: StageMoreMenu,
  args: {
    folded: ["go-live", "sound", "voice"],
    canShareScreen: true,
    onStart: () => undefined,
    onSettings: () => undefined,
    sound: heard,
    voice: { ...heard, volume: 0.45, muted: true, name: "Bruno" },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "16rem var(--space-6) var(--space-6)",
          background: "var(--grey-15)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageMoreMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Go live, the stream's sound and the streamer's voice folded into "…" (click it to open). */
export const Folded: Story = {};
/** While I'm live: only the sounds. */
export const WhileLive: Story = { args: { folded: ["sound", "voice"] } };
/** Nobody live: only the settings. */
export const SettingsOnly: Story = { args: { folded: ["settings"] } };
