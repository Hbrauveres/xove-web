import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { HeaderMyPictureButton } from "./header-my-picture-button.component";

const meta = {
  title: "Room/Header my picture button",
  component: HeaderMyPictureButton,
  args: {
    me: { id: "me", name: "Henrique", hue: 210, online: true },
    isAdmin: false,
    connection: "connected",
    ambilight: { on: true, brightness: 0.9 },
    onAmbilightChange: () => undefined,
    onSignOut: () => undefined,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof HeaderMyPictureButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Connected: a green dot. */
export const Connected: Story = {};
/** Reconnecting: a yellow dot. */
export const Reconnecting: Story = { args: { connection: "reconnecting" } };
