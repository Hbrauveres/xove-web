import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@shared/components/button";
import { Face } from "@shared/components/face";
import { LabelPill } from "@shared/components/label-pill";
import { PersonRow } from "./person-row.component";

const meta = {
  title: "Shared/Person row",
  component: PersonRow,
  args: { face: <Face name="Rafa" size={32} />, name: "Rafa Lima", line: "rafa@example.com" },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PersonRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member, with Remove at the end. */
export const Member: Story = {
  args: {
    end: (
      <Button size="sm" variant="ghost">
        Remove
      </Button>
    ),
  },
};
/** An admin: the role's pill at the end. */
export const Admin: Story = { args: { end: <LabelPill tone="solid">Admin</LabelPill> } };
/** Who's signed in, and a way out. */
export const SignedInAs: Story = {
  args: {
    label: "Signed in as",
    name: "friend@example.com",
    line: undefined,
    end: <Button variant="quiet">Use another account</Button>,
  },
};
/** A long name and email: cut with an ellipsis, never wider than the row. */
export const Long: Story = {
  args: { name: "Rafaela Cristina de Albuquerque Lima", line: "rafaela.cristina.albuquerque.lima@example.com" },
};
