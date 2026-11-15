import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared/styles/tokens.css";
import "./shared/styles/global.css";
import { Root } from "@routes/root";
import { rootElement } from "@shared/utils/root-element.util";
import { appConfig } from "@services/app-config-service";

// The settings the web app's own server serves come first, so nothing shows before them.
void appConfig.load().then(() =>
  createRoot(rootElement(document)).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  ),
);
