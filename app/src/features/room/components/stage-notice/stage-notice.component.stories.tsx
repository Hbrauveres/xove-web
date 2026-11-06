import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageNotice } from "./stage-notice.component";

const meta = {
  title: "Room/Stage notice",
  component: StageNotice,
  args: { spinner: true, title: "Loading Ana's screen…", text: "The video starts in a moment." },
  decorators: [
    (Story) => (
      <div
        style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)", background: "var(--black)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
export const Still: Story = {
  args: { spinner: false, title: "Your camera is off", text: "Turn it on to show it here." },
};
