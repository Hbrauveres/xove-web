import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { StagePictureLayer } from "./stage-picture-layer.component";

const picture = (size: "l" | "m") => ({
  setLayer: () => undefined,
  setGoLive: () => undefined,
  fit: { folded: [], size, beside: false },
  smallView: true,
});

const meta = {
  title: "Room/Stage picture layer",
  component: StagePictureLayer,
  args: {
    picture: picture("l"),
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
/** My row in M on a narrow picture: the layer keeps the fullscreen button level with it. */
export const Compact: Story = { args: { picture: picture("m") } };
