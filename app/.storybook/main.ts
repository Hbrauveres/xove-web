// Storybook (ADR-0089): every component in the new structure, each state a story beside it.
// Storybook builds with the app's own Vite settings (vite.config.ts): the short names and PostCSS.
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: { disableTelemetry: true },
};

export default config;
