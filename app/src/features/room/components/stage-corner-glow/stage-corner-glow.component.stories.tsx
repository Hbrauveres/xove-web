import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageCornerGlow } from "./stage-corner-glow.component";

const meta = {
  title: "Room/Stage corner glow",
  component: StageCornerGlow,
  args: { prefs: { on: true, brightness: 0.9 } },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          margin: "var(--space-12)",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          background: "var(--black)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageCornerGlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { prefs: { on: false, brightness: 0.9 } } };
