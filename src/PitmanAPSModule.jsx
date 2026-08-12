import React, { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, Share2, X, FileCheck, ArrowLeft, Eye, Clock, Maximize, Minimize, TrendingUp, Search } from 'lucide-react';
import { supabase } from './supabaseClient';
import { saveTestResult } from './lib/saveTestResult';

const PitmanAPSModule = ({ onBack, onTestComplete, category }) => {
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'practice'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset currentPage when search query or activeDateTab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeDateTab]);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            setIsLoadingExercises(true);
            let mergedData = [];
            
            try {
                // 1. Fetch from Supabase
                const { data, error } = await supabase
                    .from('exercises')
                    .select('*')
                    .ilike('category', '%pitman%') // Catch any variation: Pitman, pitman, PitmanAPS, etc.
                    .eq('is_hidden', false)
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    mergedData = data.map(d => ({
                        ...d,
                        isDynamic: true,
                        image: d.image_url || d.pdf || d.image_path, // STRICT: Only use real content fields
                        lines: (d.original_text || d.text || '').split('\n').filter(l => l.trim() !== '')
                    }));
                }

                // 2. Fetch from Local Admin Data — only include items not already in Supabase (by ID)
                const saved = localStorage.getItem('admin_pitman_data_list');
                if (saved) {
                    const local = JSON.parse(saved);
                    const remoteIds = new Set(mergedData.map(d => String(d.id)));
                    const localMapped = local
                        .filter(d => !remoteIds.has(String(d.id))) // Skip items already fetched from Supabase
                        .map(d => ({
                            ...d,
                            isDynamic: true,
                            image: d.pdf || d.image_url,
                            lines: (d.original_text || d.text || '').split('\n').filter(l => l.trim() !== '')
                        }));
                    mergedData = [...mergedData, ...localMapped];
                }
            } catch(e) {}

            // 3. FINAL FILTER: Hide ALL "Test X" files
            let finalized = mergedData.filter(ex => {
                const title = (ex.title || '').toLowerCase().trim();
                // ONLY hide generic 'test' files like "Test 1", "test 4", "dummy"
                const isGenericTest = /^test\s\d+$/i.test(title) || /test\s*(one|two|three|four|five)/i.test(title) || title === 'test' || title.includes('dummy');
                return !isGenericTest;
            });
            
            // ── Free Trial 'Latest Test Only' Logic ──
            try {
                const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
                if (user && user.role !== 'admin') {
                    const enrolled = user.enrolled_courses || [];
                    if (!enrolled.includes('pitman-ex')) {
                        if (finalized.length > 0) finalized = [finalized[0]];
                    }
                }
            } catch(e) {}

            setExercises(finalized);
            if (finalized.length > 0 && !selectedExercise) {
                setSelectedExercise(finalized[0]);
            }
            setIsLoadingExercises(false);
        };

        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, []);

    const filteredExercises = React.useMemo(() => {
        if (!searchQuery.trim()) return exercises;
        const q = searchQuery.toLowerCase();
        return exercises.filter(ex => 
            (ex.title || '').toLowerCase().includes(q) ||
            (ex.job_title || '').toLowerCase().includes(q) ||
            (ex.lines || []).join(' ').toLowerCase().includes(q)
        );
    }, [exercises, searchQuery]);

    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        const cats = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        
        filteredExercises.forEach(ex => {
            const dateStr = ex.created_at ? new Date(ex.created_at).toLocaleDateString() : new Date().toLocaleDateString();
            if (dateStr === today) cats['Today'].push(ex);
            else if (dateStr === yesterday) cats['Yesterday'].push(ex);
            cats['All Practice'].push(ex);
        });
        return cats;
    }, [filteredExercises]);

    const mockReferenceText = selectedExercise?.lines?.join(' ') || '';
    const [inputText, setInputText] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [timerPreset, setTimerPreset] = useState(600);
    const [timeLeft, setTimeLeft] = useState(600);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const utteranceRef = useRef(null);

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

    useEffect(() => {
        let timer;
        if (isStarted && timeLeft > 0 && !hasSubmitted) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (isStarted && timeLeft === 0 && !hasSubmitted) {
            // ── Auto-submit when timer expires ──
            handleSubmit();
        }
        return () => clearInterval(timer);
    }, [isStarted, timeLeft, hasSubmitted]);

    useEffect(() => {
        if (!isStarted || inputText.length === 0) return;
        const timeElapsed = (timerPreset - timeLeft) / 60;
        if (timeElapsed > 0) {
            const words = inputText.trim().split(/\s+/).length;
            setWpm(Math.round(words / timeElapsed));
        }
        const refWords = mockReferenceText.split(' ');
        const typedWords = inputText.trim().split(/\s+/);
        let correct = 0;
        typedWords.forEach((word, i) => { if (word === refWords[i]) correct++; });
        setAccuracy(typedWords.length > 0 ? Math.round((correct / typedWords.length) * 100) : 100);
    }, [inputText, timeLeft, isStarted, mockReferenceText, timerPreset]);

    const handleInputChange = (e) => {
        if (!isStarted) setIsStarted(true);
        setInputText(e.target.value);
    };

    const handleReset = () => {
        setInputText(''); setIsStarted(false); setTimeLeft(timerPreset);
        setWpm(0); setAccuracy(100); setHasSubmitted(false); setShowKey(false);
    };

    const handleSubmit = async () => {
        if (hasSubmitted) return; // Prevent duplicate submissions
        setIsStarted(false);
        // Properly split reference text filtering empty tokens from multi-space/newline joins
        const refWords = selectedExercise.lines.join(' ').split(/\s+/).filter(w => w !== '');
        const typedWords = inputText.trim().split(/\s+/).filter(w => w !== '');
        let fullMistakes = 0; let halfMistakes = 0;
        refWords.forEach((ref, i) => {
            const typed = typedWords[i] || '';
            if (typed === ref) return;
            if (!typed) { fullMistakes++; return; }
            const cRef = ref.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
            const cTyped = typed.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
            if (cRef === cTyped) halfMistakes++; else fullMistakes++;
        });
        const deduction = fullMistakes + (halfMistakes * 0.5);
        const timeElapsedMin = (timerPreset - timeLeft) / 60 || 1;
        const timeTakenSec = timerPreset - timeLeft;
        const wpmVal = Math.max(0, Math.round((typedWords.length - deduction) / timeElapsedMin));
        const accVal = refWords.length > 0 ? Math.max(0, Math.min(100, Math.round(((refWords.length - deduction) / refWords.length) * 100))) : 100;
        const stats = { wpm: wpmVal, accuracy: accVal, fullMistakes, halfMistakes, totalWords: typedWords.length, totalRefWords: refWords.length };
        setFinalStats(stats); setShowModal(true); setIsSaving(true); setHasSubmitted(true);
        try {
            const userSess = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const { attemptId: newId } = await saveTestResult(supabase, {
                userId: userSess.id || '00000000-0000-0000-0000-000000000000',
                studentName: userSess.name || 'Student',
                exerciseId: selectedExercise.id,
                exerciseTitle: selectedExercise.title,
                exerciseCategory: 'Pitman APS',
                sectionName: selectedExercise.title,
                testName: selectedExercise.title,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                attemptedText: inputText,
                originalText: refWords.join(' '),
                timeTakenSeconds: timeTakenSec,
                totalMistakes: Math.ceil(deduction)
            });
            setAttemptId(newId);
            if (onTestComplete) onTestComplete(newId);
        } finally { setIsSaving(false); }
    };

    // UI RENDERERS
    if (isLoadingExercises) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
                <div className="text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-[#0d6e70] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#0d6e70] font-bold text-lg">Loading Course Syllabus...</p>
                </div>
            </div>
        );
    }

    if (viewMode === 'selection') {
        const activeList = groupedTests[activeDateTab] || [];
        const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE);
        const paginatedList = activeList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        const handleTabChange = (tab) => { setActiveDateTab(tab); setCurrentPage(1); };
        return (
            <div className="h-full flex-1 bg-[#f8fafc] flex flex-col font-sans">
                <div className="bg-[#0d6e70] text-white px-6 py-4 flex items-center space-x-4 shadow-md">
                    <button onClick={onBack} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                    <h2 className="text-xl font-bold tracking-wide">Pitman Shorthand Module</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="w-full mx-auto space-y-10">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="text-4xl font-black text-[#0d6e70] tracking-tight">Pitman Dashboard</h3>
                                <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest italic text-blue-600">Select an exercise to begin your shorthand practice</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 gap-1">
                                {['Today', 'Yesterday', 'All Practice'].map(tab => (
                                    <button key={tab} onClick={() => handleTabChange(tab)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${activeDateTab === tab ? 'bg-[#0d6e70] text-white shadow-lg' : 'text-gray-400 hover:text-blue-900'}`}>
                                        {tab}
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeDateTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {groupedTests[tab]?.length ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar + Navigation indicator */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search exercises by title, job, text..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0d6e70] focus:border-[#0d6e70] bg-white text-gray-800"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            {activeList.length > 0 && (
                                <span className="text-xs text-gray-400 font-bold self-end sm:self-auto">
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, activeList.length)} of {activeList.length}
                                </span>
                            )}
                        </div>

                        {activeList.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 py-32 text-center shadow-inner">
                                <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-gray-800 italic">No official exercises published yet</h3>
                                <p className="text-gray-400 text-sm mt-1">Check back later or contact your administrator.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-10">
                                {/* List Header */}
                                <div className="hidden md:grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>#</span>
                                    <span>Exercise Title</span>
                                    <span className="text-center w-28">Published</span>
                                    <span className="w-32"></span>
                                </div>

                                {/* List Items */}
                                <div className="space-y-3">
                                    {paginatedList.map((test, idx) => {
                                        const wordCount = test.lines?.join(' ').split(/\s+/).filter(Boolean).length || 0;
                                        const dateStr = test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
                                        const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                        return (
                                            <div
                                                key={test.id}
                                                onClick={() => { setSelectedExercise(test); setViewMode('practice'); handleReset(); }}
                                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#0d6e70]/30 transition-all duration-200 cursor-pointer flex items-center gap-4 px-5 py-4 relative overflow-hidden"
                                            >
                                                {/* Left accent bar on hover */}
                                                <div className="absolute left-0 top-0 h-full w-1 bg-[#0d6e70] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center rounded-l-2xl" />

                                                {/* Index badge */}
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-[#0d6e70] flex items-center justify-center shrink-0 transition-colors">
                                                    <span className="text-sm font-black text-[#0d6e70] group-hover:text-white transition-colors">{globalIdx}</span>
                                                </div>

                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <Eye className="w-5 h-5 text-indigo-500" />
                                                </div>

                                                {/* Title + chips */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-gray-900 text-sm md:text-base group-hover:text-[#0d6e70] transition-colors truncate">{test.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{wordCount} words</span>
                                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{dateStr}</span>
                                                        {test.job_title && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{test.job_title}</span>}
                                                    </div>
                                                </div>

                                                {/* CTA */}
                                                <button className="shrink-0 px-5 py-2.5 bg-[#f0fafa] text-[#0d6e70] group-hover:bg-[#0d6e70] group-hover:text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 whitespace-nowrap">
                                                    Start →
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-[#0d6e70] hover:text-white hover:border-[#0d6e70] disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-[#0d6e70] text-white shadow-lg' : 'border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-[#0d6e70]'}`}>{p}</button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-[#0d6e70] hover:text-white hover:border-[#0d6e70] disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Practice Mode ─────────────────────────────────────
    return (
        <div className="h-full flex-1 bg-white flex flex-col font-sans overflow-hidden">
            <div className="bg-[#0d6e70] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-lg z-20">
                <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-1/3">
                    <button onClick={() => setViewMode('selection')} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <div><h2 className="text-lg font-black tracking-tight line-clamp-1">{selectedExercise?.title}</h2><span className="text-[10px] text-blue-200 uppercase font-black">Pitman Shorthand Practice</span></div>
                </div>
                
                <div className="flex items-center justify-center w-full md:w-1/3 mb-4 md:mb-0">
                    {/* Centered space */}
                </div>

                <div className="flex items-center justify-end space-x-4 w-full md:w-1/3">
                    <div className="flex items-center space-x-2 bg-blue-800 p-2 rounded-lg text-sm"><Activity className="w-4 h-4 text-blue-300" /><span className="font-bold">{wpm} WPM</span></div>
                    <div className="flex items-center space-x-2 bg-blue-800 p-2 rounded-lg text-sm"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="font-bold">{accuracy}%</span></div>
                    <div className="h-6 w-px bg-blue-800 hidden md:block"></div>
                    <button 
                        onClick={toggleFullscreen} 
                        className="p-2 hover:bg-blue-800 rounded-full transition-colors border border-blue-400/30 flex items-center justify-center text-blue-200 hover:text-white" 
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Two-column body: use inline styles to bypass Tailwind flex propagation bugs */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {/* Outlines Side */}
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f3f4f6', background: '#fcfdfe', overflow: 'hidden' }}>
                    <div style={{ flexShrink: 0 }} className="bg-gray-50 border-b px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span>Shorthand Reference</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {selectedExercise?.image && !selectedExercise.image.includes('card') ? (
                            selectedExercise.image.startsWith('data:application/pdf') ?
                            <iframe src={selectedExercise.image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} title="PDF Outline" /> :
                            <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                                <img src={selectedExercise.image} alt="Outline" className="max-w-full h-auto shadow-2xl rounded-lg contrast-125" />
                            </div>
                        ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 border-dashed">
                                    <Eye className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting Admin Media...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Typing Side */}
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
                    <div style={{ flexShrink: 0 }} className="bg-gray-50 border-b px-6 py-3 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Transcription Area</span>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`font-mono font-black text-xl ${timeLeft < 60 ? 'text-red-600' : 'text-[#0d6e70]'}`}>
                                {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
                            </span>
                        </div>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={handleInputChange}
                        disabled={hasSubmitted}
                        style={{ flex: 1, minHeight: 0, width: '100%', padding: '32px', fontSize: '1.125rem', fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', lineHeight: 1.75 }}
                        placeholder="Click here and start typing to begin..."
                        spellCheck="false"
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                    />
                    <div style={{ flexShrink: 0 }} className="bg-white border-t border-gray-100 p-2 flex justify-center items-center space-x-3">
                        <button onClick={handleReset} className="px-5 py-2.5 bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-600 border border-gray-200 font-bold rounded-lg transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest flex items-center space-x-2">
                            <X className="w-4 h-4" />
                            <span>Restart Practice</span>
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={hasSubmitted || inputText.length === 0}
                            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-black rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-widest text-[10px] flex items-center space-x-2"
                        >
                            <FileCheck className="w-4 h-4" />
                            <span>Submit Recording</span>
                        </button>
                    </div>
                </div>
            </div>

            {showModal && finalStats && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-[#0d6e70] p-10 text-center text-white relative">
                             <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                             <h2 className="text-2xl font-black">Practice Logged</h2>
                             <p className="text-blue-200 text-sm italic">Session completed successfully</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-2xl text-center"><span className="text-[9px] font-black text-blue-400 block mb-1 uppercase">Final Speed</span><span className="text-2xl font-black text-[#0d6e70] leading-none">{finalStats.wpm} WPM</span></div>
                                <div className="bg-green-50 p-4 rounded-2xl text-center transition-all"><span className="text-[9px] font-black text-green-400 block mb-1 uppercase">Accuracy</span><span className="text-2xl font-black text-green-600 leading-none">{finalStats.accuracy}%</span></div>
                            </div>

                            {/* Words typed vs total */}
                            <div className="bg-gray-50 px-5 py-3 rounded-2xl flex justify-between items-center">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Words Typed</span>
                                <span className="text-base font-black text-gray-800">
                                    {finalStats.totalWords}
                                    <span className="text-gray-400 font-bold"> / {finalStats.totalRefWords}</span>
                                </span>
                            </div>

                            {/* Mistake breakdown */}
                            <div className="bg-red-50 px-5 py-3 rounded-2xl flex justify-between items-center">
                                <span className="text-xs font-black text-red-400 uppercase tracking-wider">Mistakes</span>
                                <span className="text-xs font-bold text-red-700">
                                    {finalStats.fullMistakes} full &nbsp;·&nbsp; {finalStats.halfMistakes} half
                                </span>
                            </div>

                            <div className="flex flex-col space-y-3 pt-2">
                                <button 
                                    onClick={() => onTestComplete && onTestComplete(attemptId)} 
                                    disabled={!attemptId || isSaving}
                                    className={`w-full py-4 bg-[#0d6e70] hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 ${(!attemptId || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    <span>VIEW DETAILED ANALYSIS</span>
                                </button>
                                
                                <button onClick={() => setViewMode('selection')} className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">Return to Dashboard</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PitmanAPSModule;
