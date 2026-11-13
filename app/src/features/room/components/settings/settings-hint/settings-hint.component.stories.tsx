import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsHint } from "./settings-hint.component";

const meta = {
  title: "Room/Settings hint",
  component: SettingsHint,
  args: { children: "You're not sharing. These are used the next time you do." },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--settings-width)", padding: "var(--space-3-5)", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsHint>;

export default meta;

/** A muted line. */
export const Line: StoryObj<typeof meta> = {};
