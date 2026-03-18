/**
 * Fuzzy duplicate detection for PYQ questions.
 * Uses Levenshtein distance normalised to text length.
 * Threshold ≥ 0.88 similarity → treated as duplicate.
 */

/** Normalise a question string before comparing */
export function normalizeQ(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance (iterative, O(min(m,n)) space) */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Keep the shorter string as 'a'
  if (a.length > b.length) [a, b] = [b, a];

  let prev = Array.from({ length: a.length + 1 }, (_, i) => i);
  let curr = new Array(a.length + 1).fill(0);

  for (let j = 1; j <= b.length; j++) {
    curr[0] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[i] =
        b[j - 1] === a[i - 1]
          ? prev[i - 1]
          : 1 + Math.min(prev[i - 1], prev[i], curr[i - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[a.length];
}

/** Returns similarity 0–1 (1 = identical) */
export function similarity(a: string, b: string): number {
  const na = normalizeQ(a);
  const nb = normalizeQ(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  // For long strings, compare first 300 chars to keep it fast
  const ca = na.slice(0, 300);
  const cb = nb.slice(0, 300);
  return 1 - levenshtein(ca, cb) / Math.max(ca.length, cb.length);
}

export const SIMILARITY_THRESHOLD = 0.88;

/** In-process dedup check against an array of existing question strings */
export function isFuzzyDuplicate(
  candidate: string,
  existing: string[],
  threshold = SIMILARITY_THRESHOLD
): boolean {
  const nc = normalizeQ(candidate);
  for (const ex of existing) {
    if (similarity(nc, ex) >= threshold) return true;
  }
  return false;
}
