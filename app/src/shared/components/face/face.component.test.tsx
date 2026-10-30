import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Face } from "./face.component";

describe("a face", () => {
  it("in the room, shows the person's initial in their own colour, hidden from screen readers", () => {
    const { container } = render(<Face name="marina" hue={200} size={32} />);
    const face = container.firstElementChild as HTMLElement;
    expect(face).toHaveTextContent("M");
    expect(face).toHaveAttribute("aria-hidden", "true");
    const other = render(<Face name="Rafa" hue={20} size={32} />).container.firstElementChild as HTMLElement;
    expect(face.style.background).not.toBe("");
    expect(face.style.background).not.toBe(other.style.background);
  });

  it("rings a live person, around the face or inside its edge", () => {
    const { container, rerender } = render(<Face name="Rafa" hue={20} size={30} onAir />);
    expect(container.firstElementChild).toHaveAttribute("data-ring", "outside");
    rerender(<Face name="Rafa" hue={20} size={52} onAir ring="inside" />);
    expect(container.firstElementChild).toHaveAttribute("data-ring", "inside");
    rerender(<Face name="Rafa" hue={20} size={52} />);
    expect(container.firstElementChild).not.toHaveAttribute("data-ring");
  });

  it("shows a user's photo, and their initial once the photo fails to load", () => {
    const { container } = render(<Face name="Ana" photo="https://example.com/ana.jpg" size={36} />);
    const photo = container.querySelector("img");
    expect(photo).toHaveAttribute("src", "https://example.com/ana.jpg");
    fireEvent.error(photo as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("A");
  });
});
