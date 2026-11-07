// The sizes every case runs at: the most common desktops and two real phones, each with its pixel
// density (a page lays out in CSS pixels; the density decides how sharp it is). Phones get only
// what they get today, the phone notice: their projects run the tests tagged @phone.

export interface Size {
  name: string;
  width: number;
  height: number;
  scale: number;
  phone: boolean;
}

export const SIZES: readonly Size[] = [
  { name: "desktop-480", width: 854, height: 480, scale: 1, phone: false },
  { name: "desktop-720", width: 1280, height: 720, scale: 1, phone: false },
  { name: "desktop-1080", width: 1920, height: 1080, scale: 1, phone: false },
  // A 4K monitor at 150%, as most are set.
  { name: "desktop-1440", width: 2560, height: 1440, scale: 1.5, phone: false },
  // A 4K monitor at 100%: the layout's extreme.
  { name: "desktop-4k", width: 3840, height: 2160, scale: 1, phone: false },
  { name: "galaxy-s23-ultra", width: 384, height: 824, scale: 3.75, phone: true },
  { name: "iphone-15", width: 393, height: 852, scale: 3, phone: true },
];

/** The tag that puts a test on the phones: what phones get. */
export const PHONE_TAG = "@phone";
