import type { Meta, StoryObj } from "@storybook/react-vite";
import { HomeGoogleMark } from "./home-google-mark.component";

const meta = {
  title: "Home/Google mark",
  component: HomeGoogleMark,
} satisfies Meta<typeof HomeGoogleMark>;

export default meta;

/** Google's "G", as their sign-in button shows it. */
export const Mark: StoryObj<typeof meta> = {};
