import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropUpRow } from "./drop-up-row.component";

const meta = {
  title: "Shared/Drop-up row",
  component: DropUpRow,
  args: { children: <span style={{ color: "var(--text)" }}>Your screen</span> },
} satisfies Meta<typeof DropUpRow>;

export default meta;

/** One frosted pill, over the video. */
export const Row: StoryObj<typeof meta> = {};
/** The panel's light track, in a panel (the settings' window row). */
export const Panel: StoryObj<typeof meta> = {
  args: { look: "panel" },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: "var(--space-4)", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
};
