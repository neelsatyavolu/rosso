import type { Problem } from "./types";

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateProblems(seed: number, count = 80): Problem[] {
  const rand = mulberry32(seed);
  const int = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));

  const out: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const kind = int(0, 3);
    if (kind === 0) {
      const a = int(10, 99);
      const b = int(10, 99);
      out.push({ prompt: `${a}+${b}`, answer: a + b });
    } else if (kind === 1) {
      const a = int(20, 99);
      const b = int(10, a);
      out.push({ prompt: `${a}−${b}`, answer: a - b });
    } else if (kind === 2) {
      const a = int(2, 12);
      const b = int(2, 99);
      out.push({ prompt: `${a}×${b}`, answer: a * b });
    } else {
      const b = int(2, 12);
      const q = int(2, 20);
      const a = b * q;
      out.push({ prompt: `${a}÷${b}`, answer: q });
    }
  }
  return out;
}

export function botSolveOffsets(seed: number, count = 28): number[] {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const offsets: number[] = [];
  let t = 1400;
  for (let i = 0; i < count; i++) {
    t += 1100 + Math.floor(rand() * 1600);
    if (t >= 59000) break;
    if (rand() > 0.22) offsets.push(t);
  }
  return offsets;
}
