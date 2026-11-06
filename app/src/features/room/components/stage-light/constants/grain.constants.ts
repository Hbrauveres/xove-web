/** mulberry32's constants: a small, fixed pseudo-random sequence. */
export const MULBERRY_STEP = 0x6d2b79f5;
export const MULBERRY_SHIFT_A = 15;
export const MULBERRY_SHIFT_B = 7;
export const MULBERRY_SHIFT_C = 14;
export const MULBERRY_ODD = 61;
/** 2³²: the sequence's whole range, so each draw is a share from 0 to 1. */
export const UINT32_RANGE = 4_294_967_296;
