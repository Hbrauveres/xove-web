import type { StreamKind } from "@services/xove-api-service";

/** What the stage says while a stream starts, its video on its way: mine, or someone else's. */
export function startingNotice(isMe: boolean, name: string, kind: StreamKind) {
  return isMe
    ? { title: "Starting your share…", text: "Your screen shows here in a moment." }
    : { title: `Loading ${name}'s ${kind}…`, text: "The video starts in a moment." };
}
