import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { Field } from "./field.component";

function Message() {
  const [value, setValue] = useState("");
  return <Field label="Message" hint="(optional)" value={value} onChange={setValue} maxLength={10} />;
}

it("is a box named by its label, counting toward its limit as you type", async () => {
  render(<Message />);
  const box = screen.getByRole("textbox", { name: "Message (optional)" });
  expect(screen.getByText("0/10")).toBeInTheDocument();
  await userEvent.setup().type(box, "Hey");
  expect(box).toHaveValue("Hey");
  expect(screen.getByText("3/10")).toBeInTheDocument();
});

it("has no counter without a limit, and holds its action", () => {
  render(<Field label="Note" value="" onChange={() => {}} action={<button>Send</button>} />);
  expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
  expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
});
