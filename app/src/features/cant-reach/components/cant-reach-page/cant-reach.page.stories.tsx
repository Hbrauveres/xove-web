import type { Meta, StoryObj } from "@storybook/react-vite";
import { CantReachPage } from "./cant-reach.page";

const meta = {
  title: "Can't reach/Page",
  component: CantReachPage,
  args: { state: { status: "unreachable", nextTryAt: Date.now() + 8_000 }, onRetry: () => undefined },
} satisfies Meta<typeof CantReachPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Out of reach: counting down to the next try. */
export const Retrying: Story = {};
/** It stopped after its tries: Try again starts a new round. */
export const GaveUp: Story = { args: { state: { status: "unreachable", nextTryAt: null } } };
/** Any other answer: Try again. */
export const Failed: Story = { args: { state: { status: "failed", busy: false } } };
/** Try again pressed: Please wait, with its spinner. */
export const PleaseWait: Story = { args: { state: { status: "failed", busy: true } } };
