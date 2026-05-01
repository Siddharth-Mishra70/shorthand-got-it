import { generateDetailedAnalysis } from '../generateDetailedAnalysis.js';

let passed = 0, failed = 0;
const assert = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
};

console.log('\n=== generateDetailedAnalysis unit tests ===\n');

// TEST 1 - Perfect match
{
  console.log('TEST 1: Perfect match');
  const r = generateDetailedAnalysis('Hello world test', 'Hello world test');
  assert('accuracy = 100',           r.summary.accuracy === 100, `got ${r.summary.accuracy}`);
  assert('totalMistakes = 0',        r.summary.totalMistakes === 0, `got ${r.summary.totalMistakes}`);
  assert('missingCount = 0',         r.summary.missingCount === 0);
  assert('extraCount = 0',           r.summary.extraCount === 0);
  assert('spellingCount = 0',        r.summary.spellingCount === 0);
  assert('capitalisationCount = 0',  r.summary.capitalisationCount === 0);
  assert('wordDiff all correct',     r.wordDiff.every(t => t.type === 'correct'));
  console.log();
}

// TEST 2 - Capitalisation mistake
{
  console.log('TEST 2: Capitalisation mistake');
  const r = generateDetailedAnalysis('The Court passed the order', 'The court passed the order');
  assert('capitalisationCount = 1',  r.summary.capitalisationCount === 1, JSON.stringify(r.capitalisationMistakes));
  assert('typed = "court"',          r.capitalisationMistakes[0]?.typed === 'court');
  assert('correct = "Court"',        r.capitalisationMistakes[0]?.correct === 'Court');
  assert('spellingCount = 0',        r.summary.spellingCount === 0);
  assert('wordDiff has capital',     r.wordDiff.some(t => t.type === 'capital'));
  console.log();
}

// TEST 3 - Spelling mistake
{
  console.log('TEST 3: Spelling mistake');
  const r = generateDetailedAnalysis(
    'The petitioner seeks quashing of the order',
    'The petitioner seeks quarching of the order',
  );
  assert('spellingCount = 1',        r.summary.spellingCount === 1, JSON.stringify(r.spellingMistakes));
  assert('typed = "quarching"',      r.spellingMistakes[0]?.typed === 'quarching');
  assert('correct = "quashing"',     r.spellingMistakes[0]?.correct === 'quashing');
  console.log();
}

// TEST 4 - Missing word
{
  console.log('TEST 4: Missing word (skipped mid-sentence)');
  const r = generateDetailedAnalysis(
    'This petition under the Constitution challenges the order',
    'This petition under Constitution challenges the order',
  );
  assert('missingCount = 1',         r.summary.missingCount === 1, JSON.stringify(r.missingWords));
  assert('missing word = "the"',     r.missingWords[0]?.word === 'the');
  assert('correct words >= 5',       r.wordDiff.filter(t => t.type === 'correct').length >= 5);
  console.log();
}

// TEST 5 - Extra word
{
  console.log('TEST 5: Extra word inserted');
  const r = generateDetailedAnalysis(
    'The order was passed without prior notice',
    'The order was passed without prior proper notice',
  );
  assert('extraCount = 1',           r.summary.extraCount === 1, JSON.stringify(r.extraWords));
  assert('extra word = "proper"',    r.extraWords[0]?.word === 'proper');
  console.log();
}

// TEST 6 - Mixed errors
{
  console.log('TEST 6: Mixed errors');
  const orig  = 'The Education Department passed the Compulsory order for the children';
  const typed = 'The education Department passed Compulsory order for children having';
  const r = generateDetailedAnalysis(orig, typed);
  console.log('  capitalisation:', JSON.stringify(r.capitalisationMistakes));
  console.log('  missing:', JSON.stringify(r.missingWords));
  console.log('  extra:', JSON.stringify(r.extraWords));
  assert('capitalisationCount >= 1', r.summary.capitalisationCount >= 1);
  assert('missingCount >= 1',        r.summary.missingCount >= 1);
  assert('extraCount >= 1',          r.summary.extraCount >= 1);
  assert('totalMistakes > 0',        r.summary.totalMistakes > 0);
  assert('accuracy < 100',           r.summary.accuracy < 100);
  console.log();
}

// TEST 7 - WPM
{
  console.log('TEST 7: WPM calculation');
  const words = Array(120).fill('word').join(' ');
  const r = generateDetailedAnalysis(words, words, { durationSec: 60 });
  assert('wpm = 120', r.summary.wpm === 120, `got: ${r.summary.wpm}`);
  console.log();
}

// TEST 8 - Punctuation
{
  console.log('TEST 8: Punctuation stripped (strict=false)');
  const r = generateDetailedAnalysis('Hello, world. How are you?', 'Hello, world. How are you?');
  assert('no mistakes', r.summary.totalMistakes === 0, JSON.stringify(r.spellingMistakes));
  console.log();
}

// TEST 9 - Empty
{
  console.log('TEST 9: Empty strings');
  const r = generateDetailedAnalysis('', '');
  assert('accuracy = 0',       r.summary.accuracy === 0);
  assert('totalMistakes = 0',  r.summary.totalMistakes === 0);
  console.log();
}

console.log('===========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('===========================================\n');
if (failed > 0) process.exit(1);
