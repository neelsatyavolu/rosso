import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCorrect } from "./advance";
import type { LiveProblem } from "./advance";

function live(partial: Partial<LiveProblem> = {}): LiveProblem {
  return {
    prompt: "7+5",
    answer: 12,
    index: 0,
    youScore: 0,
    queue: [
      { prompt: "7+5", answer: 12, index: 0 },
      { prompt: "3×4", answer: 12, index: 1 },
    ],
    ...partial,
  };
}

test("wrong answer does not move", () => {
  const cur = live();
  assert.equal(applyCorrect(cur, "11"), null);
});

test("correct answer advances to the next distinct problem", () => {
  const next = applyCorrect(live(), "12");
  assert.ok(next);
  assert.equal(next.prompt, "3×4");
  assert.equal(next.index, 1);
  assert.equal(next.youScore, 1);
  assert.equal(next.queue[0]?.prompt, "3×4");
});

test("solving the last problem does not reuse it for more points", () => {
  const last = live({
    prompt: "8+4",
    answer: 12,
    index: 12,
    youScore: 12,
    queue: [{ prompt: "8+4", answer: 12, index: 12 }],
  });
  const after = applyCorrect(last, "12");
  assert.ok(after);
  assert.equal(after.youScore, 13);
  assert.equal(after.queue.length, 0);
  assert.ok(Number.isNaN(after.answer));
  assert.equal(applyCorrect(after, "12"), null);
});
