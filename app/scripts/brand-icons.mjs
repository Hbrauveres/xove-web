// Writes public/favicon.svg from the mark's geometry (specs 0111 and 0113), so the favicon
// can't drift from the mark. Run from app/: node scripts/brand-icons.mjs (Node 22.18+ strips
// the types).
import { writeFileSync } from "node:fs";
import { iconSvg } from "../src/brand/iconSvg.ts";

writeFileSync(new URL("../public/favicon.svg", import.meta.url), iconSvg());
console.log("wrote public/favicon.svg");
