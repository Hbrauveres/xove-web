import { expect, it } from "vitest";
import { SIGN_IN_ERRORS, SIGN_IN_ERROR_ANY } from "../constants/sign-in-errors.constants";
import { signInError } from "./sign-in-error.util";

it("says nothing without an error in the address", () => {
  expect(signInError(null)).toBeNull();
});

it("has its own words for each error the API sends back", () => {
  expect(signInError("login-failed")).toBe(SIGN_IN_ERRORS["login-failed"]);
  expect(signInError("email-not-verified")).toBe(SIGN_IN_ERRORS["email-not-verified"]);
});

it("gives any other code the general words, never the code itself", () => {
  expect(signInError("something-else")).toBe(SIGN_IN_ERROR_ANY);
});
