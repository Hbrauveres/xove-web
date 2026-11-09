import type { useRememberedCamera } from "../hooks/use-remembered-camera.hook";

/** The camera this browser remembers, and how to capture and pick one. */
export type RememberedCamera = ReturnType<typeof useRememberedCamera>;
