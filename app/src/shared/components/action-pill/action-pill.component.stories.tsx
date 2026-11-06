import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionPill } from "./action-pill.component";

const meta = {
  title: "Shared/Action pill",
  component: ActionPill,
  args: { size: "m", fill: "glass", lead: "dot", children: "Go live" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActionPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** M 34, glass, with the live dot: Go live, over a stream. */
export const GlassM: Story = {};
/** L 44, red: the first way to start, on the empty stage. */
export const RedL: Story = {
  args: { size: "l", fill: "red", lead: "screen-on", children: "Screen", "aria-label": "Share your screen" },
};
/** L 44, soft: the second way. */
export const SoftL: Story = {
  args: { size: "l", fill: "soft", lead: "camera-on", children: "Camera", "aria-label": "Turn on your camera" },
};
/** Unavailable: faded in place, saying why in its tooltip. */
export const Unavailable: Story = { args: { ...RedL.args, lead: "screen-off", unavailable: true } };
