import type { Preview } from "@storybook/react-vite";
import "../src/shared/styles/tokens.css";
import "../src/shared/styles/global.css";

const preview: Preview = {
  parameters: {
    // A story that breaks an accessibility rule (contrast included) fails its check, not just warns.
    a11y: { test: "error" },
    backgrounds: { disable: true },
    layout: "centered",
  },
};

export default preview;
