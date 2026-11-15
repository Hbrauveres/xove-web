import { GOOGLE_MARK } from "./constants/google-mark.constants";

/** Google's "G", beside the words of their sign-in button. */
export function HomeGoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      {GOOGLE_MARK.map(({ fill, d }) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </svg>
  );
}
