import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneNoticePage } from "./phone-notice.page";

const meta = {
  title: "Phone notice/Page",
  component: PhoneNoticePage,
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile1", isRotated: false } },
} satisfies Meta<typeof PhoneNoticePage>;

export default meta;

/** What a phone or a tablet sees on every page. */
export const OnAPhone: StoryObj<typeof meta> = {};
