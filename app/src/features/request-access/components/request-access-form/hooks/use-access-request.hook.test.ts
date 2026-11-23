import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { aUser, installFakeApi } from "../../../../../testing/fakes/api.fake";
import { useAccessRequest } from "./use-access-request.hook";

it("sends the note with the request, then lets the page know", async () => {
  const server = installFakeApi({ me: aUser({ status: "NONE" }) });
  const onSent = vi.fn(() => Promise.resolve());
  const { result } = renderHook(() => useAccessRequest(onSent));

  act(() => result.current.setMessage("it's me, Bruno"));
  await act(() => result.current.send());

  const post = server.calls.find((c) => c.method === "POST" && c.path === "/api/access-requests");
  expect(post?.body).toEqual({ message: "it's me, Bruno" });
  expect(onSent).toHaveBeenCalled();
  expect(result.current.error).toBeNull();
  expect(result.current.sending).toBe(false);
});

it("keeps the API's words when it refuses, and lets the person try again", async () => {
  const server = installFakeApi({ me: aUser({ status: "NONE" }) });
  server.failures.set("POST /api/access-requests", {
    status: 400,
    body: { detail: "Message is too long (max 500 characters)" },
  });
  const onSent = vi.fn(() => Promise.resolve());
  const { result } = renderHook(() => useAccessRequest(onSent));

  await act(() => result.current.send());

  await waitFor(() => expect(result.current.error).toBe("Message is too long (max 500 characters)"));
  expect(onSent).not.toHaveBeenCalled();
  expect(result.current.sending).toBe(false);
});

it("counts the request as sent even when the check that follows fails: it says nothing about that check", async () => {
  installFakeApi({ me: aUser({ status: "NONE" }) });
  const onSent = vi.fn(() => Promise.reject(new Error("the API's own words")));
  const { result } = renderHook(() => useAccessRequest(onSent));

  await act(() => result.current.send());

  expect(onSent).toHaveBeenCalled();
  expect(result.current.error).toBeNull();
});
