import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PickerList } from "./picker-list.component";

const OPTIONS = [
  { value: "a", label: "First" },
  { value: "b", label: "Second" },
];

it("offers its options as radios, and says which was picked", async () => {
  const onPick = vi.fn();
  render(<PickerList ref={null} id="l" label="Camera" options={OPTIONS} open unrolled up={false} onPick={onPick} />);
  await userEvent.setup().click(screen.getByRole("menuitemradio", { name: "Second" }));
  expect(onPick).toHaveBeenCalledWith("b");
});

it("is out of reach while it rolls back", () => {
  render(
    <PickerList ref={null} id="l" label="Camera" options={OPTIONS} open={false} unrolled={false} up onPick={vi.fn()} />,
  );
  expect(screen.queryByRole("menu")).toBeNull();
});
