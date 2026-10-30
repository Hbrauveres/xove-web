import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorNotice } from "./error-notice.component";

const meta = {
  title: "Shared/Error notice",
  component: ErrorNotice,
  args: { children: "Couldn't sign you in. Try again." },
} satisfies Meta<typeof ErrorNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a page, as on the sign-in page: a see-through red tint over the ground. */
export const OnThePage: Story = {};

/** Over the stage or the page, as in the room: an opaque tint, so nothing shows through. */
export const Floating: Story = {
  args: { floating: true, children: "The connection dropped. Trying again…" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-12)", background: "var(--black)" }}>
        <Story />
      </div>
    ),
  ],
};
