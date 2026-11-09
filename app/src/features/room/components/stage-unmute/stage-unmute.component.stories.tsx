import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageUnmute } from "./stage-unmute.component";

const meta = {
  title: "Room/Stage unmute",
  component: StageUnmute,
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageUnmute>;

export default meta;
type Story = StoryObj<typeof meta>;

/** While the browser holds the room's sound back: red, pointed at by the cue. */
export const Held: Story = {};
