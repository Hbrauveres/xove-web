import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageStaticGlow } from "./stage-static-glow.component";

const meta = {
  title: "Room/Stage static glow",
  component: StageStaticGlow,
  args: { prefs: { on: true, brightness: 0.9 }, turnOn: false },
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
} satisfies Meta<typeof StageStaticGlow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The static's bands lighting the wall round the stage. */
export const Glowing: Story = {};
/** The first time the stage stands by: the wall flashes with the TV. */
export const TurningOn: Story = { args: { turnOn: true } };
