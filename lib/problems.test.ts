import assert from "node:assert/strict";
import { test } from "node:test";
import { generateProblems } from "./problems";

test("a race has unique prompts", () => {
  const problems = generateProblems(42);
  const prompts = problems.map((p) => p.prompt);
  assert.equal(new Set(prompts).size, prompts.length);
  assert.ok(problems.length >= 160);
});

test("includes squares 3-25 and perfect square roots", () => {
  const problems = generateProblems(99);
  const squares = problems.filter((p) => /²$/.test(p.prompt));
  const roots = problems.filter((p) => p.prompt.startsWith("√"));
  assert.ok(squares.length >= 8, `squares=${squares.length}`);
  assert.ok(roots.length >= 8, `roots=${roots.length}`);
  for (const p of squares) {
    const n = Number(p.prompt.replace("²", ""));
    assert.ok(n >= 3 && n <= 25);
    assert.equal(p.answer, n * n);
  }
  for (const p of roots) {
    const n = Number(p.prompt.replace("√", ""));
    const r = p.answer;
    assert.equal(r * r, n);
    assert.ok(r >= 2 && r <= 25);
  }
});
