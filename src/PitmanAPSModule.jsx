import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, CheckCircle2, Share2, X, FileCheck, ArrowLeft, Eye, Clock, Maximize, Minimize } from 'lucide-react';
import { supabase } from './supabaseClient';
import { saveTestResult } from './lib/saveTestResult';

const pitmanExercises = [
    {
        id: 'ex-110',
        title: 'Exercise 110',
        words: 188,
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Pitman_shorthand.png',
        lines: [
            "I should like to say a few words about the budget.",
            "First of all I must congratulate the Finance Minister on his excellent performance.",
            "He has shown a great deal of courage and foresight in preparing this budget.",
            "There are many new taxes, but they are necessary for the development of our country.",
            "I hope that the people will bear this burden cheerfully.",
            "We must all work hard to make our five-year plan a success.",
            "The progress we have made so far is very encouraging.",
            "I am sure that under the able leadership of our Prime Minister we shall achieve our goals.",
            "Let us all unite and work together for the prosperity of our great nation."
        ],
        created_at: '2024-01-01T00:00:00.000Z'
    },
    {
        id: 'ex-111',
        title: 'Exercise 111',
        words: 125,
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Pitman_shorthand.png',
        lines: [
            "This is a supplementary exercise to build speed.",
            "Continuous practice is essential for mastering these complex outlines.",
            "In this dictation you will find many joined phrases and special contractions.",
            "Read the shorthand passage carefully before attempting transcription.",
            "Remember that accuracy is just as important as speed when submitting exams."
        ],
        created_at: '2024-01-01T00:00:00.000Z'
    },
    {
        id: 'ex-112',
        title: 'Exercise 112',
        words: 145,
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Pitman_shorthand.png',
        lines: [
            "Legal proceedings demand extreme precision from the reporter.",
            "The judge issued an order directly affecting the outcome of the writ jurisdiction case.",
            "All pending dues were processed along with the statutory interest demanded.",
            "Focus completely on the audio and immediately map sounds to strokes.",
            "The High Court requires dedicated commitment and error-free typing."
        ],
        created_at: '2024-01-01T00:00:00.000Z'
    }
];

