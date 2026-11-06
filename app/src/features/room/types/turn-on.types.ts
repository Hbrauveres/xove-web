/** The TV turning on: whether it's playing, and what to call when its animation ends. */
export interface TurnOn {
  turningOn: boolean;
  ended: () => void;
}
