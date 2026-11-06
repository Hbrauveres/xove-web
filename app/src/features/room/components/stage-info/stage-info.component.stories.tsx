import type { Meta, StoryObj } from "@storybook/react-vite";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import { StageInfo } from "./stage-info.component";

/** The row with nobody live: who's here, and the seats. */
function NobodyLiveRow() {
  const stage = useStage([]);
  const hearing = useHearing([], null);
  return (
    <div style={{ width: "var(--card-width)" }}>
      <StageInfo
        sharers={[]}
        stage={stage}
        hearing={hearing}
        free={6}
        here={[{ id: "ana", name: "Ana", hue: 300, online: true }]}
      />
    </div>
  );
}

const meta = {
  title: "Room/Stage info",
  component: NobodyLiveRow,
} satisfies Meta<typeof NobodyLiveRow>;

export default meta;

export const NobodyLive: StoryObj<typeof meta> = {};
