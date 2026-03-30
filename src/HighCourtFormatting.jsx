import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
    Save,
    Gavel,
    FileText,
    CheckCircle,
    ArrowLeft,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    X,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Keyboard,
    Clock,
    Maximize,
    Minimize
} from 'lucide-react';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';
import { saveTestResult } from './lib/saveTestResult';
import { generateDetailedAnalysis } from './lib/generateDetailedAnalysis';

/**
 * Data Parser Function: Parses rawContent as JSON if possible,
 * extracts html/plain property, and replaces newlines with <br/> tags.
 */
/**
 * Data Parser Function: Parses rawContent as JSON if possible,
 * extracts html/plain property, and replaces newlines with <br/> tags.
 * Now resilient to literal newlines and malformed JSON strings.
 */
const getFormattedContent = (rawContent) => {
    if (!rawContent) return '';
    let content = rawContent;
    
    // Check if it's a potential JSON string
    const trimmed = String(rawContent).trim();
    if (trimmed.startsWith('{') && (trimmed.includes('"__hc"') || trimmed.includes('"plain"') || trimmed.includes('"html"'))) {
        try {
            // Attempt 1: Direct parse
            const parsed = JSON.parse(trimmed);
            if (parsed && (parsed.html || parsed.plain)) {
                content = parsed.html || parsed.plain;
            }
        } catch (e) {
            // Attempt 2: Resilient parse (fix literal newlines that break standard JSON.parse)
            try {
                const fixed = trimmed.replace(/\r?\n/g, '\\n');
                const parsed = JSON.parse(fixed);
                if (parsed && (parsed.html || parsed.plain)) {
                    content = parsed.html || parsed.plain;
                }
            } catch (e2) {
                // Total failure, fallback to raw string but try to stay safe
                console.warn('getFormattedContent: Failed to parse JSON even after sanitization', e2);
            }
        }
    }
    
    // Standardize newline characters and convert to HTML breaks
    return String(content)
        .replace(/\\n/g, '\n') // Convert escaped \n to real newlines
        .replace(/\n/g, '<br/>'); // Convert real newlines to HTML breaks
};

