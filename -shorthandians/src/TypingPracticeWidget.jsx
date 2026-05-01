import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, RotateCcw, Send, Timer,
  CheckCircle2, AlertCircle, BookOpen, Keyboard,
  TrendingUp, Eye, EyeOff,
} from 'lucide-react';
import { generateDetailedAnalysis } from './lib/generateDetailedAnalysis';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// TypingPracticeWidget
// Props:
//   originalText  {string}  The passage to type
//   exerciseTitle {string}  Exercise name shown in header
//   onResult      {fn}      Called with analysis result after submission
// ─────────────────────────────────────────────────────────────────────────────
const TypingPracticeWidget = ({
  originalText = '',
  exerciseTitle = 'Practice Session',
  onResult,
}) => {
  // ── State ──────────────────────────────────────────────────
  const [phase,    setPhase]    = useState('idle');     // idle | typing | done
  const [typed,    setTyped]    = useState('');
  const [elapsed,  setElapsed]  = useState(0);          // seconds
  const [analysis, setAnalysis] = useState(null);
  const [showOrig, setShowOrig] = useState(true);

  const textareaRef = useRef(null);
  const timerRef    = useRef(null);
  const startedAt   = useRef(null);

  // ── Timer ──────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    startedAt.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Handlers ───────────────────────────────────────────────
  const handleStart = () => {
    setPhase('typing');
    setTyped('');
    setElapsed(0);
    setAnalysis(null);
    startTimer();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleReset = () => {
    stopTimer();
    setPhase('idle');
    setTyped('');
    setElapsed(0);
    setAnalysis(null);
  };

  const handleTyping = (e) => {
    setTyped(e.target.value);
  };

  const handleSubmit = () => {
    if (!typed.trim()) return;
    stopTimer();
    setPhase('done');

    const result = generateDetailedAnalysis(originalText, typed, {
      durationSec: elapsed || 1,
    });
    setAnalysis(result);
    onResult?.(result, typed, elapsed);
  };

  // Submit on Ctrl+Enter
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleSubmit();
  };

  // ── WPM live preview (while typing) ───────────────────────
  const liveWpm = elapsed > 0
    ? Math.round((typed.trim().split(/\s+/).filter(Boolean).length / elapsed) * 60)
    : 0;

  const typedWordCount = typed.trim() === '' ? 0 : typed.trim().split(/\s+/).filter(Boolean).length;
  const origWordCount  = originalText.trim().split(/\s+/).filter(Boolean).length;
  const progress       = Math.min((typedWordCount / origWordCount) * 100, 100);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-3xl border border-[#1e3a8a]/20 bg-white shadow-xl overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 60%, #1a56db 100%)' }}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <h2 className="text-white font-black text-base leading-tight">Type & Analyse</h2>
            <p className="text-blue-200 text-xs font-medium">{exerciseTitle}</p>
          </div>
        </div>

        {/* Timer badge */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg tabular-nums
            ${phase === 'typing' ? 'bg-amber-400 text-blue-900 shadow-lg shadow-amber-500/30 animate-pulse' : 'bg-white/15 text-white'}`}>
            <Timer className="w-4 h-4 flex-shrink-0" />
            {formatTime(elapsed)}
          </div>
          {phase === 'typing' && (
            <div className="flex items-center gap-1.5 bg-green-400/20 px-3 py-2 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5 text-green-300" />
              <span className="text-green-200 font-black text-sm">{liveWpm} WPM</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">

        {/* ── Progress bar (shown while typing) ────────────── */}
        {phase === 'typing' && (
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{typedWordCount} / {origWordCount} words</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Reference Passage ─────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1e3a8a]" />
              <span className="text-sm font-black text-gray-700">Original Passage</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {origWordCount} words
              </span>
            </div>
            <button
              onClick={() => setShowOrig(v => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1e3a8a] transition-colors"
            >
              {showOrig ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showOrig ? 'Hide' : 'Show'}
            </button>
          </div>

          {showOrig && (
            <div className="p-4 text-sm text-gray-700 leading-8 font-mono bg-blue-50/30 select-none">
              {originalText}
            </div>
          )}
        </div>

        {/* ── Typing Area ───────────────────────────────────── */}
        {phase !== 'idle' && (
          <div className="rounded-2xl border-2 overflow-hidden transition-colors duration-200"
            style={{ borderColor: phase === 'typing' ? '#1e3a8a' : '#e5e7eb' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-black text-gray-700">Your Answer</span>
              <span className="ml-auto text-[10px] text-gray-400 font-medium">Ctrl+Enter to submit</span>
            </div>
            <textarea
              ref={textareaRef}
              value={typed}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              disabled={phase === 'done'}
              rows={7}
              placeholder="Type the passage here… (Ctrl+Enter to submit)"
              className="w-full p-4 text-sm font-mono text-gray-800 leading-8 resize-none focus:outline-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        )}

        {/* ── Idle card ─────────────────────────────────────── */}
        {phase === 'idle' && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Keyboard className="w-8 h-8 text-[#1e3a8a]" />
            </div>
            <p className="text-gray-500 text-sm font-medium max-w-xs">
              Click <strong>"Start Practice"</strong> below to begin the timer and type the passage above.
            </p>
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {phase === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/25 text-sm"
            >
              <Play className="w-4 h-4" />
              Start Practice
            </button>
          )}

          {phase === 'typing' && (
            <>
              <button
                onClick={handleSubmit}
                disabled={!typed.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-green-500/25 text-sm"
              >
                <Send className="w-4 h-4" />
                Submit & Analyse
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 border-2 border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-500 font-bold px-5 py-3 rounded-2xl transition-colors text-sm"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {phase === 'done' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 font-black px-6 py-3 rounded-2xl transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>

        {/* ── Result Analysis Panel ─────────────────────────── */}
        {phase === 'done' && analysis && (
          <div className="space-y-4">
            {/* Quick score strip */}
            <div
              className="flex flex-wrap gap-4 items-center px-5 py-4 rounded-2xl"
              style={{ background: analysis.summary.accuracy >= 80 ? '#f0fdf4' : analysis.summary.accuracy >= 60 ? '#fffbeb' : '#fef2f2' }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="w-8 h-8 flex-shrink-0"
                  style={{ color: analysis.summary.accuracy >= 80 ? '#16a34a' : analysis.summary.accuracy >= 60 ? '#d97706' : '#dc2626' }}
                />
                <div>
                  <p className="font-black text-gray-900 text-xl">{analysis.summary.accuracy}%</p>
                  <p className="text-gray-500 text-xs font-medium">Accuracy</p>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {[
                  { label: 'Time',        value: formatTime(elapsed),                     color: '#1e3a8a' },
                  { label: 'WPM',         value: analysis.summary.wpm ?? '—',             color: '#7c3aed' },
                  { label: 'Mistakes',    value: analysis.summary.totalMistakes,          color: '#dc2626' },
                  { label: 'Correct',     value: analysis.summary.correctWords,           color: '#16a34a' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className="font-black text-lg" style={{ color }}>{value}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full word-level comparison */}
            <div>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">
                Word-by-Word Analysis
              </h3>
              <DetailedAnalysisPanel
                originalText={originalText}
                attemptedText={typed}
                durationSec={elapsed}
                title="Your Result"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TypingPracticeWidget;
