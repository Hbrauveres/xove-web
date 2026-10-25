// First: the install prompt may come before anything renders (spec 0171).
import { listenForInstall } from "./install/prompt";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Root } from "@app/root.component";

listenForInstall();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
