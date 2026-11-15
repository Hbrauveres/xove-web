import type { Meta, StoryObj } from "@storybook/react-vite";
import { Face } from "@shared/components/face";
import { LiveDot } from "@shared/components/live-dot";
import { LabelPill } from "./label-pill.component";

const meta = {
  title: "Shared/Label pill",
  component: LabelPill,
  args: { lead: <Face name="Ana" hue={280} size={16} />, children: "Ana · camera" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LabelPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A preview's name: the face, then who and what. */
export const PreviewName: Story = {};
/** Words alone: the camera's preview, "Only you see this". */
export const WordsAlone: Story = { args: { lead: undefined, children: "Only you see this" } };
/** A status on a page: the red tint, its dot beating. */
export const Status: Story = {
  args: { tone: "soft", size: "m", lead: <LiveDot size="m" pulse />, children: "Waiting for approval" },
};
/** A role in a row: solid red. */
export const Role: Story = { args: { tone: "solid", lead: undefined, children: "Admin" } };
