/** Why starting a stream is greyed out when every one of the room's `places` is taken. */
export const fullRoom = (places: number) =>
  `${places} ${places === 1 ? "stream is" : "streams are"} live, the most at once. You can start yours when one stops.`;
