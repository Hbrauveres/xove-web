import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageSoundDrawer } from "./stage-sound-drawer.component";

const heard = { volume: 0.7, muted: false };

const meta = {
  title: "Room/Stage sound drawer",
  component: StageSoundDrawer,
  args: {
    open: true,
    hearing: { sound: heard, voice: heard },
    drawer: { shown: "voice", leaving: null, entering: false, left: () => undefined, entered: () => undefined },
    label: "Ana's voice volume",
    onVolume: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", width: "8rem", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageSoundDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unrolled, setting their voice. */
export const Open: Story = {};
