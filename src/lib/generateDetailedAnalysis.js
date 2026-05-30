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
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
    }
  }
  return dp[a.length][b.length];
}

function lineSimilarity(s1, s2) {
  const clean1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean1 && !clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;
  const dist = levenshtein(clean1, clean2);
  const maxLen = Math.max(clean1.length, clean2.length);
  return 1.0 - (dist / maxLen);
}

function extractBlocksFromHtml(htmlString) {
  if (!htmlString) return [];
  if (typeof DOMParser === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const blocks = [];
  let currentBlockText = [];
  let currentBlockStyles = [];

  function commitBlock() {
    const rawText = currentBlockText.join('');
    const trimmedText = rawText.trim();

    if (trimmedText.length > 0) {
      let totalLen = 0;
      let boldLen = 0;
      let italicLen = 0;
      let underlineLen = 0;
      let alignment = 'left';
      let foundAlign = false;

      for (let i = 0; i < currentBlockText.length; i++) {
        const txt = currentBlockText[i];
        const style = currentBlockStyles[i];
        const len = txt.trim().length;
        if (len > 0) {
          totalLen += len;
          if (style.bold) boldLen += len;
          if (style.italic) italicLen += len;
          if (style.underline) underlineLen += len;
          if (!foundAlign) {
            alignment = style.alignment || 'left';
            foundAlign = true;
          }
        }
      }

      if (alignment === 'justifyfull' || alignment === 'justify') {
        alignment = 'justify';
      }
      if (!['left', 'center', 'right', 'justify'].includes(alignment)) {
        alignment = 'left';
      }

      blocks.push({
        text: trimmedText,
        alignment: alignment,
        bold: totalLen > 0 ? (boldLen / totalLen >= 0.5) : false,
        italic: totalLen > 0 ? (italicLen / totalLen >= 0.5) : false,
        underline: totalLen > 0 ? (underlineLen / totalLen >= 0.5) : false
      });
    }

    currentBlockText = [];
    currentBlockStyles = [];
  }

  function walk(node, parentStyles) {
    let styles = { ...parentStyles };

    if (node.nodeType === 1) { // ELEMENT_NODE
      const tagName = node.tagName.toUpperCase();

      if (tagName === 'B' || tagName === 'STRONG') {
        styles.bold = true;
      }
      if (tagName === 'I' || tagName === 'EM') {
        styles.italic = true;
      }
      if (tagName === 'U' || tagName === 'INS') {
        styles.underline = true;
      }

      const alignAttr = node.getAttribute('align');
      if (alignAttr) {
        styles.alignment = alignAttr.toLowerCase();
      }
      const styleAttr = node.getAttribute('style') || '';
      if (styleAttr.includes('text-align')) {
        const match = styleAttr.match(/text-align\s*:\s*([^;]+)/);
        if (match) {
          styles.alignment = match[1].trim().toLowerCase();
        }
      }
      const classAttr = node.getAttribute('class') || '';
      if (classAttr.includes('ql-align-center')) styles.alignment = 'center';
      if (classAttr.includes('ql-align-right')) styles.alignment = 'right';
      if (classAttr.includes('ql-align-justify')) styles.alignment = 'justify';

      if (tagName === 'CENTER') {
        styles.alignment = 'center';
      }

      const isBlockElement = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'PRE'].includes(tagName);
      const isBr = tagName === 'BR';

      if (isBlockElement) {
        commitBlock();
        for (let child of node.childNodes) {
          walk(child, styles);
        }
        commitBlock();
      } else if (isBr) {
        commitBlock();
      } else {
        for (let child of node.childNodes) {
          walk(child, styles);
        }
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      const txt = node.nodeValue;
      if (txt) {
        currentBlockText.push(txt);
        currentBlockStyles.push({
          length: txt.length,
          bold: styles.bold,
          italic: styles.italic,
          underline: styles.underline,
          alignment: styles.alignment
        });
      }
    }
  }

  walk(doc.body, { bold: false, italic: false, underline: false, alignment: 'left' });
  commitBlock();

  return blocks;
}

function alignBlocks(refBlocks, userBlocks) {
  const m = refBlocks.length;
  const n = userBlocks.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i * 1.5;
  for (let j = 0; j <= n; j++) dp[0][j] = j * 1.5;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = lineSimilarity(refBlocks[i - 1].text, userBlocks[j - 1].text);
      const matchCost = 2.0 * (1.0 - sim);

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + matchCost,
        dp[i - 1][j] + 1.5,
        dp[i][j - 1] + 1.5
      );
    }
  }

  const aligned = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = lineSimilarity(refBlocks[i - 1].text, userBlocks[j - 1].text);
      const matchCost = 2.0 * (1.0 - sim);

      if (dp[i][j] === dp[i - 1][j - 1] + matchCost) {
        if (sim >= 0.2) {
          aligned.unshift({
            type: 'match',
            ref: refBlocks[i - 1],
            user: userBlocks[j - 1],
            refIdx: i - 1,
            userIdx: j - 1
          });
          i--; j--;
          continue;
        }
      }
    }

    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1.5)) {
      aligned.unshift({
        type: 'missing',
        ref: refBlocks[i - 1],
        refIdx: i - 1
      });
      i--;
    } else {
      aligned.unshift({
        type: 'extra',
        user: userBlocks[j - 1],
        userIdx: j - 1
      });
      j--;
    }
  }

  return aligned;
}

