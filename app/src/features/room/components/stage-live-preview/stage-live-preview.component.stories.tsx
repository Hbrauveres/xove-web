import type { Meta, StoryObj } from "@storybook/react-vite";
import { aSharer } from "@testing/factories/sharer.factory";
import { usePreviewTray } from "../../hooks/use-preview-tray.hook";
import { StageLivePreview } from "./stage-live-preview.component";
import type { StageLivePreviewProps } from "./types/stage-live-preview.types";

/** A preview with its own tray, as the strip gives it. */
function WithTray(props: Omit<StageLivePreviewProps, "tray">) {
  const tray = usePreviewTray();
  return (
    <ul style={{ listStyle: "none", padding: "var(--space-6)", background: "var(--grey-15)" }}>
      <StageLivePreview {...props} tray={tray} />
    </ul>
  );
}

const meta = {
  title: "Room/Stage live preview",
  component: WithTray,
  args: {
    sharer: aSharer({ name: "Ana", hasVoice: true }),
    swapped: false,
    swapping: false,
    talking: false,
    onPick: () => undefined,
  },
} satisfies Meta<typeof WithTray>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Someone's screen, with their name in a label pill. */
export const Screen: Story = {};
/** A screen and a camera: the camera peeks out behind. */
export const Stacked: Story = { args: { sharer: aSharer({ name: "Bruno", kinds: ["screen", "camera"] }) } };
/** Their voice while they speak: the picture's ring lights. */
export const Talking: Story = { args: { talking: true } };