const PitmanAPSModule = ({ onBack, onTestComplete, category }) => {
    const [exercises, setExercises] = useState(pitmanExercises);
    const [selectedExercise, setSelectedExercise] = useState(pitmanExercises[0]);
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'practice'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);

    // Load dynamic tests from Admin
    useEffect(() => {
        const load = async () => {
            setIsLoadingExercises(true);
            let remoteTests = [];
            
            // 1. Fetch from Supabase
            try {
                if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
                    const { data, error } = await supabase
                        .from('exercises')
                        .select('*')
                        .in('category', ['pitman', 'Pitman Shorthand'])
                        .eq('is_hidden', false)
                        .order('created_at', { ascending: false });
                    
                    if (!error && data) {
                        remoteTests = data.map(d => ({
                            ...d,
                            isDynamic: true,
                            image: d.image_url || d.pdf || d.image, // Fallback through potential column names
                            lines: (d.original_text || '').split('\n').filter(l => l.trim() !== '')
                        }));
                    }
                }
            } catch(e) {}

            // 2. Load from LocalStorage
            let localTests = [];
            const saved = localStorage.getItem('admin_pitman_data_list');
            if (saved) {
                try {
                    const dynamic = JSON.parse(saved);
                    localTests = dynamic.map(d => ({
                        ...d,
                        isDynamic: true,
                        image: d.pdf,
                        lines: (d.original_text || d.text || '').split('\n').filter(l => l.trim() !== '')
                    }));
                } catch (e) {}
            }
                    
            // Merge: Remote -> Local -> Static
            const merged = [...remoteTests, ...localTests, ...pitmanExercises];
            setExercises(merged);
            
            if (merged.length > 0 && selectedExercise.id === pitmanExercises[0].id) {
                setSelectedExercise(merged[0]);
            }
            setIsLoadingExercises(false);
        };

        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, []);

    // ── Grouping Logic ──────────────────────────────────────────
    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

        const categories = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        
        exercises.forEach(ex => {
            const exDate = ex.created_at ? new Date(ex.created_at) : new Date();
            const dateStr = exDate.toLocaleDateString();
            
            if (dateStr === today) categories['Today'].push(ex);
            else if (dateStr === yesterday) categories['Yesterday'].push(ex);
            
            categories['All Practice'].push(ex);
        });

        return categories;
    }, [exercises]);

    const mockReferenceText = selectedExercise.lines.join(' ');

    const [inputText, setInputText] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [timerPreset, setTimerPreset] = useState(600); // default 10 mins
    const [timeLeft, setTimeLeft] = useState(600);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);

    // Audio & Transcription
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(80); // Speed in WPM
    const [audioProgress, setAudioProgress] = useState(0);
    const [showKey, setShowKey] = useState(false);
    const utteranceRef = useRef(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [attemptId, setAttemptId] = useState(null);

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

    useEffect(() => {
        let timer;
        if (isStarted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isStarted, timeLeft]);

    useEffect(() => {
        if (!isStarted || inputText.length === 0) return;
        const timeElapsed = (timerPreset - timeLeft) / 60;
        if (timeElapsed > 0) {
            const wordsTyped = inputText.trim().split(/\s+/).length;
            setWpm(Math.round(wordsTyped / timeElapsed));
        }

        const refWords = mockReferenceText.split(' ');
        const typedWords = inputText.trim().split(/\s+/);
        let correctWords = 0;
        typedWords.forEach((word, index) => {
            if (word === refWords[index]) correctWords++;
        });
        setAccuracy(typedWords.length > 0 ? Math.round((correctWords / typedWords.length) * 100) : 100);
    }, [inputText, timeLeft, isStarted]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleInputChange = (e) => {
        if (!isStarted) setIsStarted(true);
        setInputText(e.target.value);
    };

    // Audio setup mapping WPM presets to speech synthesis rates
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(mockReferenceText);
            u.lang = 'en-IN';
            u.rate = playbackSpeed / 100; // rough mapping: 80 wpm -> 0.8
            u.onboundary = (e) => {
                const progress = (e.charIndex / mockReferenceText.length) * 100;
                setAudioProgress(progress);
            };
            u.onend = () => {
                setIsPlaying(false);
                setAudioProgress(100);
            };
            u.onerror = () => setIsPlaying(false);
            utteranceRef.current = u;
        }
        return () => window.speechSynthesis?.cancel();
    }, [playbackSpeed, mockReferenceText]);

    const togglePlayPause = () => {
        if (!utteranceRef.current) return;
        if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utteranceRef.current);
            }
            setIsPlaying(true);
        }
    };

    const resetAudio = () => {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
        setAudioProgress(0);
    };

    const handleSpeedChange = (speedPreset) => {
        setPlaybackSpeed(speedPreset);
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setAudioProgress(0);
        }
    };

    const handleReset = () => {
        setInputText('');
        setIsStarted(false);
        setTimeLeft(timerPreset);
        setWpm(0);
        setAccuracy(100);
        setIsPlaying(false);
        setHasSubmitted(false);
        setShowKey(false);
    };

    const calculateFinalStats = () => {
        const refWords = selectedExercise.lines.join(' ').split(' ');
        const typedWords = inputText.trim().split(/\s+/).filter(w => w !== '');

        let fullMistakes = 0;
        let halfMistakes = 0;

        refWords.forEach((refWord, index) => {
            const typedWord = typedWords[index] || '';
            if (typedWord === refWord) return;
            if (!typedWord) {
                fullMistakes++;
                return;
            }
            const cleanRef = refWord.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
            const cleanTyped = typedWord.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();

            if (cleanRef === cleanTyped) halfMistakes++;
            else fullMistakes++;
        });

        if (typedWords.length > refWords.length) {
            fullMistakes += (typedWords.length - refWords.length);
        }

        const timeElapsedMin = (timerPreset - timeLeft) / 60;
        const validTime = timeElapsedMin > 0 ? timeElapsedMin : 1;
        const totalWords = typedWords.length;
        const deduction = fullMistakes + (halfMistakes * 0.5);
        let finalWpm = Math.max(0, Math.round((totalWords - deduction) / validTime));
        let finalAcc = refWords.length > 0 ? Math.max(0, Math.round(((refWords.length - deduction) / refWords.length) * 100)) : 100;

        return { wpm: finalWpm, accuracy: finalAcc, fullMistakes, halfMistakes, totalWords };
    };

    const handleSubmit = async () => {
        setIsStarted(false);
        resetAudio();

        const stats = calculateFinalStats();
        setFinalStats(stats);
        setShowModal(true);
        setIsSaving(true);
        setHasSubmitted(true);

        let resolvedUserId = '00000000-0000-0000-0000-000000000000';
        let resolvedUserName = 'Guest Student';
        try {
            const currentSession = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentSession.id) resolvedUserId = currentSession.id;
            if (currentSession.name) resolvedUserName = currentSession.name;
        } catch {}

        try {
            const { attemptId: newId } = await saveTestResult(supabase, {
                userId: resolvedUserId,
                studentName: resolvedUserName,
                exerciseId: `${selectedExercise.title} (Pitman_APS)`,
                exerciseCategory: category,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                attemptedText: inputText,
                originalText: mockReferenceText,
                mistakesCount: stats.fullMistakes + Math.ceil(stats.halfMistakes * 0.5)
            });
            setAttemptId(newId);
        } catch (error) {
            console.error('Error saving stats:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWhatsAppShare = () => {
        const text = `Hi Ayush Sir, I've just completed the Pitman APS mock test.\n\n*Exercise:* ${selectedExercise.title} (Pitman Practice)\n*WPM:* ${finalStats?.wpm}\n*Accuracy:* ${finalStats?.accuracy}%\n*Full Mistakes:* ${finalStats?.fullMistakes}\n*Half Mistakes:* ${finalStats?.halfMistakes}\n\nPlease review my performance. Thank you!`;
        window.open(`https://wa.me/917080811235?text=${encodeURIComponent(text)}`, '_blank');
    };

    const renderKey = () => {
        return selectedExercise.lines.map((line, idx) => (
            <p key={idx} className="mb-2 text-gray-800 leading-relaxed">{line}</p>
        ));
    };

    // ── Loading Skeleton ─────────────────────────
    if (isLoadingExercises) {
        return (
            <div className="h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#1e3a8a] font-bold text-lg">Loading Pitman exercises...</p>
                    <p className="text-gray-400 text-sm mt-1">Connecting to Shorthand Database</p>
                </div>
            </div>
        );
    }

    // ── Selection UI ───────────────────────────────────────
    if (viewMode === 'selection') {
        const activeList = groupedTests[activeDateTab] || [];
        
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
                {/* Header */}
                <div className="bg-[#1e3a8a] text-white px-6 py-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center space-x-4">
                        <button onClick={onBack} className="hover:bg-blue-800 p-2 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                        <h2 className="text-xl font-bold tracking-wide">Pitman Shorthand Module</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10">
                    <div className="w-full mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Pitman Dashboard</h3>
                                <p className="text-gray-500 font-bold mt-1">Practice your strokes with specialized day-wise exercises.</p>
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

                        {activeList.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
                                <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-gray-800">No exercises found for {activeDateTab}</h3>
                                <p className="text-gray-400 max-w-xs mx-auto mt-2 font-bold">New Pitman exercises will appear here once published by the Admin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                                {activeList.map((test) => (
                                    <div 
                                        key={test.id}
                                        onClick={() => {
                                            setSelectedExercise(test);
                                            setViewMode('practice');
                                            handleReset();
                                        }}
                                        className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-[#1e3a8a] hover:translate-y-[-8px] transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/5 rounded-bl-[4rem] group-hover:bg-[#1e3a8a]/10 transition-colors" />
                                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 shadow-sm">
                                            <Eye className="w-7 h-7 text-amber-600" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight group-hover:text-[#1e3a8a] h-12 overflow-hidden">
                                            {test.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
                                            <span>{test.words || test.lines.join(' ').split(' ').length} Words</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span>{test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Exercise'}</span>
                                        </div>
                                        <button className="w-full py-3 bg-gray-50 group-hover:bg-[#1e3a8a] group-hover:text-white rounded-xl text-gray-600 text-xs font-black uppercase tracking-widest transition-all">
                                            Start Practice
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
            {/* Top Bar */}
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md z-10">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <button onClick={() => setViewMode('selection')} className="hover:bg-blue-800 p-2 rounded-full transition-colors" title="Back to Selection">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold tracking-wide">Pitman APS Module</h2>
                        <span className="text-xs text-blue-200">{selectedExercise.title} • Pitman Shorthand Practice</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors border border-blue-400/30 flex items-center justify-center text-blue-200 hover:text-white"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    <select
                        className="bg-blue-800/50 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none border border-blue-700 focus:border-blue-400"
                        value={selectedExercise.id}
                        onChange={(e) => {
                            const ex = exercises.find(x => x.id.toString() === e.target.value.toString());
                            if (ex) {
                                setSelectedExercise(ex);
                                handleReset();
                            }
                        }}
                        disabled={isStarted || hasSubmitted}
                    >
                        {exercises.map((ex) => (
                            <option key={ex.id} value={ex.id} className="bg-white text-gray-900">
                                {ex.isDynamic ? '🆕 ' : ''}{ex.title}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center space-x-2 bg-blue-800/50 px-3 py-1.5 rounded-lg text-sm">
                        <Activity className="w-4 h-4 text-blue-200" />
                        <span>{Math.max(0, wpm)} WPM</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-blue-800/50 px-3 py-1.5 rounded-lg text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        <span>{accuracy}%</span>
                    </div>
                </div>
            </div>


            <div className="flex-1 w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">

                {/* Left Side: Shorthand Strokes Image */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
                    <div className="bg-gray-100 px-4 py-3 border-b text-sm font-bold text-gray-600 uppercase flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <span>Shorthand Outlines</span>
                        </div>
                        <span className="text-xs font-normal text-gray-400">{selectedExercise.title}</span>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto bg-[#f8fbff]">
                        {selectedExercise.image && selectedExercise.image.startsWith('data:application/pdf') ? (
                            <iframe src={selectedExercise.image} className="w-full h-full border-none min-h-[400px]" title="Pitman PDF" />
                        ) : (
                            <img
                                src={selectedExercise.image}
                                alt="Shorthand Strokes"
                                className="max-w-full h-auto opacity-80 contrast-125 filter mix-blend-multiply"
                            />
                        )}
                        <p className="mt-8 text-sm text-gray-400 font-medium italic">Refer to the script and transcribe exactly onto the right panel.</p>
                    </div>
                </div>

                {/* Right Side: Standard Typing Engine */}
                <div className="flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                            <FileCheck className="w-5 h-5 text-green-600" />
                            <span>Your Transcription</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {!isStarted && !hasSubmitted && (
                                <select 
                                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 px-2 py-1 rounded outline-none"
                                    value={timerPreset}
                                    onChange={(e) => {
                                        const newTime = Number(e.target.value);
                                        setTimerPreset(newTime);
                                        setTimeLeft(newTime);
                                    }}
                                >
                                    <option value={300}>5 mins</option>
                                    <option value={600}>10 mins</option>
                                    <option value={900}>15 mins</option>
                                </select>
                            )}
                            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <span className={`font-mono font-black text-2xl tracking-wider ${timeLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-[#1e3a8a]'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <textarea
                        className="flex-1 w-full bg-white border-2 border-gray-200 focus:border-[#1e3a8a] rounded-xl p-5 shadow-sm text-lg outline-none resize-none transition-colors"
                        placeholder="Start typing your transcription here... (Timer starts automatically)"
                        value={inputText}
                        onChange={handleInputChange}
                        onCopy={(e) => { e.preventDefault(); alert("Copying is disabled!"); }}
                        onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled!"); }}
                        onContextMenu={(e) => { e.preventDefault(); }}
                        disabled={timeLeft === 0 || hasSubmitted}
                        spellCheck="false"
                    />

                    {/* Review Section (Shows only after submission) */}
                    {hasSubmitted && (
                        <div className="bg-white border-2 border-amber-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center">
                                    <Eye className="w-4 h-4 mr-2" /> Expert Review Mode
                                </h3>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded transition-colors"
                                >
                                    {showKey ? 'Hide Original Key' : 'Reveal Original Key'}
                                </button>
                            </div>

                            {showKey ? (
                                <div className="bg-amber-50 p-4 rounded border border-amber-100 font-serif text-[15px]">
                                    {renderKey()}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">Click the reveal button to compare your text with the exact original English passage.</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border border-gray-200 rounded-xl shadow-sm">
                        <button
                            onClick={handleReset}
                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-lg transition-colors text-sm"
                        >
                            Reset Module
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={hasSubmitted || (!isStarted && inputText.length === 0)}
                            className={`px-6 py-2.5 font-bold rounded-lg transition-transform shadow-md flex items-center space-x-2 text-sm ${hasSubmitted ? 'bg-green-600 text-white cursor-default' :
                                (!isStarted && inputText.length === 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                    'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                                }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{hasSubmitted ? 'Submitted' : 'Submit Transcription'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Same Validation Modal from TypingArena */}
            {
                showModal && finalStats && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md animate-in fade-in zoom-in duration-300">
                            <div className="bg-[#1e3a8a] py-6 px-6 text-center text-white relative">
                                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-blue-200 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                                <FileCheck className="w-16 h-16 mx-auto mb-3 text-blue-100" />
                                <h2 className="text-2xl font-black">Submission Successful</h2>
                                <p className="text-blue-200 font-medium tracking-wide">Pitman Exercise Results</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Final WPM</span>
                                        <span className="text-3xl font-black text-[#1e3a8a]">{finalStats.wpm}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Accuracy</span>
                                        <span className="text-3xl font-black text-green-600">{finalStats.accuracy}%</span>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">Total Mistakes</span>
                                        <span className="text-2xl font-bold text-red-600">{finalStats.fullMistakes + finalStats.halfMistakes}</span>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Half Mistakes</span>
                                        <span className="text-2xl font-bold text-amber-600">{finalStats.halfMistakes}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-3">
                                    {isSaving ? (
                                        <div className="text-center text-gray-400 font-bold text-sm py-2">Saving to Database...</div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => onTestComplete?.(attemptId)}
                                                disabled={!attemptId}
                                                className={`w-full py-3 bg-[#1e3a8a] text-white font-black rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all ${!attemptId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800 hover:scale-105'}`}
                                            >
                                                <Activity className="w-5 h-5" />
                                                <span>View Detailed Analysis</span>
                                            </button>
                                            <button
                                                onClick={handleWhatsAppShare}
                                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-md transition-colors"
                                            >
                                                <Share2 className="w-5 h-5" />
                                                <span>Share on WhatsApp</span>
                                            </button>
                                            <button
                                                onClick={() => setShowModal(false)}
                                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#1e3a8a] font-bold rounded-xl transition-colors"
                                            >
                                                Review Transcription
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PitmanAPSModule;

