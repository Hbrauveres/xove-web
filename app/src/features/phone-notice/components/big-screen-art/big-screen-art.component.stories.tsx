import type { Meta, StoryObj } from "@storybook/react-vite";
import { BigScreenArt } from "./big-screen-art.component";

const meta = {
  title: "Phone notice/Big screen art",
  component: BigScreenArt,
} satisfies Meta<typeof BigScreenArt>;

export default meta;

/** A computer drawn from the mark: its corners, the top right one red, and its red dot. */
export const Drawing: StoryObj<typeof meta> = {};
