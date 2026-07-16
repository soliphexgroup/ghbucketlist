// Reviews are collected out of 5, but stays present them as a score out of 10
// with a word label, which reads better at a glance on cards and detail pages.

/** 4.8 → 9.6 */
export function toScore10(rating5: number) {
  return Math.round(rating5 * 2 * 10) / 10;
}

/** Always one decimal place, so "9" renders as "9.0". */
export function formatScore(score10: number) {
  return score10.toFixed(1);
}

export function scoreLabel(score10: number) {
  if (score10 >= 9) return "Superb";
  if (score10 >= 8) return "Very good";
  if (score10 >= 7) return "Good";
  if (score10 >= 6) return "Pleasant";
  return "Review score";
}

/** Convenience for the common case: a 0–5 rating straight to its label. */
export function ratingLabel(rating5: number) {
  return scoreLabel(toScore10(rating5));
}
