import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequestAccessForm } from "./request-access-form.component";

/** The API's answer to a request: refused with its words, or none yet (still sending). */
function answer(with_: "refused" | "pending") {
  const real = window.fetch;
  window.fetch = () =>
    with_ === "refused"
      ? Promise.resolve(Response.json({ detail: "Message is too long (max 500 characters)" }, { status: 400 }))
      : new Promise<Response>(() => undefined);
  // The next story gets the real fetch back.
  return () => {
    window.fetch = real;
  };
}

/** Sends the form, as a click on its button does. */
const send = ({ canvasElement }: { canvasElement: HTMLElement }) => {
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

const meta = {
  title: "Request access/Form",
  component: RequestAccessForm,
  args: { declined: false, onSent: () => Promise.resolve() },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", display: "grid", gap: "var(--space-3-5)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequestAccessForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed in, not a member yet. */
export const Ask: Story = {};
/** The last request was declined. */
export const Declined: Story = { args: { declined: true } };
/** Sending: the button says so and waits. */
export const Sending: Story = { beforeEach: () => answer("pending"), play: send };
/** Refused: the API's words in the error box, the form kept. */
export const Refused: Story = { beforeEach: () => answer("refused"), play: send };
