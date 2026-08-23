import type { Problem } from "./types";

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RandInt = (min: number, max: number) => number;

function add(a: number, b: number): Problem {
  return { prompt: `${a}+${b}`, answer: a + b };
}
function add3(a: number, b: number, c: number): Problem {
  return { prompt: `${a}+${b}+${c}`, answer: a + b + c };
}
function sub(a: number, b: number): Problem {
  return { prompt: `${a}−${b}`, answer: a - b };
}
function mul(a: number, b: number): Problem {
  return { prompt: `${a}×${b}`, answer: a * b };
}
function divExact(divisor: number, quotient: number): Problem {
  return { prompt: `${divisor * quotient}÷${divisor}`, answer: quotient };
}
function mulThenAdd(a: number, b: number, c: number): Problem {
  return { prompt: `${a}×${b}+${c}`, answer: a * b + c };
}
function parenThenMul(a: number, b: number, c: number): Problem {
  return { prompt: `(${a}+${b})×${c}`, answer: (a + b) * c };
}

function make(band: number, int: RandInt): Problem {
  const roll = int(0, 99);
  if (band < 0.22) {
    if (roll < 30) return add(int(2, 20), int(2, 20));
    if (roll < 55) {
      const a = int(8, 30);
      return sub(a, int(2, a - 1));
    }
    if (roll < 80) return mul(int(2, 10), int(2, 12));
    return divExact(int(2, 10), int(2, 12));
  }
  if (band < 0.5) {
    if (roll < 25) return add(int(10, 99), int(10, 99));
    if (roll < 45) {
      const a = int(30, 99);
      return sub(a, int(10, a));
    }
    if (roll < 70) return mul(int(2, 12), int(11, 50));
    if (roll < 88) return divExact(int(2, 12), int(6, 30));
    return add3(int(2, 20), int(2, 20), int(2, 20));
  }
  if (band < 0.78) {
    if (roll < 18) return add(int(100, 400), int(20, 199));
    if (roll < 32) {
      const a = int(120, 500);
      return sub(a, int(20, Math.min(199, a - 10)));
    }
    if (roll < 50) return mul(int(11, 19), int(11, 25));
    if (roll < 65) return mul(int(6, 15), int(12, 80));
    if (roll < 80) return divExact(int(3, 15), int(8, 45));
    if (roll < 90) return mulThenAdd(int(2, 12), int(2, 20), int(3, 40));
    return parenThenMul(int(3, 25), int(3, 25), int(2, 12));
  }
  if (roll < 16) return add(int(150, 900), int(150, 900));
  if (roll < 28) {
    const a = int(250, 900);
    return sub(a, int(50, Math.min(400, a - 20)));
  }
  if (roll < 42) return mul(int(12, 25), int(12, 35));
  if (roll < 54) return divExact(int(4, 20), int(10, 70));
  if (roll < 66) return add3(int(20, 90), int(20, 90), int(20, 90));
  if (roll < 80) return mulThenAdd(int(6, 19), int(6, 25), int(10, 80));
  if (roll < 90) return parenThenMul(int(10, 50), int(10, 50), int(3, 15));
  return mul(int(13, 19), int(13, 40));
}

export function generateProblems(seed: number, count = 160): Problem[] {
  const rand = mulberry32(seed);
  const int: RandInt = (min, max) => {
    if (max < min) return min;
    return min + Math.floor(rand() * (max - min + 1));
  };

  const seen = new Set<string>();
  const out: Problem[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 60) {
    guard += 1;
    const p = make(out.length / count, int);
    if (seen.has(p.prompt)) continue;
    seen.add(p.prompt);
    out.push(p);
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
