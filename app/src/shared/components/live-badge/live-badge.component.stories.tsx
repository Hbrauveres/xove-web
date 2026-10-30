import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveBadge } from "./live-badge.component";

const meta = { title: "Shared/LIVE badge", component: LiveBadge, args: { variant: "stage" } } satisfies Meta<
  typeof LiveBadge
>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Beside who's on the stage, its dot pulsing. */
export const Stage: Story = {};
/** Over my own stream's preview, in the settings. */
export const Preview: Story = { args: { variant: "preview" } };