export function generateDetailedAnalysis(originalText, attemptedText, options = {}) {
  const { durationSec = null, strict = false, originalHtml = null, attemptedHtml = null } = options;

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
   * ──────────────────────────────────────────────────────────── */
  const m = origTokens.length;
  const n = typedTokens.length;

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const origNorm  = normalise(origTokens[i - 1]);
      const typedNorm = normalise(typedTokens[j - 1]);

      const isExact = origNorm === typedNorm;

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + (isExact ? 0 : 1),
        dp[i - 1][j]     + 1,
        dp[i][j - 1]     + 1
      );
    }
  }

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

      if (isExact && dp[i][j] === diagCost) {
        ops.unshift({ op: 'MATCH', orig: origTokens[i - 1], typed: typedTokens[j - 1], origIdx: i - 1, typedIdx: j - 1 });
        i--; j--;
        continue;
      }

      if (dp[i][j] === diagCost && diagCost < deleteCost && diagCost < insertCost) {
        ops.unshift({ op: 'REPLACE', orig: origTokens[i - 1], typed: typedTokens[j - 1], origIdx: i - 1, typedIdx: j - 1 });
        i--; j--;
        continue;
      }
    }

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
   * ──────────────────────────────────────────────────────────── */
  const classifyReplace = (origWord, typedWord) => {
    const on = normalise(origWord);
    const tn = normalise(typedWord);
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

  ops.forEach((op) => {
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

  let formattingMistakes = 0;
  let formattingErrors = [];

  if (originalHtml && attemptedHtml && typeof DOMParser !== 'undefined') {
    try {
      const refBlocks = extractBlocksFromHtml(originalHtml);
      const userBlocks = extractBlocksFromHtml(attemptedHtml);
      const aligned = alignBlocks(refBlocks, userBlocks);

      aligned.forEach(item => {
        if (item.type === 'match') {
          const ref = item.ref;
          const user = item.user;
          const lineNum = item.refIdx + 1;

          // 1. Alignment check
          if (ref.alignment !== user.alignment) {
            formattingMistakes++;
            formattingErrors.push({
              lineIndex: item.refIdx,
              lineText: ref.text,
              type: 'alignment',
              expected: ref.alignment,
              actual: user.alignment,
              message: `Alignment mismatch: Expected '${ref.alignment}' but got '${user.alignment}'.`
            });
          }

          // 2. Bold check
          if (ref.bold !== user.bold) {
            formattingMistakes++;
            formattingErrors.push({
              lineIndex: item.refIdx,
              lineText: ref.text,
              type: 'bold',
              expected: ref.bold ? 'bold' : 'normal',
              actual: user.bold ? 'bold' : 'normal',
              message: `Bold format mismatch: Expected ${ref.bold ? 'bold' : 'normal'} text.`
            });
          }

          // 3. Italic check
          if (ref.italic !== user.italic) {
            formattingMistakes++;
            formattingErrors.push({
              lineIndex: item.refIdx,
              lineText: ref.text,
              type: 'italic',
              expected: ref.italic ? 'italic' : 'normal',
              actual: user.italic ? 'italic' : 'normal',
              message: `Italic format mismatch: Expected ${ref.italic ? 'italic' : 'normal'} text.`
            });
          }

          // 4. Underline check
          if (ref.underline !== user.underline) {
            formattingMistakes++;
            formattingErrors.push({
              lineIndex: item.refIdx,
              lineText: ref.text,
              type: 'underline',
              expected: ref.underline ? 'underlined' : 'normal',
              actual: user.underline ? 'underlined' : 'normal',
              message: `Underline format mismatch: Expected ${ref.underline ? 'underlined' : 'normal'} text.`
            });
          }
        }
      });
    } catch (err) {
      console.error('Error computing formatting analysis:', err);
    }
  }

  const totalMistakes         = missingCount + extraCount + spellingCount + capitalisationCount + formattingMistakes;
  const correctWords          = Math.max(0, totalWords - missingCount - spellingCount - capitalisationCount - formattingMistakes);

  const accuracy = totalWords === 0
    ? 0
    : parseFloat((Math.min(correctWords / totalWords, 1) * 100).toFixed(2));

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
      formattingMistakes,
      accuracy,
      wpm,
    },
    missingWords,
    extraWords,
    spellingMistakes,
    capitalisationMistakes,
    formattingErrors,
    wordDiff,
  };
}

export default generateDetailedAnalysis;
