import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared/styles/tokens.css";
import "./shared/styles/global.css";
import { Root } from "@routes/root";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
