import React, { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, Share2, X, FileCheck, ArrowLeft, Eye, Clock, Maximize, Minimize, TrendingUp } from 'lucide-react';
import { supabase } from './supabaseClient';
import { saveTestResult } from './lib/saveTestResult';

const PitmanAPSModule = ({ onBack, onTestComplete, category }) => {
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'practice'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);

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

                // 2. Fetch from Local Admin Data
                const saved = localStorage.getItem('admin_pitman_data_list');
                if (saved) {
                    const local = JSON.parse(saved);
                    const localMapped = local.map(d => ({
                        ...d,
                        isDynamic: true,
                        image: d.pdf || d.image_url,
                        lines: (d.original_text || d.text || '').split('\n').filter(l => l.trim() !== '')
                    }));
                    mergedData = [...mergedData, ...localMapped];
                }
            } catch(e) {}

            // 3. FINAL FILTER: Hide ALL "Test X" files
            const finalized = mergedData.filter(ex => {
                const title = (ex.title || '').toLowerCase().trim();
                // ONLY hide generic 'test' files like "Test 1", "test 4", "dummy"
                const isGenericTest = /^test\s\d+$/i.test(title) || /test\s*(one|two|three|four|five)/i.test(title) || title === 'test' || title.includes('dummy');
                return !isGenericTest;
            });

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

    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        const cats = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        exercises.forEach(ex => {
            const dateStr = ex.created_at ? new Date(ex.created_at).toLocaleDateString() : new Date().toLocaleDateString();
            if (dateStr === today) cats['Today'].push(ex);
            else if (dateStr === yesterday) cats['Yesterday'].push(ex);
            cats['All Practice'].push(ex);
        });
        return cats;
    }, [exercises]);

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
        if (isStarted && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isStarted, timeLeft]);

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
        setIsStarted(false);
        const refWords = selectedExercise.lines.join(' ').split(' ');
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
        const wpmVal = Math.round((typedWords.length - deduction) / ((timerPreset - timeLeft) / 60 || 1));
        const accVal = refWords.length > 0 ? Math.round(((refWords.length - deduction) / refWords.length) * 100) : 100;
        const stats = { wpm: wpmVal, accuracy: accVal, fullMistakes, halfMistakes, totalWords: typedWords.length };
        setFinalStats(stats); setShowModal(true); setIsSaving(true); setHasSubmitted(true);
        try {
            const userSess = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const { attemptId: newId } = await saveTestResult(supabase, {
                userId: userSess.id || '00000000-0000-0000-0000-000000000000',
                studentName: userSess.name || 'Student',
                exerciseId: selectedExercise.id, // Using real UUID now
                exerciseCategory: 'Pitman APS',
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                attemptedText: inputText,
                originalText: mockReferenceText,
                totalMistakes: Math.ceil(deduction)
            });
            setAttemptId(newId);
        } finally { setIsSaving(false); }
    };

    // UI RENDERERS
    if (isLoadingExercises) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
                <div className="text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#1e3a8a] font-bold text-lg">Loading Course Syllabus...</p>
                </div>
            </div>
        );
    }

    if (viewMode === 'selection') {
        const activeList = groupedTests[activeDateTab] || [];
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
                <div className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center space-x-4 shadow-md">
                    <button onClick={onBack} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                    <h2 className="text-xl font-bold tracking-wide">Pitman Shorthand Module</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="w-full mx-auto space-y-10">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="text-4xl font-black text-[#1e3a8a] tracking-tight">Pitman Dashboard</h3>
                                <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest italic text-blue-600">Select an exercise to begin your shorthand practice</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                {['Today', 'Yesterday', 'All Practice'].map(tab => (
                                    <button key={tab} onClick={() => setActiveDateTab(tab)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeDateTab === tab ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-400 hover:text-blue-900'}`}>{tab}</button>
                                ))}
                            </div>
                        </div>

                        {activeList.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 py-32 text-center shadow-inner">
                                <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-gray-800 italic">No official exercises published yet</h3>
                                <p className="text-gray-400 text-sm mt-1">Check back later or contact your administrator.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                                {activeList.map((test) => (
                                    <div key={test.id} onClick={() => { setSelectedExercise(test); setViewMode('practice'); handleReset(); }} className="group bg-white rounded-[2rem] p-6 shadow-xl hover:translate-y-[-8px] transition-all cursor-pointer border border-transparent hover:border-[#1e3a8a]/30">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6"><Eye className="w-7 h-7 text-blue-600" /></div>
                                        <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight group-hover:text-[#1e3a8a] line-clamp-2">{test.title}</h3>
                                        <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">{test.lines?.join(' ').split(' ').length} WORDS • {new Date(test.created_at || Date.now()).toLocaleDateString()}</p>
                                        <button className="w-full py-3 bg-[#f8fbff] text-blue-600 group-hover:bg-[#1e3a8a] group-hover:text-white rounded-xl text-xs font-black uppercase transition-all">Start Practice</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Practice Mode ─────────────────────────────────────
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-lg z-20">
                <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-1/3">
                    <button onClick={() => setViewMode('selection')} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <div><h2 className="text-lg font-black tracking-tight line-clamp-1">{selectedExercise?.title}</h2><span className="text-[10px] text-blue-200 uppercase font-black">Pitman Shorthand Practice</span></div>
                </div>
                
                <div className="flex items-center justify-center w-full md:w-1/3 mb-4 md:mb-0">
                    {/* Centered space previously holding submit button */}
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

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
                {/* Outlines Side */}
                <div className="border-r border-gray-100 flex flex-col bg-[#fcfdfe]">
                    <div className="bg-gray-50 border-b px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex justify-between items-center">
                        <span>Shorthand Reference</span>
                    </div>
                    <div className="flex-1 bg-white overflow-hidden relative">
                        {selectedExercise?.image && !selectedExercise.image.includes('card') ? (
                            selectedExercise.image.startsWith('data:application/pdf') ? 
                            <iframe src={selectedExercise.image} className="absolute inset-0 w-full h-full border-none" title="PDF Outline" /> :
                            <div className="absolute inset-0 overflow-auto p-6 flex justify-center items-start">
                                <img src={selectedExercise.image} alt="Outline" className="max-w-full h-auto shadow-2xl rounded-lg contrast-125" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 border-dashed">
                                    <Eye className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting Admin Media...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Typing Side */}
                <div className="flex flex-col bg-white">
                    <div className="bg-gray-50 border-b px-6 py-3 flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Transcription Area</span>
                         <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-gray-400" /><span className={`font-mono font-black text-xl ${timeLeft < 60 ? 'text-red-600' : 'text-[#1e3a8a]'}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span></div>
                    </div>
                    <textarea value={inputText} onChange={handleInputChange} disabled={hasSubmitted} className="flex-1 w-full p-8 text-lg font-serif outline-none resize-none leading-relaxed" placeholder="Click here and start typing to begin..." spellCheck="false" />
                    <div className="bg-white border-t border-gray-100 p-2 flex justify-center items-center space-x-3 shrink-0">
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
                        <div className="bg-[#1e3a8a] p-10 text-center text-white relative">
                             <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                             <h2 className="text-2xl font-black">Practice Logged</h2>
                             <p className="text-blue-200 text-sm italic">Session completed successfully</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-2xl text-center"><span className="text-[9px] font-black text-blue-400 block mb-1 uppercase">Final Speed</span><span className="text-2xl font-black text-[#1e3a8a] leading-none">{finalStats.wpm} WPM</span></div>
                                <div className="bg-green-50 p-4 rounded-2xl text-center transition-all"><span className="text-[9px] font-black text-green-400 block mb-1 uppercase">Accuracy</span><span className="text-2xl font-black text-green-600 leading-none">{finalStats.accuracy}%</span></div>
                            </div>
                            
                            <div className="flex flex-col space-y-3">
                                <button 
                                    onClick={() => onTestComplete && onTestComplete(attemptId)} 
                                    disabled={!attemptId || isSaving}
                                    className={`w-full py-4 bg-[#1e3a8a] hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 ${(!attemptId || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
