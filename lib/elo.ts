export function eloDelta(
  winnerRating: number,
  loserRating: number,
  draw: boolean,
  k = 32,
) {
  const expected =
    1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  if (draw) {
    const d = Math.round(k * (0.5 - expected));
    return { winner: d, loser: -d };
  }
  const d = Math.round(k * (1 - expected));
  return { winner: d, loser: -d };
}
