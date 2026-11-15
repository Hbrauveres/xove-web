import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { HomePage } from "./home.page";

const meta = {
  title: "Home/Page",
  component: HomePage,
  parameters: { layout: "fullscreen", address: "/" },
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[parameters.address as string]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed out: the pitch and the way in. */
export const SignedOut: Story = {};
/** Back from Google with an error. */
export const SignInFailed: Story = { parameters: { address: "/?error=login-failed" } };
