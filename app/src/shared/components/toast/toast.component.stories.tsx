import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { Icon } from "@shared/components/icon";
import { toastStore } from "@shared/stores/toast-store";
import { Toast } from "./toast.component";

function Showing({ text, icon }: { text: string; icon?: boolean }) {
  useEffect(() => toastStore.show(text, icon ? <Icon name="voice-off" size={20} /> : undefined), [text, icon]);
  return (
    <div style={{ position: "relative", height: "var(--settings-min-height)", background: "var(--ground)" }}>
      <Toast />
    </div>
  );
}

const meta = {
  title: "Shared/Toast",
  component: Showing,
  args: { text: "Bruno's mic is off", icon: true },
} satisfies Meta<typeof Showing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {};
export const Words: Story = { args: { text: "Pick another window or tab", icon: false } };
