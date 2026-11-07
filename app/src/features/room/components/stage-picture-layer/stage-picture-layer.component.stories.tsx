import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { StagePictureLayer } from "./stage-picture-layer.component";

const meta = {
  title: "Room/Stage picture layer",
  component: StagePictureLayer,
  args: {
    setLayer: () => undefined,
    compact: false,
    fullscreen: (
      <div style={{ position: "absolute", right: "var(--space-3)", bottom: "var(--space-3)", pointerEvents: "auto" }}>
        <IconButton variant="round" size="m" aria-label="Fullscreen">
          <Icon name="fullscreen-enter" size={16} />
        </IconButton>
      </div>
    ),
    children: null,
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            position: "relative",
            width: "48rem",
            aspectRatio: "16 / 9",
            background: "var(--grey-15)",
            containerType: "size",
            "--shape": "0.5625",
          } as never
        }
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StagePictureLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Over a tall picture: the layer is the picture's size and place, fullscreen at its bottom right. */
export const TallPicture: Story = {};
