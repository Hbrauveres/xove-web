import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cue } from "./cue.component";

const meta = {
  title: "Shared/Cue",
  component: Cue,
  args: { request: 1 },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "var(--strip-item)", height: "var(--control-md)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Cue>;

export default meta;

/** Pointing at a control: two slow pulses, then lit. */
export const Pointing: StoryObj<typeof meta> = {};
