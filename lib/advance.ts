export type LiveBit = { prompt: string; answer: number; index: number };

export type LiveProblem = {
  prompt: string;
  answer: number;
  index: number;
  youScore: number;
  queue: LiveBit[];
};

export function applyCorrect(
  cur: LiveProblem,
  raw: string,
): LiveProblem | null {
  if (raw === "") return null;
  if (!Number.isFinite(cur.answer) || Number(raw) !== cur.answer) return null;
  const rest = cur.queue.slice(1);
  const next = rest[0];
  if (!next) {
    return {
      prompt: cur.prompt,
      answer: Number.NaN,
      index: cur.index + 1,
      youScore: cur.youScore + 1,
      queue: [],
    };
  }
  return {
    prompt: next.prompt,
    answer: next.answer,
    index: next.index,
    youScore: cur.youScore + 1,
    queue: rest,
  };
}
