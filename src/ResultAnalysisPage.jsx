import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Download, Printer, ArrowLeft, CheckCircle2, XCircle,
  AlertTriangle, Type, MinusCircle, PlusCircle, Hash,
  FileText, TrendingUp, User, Calendar, Loader2,
  BarChart2, Eye, ChevronRight, Award, Zap, Target,
  BookOpen, RefreshCw, Clock, Maximize, Minimize, Gavel
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { fetchTestResult, fetchAllResults } from './lib/saveTestResult';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';
import TypingPracticeWidget from './TypingPracticeWidget';
import { generateDetailedAnalysis } from './lib/generateDetailedAnalysis';

// ─────────────────────────────────────────────────────────────────────────────
// Demo / fallback data
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  studentName: 'My Performance',
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
const StatCard = ({ icon: Icon, value, label, valueColor, suffix = '' }) => (
  <div className="bg-white flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 shadow-sm print:rounded-lg print:p-3 transition-all hover:-translate-y-1 hover:shadow-md group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: valueColor + '10' }}>
      <Icon className="w-5 h-5 print:w-4 print:h-4" style={{ color: valueColor }} />
    </div>
    <span className="text-2xl font-black text-slate-800 print:text-xl">
      <AnimatedNumber value={typeof value === 'string' ? parseFloat(value) || value : value} />
      <span className="text-sm opacity-70 ml-0.5">{suffix}</span>
    </span>
    <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest mt-1">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Mistake List
// ─────────────────────────────────────────────────────────────────────────────
const MistakeList = ({ title, icon: Icon, iconColor, items, columns = 1 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm print:rounded-lg overflow-hidden flex flex-col">
    <div className="flex items-center space-x-3 px-5 py-4 border-b border-slate-100 print:py-2">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconColor + '15' }}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
      </div>
      <h4 className="font-bold text-slate-700 text-sm tracking-tight">{title}</h4>
      <span
        className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest"
        style={{ background: iconColor + '10', color: iconColor }}
      >
        {items.length} Errors
      </span>
    </div>
    <div className="p-5 max-h-64 overflow-y-auto print:overflow-visible print:max-h-none flex-1 bg-slate-50/30">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm font-medium">
          <CheckCircle2 className="w-8 h-8 mb-2 text-green-400 opacity-50" />
          <span>No errors in this category</span>
        </div>
      ) : columns === 2 ? (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Typed (Wrong)</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Correct</span>
          </div>
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <span className="text-[13px] font-semibold px-3 py-2 rounded-xl bg-red-50/80 text-red-700 border border-red-100/50 line-through decoration-red-300 shadow-sm">
                  {item.typed}
                </span>
                <span className="text-[13px] font-semibold px-3 py-2 rounded-xl bg-green-50/80 text-green-700 border border-green-100/50 shadow-sm">
                  {item.correct}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((word, i) => (
            <span
              key={i}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-xl border shadow-sm"
              style={{ background: iconColor + '08', color: iconColor, borderColor: iconColor + '20' }}
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
  const pct = Math.min(100, Math.max(0, parseFloat(accuracy) || 0));
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : 'Needs Work';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</span>
        </div>
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
                  ? 'linear-gradient(180deg, #0d6e70, #06b6d4)'
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
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 leading-[2.5] text-[17px] font-medium font-sans text-slate-700 break-words mb-4">
      {origWords.map((origWord, index) => {
        const typedWord = typedWords[index];

        // 1. Missing Word
        if (typedWord === undefined) {
          return (
            <span key={index} className="inline-block border-b-2 border-amber-400 bg-amber-50/50 text-amber-700 px-1 mx-0.5 rounded-sm" title={`Missing Word: ${origWord}`}>
              {origWord}
            </span>
          );
        }

        // 2. Exact Match
        if (origWord === typedWord) {
          return (
            <span key={index} className="inline-block text-slate-600 px-1 mx-0.5">
              {typedWord}
            </span>
          );
        }

        // 3. Half Mistake (Formatting)
        const cleanOrig = origWord.replace(/[^\w\s]/g, '').toLowerCase();
        const cleanTyped = typedWord.replace(/[^\w\s]/g, '').toLowerCase();

        if (cleanOrig === cleanTyped) {
          return (
            <span key={index} className="inline-block border-b-2 border-blue-400 bg-blue-50/50 text-blue-700 px-1 mx-0.5 rounded-sm" title={`Formatting/Case. Expected: ${origWord}`}>
              {typedWord}
            </span>
          );
        }

        // 4. Full Mistake (Wrong spelling)
        return (
          <span key={index} className="inline-block border-b-2 border-red-400 bg-red-50/50 text-red-700 line-through decoration-red-400 px-1 mx-0.5 rounded-sm" title={`Wrong. Expected: ${origWord}`}>
            {typedWord}
          </span>
        );
      })}

      {/* 5. Extra Words */}
      {typedWords.slice(origWords.length).map((extraWord, idx) => (
        <span key={`extra-${idx}`} className="inline-block border-b-2 border-purple-400 bg-purple-50/50 text-purple-700 px-1 mx-0.5 rounded-sm" title="Extra Word">
          {extraWord}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const ResultAnalysisPage = ({ data: propData, attemptId, onBack, user, onNavigateToTest }) => {
  const reportRef = useRef(null);
  const [currentAttemptId, setCurrentAttemptId] = useState(attemptId);
  const [liveData, setLiveData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(!!attemptId);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');  // 'overview' | 'comparison' | 'history' | 'practice'
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // ── Sync prop changes ──
  useEffect(() => {
    setCurrentAttemptId(attemptId);
  }, [attemptId]);

  // ── Fetch real attempt from Supabase if attempting ID is given ──
  useEffect(() => {
    if (!currentAttemptId) return;
    setLoading(true);

    fetchTestResult(supabase, currentAttemptId, user?.id)
      .then(async (row) => {
        // 1. Extract attempted_text from mistakes_data JSONB
        const attemptedText = row.mistakes_data?.attempted_text ?? row.attempted_text ?? '';

        // 2. Fetch original_text from mistakes_data or exercises table
        let originalText = row.mistakes_data?.original_text ?? '';
        let originalHtml = null;
        let exerciseTitle = row.mistakes_data?.exercise_title || row.exercise_id || '—';

        // If no original text in mistakes_data, try fetching from exercises table (UUID check)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.exercise_id);
        
        // If exercise_id is a UUID, always fetch the authoritative exercise details (specifically formatted_html)
        if (isUUID) {
          try {
            const { data: ex, error: exErr } = await supabase
              .from('exercises')
              .select('title, original_text, formatted_html')
              .eq('id', row.exercise_id)
              .single();
            if (!exErr && ex) {
              originalText = ex.original_text ?? '';
              exerciseTitle = ex.title ?? exerciseTitle;
              if (ex.formatted_html) originalHtml = ex.formatted_html;
            }
          } catch (_) {
            console.warn('[ResultAnalysisPage] Could not fetch exercise original_text');
          }
        }

        // Decode High Court JSON formatting if present
        if (originalText && originalText.startsWith('{"__hc"')) {
            try {
                const parsed = JSON.parse(originalText);
                if (parsed.__hc) {
                    originalText = parsed.plain || '';
                    if (parsed.html) originalHtml = parsed.html;
                }
            } catch (e) {}
        } else if (originalText && /<[a-z][\s\S]*>/i.test(originalText) && !originalHtml) {
            // Legacy HTML fallback
            originalHtml = originalText;
            const tmp = document.createElement('div');
            tmp.innerHTML = originalHtml
                .replace(/<\/p>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/div>/gi, '\n');
            originalText = (tmp.innerText || tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
        }

        let formattingMistakes = row.mistakes_data?.formatting_errors?.length ?? 0;
        let formattingErrors = row.mistakes_data?.formatting_errors ?? [];

        // If formatting_errors is not in DB but we have HTML, calculate on the fly
        if (formattingMistakes === 0 && originalHtml && row.mistakes_data?.html_content) {
          try {
            const analysis = generateDetailedAnalysis(originalText, attemptedText, {
              strict: true,
              originalHtml: originalHtml,
              attemptedHtml: row.mistakes_data.html_content
            });
            formattingMistakes = analysis.summary.formattingMistakes ?? 0;
            formattingErrors = analysis.formattingErrors ?? [];
          } catch (e) {
            console.error('Failed to calculate formatting on-the-fly', e);
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
          originalHtml:     originalHtml,
          typed:            attemptedText,
          missingWords:     row.missing_words      ?? [],
          extraWords:       row.extra_words        ?? [],
          spellingErrors:   row.spelling_errors    ?? [],
          capitalErrors:    row.capital_errors     ?? [],
          attemptedHtml:    row.mistakes_data?.html_content ?? null,
          formattingMistakes: formattingMistakes,
          formattingErrors:   formattingErrors,
          // ── Section-wise metrics from mistakes_data ─────────────
          sectionName:      row.mistakes_data?.section_name ?? row.mistakes_data?.category ?? '—',
          testName:         row.mistakes_data?.test_name ?? exerciseTitle,
          correctWords:     row.mistakes_data?.correct_words ?? null,
          incorrectWords:   row.mistakes_data?.incorrect_words ?? null,
          missedWords:      row.mistakes_data?.missed_words ?? null,
          timeTaken:        row.mistakes_data?.time_taken ?? '—',
          resultStatus:     row.mistakes_data?.result_status ?? '—',
        });
      })
      .catch((err) => {
        console.error('[ResultAnalysisPage] fetch error:', err);
        setLoadError(err.message);
      })
      .finally(() => setLoading(false));
  }, [currentAttemptId]);

  // ── Fetch History ──
  useEffect(() => {
    setLoadingHistory(true);
    const userId = user?.id ?? '00000000-0000-0000-0000-000000000000';
    fetchAllResults(supabase, userId)
      .then(async (rows) => {
        // Enrich with exercise titles from Supabase
        const enriched = await Promise.all(rows.map(async (r) => {
          if (r.mistakes_data?.exercise_title) {
            return { ...r, exerciseTitle: r.mistakes_data.exercise_title };
          }
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
        
        // Auto-select the most recent test if none exists and user just clicked 'My Performance'
        if (!currentAttemptId && enriched.length > 0) {
            setCurrentAttemptId(enriched[0].id);
        }
      })
      .catch(err => console.error('History fetch error:', err))
      .finally(() => setLoadingHistory(false));
  }, [attemptId, currentAttemptId, user]);

  // Resolved data: live DB > prop > adjusted demo data
  const data = liveData ?? propData ?? { ...DEMO_DATA, studentName: user?.name || DEMO_DATA.studentName };
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
            <button onClick={onBack} className="bg-[#0d6e70] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Go Back
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
        { icon: Hash,         value: data.totalWords,     label: 'Total Words',       valueColor: '#0d6e70' },
        { icon: FileText,     value: data.userWords,       label: 'Words Typed',       valueColor: '#0369a1' },
        { icon: XCircle,      value: data.totalMistakes,   label: 'Total Mistakes',    valueColor: '#dc2626' },
        { icon: AlertTriangle,value: data.capitalMistakes, label: 'Capital Errors',    valueColor: '#d97706' },
        { icon: Type,         value: data.spellingMistakes,label: 'Spelling Errors',   valueColor: '#7c3aed' },
        { icon: TrendingUp,   value: data.accuracy,        label: 'Accuracy',          valueColor: accColor, suffix: '%' },
    ];

  const mistakeSections = [
    { title: 'Missing Words',           icon: MinusCircle,   iconColor: '#dc2626', items: data.missingWords,   columns: 1 },
    { title: 'Extra Words',             icon: PlusCircle,    iconColor: '#16a34a', items: data.extraWords,     columns: 1 },
    { title: 'Spelling Mistakes',       icon: Type,          iconColor: '#7c3aed', items: data.spellingErrors, columns: 2 },
    { title: 'Capitalisation Mistakes', icon: AlertTriangle, iconColor: '#d97706', items: data.capitalErrors,  columns: 2 },
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
        <div className="w-full px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-[#0d6e70] font-bold transition-all group shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest hidden sm:inline">Back</span>
          </button>

          {/* Tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 mx-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === id
                    ? 'bg-white text-[#0d6e70] shadow-sm'
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
              onClick={toggleFullscreen}
              className="flex items-center space-x-1.5 border-2 border-gray-200 text-gray-500 hover:border-[#0d6e70] hover:text-[#0d6e70] font-bold px-3 py-2 rounded-xl transition-colors text-xs"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 border-2 border-gray-200 text-gray-500 hover:border-[#0d6e70] hover:text-[#0d6e70] font-bold px-3 py-2 rounded-xl transition-colors text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-[#0d6e70] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 text-xs"
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
        className="w-full my-6 print:my-0 bg-white rounded-3xl shadow-xl print:shadow-none print:rounded-none overflow-hidden"
      >
        {/* ── Gradient Header ────────────────────────────────── */}
        <div
          className="px-8 py-10 print:py-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #09505a 0%, #0d6e70 100%)' }}
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
                  <Target className="w-4 h-4 text-[#0d6e70]" /> Performance Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Accuracy Gauge */}
                  <div className="sm:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-150" />
                    <AccuracyGauge accuracy={accuracyNum} />
                    <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-[0.2em] relative z-10">Overall Accuracy</p>
                  </div>

                  {/* Stats Grid 2x2 */}
                  <div className="sm:col-span-8 grid grid-cols-2 gap-3">
                    {[
                      { icon: Hash,         label: 'Total Words',    value: data.totalWords,      color: '#0d6e70', description: 'Maximum possible' },
                      { icon: FileText,     label: 'Words Typed',    value: data.userWords,       color: '#0369a1', description: 'Your input length' },
                      { icon: XCircle,      label: 'Total Mistakes', value: data.totalMistakes,   color: '#dc2626', description: 'Errors detected' },
                      { icon: Zap,          label: 'Typing Speed',   value: (data.wpm ?? (parseFloat(data.speed) || 0)), color: '#7c3aed', description: 'Words per minute', suffix: ' WPM' },
                    ].map(({ icon: Icon, label, value, color, description, suffix = '' }) => (
                      <div key={label} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between transition-all shadow-sm hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: color + '10' }}>
                                <Icon className="w-6 h-6" style={{ color }} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{description}</span>
                        </div>
                        <div>
                          <p className="text-3xl font-black leading-none tracking-tight text-slate-800">
                            <AnimatedNumber value={value} />
                            <span className="text-sm ml-0.5 opacity-60 text-slate-500 font-bold">{suffix}</span>
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Stats Grid ───────────────────────────────────── */}
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 print:mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#0d6e70]" /> Full Statistics
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

              {/* ── Section-wise Performance Detail ──────────────────── */}
              {(data.correctWords !== null || data.timeTaken !== '—') && (
                <div>
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0d6e70]" /> Section Performance Detail
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Correct Words',   value: data.correctWords   ?? '—', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                      { label: 'Incorrect Words',  value: data.incorrectWords ?? '—', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                      { label: 'Missed Words',     value: data.missedWords    ?? '—', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                      { label: 'Time Taken',       value: data.timeTaken      ?? '—', color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe' },
                    ].map(({ label, value, color, bg, border }) => (
                      <div key={label} className="rounded-2xl border p-5 flex flex-col items-center text-center" style={{ background: bg, borderColor: border }}>
                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {data.sectionName && data.sectionName !== '—' && (
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0d6e70] text-xs font-black border border-blue-100">
                        📚 Section: {data.sectionName}
                      </span>
                    )}
                    {data.resultStatus && data.resultStatus !== '—' && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                        data.resultStatus === 'Passed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : data.resultStatus === 'Completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {data.resultStatus === 'Passed' ? '✅' : data.resultStatus === 'Completed' ? '🔵' : '❌'} {data.resultStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                  {(() => {
                    const errorBars = [
                      { label: 'Spelling Errors',        count: data.spellingMistakes ?? 0,  total: data.totalWords || 1, color: '#7c3aed', unit: 'words' },
                      { label: 'Capitalisation Errors',  count: data.capitalMistakes ?? 0,   total: data.totalWords || 1, color: '#d97706', unit: 'words' },
                      { label: 'Missing Words',           count: data.missingCount    ?? (data.missingWords?.length ?? 0), total: data.totalWords || 1, color: '#dc2626', unit: 'words' },
                      { label: 'Extra Words',             count: data.extraCount      ?? (data.extraWords?.length ?? 0),   total: data.totalWords || 1, color: '#0891b2', unit: 'words' },
                    ];
                    if (data.formattingMistakes !== undefined && data.formattingMistakes > 0) {
                      errorBars.push({
                        label: 'Formatting & Alignment Errors',
                        count: data.formattingMistakes,
                        total: data.totalWords || 1,
                        color: '#0f172a',
                        unit: 'errors'
                      });
                    }
                    return errorBars.map(({ label, count, total, color, unit }) => (
                      <div key={label} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                          <span>{label}</span>
                          <span style={{ color }}>{count} {unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, (count / total) * 100)}%`, background: color }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-3">
                  {mistakeSections.map((sec) => <MistakeList key={sec.title} {...sec} />)}
                </div>

                {/* ── Formatting errors section ─────────────────────────── */}
                {data.formattingErrors && data.formattingErrors.length > 0 && (
                  <div className="mt-4 p-5 bg-red-50/40 rounded-2xl border border-red-100">
                    <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-red-600 animate-pulse" />
                      Formatting & Alignment Mismatches ({data.formattingErrors.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.formattingErrors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-red-100 shadow-sm text-xs text-gray-700">
                          <span className="font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold shrink-0">Line {err.lineIndex + 1}</span>
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-bold text-gray-800 italic truncate">"{err.lineText}"</p>
                            <p className="text-red-600 font-semibold">{err.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══ COMPARISON TAB ════════════════════════════════════ */}
          {activeTab === 'comparison' && (
            <div className="print:hidden space-y-5">
              {data.original ? (
                <DetailedAnalysisPanel
                  originalText={data.original}
                  originalHtml={data.originalHtml}
                  attemptedText={data.typed}
                  attemptedHtml={data.attemptedHtml}
                  title="Side-by-Side Comparison"
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
                  <Clock className="w-4 h-4 text-[#0d6e70]" /> Performance History
                </h2>
                <span className="text-xs bg-blue-50 text-[#0d6e70] font-black px-3 py-1 rounded-full border border-blue-100">
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
                    const isCurrent = h.id === currentAttemptId;
                    const accNum = parseFloat(h.accuracy) || 0;
                    const hColor = accNum >= 80 ? '#16a34a' : accNum >= 60 ? '#d97706' : '#dc2626';
                    return (
                      <div
                        key={h.id}
                        onClick={() => onNavigateToTest && onNavigateToTest(h.id)}
                        className={`cursor-pointer rounded-2xl border p-4 flex items-center justify-between group transition-all hover:shadow-md ${
                          isCurrent
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-gray-100 bg-white hover:border-blue-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${
                            isCurrent ? 'bg-[#0d6e70] border-[#0d6e70] text-white' : 'bg-white border-gray-100 text-[#0d6e70]'
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
                                <span className="text-[10px] font-black bg-[#0d6e70] text-white px-1.5 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-black" style={{ color: '#0d6e70' }}>{h.wpm}</p>
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
                <BookOpen className="w-4 h-4 text-[#0d6e70]" /> Practice This Passage
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
              <div className="w-9 h-9 bg-gradient-to-br from-[#0d6e70] to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <div>
                <p className="font-black text-[#0d6e70] text-sm">Shorthandians</p>
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
