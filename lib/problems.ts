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
function square(n: number): Problem {
  return { prompt: `${n}²`, answer: n * n };
}
function sqrt(n: number): Problem {
  return { prompt: `√${n * n}`, answer: n };
}
function cube(n: number): Problem {
  return { prompt: `${n}³`, answer: n * n * n };
}
function cbrt(n: number): Problem {
  return { prompt: `∛${n * n * n}`, answer: n };
}

type Kind =
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "add3"
  | "mix"
  | "paren"
  | "sq"
  | "sqrt"
  | "cube"
  | "cbrt";

function kindsFor(band: number): Kind[] {
  if (band < 0.22) {
    return ["add", "sub", "mul", "div", "sq", "sqrt"];
  }
  if (band < 0.5) {
    return ["add", "sub", "mul", "div", "add3", "sq", "sqrt", "cube"];
  }
  if (band < 0.78) {
    return [
      "add",
      "sub",
      "mul",
      "div",
      "mix",
      "paren",
      "sq",
      "sqrt",
      "cube",
      "cbrt",
    ];
  }
  return [
    "add",
    "sub",
    "mul",
    "div",
    "add3",
    "mix",
    "paren",
    "sq",
    "sqrt",
    "cube",
    "cbrt",
  ];
}

function make(band: number, int: RandInt): Problem {
  const kinds = kindsFor(band);
  const kind = kinds[int(0, kinds.length - 1)]!;
  switch (kind) {
    case "add":
      if (band < 0.22) return add(int(2, 20), int(2, 20));
      if (band < 0.5) return add(int(10, 99), int(10, 99));
      if (band < 0.78) return add(int(100, 400), int(20, 199));
      return add(int(150, 900), int(150, 900));
    case "sub": {
      const a =
        band < 0.22
          ? int(8, 30)
          : band < 0.5
            ? int(30, 99)
            : band < 0.78
              ? int(120, 500)
              : int(250, 900);
      const lo = band < 0.22 ? 2 : band < 0.5 ? 10 : band < 0.78 ? 20 : 50;
      const hi =
        band < 0.78 ? Math.min(a - 1, band < 0.5 ? a : 199) : Math.min(400, a - 20);
      return sub(a, int(lo, Math.max(lo, hi)));
    }
    case "mul":
      if (band < 0.22) return mul(int(2, 10), int(2, 12));
      if (band < 0.5) return mul(int(2, 12), int(11, 50));
      if (band < 0.78) return mul(int(11, 19), int(11, 25));
      return mul(int(12, 25), int(12, 35));
    case "div":
      if (band < 0.22) return divExact(int(2, 10), int(2, 12));
      if (band < 0.5) return divExact(int(2, 12), int(6, 30));
      if (band < 0.78) return divExact(int(3, 15), int(8, 45));
      return divExact(int(4, 20), int(10, 70));
    case "add3":
      if (band < 0.5) return add3(int(2, 20), int(2, 20), int(2, 20));
      return add3(int(20, 90), int(20, 90), int(20, 90));
    case "mix":
      if (band < 0.78) return mulThenAdd(int(2, 12), int(2, 20), int(3, 40));
      return mulThenAdd(int(6, 19), int(6, 25), int(10, 80));
    case "paren":
      if (band < 0.78) return parenThenMul(int(3, 25), int(3, 25), int(2, 12));
      return parenThenMul(int(10, 50), int(10, 50), int(3, 15));
    case "sq":
      if (band < 0.22) return square(int(3, 12));
      if (band < 0.5) return square(int(8, 20));
      return square(int(12, 25));
    case "sqrt":
      if (band < 0.22) return sqrt(int(2, 12));
      if (band < 0.5) return sqrt(int(6, 20));
      return sqrt(int(10, 25));
    case "cube":
      if (band < 0.5) return cube(int(2, 8));
      return cube(int(4, 12));
    case "cbrt":
      return cbrt(int(2, 10));
  }
}

export function generateProblems(seed: number, count = 200): Problem[] {
  const rand = mulberry32(seed);
  const int: RandInt = (min, max) => {
    if (max < min) return min;
    return min + Math.floor(rand() * (max - min + 1));
  };

  const seen = new Set<string>();
  const out: Problem[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 80) {
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
