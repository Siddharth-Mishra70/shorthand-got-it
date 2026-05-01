/**
 * generateDetailedAnalysis
 * ═══════════════════════════════════════════════════════════════════════════
 * Compares two strings word-by-word using edit-distance alignment (Wagner-
 * Fischer DP) so that skipped/inserted words don't cascade false errors.
 *
 * @param {string} originalText          The reference / dictation text.
 * @param {string} attemptedText         The student's typed text.
 * @param {object} [options]
 * @param {number} [options.durationSec] Test duration in seconds (for WPM).
 *                                       If omitted, WPM is returned as null.
 * @param {boolean} [options.strict]     When true, punctuation is part of the
 *                                       word token; when false (default),
 *                                       trailing punctuation is stripped
 *                                       before comparison (but preserved in
 *                                       the output for readability).
 *
 * @returns {{
 *   summary: {
 *     totalWords:       number,   // word count of originalText
 *     attemptedWords:   number,   // word count of attemptedText
 *     correctWords:     number,
 *     totalMistakes:    number,
 *     missingCount:     number,
 *     extraCount:       number,
 *     spellingCount:    number,
 *     capitalisationCount: number,
 *     accuracy:         number,   // 0-100, 2 decimal places
 *     wpm:              number|null,
 *   },
 *   missingWords:       Array<{ word: string, position: number }>,
 *   extraWords:         Array<{ word: string, position: number }>,
 *   spellingMistakes:   Array<{ typed: string, correct: string, position: number }>,
 *   capitalisationMistakes: Array<{ typed: string, correct: string, position: number }>,
 *   wordDiff:           Array<{ word: string, type: 'correct'|'wrong'|'capital'|'missing'|'extra' }>,
 * }}
 */
