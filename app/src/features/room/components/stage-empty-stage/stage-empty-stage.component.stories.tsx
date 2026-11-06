import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageEmptyStage } from "./stage-empty-stage.component";

const meta = {
  title: "Room/Stage empty stage",
  component: StageEmptyStage,
  args: { canShareScreen: true, onStart: () => undefined, turnOn: false, onStandby: () => undefined },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          background: "var(--black)",
          containerType: "inline-size",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageEmptyStage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A TV on standby, already on. */
export const Standby: Story = {};
/** The first time it stands by in a visit: the TV turns on. */
export const TurningOn: Story = { args: { turnOn: true } };
