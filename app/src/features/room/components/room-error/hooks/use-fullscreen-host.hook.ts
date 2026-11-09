import { useLayoutEffect, useState } from "react";
import { useFullscreenElement } from "../../../hooks/use-fullscreen-element.hook";

/**
 * A container for windows over the page, that moves into the fullscreen element and back
 * out with it. Moving the container instead of rendering elsewhere keeps what's
 * inside it (a window's choices, where its focus goes back to) when fullscreen starts or ends.
 */
export function useFullscreenHost(): HTMLElement {
  const fullscreen = useFullscreenElement();
  const [host] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    (fullscreen ?? document.body).appendChild(host);
  }, [fullscreen, host]);
  useLayoutEffect(() => () => host.remove(), [host]);
  return host;
}
