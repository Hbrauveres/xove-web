import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsCameraPreview } from "./settings-camera-preview.component";

const meta = {
  title: "Room/Settings camera preview",
  component: SettingsCameraPreview,
  args: { live: false },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          width: "var(--settings-width)",
          padding: "var(--space-3-5)",
          background: "var(--panel)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsCameraPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My camera, only mine (its picture still on its way here). */
export const OnlyMine: Story = {};
/** My camera, sent. */
export const Live: Story = { args: { live: true } };
/** The camera refused: how to allow it, in the picture's place. */
export const Refused: Story = { args: { problem: "blocked" } };
