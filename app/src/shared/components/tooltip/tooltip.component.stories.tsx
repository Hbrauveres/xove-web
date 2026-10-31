import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "./tooltip.component";

const meta = {
  title: "Shared/Tooltip",
  component: Tooltip,
  args: {
    text: "Turn on your camera",
    children: (
      <IconButton variant="stage" aria-label="Camera">
        <Icon name="camera-off" size={20} />
      </IconButton>
    ),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: only its control shows, and the tip describes it for screen readers. */
export const AtRest: Story = {};
/** With the keyboard's focus: the tip shows above its control. */
export const Focused: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector("button")?.focus();
  },
};
