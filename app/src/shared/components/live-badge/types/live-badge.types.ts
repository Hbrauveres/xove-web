export interface LiveBadgeProps {
  /**
   * Where it sits:
   * - stage: beside who's on the stage, its dot pulsing
   * - preview: over my own stream's preview in the settings, a pill with a still dot
   */
  variant: "stage" | "preview";
  className?: string | undefined;
}
