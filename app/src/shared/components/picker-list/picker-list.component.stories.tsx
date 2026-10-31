import type { Meta, StoryObj } from "@storybook/react-vite";
import { PickerList } from "./picker-list.component";

const meta = {
  title: "Shared/Picker list",
  component: PickerList,
  args: {
    ref: null,
    id: "list",
    label: "Camera",
    options: [
      { value: "a", label: "Webcam C920" },
      { value: "b", label: "OBS Virtual Camera" },
    ],
    open: true,
    unrolled: true,
    up: false,
    onPick: () => {},
  },
} satisfies Meta<typeof PickerList>;

export default meta;

/** Its options, unrolled. */
export const Unrolled: StoryObj<typeof meta> = {};