const HighCourtFormatting = ({ onBack, user }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [finalText, setFinalText] = useState('');
    const [pastAttempts, setPastAttempts] = useState([]);
    const [showPastAttempts, setShowPastAttempts] = useState(false);
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'writing'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [selectedDuration, setSelectedDuration] = useState(10);
    const [targetWpm, setTargetWpm] = useState(80);
    const [timeLeft, setTimeLeft] = useState(600);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const editorRef = useRef(null);

    const [hcTests, setHcTests] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState(null); // Initialize as null, will be set in useEffect
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-sync with storage on mount and update selectedTestId
    React.useEffect(() => {
        const loadTests = async () => {
            let allHcTests = [];

            // 1. Fetch from Supabase (Primary)
            try {
                if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
                    const { data, error } = await supabase
                        .from('exercises')
                        .select('*')
                        .eq('category', 'highcourt')
                        .order('created_at', { ascending: false });
                    
                    if (!error && data) {
                        allHcTests = data.map(d => ({
                            ...d,
                            text: d.original_text // Normalize field name
                        }));
                    }
                }
            } catch (err) {
                console.warn('Supabase HC fetch failed:', err);
            }

            // 2. Load from LocalStorage (Fallback/Legacy)
            const saved = localStorage.getItem('admin_highcourt_data_list');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Merge unique items from local that aren't in remote (by ID)
                    const remoteIds = new Set(allHcTests.map(t => String(t.id)));
                    const uniqueLocal = parsed.filter(t => !remoteIds.has(String(t.id)));
                    allHcTests = [...allHcTests, ...uniqueLocal];
                } catch (e) {}
            }

            // 3. Final Deduplication (Security layer against "doubling" items in list)
            const seenIds = new Set();
            const finalTests = allHcTests.filter(test => {
                const idStr = String(test.id);
                if (seenIds.has(idStr)) return false;
                seenIds.add(idStr);
                return true;
            });

            setHcTests(finalTests);
            if (finalTests.length > 0) {
                setSelectedTestId(finalTests[0].id);
            }

            // Load past attempts
            const savedAttempts = localStorage.getItem('hc_formatting_attempts');
            if (savedAttempts) {
                try {
                    setPastAttempts(JSON.parse(savedAttempts));
                } catch (e) {}
            }
        };

        loadTests();
        window.addEventListener('storage', loadTests);
        return () => window.removeEventListener('storage', loadTests);
    }, []);

    // Timer SYNC effect
    useEffect(() => {
        if (!isTimerRunning && !submitted) {
            setTimeLeft(selectedDuration * 60);
        }
    }, [selectedDuration, isTimerRunning, submitted]);

    // Timer COUNTDOWN effect
    useEffect(() => {
        let timer;
        if (isTimerRunning && timeLeft > 0 && !submitted) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isTimerRunning && timeLeft === 0 && !submitted) {
            clearInterval(timer);
            setIsTimerRunning(false);
            handleSubmit(); // Auto submit
        }
        return () => clearInterval(timer);
    }, [isTimerRunning, timeLeft, submitted]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleInputStart = () => {
        if (!isTimerRunning && !submitted && timeLeft > 0) {
            setIsTimerRunning(true);
        }
    };

    const defaultSample = `IN THE HIGH COURT OF JUDICATURE AT PATNA
Civil Writ Jurisdiction Case No. 1234 of 2024

In the matter of:
Rahul Kumar ................................. Petitioner
Versus
The State of Bihar & Ors. ........... Respondents

CORAM: HONOURABLE MR. JUSTICE A. B. C.

ORAL ORDER
    01/ 12-03-2024

    Heard learned counsel for the petitioner and learned counsel for the State.
    The petitioner seeks a direction to the respondents to clear the pending dues along with statutory interest.
    Let notice be issued to Respondent No. 2 to 4. 
    Post this matter after four weeks.`;

    // ── Grouping Logic ──────────────────────────────────────────
    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

        const categories = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        
        hcTests.forEach(ex => {
            const exDate = ex.created_at ? new Date(ex.created_at) : new Date();
            const dateStr = exDate.toLocaleDateString();
            
            if (dateStr === today) categories['Today'].push(ex);
            else if (dateStr === yesterday) categories['Yesterday'].push(ex);
            
            categories['All Practice'].push(ex);
        });

        return categories;
    }, [hcTests]);

    const selectedTest = hcTests.find(t => t.id === selectedTestId);
    const [docViewMode, setDocViewMode] = useState('word');

    // ── Content Parsing ──────────────────────────────────────────
    // Decode HC content — supports ALL storage formats in correct priority
    const decodeHcContent = (test) => {
        if (!test) return { plain: '', html: null };
        
        const rawRaw = test.original_text || test.text || '';
        const raw = String(rawRaw).trim();

        // ── Extract plain + html from JSON (highest fidelity for new saves) ──
        let jsonPlain = null;
        let jsonHtml = null;
        if ((raw.startsWith('{') || raw.includes('{"__hc"')) && raw.includes('"plain"')) {
            try {
                const jsonStart = raw.indexOf('{');
                const sanitized = raw.substring(jsonStart).replace(/\r?\n/g, '\\n');
                const parsed = JSON.parse(sanitized);
                if (parsed.__hc || parsed.plain || parsed.html) {
                    jsonPlain = parsed.plain || null;
                    jsonHtml  = parsed.html  || null;
                }
            } catch (err) {
                console.warn('decodeHcContent: JSON parse failed', err);
            }
        }

        // PRIORITY 1 — Explicit formatted_html column (most reliable for full content)
        // Use jsonPlain for scoring accuracy, but the column HTML for display
        if (test.formatted_html && test.formatted_html.trim().length > 10) {
            return {
                plain: jsonPlain || raw,
                html:  test.formatted_html
            };
        }

        // PRIORITY 2 — JSON-embedded html (new saves via rich editor)
        if (jsonHtml && jsonHtml.trim().length > 10) {
            return { plain: jsonPlain || '', html: jsonHtml };
        }

        // PRIORITY 3 — JSON plain text only (render as formatted plain text)
        if (jsonPlain) {
            return { plain: jsonPlain, html: null };
        }

        // PRIORITY 4 — Raw HTML in original_text field
        if (/<[^>]+>/.test(raw) && !raw.startsWith('{')) {
            return { plain: null, html: raw };
        }

        // PRIORITY 5 — Plain text fallback
        return { plain: raw, html: null };
    };

    // Strip HTML tags preserving newlines from <br> and <p>
    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/div>/gi, '\n');
        return (tmp.innerText || tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
    };

    // Raw reference content (used as absolute fallback)
    const referenceText = selectedTest?.original_text || selectedTest?.text || defaultSample;

    // Decoded version — plain for scoring, html for rich display
    const { plain: decodedPlain, html: decodedHtml } = decodeHcContent(selectedTest);

    // Best plain text for scoring: prefer explicit plain, then strip HTML, then raw fallback
    const plainReferenceForScoring = decodedPlain
        || (decodedHtml ? stripHtml(decodedHtml) : '')
        || stripHtml(referenceText)
        || defaultSample;

    // Best HTML for display: prefer rich HTML, then convert plain with line breaks
    const displayHtml = decodedHtml
        || (decodedPlain ? decodedPlain.replace(/\n/g, '<br/>') : null)
        || getFormattedContent(referenceText);

    // Render plain text preserving newlines and punctuation
    const renderFormattedText = (text) => {
        const content = text || referenceText || defaultSample;
        // Normalize escaped newlines
        const cleanText = String(content).replace(/\\n/g, '\n');
        return cleanText.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line || '\u00A0' /* non-breaking space to preserve blank lines */}
                <br />
            </React.Fragment>
        ));
    };

    const rules = [
        "Court Name must be UPPERCASE, Bold and Centered.",
        "Case Number must be Centered and Underlined.",
        "Parties' names should be Left-aligned but separated with dotted lines.",
        "CORAM must be Bold and Left-aligned.",
        "ORDER text should be Justified.",
        "Paragraphs must start with an Indent (Tab)."
    ];

    const execCmd = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
    };

    const handleSubmit = async () => {
        if (!editorRef.current) return;
        const htmlContent = editorRef.current.innerHTML;
        const resultText = editorRef.current.innerText;

        if (!resultText.trim() || resultText === '<br>') return;

        setIsSubmitting(true);

        try {
            // 1. Generate Automated Analysis for scoring (strict mode to include punctuation)
            const originalBase = plainReferenceForScoring;
            const analysis = generateDetailedAnalysis(originalBase, resultText, { strict: true });
            const { accuracy, totalMistakes } = analysis.summary;

            // 2. Save via Utility to Primary DB (test_results)
            const result = await saveTestResult(supabase, {
                wpm: 0, // Formatting test - not timed
                accuracy: accuracy,
                totalMistakes: totalMistakes, 
                attemptedText: resultText,
                originalText: originalBase,
                exerciseId: selectedTestId,
                userId: user?.id,
                studentName: user?.name,
                // Attach HTML for the admin to check formatting specifically
                extraMistakesData: { html_content: htmlContent }
            });

            if (result && result.attemptId) {
                console.log('[HighCourt] Save success:', result.attemptId);
            }
        } catch (err) {
            console.error('[HighCourt] Submission failed:', err);
            // Fallback saved via local logic in saveTestResult.js 'stn_local_results'
        } finally {
            // Update local UI state
            setFinalText(resultText);
            const newAttempt = { text: resultText, html: htmlContent, timestamp: new Date().toLocaleString() };
            const updatedAttempts = [newAttempt, ...pastAttempts];
            setPastAttempts(updatedAttempts);
            localStorage.setItem('hc_formatting_attempts', JSON.stringify(updatedAttempts));
            
            setSubmitted(true);
            setIsSubmitting(false);
            setIsTimerRunning(false);
        }
    };

    const handleRetake = () => {
        setSubmitted(false);
        setFinalText('');
        setIsTimerRunning(false);
        setTimeLeft(selectedDuration * 60);
        if (editorRef.current) {
            editorRef.current.innerHTML = '<p><br></p>';
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setFinalText('');
        setIsTimerRunning(false);
        setTimeLeft(selectedDuration * 60);
        if (editorRef.current) {
            editorRef.current.innerHTML = '<p><br></p>';
        }
    };

    const ToolbarButton = ({ icon: Icon, command, title }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd(command)}
            className="p-2 text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 focus:outline-none"
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    // ── Conditional Rendering for Selection Grid ───────────
    if (viewMode === 'selection') {
        const activeList = groupedTests[activeDateTab] || [];
        
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
                {/* Fixed Top Header for Selection Mode */}
                <div className="bg-[#1e3a8a] text-white px-6 py-4 flex justify-between items-center shadow-md z-[100]">
                    <div className="flex items-center space-x-4">
                        <button onClick={onBack} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                        <h2 className="text-xl font-bold tracking-wide">High Court Formatting</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
                    <div className="max-w-7xl mx-auto w-full space-y-8">
                        {/* Tab Switcher */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Practice Dashboard</h3>
                                <p className="text-gray-500 font-bold mt-1">Select a case draft to start your formatting practice.</p>
                            </div>
                            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                                {['Today', 'Yesterday', 'All Practice'].map( tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveDateTab(tab)}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDateTab === tab ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-400 hover:text-[#1e3a8a]'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        {activeList.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gavel className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800">No formatting tests for {activeDateTab}</h3>
                                <p className="text-gray-400 max-w-xs mx-auto mt-2 font-bold">Check the 'All Practice' tab for earlier published drafting tests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                                {activeList.map((test, idx) => (
                                    <div 
                                        key={test.id}
                                        onClick={() => {
                                            setSelectedTestId(test.id);
                                            setViewMode('writing');
                                        }}
                                        className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-[#1e3a8a] hover:translate-y-[-8px] transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/5 rounded-bl-[4rem] group-hover:bg-[#1e3a8a]/10 transition-colors" />
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 shadow-sm">
                                            <FileText className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight group-hover:text-[#1e3a8a] h-12 overflow-hidden">
                                            {test.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
                                            <span>Drafting</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span>{test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Set 1'}</span>
                                        </div>
                                        <button className="w-full py-3 bg-gray-50 group-hover:bg-[#1e3a8a] group-hover:text-white rounded-xl text-gray-600 text-xs font-black uppercase tracking-widest transition-all">
                                            Start Drafting
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            {/* Context Back Button */}
            <button 
                onClick={() => setViewMode('selection')}
                className="fixed top-[4.5rem] left-6 z-[90] bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-black text-[#1e3a8a] shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2"
            >
                <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </button>

            {/* Top Header */}
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setViewMode('selection')}
                        className="hover:bg-blue-800 p-2 rounded-full transition-colors"
                        title="Back to Selection"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <Gavel className="w-6 h-6 text-blue-200" />
                        <h2 className="text-xl font-bold tracking-wide">High Court Formatting Module</h2>
                    </div>
                    <div className="flex items-center space-x-4 ml-6 border-l border-blue-400 pl-6">
                        <div className="flex items-center space-x-3 bg-red-600 px-5 py-2 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400">
                            <Clock className="w-6 h-6 text-white" />
                            <span className={`text-2xl font-black tracking-widest text-white drop-shadow-md ${timeLeft <= 60 ? 'animate-pulse text-red-200' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                        <h2 className="text-sm font-bold tracking-wide ml-2">Time:</h2>
                        <select
                            className="bg-blue-800/50 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none border border-blue-700 focus:border-blue-400"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(Number(e.target.value))}
                            disabled={isSubmitting || submitted}
                        >
                            {Array.from({length: 11}, (_, i) => i + 5).map(m => (
                                <option key={m} value={m} className="bg-white text-gray-900">{m} Min</option>
                            ))}
                        </select>
                        <h2 className="text-sm font-bold tracking-wide ml-2">WPM:</h2>
                        <select
                            className="bg-blue-800/50 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none border border-blue-700 focus:border-blue-400"
                            value={targetWpm}
                            onChange={(e) => setTargetWpm(Number(e.target.value))}
                            disabled={isSubmitting || submitted}
                        >
                            {Array.from({length: 12}, (_, i) => 40 + (i * 10)).map(w => (
                                <option key={w} value={w} className="bg-white text-gray-900">{w} WPM</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-blue-800 rounded-full transition-colors border border-blue-400/30 flex items-center justify-center text-blue-200 hover:text-white"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    {submitted ? (
                        <button
                            onClick={handleRetake}
                            className="px-6 py-2 font-bold rounded-lg transition-transform shadow-md flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white transform hover:-translate-y-0.5"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span>Retake Test</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-6 py-2 font-bold rounded-lg transition-transform shadow-md flex items-center space-x-2 ${
                                isSubmitting ? 'bg-blue-300 text-white cursor-not-allowed' :
                                    'bg-green-500 hover:bg-green-600 text-white transform hover:-translate-y-0.5'
                                }`}
                        >
                            <Save className="w-5 h-5" />
                            <span>{isSubmitting ? 'Saving...' : 'Submit Formatting'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col overflow-hidden p-0">
                {!submitted || !finalText ? (
                    <div className="flex-1 flex flex-col gap-0 overflow-hidden bg-gray-300">
                        {/* Top Half: PDF or Sample Document */}
                        <div className="flex-1 flex overflow-hidden border-b-2 border-gray-300">
                            {/* Reference Content */}
                            <div className="flex-1 bg-white overflow-hidden flex flex-col">
                                <div className="bg-gray-100 px-4 py-2 border-b text-xs font-bold text-gray-600 uppercase tracking-wider flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <span className="font-black text-[#1e3a8a]">{selectedTest?.title || 'No Test Selected'}</span>
                                        <div className="h-4 w-px bg-gray-300" />
                                        <span>Reference Document</span>
                                        {decodedHtml && (
                                            <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                                ✦ Formatted reference — replicate this exactly
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex bg-gray-200 p-0.5 rounded-lg">
                                        <button 
                                            onClick={() => setDocViewMode('word')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${docViewMode === 'word' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                                        >
                                            WORD VIEW
                                        </button>
                                        {selectedTest?.pdf && (
                                            <button 
                                                onClick={() => setDocViewMode('pdf')}
                                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${docViewMode === 'pdf' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                                            >
                                                PDF VIEW
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* h-full on flex-1 gives a definite height so children with h-full / absolute inset resolve correctly */}
                                    <div className="flex-1 bg-gray-200/50 relative h-full min-h-0">
                                        {selectedTest && docViewMode === 'pdf' && selectedTest.pdf ? (
                                            <iframe src={selectedTest.pdf} className="absolute inset-0 w-full h-full border-none" title="Reference PDF" />
                                        ) : (
                                            /* WORD VIEW (Admin style full width) */
                                            <div className="absolute inset-0 overflow-y-auto bg-white">
                                                <div 
                                                    className="min-h-full p-5 font-serif text-sm leading-relaxed text-black whitespace-pre-wrap outline-none"
                                                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                                                    dangerouslySetInnerHTML={{ __html: displayHtml }}
                                                />
                                                {!selectedTest && (
                                                    <p className="mt-4 text-center text-xs text-gray-400 font-bold uppercase italic">Viewing default reference format</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                            </div>
                        </div>

                        {/* Bottom Half: Editor */}
                        <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                            <div className="bg-gray-100 px-4 py-2 border-b text-xs font-bold text-gray-600 uppercase tracking-wider flex justify-between items-center">
                                <span>Your Editor Workspace</span>
                                <span className="text-gray-400 font-normal">Apply Bold, Italics, and Alignment carefully</span>
                            </div>
                            
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="bg-white h-full overflow-hidden flex flex-col">
                                    {/* Custom Toolbar */}
                                    <div className="flex items-center gap-1 p-1.5 border-b bg-gray-50 overflow-x-auto shrink-0">
                                        <div className="flex space-x-0.5 border-r pr-1.5 mr-1.5">
                                            <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" />
                                            <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" />
                                            <ToolbarButton icon={Underline} command="underline" title="Underline (Ctrl+U)" />
                                        </div>
                                        <div className="flex space-x-0.5 border-r pr-1.5 mr-1.5">
                                            <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
                                            <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
                                            <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
                                            <ToolbarButton icon={AlignJustify} command="justifyFull" title="Justify" />
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase hidden md:block">
                                            Font: Courier New
                                        </div>
                                    </div>
                                    
                                    {/* Editor Content Area */}
                                    <div
                                        ref={editorRef}
                                        contentEditable={!submitted && timeLeft > 0}
                                        suppressContentEditableWarning={true}
                                        onInput={handleInputStart}
                                        onCopy={(e) => { e.preventDefault(); alert("Copying is disabled!"); }}
                                        onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled!"); }}
                                        onContextMenu={(e) => { e.preventDefault(); }}
                                        onKeyDown={(e) => {
                                            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="flex-1 p-10 md:p-16 outline-none font-mono text-[16px] md:text-[18px] leading-loose text-justify text-black overflow-y-auto"
                                        spellCheck={false}
                                    >
                                        <p><br /></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 flex flex-col space-y-8">
                            
                            {pastAttempts.length > 0 && (
                                <div>
                                    <div className="mb-4 flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h3 className="font-bold text-gray-800 text-lg">Latest Result ({pastAttempts[0].timestamp})</h3>
                                    </div>
                                    <DetailedAnalysisPanel
                                        originalText={plainReferenceForScoring}
                                        originalHtml={decodedHtml || decodedPlain || getFormattedContent(referenceText)}
                                        attemptedText={pastAttempts[0].text}
                                        attemptedHtml={pastAttempts[0].html}
                                        title="Formatting Analysis"
                                    />
                                </div>
                            )}

                            {pastAttempts.length > 1 && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <button 
                                        className="w-full flex justify-between items-center text-left py-2 focus:outline-none group"
                                        onClick={() => setShowPastAttempts(!showPastAttempts)}
                                    >
                                        <h3 className="font-bold text-gray-700 text-lg flex items-center space-x-2 group-hover:text-blue-600 transition-colors">
                                            <RotateCcw className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                                            <span>Previous Results ({pastAttempts.length - 1})</span>
                                        </h3>
                                        {showPastAttempts ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        )}
                                    </button>
                                    
                                    {showPastAttempts && (
                                        <div className="flex flex-col space-y-6 mt-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                            {pastAttempts.slice(1).map((attempt, idx) => {
                                                // Try to decode the original text for this specific attempt if it exists
                                                // Fallback to the current test's reference if item ID matches
                                                const attemptDecoded = decodeHcContent(selectedTest); 
                                                
                                                return (
                                                    <div key={idx} className="opacity-90 transform scale-[0.98] origin-top bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                        <div className="text-sm font-bold text-gray-500 mb-2 border-b pb-2">Attempt at {attempt.timestamp}</div>
                                                        <DetailedAnalysisPanel
                                                            originalText={attemptDecoded.plain || (attemptDecoded.html ? stripHtml(attemptDecoded.html) : attempt.text)}
                                                            originalHtml={attemptDecoded.html || attemptDecoded.plain || getFormattedContent(referenceText)}
                                                            attemptedText={attempt.text}
                                                            attemptedHtml={attempt.html}
                                                            title={`Previous Attempt ${pastAttempts.length - 1 - idx}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HighCourtFormatting;
