import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownSection } from "./dropdown-section.component";

const meta = {
  title: "Shared/Dropdown section",
  component: DropdownSection,
  args: { children: <span style={{ color: "var(--text)" }}>Nobody is waiting for a seat.</span> },
} satisfies Meta<typeof DropdownSection>;

export default meta;

/** One frosted section. */
export const Section: StoryObj<typeof meta> = {};
