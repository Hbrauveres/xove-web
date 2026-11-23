/** The stage's four viewfinder corners, as the mark has them: top left, top right, bottom left, bottom right. */
export const CORNERS = ["tl", "tr", "bl", "br"] as const;
/** The corner that's a red neon tube, as the mark's red corner. */
export const NEON_CORNER: (typeof CORNERS)[number] = "tr";
