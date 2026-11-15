import { expect, it } from "vitest";
import { buttonClasses, isButtonLink } from "./button-classes.util";

const styles = { button: "b", primary: "p", quiet: "q", md: "m", sm: "s" };

it("is a primary, middle-sized button unless told otherwise, with its place's class last", () => {
  expect(buttonClasses(styles)).toBe("b p m");
  expect(buttonClasses(styles, "quiet", "sm", "here")).toBe("b q s here");
});

it("is a link when it has somewhere to go, in the app or out of it", () => {
  expect(isButtonLink({ to: "/room" })).toBe(true);
  expect(isButtonLink({ href: "/api/oauth2/authorization/google" })).toBe(true);
  expect(isButtonLink({ onClick: () => undefined })).toBe(false);
});
