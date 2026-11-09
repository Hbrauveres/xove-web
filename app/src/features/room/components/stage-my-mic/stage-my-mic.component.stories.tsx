import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageMyMic } from "./stage-my-mic.component";

const meta = {
  title: "Room/Stage my mic",
  component: StageMyMic,
  args: { on: false, size: "l", onClick: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageMyMic>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Off: my voice isn't shared. */
export const Off: Story = {};
/** On: red, in a silence. */
export const On: Story = { args: { on: true } };
/** On while my voice is sent: the talking cue on its red. */
export const Speaking: Story = { args: { on: true, speaking: true } };
