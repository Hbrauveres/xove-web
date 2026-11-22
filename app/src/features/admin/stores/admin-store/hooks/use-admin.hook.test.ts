import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { aUser, installFakeApi } from "../../../../../testing/fakes/api.fake";
import { useAdmin } from "./use-admin.hook";

it("loads the lists as the page opens, and its actions change them", async () => {
  installFakeApi({
    me: aUser({ admin: true }),
    requests: [],
    members: [{ id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false }],
  });
  const { result } = renderHook(() => useAdmin());
  expect(result.current.lists).toBeNull();
  await waitFor(() => expect(result.current.lists?.members.map((m) => m.id)).toEqual([2]));

  await act(() => result.current.remove(2));

  expect(result.current.lists?.members).toEqual([]);
});
