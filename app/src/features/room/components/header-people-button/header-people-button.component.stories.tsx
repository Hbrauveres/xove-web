import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderPeopleButton } from "./header-people-button.component";

const meta = {
  title: "Room/Header people button",
  component: HeaderPeopleButton,
  args: {
    people: [
      { id: "me", name: "Henrique", hue: 210, online: true },
      { id: "bruno", name: "Bruno", hue: 30, online: true },
      { id: "ana", name: "Ana", hue: 300, online: true },
    ],
    meId: "me",
    sharing: { bruno: { screen: true, camera: true } },
    watchingOf: { me: { sharerId: "bruno", kind: "screen" } },
    seats: { total: 3, taken: 3, waiting: 1 },
  },
} satisfies Meta<typeof HeaderPeopleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three here, the room full, one waiting; click it to open the panel. */
export const Here: Story = {};
/** An older API that doesn't say the seats. */
export const NoSeats: Story = { args: { seats: null } };