export function generateDetailedAnalysis(originalText, attemptedText, options = {}) {
  const { durationSec = null, strict = false } = options;

  /* ────────────────────────────────────────────────────────────
   * 1. Tokenise
   * ──────────────────────────────────────────────────────────── */
  const tokenise = (text) =>
    (text || '').trim().split(/\s+/).filter(Boolean);

  const origTokens = tokenise(originalText);
  const typedTokens = tokenise(attemptedText);

  /**
   * Normalise a token for comparison:
   * strip leading/trailing punctuation unless strict mode.
   */
  const normalise = (w) =>
    strict ? w : w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

  /* ────────────────────────────────────────────────────────────
   * 2. Edit-distance alignment  (Wagner-Fischer DP)
   *
   * Costs:  match=0, substitute=1, insert=1, delete=1
   * We want the sequence of edit operations that minimises cost,
   * giving us correct MATCH / REPLACE / INSERT / DELETE labels.
   * ──────────────────────────────────────────────────────────── */
  const m = origTokens.length;
  const n = typedTokens.length;

  // dp[i][j] = minimum edit cost to align orig[0..i-1] with typed[0..j-1]
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const origNorm  = normalise(origTokens[i - 1]);   // punctuation-stripped, CASE PRESERVED
      const typedNorm = normalise(typedTokens[j - 1]);

      // Exact match (same letters, same case) = cost 0
      // Any difference (including capitalisation) = cost 1
      const isExact = origNorm === typedNorm;

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + (isExact ? 0 : 1), // substitute (or exact match)
        dp[i - 1][j]     + 1,                  // delete  (orig word missing in typed)
        dp[i][j - 1]     + 1                   // insert  (extra word in typed)
      );
    }
  }

  /* ── Backtrack to recover aligned edit operations ── */
  const ops = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const origNorm  = normalise(origTokens[i - 1]);
      const typedNorm = normalise(typedTokens[j - 1]);
      const isExact   = origNorm === typedNorm;

      const diagCost   = dp[i - 1][j - 1] + (isExact ? 0 : 1);
      const deleteCost = dp[i - 1][j]     + 1;
      const insertCost = dp[i][j - 1]     + 1;

      // For EXACT MATCH: always prefer diagonal (no cost, clear winner)
      if (isExact && dp[i][j] === diagCost) {
        ops.unshift({ op: 'MATCH', orig: origTokens[i - 1], typed: typedTokens[j - 1], origIdx: i - 1, typedIdx: j - 1 });
        i--; j--;
        continue;
      }

      // For REPLACE (cost 1 diagonal): only prefer it over delete+insert when cheaper
      // If delete or insert has the SAME cost as replace, prefer delete or insert
      // (semantically: missing word + extra word is clearer than a wrong replacement)
      if (dp[i][j] === diagCost && diagCost < deleteCost && diagCost < insertCost) {
        ops.unshift({ op: 'REPLACE', orig: origTokens[i - 1], typed: typedTokens[j - 1], origIdx: i - 1, typedIdx: j - 1 });
        i--; j--;
        continue;
      }
    }

    // Prefer DELETE over INSERT when costs are equal (keeps original structure)
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.unshift({ op: 'DELETE', orig: origTokens[i - 1], origIdx: i - 1 });
      i--;
    } else {
      ops.unshift({ op: 'INSERT', typed: typedTokens[j - 1], typedIdx: j - 1 });
      j--;
    }
  }

  /* ────────────────────────────────────────────────────────────
   * 3. Classify REPLACE operations
   *
   *  REPLACE can be:
   *    - capitalisation: same letters (case-insensitive), different case
   *    - spelling:       different letters
   * ──────────────────────────────────────────────────────────── */
  const classifyReplace = (origWord, typedWord) => {
    // Use normalised (punctuation-stripped) versions for letter comparison
    const on = normalise(origWord);
    const tn = normalise(typedWord);
    // Case-insensitive letter match but different case = capitalisation error
    if (on.toLowerCase() === tn.toLowerCase()) return 'capital';
    return 'spelling';
  };

  /* ────────────────────────────────────────────────────────────
   * 4. Build output arrays from edit operations
   * ──────────────────────────────────────────────────────────── */
  const missingWords          = [];
  const extraWords            = [];
  const spellingMistakes      = [];
  const capitalisationMistakes = [];
  const wordDiff              = [];

  ops.forEach((op, idx) => {
    switch (op.op) {
      case 'MATCH':
        wordDiff.push({ word: op.typed, type: 'correct' });
        break;

      case 'REPLACE': {
        const kind = classifyReplace(op.orig, op.typed);
        if (kind === 'capital') {
          capitalisationMistakes.push({
            typed:    op.typed,
            correct:  op.orig,
            position: op.origIdx,
          });
          wordDiff.push({ word: op.typed, type: 'capital' });
        } else {
          spellingMistakes.push({
            typed:    op.typed,
            correct:  op.orig,
            position: op.origIdx,
          });
          wordDiff.push({ word: op.typed, type: 'wrong' });
        }
        break;
      }

      case 'DELETE':
        missingWords.push({ word: op.orig, position: op.origIdx });
        wordDiff.push({ word: `[${op.orig}]`, type: 'missing' });
        break;

      case 'INSERT':
        extraWords.push({ word: op.typed, position: op.typedIdx });
        wordDiff.push({ word: op.typed, type: 'extra' });
        break;

      default:
        break;
    }
  });

  /* ────────────────────────────────────────────────────────────
   * 5. Compute summary metrics
   * ──────────────────────────────────────────────────────────── */
  const totalWords            = origTokens.length;
  const attemptedWords        = typedTokens.length;
  const missingCount          = missingWords.length;
  const extraCount            = extraWords.length;
  const spellingCount         = spellingMistakes.length;
  const capitalisationCount   = capitalisationMistakes.length;
  const totalMistakes         = missingCount + extraCount + spellingCount + capitalisationCount;
  const correctWords          = Math.max(0, totalWords - missingCount - spellingCount - capitalisationCount);

  // Accuracy = correct / total original words (capped 0-100)
  const accuracy = totalWords === 0
    ? 0
    : parseFloat((Math.min(correctWords / totalWords, 1) * 100).toFixed(2));

  // WPM = (words typed / duration in minutes)
  const wpm = durationSec != null && durationSec > 0
    ? parseFloat(((attemptedWords / durationSec) * 60).toFixed(1))
    : null;

  /* ────────────────────────────────────────────────────────────
   * 6. Return structured result
   * ──────────────────────────────────────────────────────────── */
  return {
    summary: {
      totalWords,
      attemptedWords,
      correctWords,
      totalMistakes,
      missingCount,
      extraCount,
      spellingCount,
      capitalisationCount,
      accuracy,
      wpm,
    },
    missingWords,
    extraWords,
    spellingMistakes,
    capitalisationMistakes,
    wordDiff,
  };
}

export default generateDetailedAnalysis;
