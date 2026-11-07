// The sizes every case runs at (ADR-0098): two common desktops, a monitor turned on its side, and a
// real phone, each with its pixel density (a page lays out in CSS pixels; the density decides how
// sharp it is). The phone gets only what it gets today, the phone notice: its project runs the tests
// tagged @phone.

export interface Size {
  name: string;
  width: number;
  height: number;
  scale: number;
  phone: boolean;
}

export const SIZES: readonly Size[] = [
  { name: "desktop-720", width: 1280, height: 720, scale: 1, phone: false },
  { name: "desktop-1080", width: 1920, height: 1080, scale: 1, phone: false },
  // A 1080p monitor on its side: tall and narrow.
  { name: "desktop-portrait", width: 1080, height: 1920, scale: 1, phone: false },
  { name: "galaxy-s23-ultra", width: 384, height: 824, scale: 3.75, phone: true },
];

/** The tag that puts a test on the phones: what phones get. */
export const PHONE_TAG = "@phone";
