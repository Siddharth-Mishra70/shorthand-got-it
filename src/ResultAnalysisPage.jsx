import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Download, Printer, ArrowLeft, CheckCircle2, XCircle,
  AlertTriangle, Type, MinusCircle, PlusCircle, Hash,
  FileText, TrendingUp, User, Calendar, Loader2,
  BarChart2, Eye, ChevronRight, Award, Zap, Target,
  BookOpen, RefreshCw, Clock,
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { fetchTestResult, fetchAllResults } from './lib/saveTestResult';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';
import TypingPracticeWidget from './TypingPracticeWidget';

// ─────────────────────────────────────────────────────────────────────────────
// Demo / fallback data
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  studentName: 'Rahul Verma',
  date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
  exercise: 'Kailash Chandra Vol. 1 — Exercise 3',
  speed: '80 WPM',
  duration: '10:00',
  totalWords: 203,
  userWords: 198,
  totalMistakes: 12,
  capitalMistakes: 3,
  spellingMistakes: 4,
  missingCount: 3,
  extraCount: 2,
  accuracy: 82.5,
  original:
    'This petition under Article 226 of the Constitution challenges the order dated 15th March, 2024 passed by the Education Department withdrawing recognition from Bright Future Public School on grounds of non-compliance with infrastructural norms, violation of natural justice, and provisions of the Right of Children to Free and Compulsory Education Act, 2009. The order was passed without prior notice, lacks proper facilities including adequate classroom space, and violates procedural requirements.',
  typed:
    'This petition under Article 226 of the Constitution challenges the order dated 15th March, 2024 passed by the education Department withdrawing recognition from Bright Future Public School on grounds of non-compliance with infrastructural norms, violation of natural justice, and provisions of Right of Children to Free and compulsory Education Act, 2009. The order was passed without prior notice, lacks proper facilites including adequate classroom space violates procedural requirements.',
  missingWords: ['the', 'and'],
  extraWords: [],
  spellingErrors: [
    { typed: 'facilites', correct: 'facilities' },
  ],
  capitalErrors: [
    { typed: 'education', correct: 'Education' },
    { typed: 'compulsory', correct: 'Compulsory' },
    { typed: 'department', correct: 'Department' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const stepTime = Math.max(10, duration / Math.abs(end - start));
    const step = (end - start) / (duration / stepTime);
    const timer = setInterval(() => {
      start += step;
      if ((step > 0 && start >= end) || (step < 0 && start <= end)) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(start * 10) / 10);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card with animation
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, value, label, valueColor, bg, border, suffix = '' }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border print:rounded-lg print:p-3 transition-transform hover:scale-105 ${bg} ${border}`}>
    <Icon className="w-5 h-5 mb-2 print:w-4 print:h-4" style={{ color: valueColor }} />
    <span className="text-2xl font-black print:text-xl" style={{ color: valueColor }}>
      <AnimatedNumber value={typeof value === 'string' ? parseFloat(value) || value : value} />
      {suffix}
    </span>
    <span className="text-xs font-semibold text-gray-500 text-center leading-tight mt-0.5">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Mistake List
// ─────────────────────────────────────────────────────────────────────────────
const MistakeList = ({ title, icon: Icon, iconColor, bg, border, items, columns = 1 }) => (
  <div className={`rounded-2xl border print:rounded-lg overflow-hidden ${border}`}>
    <div className={`flex items-center space-x-2 px-4 py-3 border-b print:py-2 ${bg} ${border}`}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
      <h4 className="font-black text-gray-800 text-sm">{title}</h4>
      <span
        className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: iconColor + '20', color: iconColor }}
      >
        {items.length}
      </span>
    </div>
    <div className="p-3 max-h-52 overflow-y-auto print:overflow-visible print:max-h-none">
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-gray-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" /> No errors in this category
        </div>
      ) : columns === 2 ? (
        <div>
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Typed (Wrong)</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Correct</span>
          </div>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-1">
                <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 line-through decoration-red-400">
                  {item.typed}
                </span>
                <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100">
                  {item.correct}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((word, i) => (
            <span
              key={i}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
              style={{ background: iconColor + '15', color: iconColor, border: `1px solid ${iconColor}30` }}
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Performance Gauge Ring
// ─────────────────────────────────────────────────────────────────────────────
const AccuracyGauge = ({ accuracy }) => {
  const pct = Math.min(100, Math.max(0, accuracy));
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : 'Needs Work';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease-in-out' }}
        />
      </svg>
      <div className="-mt-[86px] flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
        <span className="text-xs font-bold text-gray-500">{label}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mini Bar Chart for History
// ─────────────────────────────────────────────────────────────────────────────
const MiniBarChart = ({ history }) => {
  if (!history || history.length < 2) return null;
  const last8 = history.slice(0, 8).reverse();
  const maxWpm = Math.max(...last8.map(h => h.wpm || 0), 1);

  return (
    <div className="flex items-end gap-1.5 h-14">
      {last8.map((h, i) => {
        const heightPct = ((h.wpm || 0) / maxWpm) * 100;
        const isLast = i === last8.length - 1;
        return (
          <div key={h.id || i} className="flex flex-col items-center flex-1 group relative">
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max(4, heightPct)}%`,
                background: isLast
                  ? 'linear-gradient(180deg, #1e3a8a, #3b82f6)'
                  : 'linear-gradient(180deg, #93c5fd, #bfdbfe)',
              }}
            />
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {h.wpm} WPM
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detailed Word-by-Word Highlighted Comparison Tool
// ─────────────────────────────────────────────────────────────────────────────
const HighlightedComparison = ({ originalText, attemptedText }) => {
  if (!originalText) return null;
  const origWords = originalText.trim().split(/\s+/);
  const typedWords = (attemptedText || '').trim().split(/\s+/);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm leading-10 text-[17px] font-medium font-mono text-gray-800 break-words mb-4">
      {origWords.map((origWord, index) => {
        const typedWord = typedWords[index];

        // 1. Missing Word
        if (typedWord === undefined) {
          return (
            <span key={index} className="inline-block bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded mr-1 shadow-sm border border-amber-200" title={`Missing Word: ${origWord}`}>
              {origWord}
            </span>
          );
        }

        // 2. Exact Match
        if (origWord === typedWord) {
          return (
            <span key={index} className="inline-block text-gray-700 px-1 mr-1">
              {typedWord}
            </span>
          );
        }

        // 3. Half Mistake (Formatting)
        const cleanOrig = origWord.replace(/[^\w\s]/g, '').toLowerCase();
        const cleanTyped = typedWord.replace(/[^\w\s]/g, '').toLowerCase();

        if (cleanOrig === cleanTyped) {
          return (
            <span key={index} className="inline-block bg-blue-50 text-[#1e3a8a] font-bold px-2 py-0.5 rounded mr-1 shadow-sm border border-blue-200" title={`Formatting/Case. Expected: ${origWord}`}>
              {typedWord}
            </span>
          );
        }

        // 4. Full Mistake (Wrong spelling)
        return (
          <span key={index} className="inline-block bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded mr-1 shadow-sm border border-red-200 line-through decoration-red-400" title={`Wrong. Expected: ${origWord}`}>
            {typedWord}
          </span>
        );
      })}

      {/* 5. Extra Words */}
      {typedWords.slice(origWords.length).map((extraWord, idx) => (
        <span key={`extra-${idx}`} className="inline-block bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded mr-1 shadow-sm border border-purple-200" title="Extra Word">
          {extraWord}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const ResultAnalysisPage = ({ data: propData, attemptId, onBack, user }) => {
  const reportRef = useRef(null);
  const [liveData, setLiveData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(!!attemptId);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');  // 'overview' | 'comparison' | 'history' | 'practice'

  // ── Fetch real attempt from Supabase if attemptId is given ──
  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);

    fetchTestResult(supabase, attemptId)
      .then(async (row) => {
        // 1. Extract attempted_text from mistakes_data JSONB
        const attemptedText = row.mistakes_data?.attempted_text ?? row.attempted_text ?? '';

        // 2. Fetch original_text from mistakes_data or exercises table
        let originalText = row.mistakes_data?.original_text ?? '';
        let exerciseTitle = row.exercise_id ?? '—';

        // If no original text in mistakes_data, try fetching from exercises table (UUID check)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.exercise_id);
        
        if (!originalText && isUUID) {
          try {
            const { data: ex, error: exErr } = await supabase
              .from('exercises')
              .select('title, original_text')
              .eq('id', row.exercise_id)
              .single();
            if (!exErr && ex) {
              originalText = ex.original_text ?? '';
              exerciseTitle = ex.title ?? exerciseTitle;
            }
          } catch (_) {
            console.warn('[ResultAnalysisPage] Could not fetch exercise original_text');
          }
        }

        // 3. Map → component data shape
        setLiveData({
          studentName:      row.student_name ?? row.mistakes_data?.student_name ?? user?.name ?? 'Student',
          date:             new Date(row.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            }),
          exercise:         exerciseTitle,
          speed:            `${row.wpm} WPM`,
          wpm:              row.wpm ?? 0,
          duration:         '—',
          totalWords:       originalText.trim().split(/\s+/).filter(Boolean).length,
          userWords:        attemptedText.trim().split(/\s+/).filter(Boolean).length,
          totalMistakes:    row.total_mistakes     ?? row.mistakes_count ?? 0,
          capitalMistakes:  row.capital_mistakes   ?? 0,
          spellingMistakes: row.spelling_mistakes  ?? 0,
          missingCount:     row.missing_count      ?? 0,
          extraCount:       row.extra_count        ?? 0,
          accuracy:         row.accuracy           ?? 0,
          original:         originalText,
          typed:            attemptedText,
          missingWords:     row.missing_words      ?? [],
          extraWords:       row.extra_words        ?? [],
          spellingErrors:   row.spelling_errors    ?? [],
          capitalErrors:    row.capital_errors     ?? [],
        });
      })
      .catch((err) => {
        console.error('[ResultAnalysisPage] fetch error:', err);
        setLoadError(err.message);
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  // ── Fetch History ──
  useEffect(() => {
    setLoadingHistory(true);
    const userId = user?.id ?? '00000000-0000-0000-0000-000000000000';
    fetchAllResults(supabase, userId)
      .then(async (rows) => {
        // Enrich with exercise titles from Supabase
        const enriched = await Promise.all(rows.map(async (r) => {
          if (!r.exercise_id || r.exercise_id.startsWith('kc-') || r.exercise_id.startsWith('ssc-')) {
            return { ...r, exerciseTitle: r.exercise_id ?? 'Exercise' };
          }
          try {
            const { data: ex } = await supabase
              .from('exercises')
              .select('title')
              .eq('id', r.exercise_id)
              .single();
            return { ...r, exerciseTitle: ex?.title ?? 'Exercise' };
          } catch {
            return { ...r, exerciseTitle: 'Exercise' };
          }
        }));
        setHistory(enriched);
      })
      .catch(err => console.error('History fetch error:', err))
      .finally(() => setLoadingHistory(false));
  }, [attemptId, user]);

  // Resolved data: live DB > prop > demo
  const data = liveData ?? propData ?? DEMO_DATA;
  const handlePrint = () => window.print();

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 animate-spin" />
            <div className="absolute inset-2 bg-blue-900/50 rounded-full flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="font-black text-white text-lg">Analysing your result…</p>
          <p className="text-blue-300/70 text-sm mt-1">Fetching from Shorthandians database</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Couldn't Load Result</h2>
          <p className="text-gray-500 text-sm mb-6">{loadError}</p>
          {onBack && (
            <button onClick={onBack} className="bg-[#1e3a8a] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Derive stats ──
  const accuracyNum = parseFloat(data.accuracy) || 0;
  const accColor = accuracyNum >= 80 ? '#16a34a' : accuracyNum >= 60 ? '#d97706' : '#dc2626';
  const accGradient = accuracyNum >= 80
    ? 'linear-gradient(90deg, #16a34a, #22c55e)'
    : accuracyNum >= 60
    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
    : 'linear-gradient(90deg, #dc2626, #ef4444)';

  const perfBadge = accuracyNum >= 90 ? { label: 'Outstanding', color: '#7c3aed', bg: '#f3e8ff' }
    : accuracyNum >= 80 ? { label: 'Excellent', color: '#16a34a', bg: '#dcfce7' }
    : accuracyNum >= 70 ? { label: 'Good', color: '#0369a1', bg: '#e0f2fe' }
    : accuracyNum >= 60 ? { label: 'Average', color: '#d97706', bg: '#fef3c7' }
    : { label: 'Needs Practice', color: '#dc2626', bg: '#fee2e2' };

  const stats = [
    { icon: Hash,         value: data.totalWords,     label: 'Total Words',       valueColor: '#1e3a8a', bg: 'bg-blue-50',   border: 'border-blue-100' },
    { icon: FileText,     value: data.userWords,       label: 'Words Typed',       valueColor: '#0369a1', bg: 'bg-sky-50',    border: 'border-sky-100' },
    { icon: XCircle,      value: data.totalMistakes,   label: 'Total Mistakes',    valueColor: '#dc2626', bg: 'bg-red-50',    border: 'border-red-100' },
    { icon: AlertTriangle,value: data.capitalMistakes, label: 'Capital Errors',    valueColor: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-100' },
    { icon: Type,         value: data.spellingMistakes,label: 'Spelling Errors',   valueColor: '#7c3aed', bg: 'bg-purple-50', border: 'border-purple-100' },
    { icon: TrendingUp,   value: data.accuracy,        label: 'Accuracy',          valueColor: accColor,  bg: 'bg-green-50',  border: 'border-green-100', suffix: '%' },
  ];

  const mistakeSections = [
    { title: 'Missing Words',           icon: MinusCircle,   iconColor: '#dc2626', bg: 'bg-red-50',    border: 'border-red-100',    items: data.missingWords,   columns: 1 },
    { title: 'Extra Words',             icon: PlusCircle,    iconColor: '#16a34a', bg: 'bg-green-50',  border: 'border-green-100',  items: data.extraWords,     columns: 1 },
    { title: 'Spelling Mistakes',       icon: Type,          iconColor: '#7c3aed', bg: 'bg-purple-50', border: 'border-purple-100', items: data.spellingErrors, columns: 2 },
    { title: 'Capitalisation Mistakes', icon: AlertTriangle, iconColor: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-100',  items: data.capitalErrors,  columns: 2 },
  ];

  const tabs = [
    { id: 'overview',    label: 'Overview',    icon: BarChart2 },
    { id: 'comparison',  label: 'Comparison',  icon: Eye },
    { id: 'history',     label: 'History',     icon: Clock },
    { id: 'practice',    label: 'Practice',    icon: BookOpen },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-100 print:bg-white">

      {/* ── Sticky Action Bar ─────────────────────────────────── */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-500 hover:text-[#1e3a8a] font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          )}

          {/* Tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 mx-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === id
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 border-2 border-gray-200 text-gray-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] font-bold px-3 py-2 rounded-xl transition-colors text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-[#1e3a8a] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Printable Report Wrapper ───────────────────────────── */}
      <div
        ref={reportRef}
        id="printable-report"
        className="max-w-5xl mx-auto my-6 print:my-0 bg-white rounded-3xl shadow-xl print:shadow-none print:rounded-none overflow-hidden"
      >
        {/* ── Gradient Header ────────────────────────────────── */}
        <div
          className="px-8 py-8 print:py-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 60%, #1a56db 100%)' }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center font-black text-blue-900 text-3xl shadow-xl">
                S
              </div>
              <div>
                <h1 className="text-2xl font-black text-white leading-tight print:text-lg">Shorthandians</h1>
                <p className="text-blue-200 text-sm font-medium tracking-wide">Detailed Analysis Report</p>
              </div>
            </div>

            {/* Performance Badge */}
            <div
              className="print:hidden flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
            >
              <Award className="w-5 h-5 text-amber-300" />
              <div>
                <p className="text-white font-black text-sm leading-none">{perfBadge.label}</p>
                <p className="text-blue-200 text-[11px] font-semibold leading-none mt-0.5">Performance</p>
              </div>
            </div>
          </div>

          {/* Meta info row */}
          <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: User,       label: 'Student',  value: data.studentName },
              { icon: Calendar,   label: 'Date',     value: data.date },
              { icon: FileText,   label: 'Exercise', value: data.exercise },
              { icon: Zap,        label: 'Speed',    value: data.speed },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 print:py-2">
                <div className="flex items-center space-x-1.5 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </div>
                <p className="text-white font-bold text-sm truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body Content ──────────────────────────────────────── */}
        <div className="px-6 sm:px-8 py-8 print:py-6 space-y-8 print:space-y-5">

          {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
          {(activeTab === 'overview' || typeof window === 'undefined') && (
            <div className="space-y-8 print:space-y-5">

              {/* ── Performance Snapshot ─────────────────────────── */}
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 print:mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1e3a8a]" /> Performance Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Accuracy Gauge */}
                  <div className="sm:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
                    <AccuracyGauge accuracy={accuracyNum} />
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Overall Accuracy</p>
                  </div>

                  {/* Stats Grid 2x2 */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    {[
                      { icon: Hash,         label: 'Total Words',    value: data.totalWords,      color: '#1e3a8a', bg: '#eff6ff' },
                      { icon: CheckCircle2, label: 'Words Typed',    value: data.userWords,       color: '#0369a1', bg: '#f0f9ff' },
                      { icon: XCircle,      label: 'Total Mistakes', value: data.totalMistakes,   color: '#dc2626', bg: '#fef2f2' },
                      { icon: TrendingUp,   label: 'WPM',            value: data.wpm ?? (parseFloat(data.speed) || 0), color: '#7c3aed', bg: '#faf5ff' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                      <div key={label} className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3" style={{ background: bg }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-2xl font-black leading-none" style={{ color }}>
                            <AnimatedNumber value={value} />
                          </p>
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Stats Grid ───────────────────────────────────── */}
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 print:mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#1e3a8a]" /> Full Statistics
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 print:gap-2">
                  {stats.map((s) => <StatCard key={s.label} {...s} />)}
                </div>

                {/* Accuracy bar */}
                <div className="mt-4 print:mt-3 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between text-sm font-bold text-gray-600 mb-2">
                    <span>Overall Accuracy Progress</span>
                    <span style={{ color: accColor }}>{accuracyNum}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 relative"
                      style={{ width: `${accuracyNum}%`, background: accGradient }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                    <span>0%</span>
                    <span>60% — Pass</span>
                    <span>80% — Good</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* ── Mistake Breakdown ─────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-4 print:mb-2">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" /> Detailed Mistake Breakdown
                  </h2>
                  <span className="text-xs bg-red-50 text-red-600 font-black px-3 py-1 rounded-full border border-red-100">
                    {data.totalMistakes} total errors
                  </span>
                </div>

                {/* Mistake type progress bars */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-4">
                  {[
                    { label: 'Spelling Errors',        count: data.spellingMistakes ?? 0,  total: data.totalWords || 1, color: '#7c3aed' },
                    { label: 'Capitalisation Errors',  count: data.capitalMistakes ?? 0,   total: data.totalWords || 1, color: '#d97706' },
                    { label: 'Missing Words',           count: data.missingCount    ?? (data.missingWords?.length ?? 0), total: data.totalWords || 1, color: '#dc2626' },
                    { label: 'Extra Words',             count: data.extraCount      ?? (data.extraWords?.length ?? 0),   total: data.totalWords || 1, color: '#0891b2' },
                  ].map(({ label, count, total, color }) => (
                    <div key={label} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                        <span>{label}</span>
                        <span style={{ color }}>{count} words</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (count / total) * 100)}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-3">
                  {mistakeSections.map((sec) => <MistakeList key={sec.title} {...sec} />)}
                </div>
              </div>

            </div>
          )}

          {/* ══ COMPARISON TAB ════════════════════════════════════ */}
          {activeTab === 'comparison' && (
            <div className="print:hidden space-y-5">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1e3a8a]" /> Detailed Mistake Breakdown
              </h2>
              
              {/* Legend map */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs font-bold font-mono">
                 <span className="text-gray-600 px-2 py-1 rounded">Correct</span>
                 <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded line-through decoration-red-400">Incorrect</span>
                 <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded">Missing</span>
                 <span className="bg-blue-50 text-[#1e3a8a] border border-blue-200 px-2 py-1 rounded">Capital/Format</span>
                 <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded">Extra Word</span>
              </div>

              {data.original ? (
                <HighlightedComparison
                  originalText={data.original}
                  attemptedText={data.typed}
                />
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Original text not available for comparison.</p>
                  <p className="text-gray-400 text-sm mt-1">The exercise text could not be fetched from the database.</p>
                </div>
              )}
            </div>
          )}

          {/* Print-only comparison UI Upgrade */}
          <div className="hidden print:block space-y-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Detailed Visual Breakdown</h2>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50/50">
              <HighlightedComparison
                  originalText={data.original}
                  attemptedText={data.typed}
              />
            </div>
          </div>

          {/* ══ HISTORY TAB ═══════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="print:hidden space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1e3a8a]" /> Performance History
                </h2>
                <span className="text-xs bg-blue-50 text-[#1e3a8a] font-black px-3 py-1 rounded-full border border-blue-100">
                  {history.length} attempts
                </span>
              </div>

              {/* Mini WPM Chart */}
              {history.length >= 2 && (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">WPM Trend (Last 8)</p>
                  <MiniBarChart history={history} />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                    <span>Oldest</span>
                    <span>Latest →</span>
                  </div>
                </div>
              )}

              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((h, idx) => {
                    const isCurrent = h.id === attemptId;
                    const accNum = parseFloat(h.accuracy) || 0;
                    const hColor = accNum >= 80 ? '#16a34a' : accNum >= 60 ? '#d97706' : '#dc2626';
                    return (
                      <div
                        key={h.id}
                        className={`rounded-2xl border p-4 flex items-center justify-between group transition-all hover:shadow-md ${
                          isCurrent
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-gray-100 bg-white hover:border-blue-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${
                            isCurrent ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white' : 'bg-white border-gray-100 text-[#1e3a8a]'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800 leading-tight">
                              {h.exerciseTitle || h.exercise_id || 'Exercise'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-bold">
                                {new Date(h.created_at).toLocaleDateString('en-IN')}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-[10px] font-bold" style={{ color: hColor }}>{h.accuracy}% acc</span>
                              {isCurrent && (
                                <span className="text-[10px] font-black bg-[#1e3a8a] text-white px-1.5 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-black" style={{ color: '#1e3a8a' }}>{h.wpm}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">WPM</p>
                          </div>
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border"
                            style={{ background: hColor + '15', color: hColor, borderColor: hColor + '30' }}
                          >
                            {h.accuracy}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No past attempts found.</p>
                  <p className="text-gray-400 text-sm mt-1">Complete a test to see your history here.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ PRACTICE TAB ══════════════════════════════════════ */}
          {activeTab === 'practice' && (
            <div className="print:hidden space-y-4">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1e3a8a]" /> Practice This Passage
              </h2>
              {data.original ? (
                <TypingPracticeWidget
                  originalText={data.original}
                  exerciseTitle={data.exercise}
                />
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No passage available to practice.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-6 print:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a8a] to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <div>
                <p className="font-black text-[#1e3a8a] text-sm">Shorthandians</p>
                <p className="text-gray-400 text-xs">Under the guidance of Ayush Pandey · Prayagraj</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs text-center">
              Generated on {data.date} · shorthandians.in · 7080811235
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysisPage;
