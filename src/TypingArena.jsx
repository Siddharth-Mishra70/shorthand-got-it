import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward, Clock, Activity, CheckCircle2, Share2, X, FileCheck, TrendingUp, Headphones, ArrowLeft, Maximize, Minimize, Sparkles, Upload, Music, FileText } from 'lucide-react';
import { supabase } from './supabaseClient';
import { saveTestResult } from './lib/saveTestResult';

const mockExercises = [
    {
        id: 'kc-1',
        title: 'Kailash Chandra Vol 1',
        lines: [
            "Mr. Deputy Speaker, Sir, I am extremely thankful to you for giving me this opportunity to speak on the Finance Bill. The various provisions made in this Bill have far reaching consequences.",
            "I rise to support the Budget presented by the Honourable Finance Minister. He has presented a Budget which is not only balanced but also progressive in its outlook. The entire country has welcomed the proposals made in the Budget. The relief given to the common man, especially in the matter of direct taxes, is commendable.",
            "It is true that the prices of essential commodities have gone up to some extent in the recent past, but this is a global phenomenon. We cannot view our economy in isolation. The pressures of international market have their impact on our domestic prices as well. The Government has taken several steps to check inflation and stabilize prices. The public distribution system is being strengthened to ensure that the weaker sections of the society get essential items at reasonable rates.",
            "Sir, agriculture is the backbone of our economy. Unless our agriculturists prosper, the country cannot prosper. I am glad that the Government has recognized the importance of agriculture and has increased the allocation for rural development. The provision of credit facilities to farmers at reduced rates of interest will go a long way in boosting agricultural production. However, I feel that more attention needs to be paid to the irrigation sector. A large part of our cultivable land is still dependent on the vagaries of monsoon. The completion of ongoing irrigation projects should be taken up on a priority basis.",
            "I would also like to draw the attention of the House to the problem of unemployment, especially among the educated youth. It is a matter of serious concern that a large number of young men and women, despite possessing necessary qualifications, are unable to find suitable jobs. The various employment generation schemes launched by the Government are no doubt useful, but they fall short of the actual requirement. We need a massive program of industrialization, particularly in the rural and backward areas, to create more employment opportunities. The cottage and small scale industries have a vital role to play in this regard. The Government should provide more incentives and support to these industries.",
            "Regarding the power sector, I must point out that the chronic shortage of electricity in many parts of the country is severely affecting the industrial and agricultural production. Power is the basic necessity for any developmental activity. The Government should chalk out a comprehensive plan to increase power generation, both through conventional and non-conventional sources. The state electricity boards need to be revamped to improve their efficiency and reduce transmission and distribution losses.",
            "Sir, education is another vital area which requires urgent attention. The goal of universalization of elementary education is yet to be achieved. The quality of education in government schools leaves much to be desired. The allocation for education should be substantially increased to improve the infrastructure and provide better facilities to the students.",
            "In conclusion, I would request the Honourable Minister to consider the suggestions made by various members and bring about necessary amendments in the Bill. With these words, I support the Finance Bill. Thank you."
        ]
    },
    {
        id: 'ssc-cd',
        title: 'SSC Grade C & D',
        lines: [
            "The selection process for SSC Grade C demands an error free transcript.",
            "Punctuation rules are strictly enforced during the skill test.",
            "A speed of hundred words per minute is expected from all participating candidates.",
            "Continuous practice will gradually improve your overall consistency."
        ]
    }
];

const TypingArena = ({ initialCourse = 'kc-1', onTestComplete, courses, onNavigateCourse, category }) => {
    const [availableExercises, setAvailableExercises] = useState(mockExercises);
    const [selectedExercise, setSelectedExercise] = useState(mockExercises[0]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);
    const [dbExerciseId, setDbExerciseId] = useState(null);   // real UUID from Supabase
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'practice'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [isTestActive, setIsTestActive] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const textareaRef = useRef(null);

    // Additional state & refs for Typing Arena
    const [inputText, setInputText] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(10);
    const [targetWpm, setTargetWpm] = useState(80);
    const [timeLeft, setTimeLeft] = useState(600);

    useEffect(() => {
        if (!isStarted) {
            setTimeLeft(selectedDuration * 60);
        }
    }, [selectedDuration, isStarted]);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [audioProgress, setAudioProgress] = useState(0);
    
    const referenceScrollRef = useRef(null);
    const utteranceRef = useRef(null);
    const audioRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [attemptId, setAttemptId] = useState(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Custom Content Upload States
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customAudioFile, setCustomAudioFile] = useState(null);
    const [customAudioUrl, setCustomAudioUrl] = useState(null);
    const [customText, setCustomText] = useState('');
    const [isUploadingCustom, setIsUploadingCustom] = useState(false);

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

    // Test Countdown Effect
    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setIsTestActive(true);
            setIsStarted(true); // Start the 10-minute timer immediately
            setCountdown(null);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
                // Audio is now manual-play exclusively; auto-play has been disabled
            }, 100);
        }
        return () => clearTimeout(timer);
    }, [countdown, selectedExercise, playbackSpeed]);



    // ── Fetch exercises from Supabase on mount ─────────────────────────────────
    useEffect(() => {
        const fetchExercisesAndUser = async () => {
            setIsLoadingExercises(true);
            try {
                // 1. Fetch exercises table robustly without crashing if new custom columns were added/removed
                const { data: dbExercises, error: exError } = await supabase
                    .from('exercises')
                    .select('*')
                    .eq('is_hidden', false)
                    .order('created_at', { ascending: false });

                if (!exError && dbExercises && dbExercises.length > 0) {
                    // Map Supabase rows → component exercise shape
                    const mapped = dbExercises.map(ex => ({
                        id: ex.id,                       // UUID (used for DB save)
                        title: ex.title,
                        category: ex.category,           // Important for grouping
                        lines: (ex.original_text || '')
                            .split('\n')
                            .filter(l => l.trim() !== '')
                    }));

                    const stored = localStorage.getItem('admin_kailash_data_list');
                    let localKc = [];
                    if (stored) {
                        const list = JSON.parse(stored);
                        localKc = list.map((item, idx) => ({
                            id: `kc-local-${idx + 1}`,
                            title: item.title || `Kailash Chandra Vol (Test #${list.length - idx})`,
                            category: 'kailash',
                            lines: (item.text || item.original_text || '').split('\n').filter(line => line.trim() !== '')
                        }));
                    }

                    const storedComp = localStorage.getItem('admin_comprehension_data_list');
                    let localComp = [];
                    if (storedComp) {
                        const list = JSON.parse(storedComp);
                        localComp = list.map((item, idx) => ({
                            id: item.id || `comp-local-${idx + 1}`,
                            title: item.title || `Comprehension #${list.length - idx}`,
                            category: 'comprehension',
                            lines: (item.text || item.original_text || '').split('\n').filter(line => line.trim() !== '')
                        }));
                    }
                    
                    const storedAudio = localStorage.getItem('admin_published_audio_list');
                    let localAudio = [];
                    if (storedAudio) {
                        const list = JSON.parse(storedAudio);
                        localAudio = list.map((item, idx) => ({
                            id: item.id || `audio-local-${idx + 1}`,
                            title: item.title || `Audio Dictation #${list.length - idx}`,
                            category: 'audio',
                            audio: item.audio,
                            state: item.state,
                            lines: (item.text || item.original_text || '').split('\n').filter(line => line.trim() !== '')
                        }));
                    }

                    const combinedRaw = [...mapped.map(m => {
                        const dbEx = dbExercises.find(x => x.id === m.id);
                        if (dbEx && (dbEx.category === 'audio' || dbEx.category === 'Audio Dictation')) {
                            m.audio = dbEx.audio_url || dbEx.audio;
                            m.category = 'audio';
                        }
                        return m;
                    }), ...localKc, ...localAudio, ...localComp];

                    // DEDUPLICATE by ID before setting state to avoid "duplicate key" react error
                    const uniqueMap = new Map();
                    combinedRaw.forEach(item => {
                        if (item.id) uniqueMap.set(item.id, item);
                    });
                    const combined = Array.from(uniqueMap.values());
                    
                    setAvailableExercises(combined);

                    // Auto-select first exercise
                    if (combined.length > 0) {
                        const first = combined[0];
                        setSelectedExercise(first);
                        setDbExerciseId(first.id && !first.id.startsWith('kc-') && !first.id.startsWith('ssc-') ? first.id : null);
                    }
                } else {
                    // Supabase returned nothing — fall back to mock data
                    console.warn('[TypingArena] No exercises in DB, using mock data.', exError?.message);
                    setAvailableExercises(mockExercises);
                    setSelectedExercise(mockExercises[0]);
                }
            } catch (err) {
                console.error('[TypingArena] Supabase fetch failed:', err);
                setAvailableExercises(mockExercises);
                setSelectedExercise(mockExercises[0]);
            } finally {
                setIsLoadingExercises(false);
            }
        };

        fetchExercisesAndUser();
    }, []);

    useEffect(() => {
        // Skip this effect while DB exercises are still loading
        if (isLoadingExercises) return;

        // Check if there is a pending routed test from State Exams wrapper
        let targetCourseId = initialCourse;
        const activeTestId = localStorage.getItem('active_selected_test_id');
        if (activeTestId) {
            targetCourseId = activeTestId;
            localStorage.removeItem('active_selected_test_id');
            setViewMode('practice'); // Auto-start if specifically routed
        }

        const isAudioView = targetCourseId === 'audio-dict' || targetCourseId === 'arena-audio';
        const isCompView = targetCourseId === 'comprehension' || targetCourseId === 'arena-comp';
        
        if (isAudioView || selectedExercise?.id === 'audio-dict') {
            const audios = availableExercises.filter(e => e.category === 'audio');
            if (audios.length > 0) {
                const target = audios[0];
                if (selectedExercise?.id !== target.id) {
                    target.isAudioCourse = true;
                    setSelectedExercise(target);
                    setDbExerciseId(target.id.startsWith('audio-local') ? null : target.id);
                    handleReset();
                }
            }
        } else if (isCompView || selectedExercise?.id === 'comprehension' || selectedExercise?.id === 'arena-comp') {
             const comps = availableExercises.filter(e => e.category === 'comprehension');
             if (comps.length > 0) {
                 const target = comps[0];
                 if (selectedExercise?.id !== target.id) {
                     setSelectedExercise(target);
                     setDbExerciseId(target.id.startsWith('comp-local') ? null : target.id);
                     handleReset();
                 }
             }
        } else {
            const found = availableExercises.find(e => e.id === targetCourseId || e.title.includes(targetCourseId));
            if (found && selectedExercise?.id !== found.id) {
                setSelectedExercise(found);
                setDbExerciseId(found?.id && !found.id.startsWith('kc-') && !found.id.startsWith('ssc-') ? found.id : null);
                if (found.category === 'audio') {
                    found.isAudioCourse = true;
                }
                handleReset();
            }
        }
    }, [initialCourse, availableExercises, isLoadingExercises]);

    // ── Grouping Logic ──────────────────────────────────────────
    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        const sixDaysAgo = Date.now() - (5 * 86400000);

        const categories = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        
        const currentCategory = selectedExercise?.category || (initialCourse === 'arena-audio' ? 'audio' : (initialCourse === 'arena-comp' ? 'comprehension' : 'kailash'));
        const list = availableExercises.filter(e => e.category === currentCategory || (currentCategory === 'kailash' && e.id.startsWith('kc-')));

        list.forEach(ex => {
            const exDate = ex.created_at ? new Date(ex.created_at) : new Date();
            const dateStr = exDate.toLocaleDateString();
            
            if (dateStr === today) categories['Today'].push(ex);
            else if (dateStr === yesterday) categories['Yesterday'].push(ex);
            
            categories['All Practice'].push(ex);
        });

        return categories;
    }, [availableExercises, selectedExercise, initialCourse]);

    // Robust Date Tab fallback
    useEffect(() => {
        if (viewMode === 'selection' && groupedTests['Today']?.length === 0 && groupedTests['Yesterday']?.length === 0) {
            setActiveDateTab('All Practice');
        }
    }, [groupedTests, viewMode]);

    // Safety check for selected exercise properties
    const mockReferenceLines = selectedExercise?.lines || [];
    const mockReferenceText = mockReferenceLines.join(' ');



    // Timer logic
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



    // Statistics calculation
    useEffect(() => {
        if (!isStarted || inputText.length === 0) return;

        const timeElapsed = ((selectedDuration * 60) - timeLeft) / 60; // in minutes
        if (timeElapsed > 0) {
            const wordsTyped = inputText.trim().split(/\s+/).length;
            const currentWPM = Math.round(wordsTyped / timeElapsed);
            setWpm(currentWPM);
        }

        // Accuracy Calculation
        const refWords = mockReferenceText.split(' ');
        const typedWords = inputText.trim().split(/\s+/);
        let correctWords = 0;

        typedWords.forEach((word, index) => {
            if (word === refWords[index]) {
                correctWords++;
            }
        });

        const currAccuracy = typedWords.length > 0
            ? Math.round((correctWords / typedWords.length) * 100)
            : 100;
        setAccuracy(currAccuracy);

        // Auto-scroll logic based on typing progress
        if (referenceScrollRef.current) {
            const currentElement = referenceScrollRef.current.querySelector('.current-word');
            if (currentElement) {
                currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

    }, [inputText, timeLeft, isStarted, mockReferenceText]);

    const handleInputChange = (e) => {
        if (!isStarted) {
            setIsStarted(true);
        }
        setInputText(e.target.value);
    };

    const handleReset = () => {
        setInputText('');
        setIsStarted(false);
        setTimeLeft(selectedDuration * 60);
        setWpm(0);
        setAccuracy(100);
        setIsPlaying(false);
        setIsTestActive(false);
        setCountdown(null);
        resetAudio(); 
    };

    const calculateFinalStats = () => {
        const refWords = mockReferenceLines.join(' ').split(' ');
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

            const cleanRef = refWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
            const cleanTyped = typedWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();

            if (cleanRef === cleanTyped) halfMistakes++;
            else fullMistakes++;
        });

        if (typedWords.length > refWords.length) {
            fullMistakes += (typedWords.length - refWords.length);
        }

        const timeElapsedMin = ((selectedDuration * 60) - timeLeft) / 60;
        const validTime = timeElapsedMin > 0 ? timeElapsedMin : 1;
        const totalWords = typedWords.length;
        const deduction = fullMistakes + (halfMistakes * 0.5);
        let finalWpm = (totalWords - deduction) / validTime;
        finalWpm = Math.max(0, Math.round(finalWpm));

        let finalAcc = 100;
        if (refWords.length > 0) {
            finalAcc = Math.max(0, Math.round(((refWords.length - deduction) / refWords.length) * 100));
        }

        return { wpm: finalWpm, accuracy: finalAcc, fullMistakes, halfMistakes, totalWords };
    };

    const handleSubmit = async () => {
        setIsStarted(false);
        resetAudio();

        const stats = calculateFinalStats();
        setFinalStats(stats);
        setShowModal(true);
        setIsSaving(true);

        // Use real DB UUID if available, else fall back to exercise title string
        const resolvedExerciseId = dbExerciseId || selectedExercise.id || selectedExercise.title;
        
        // --- AUTH SYNC: Get the real logged-in user ID from localStorage session ---
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
                exerciseId: resolvedExerciseId,
                exerciseCategory: category,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                attemptedText: inputText,
                originalText: mockReferenceText,
                mistakesCount: stats.fullMistakes + Math.ceil(stats.halfMistakes * 0.5)
            });
            setAttemptId(newId);
            
            // Automatically redirect natively to the Detailed Result Analysis Page immediately upon successful DB save
            if (onTestComplete) {
                onTestComplete(newId);
            }
        } catch (error) {
            console.error('Error saving stats:', error);
            setIsSaving(false);
        }
    };

    const handleWhatsAppShare = () => {
        const text = `Hi Ayush Sir, I've just submitted my Shorthandians mock test.\n\n*Exercise:* Kailash Chandra Vol 1\n*WPM:* ${finalStats?.wpm}\n*Accuracy:* ${finalStats?.accuracy}%\n*Full Mistakes:* ${finalStats?.fullMistakes}\n*Half Mistakes:* ${finalStats?.halfMistakes}\n\nPlease review my performance. Thank you!`;
        window.open(`https://wa.me/917080811235?text=${encodeURIComponent(text)}`, '_blank');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!selectedExercise || !mockReferenceText) return;
        
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && !selectedExercise.isAudioCourse) {
            const u = new SpeechSynthesisUtterance(mockReferenceText);
            u.lang = 'en-US';
            u.rate = playbackSpeed;
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
        } else {
            utteranceRef.current = null;
        }
        return () => window.speechSynthesis?.cancel();
    }, [mockReferenceText, playbackSpeed, selectedExercise.isAudioCourse]);

    const togglePlayPause = () => {
        if (selectedExercise.isAudioCourse && audioRef.current && audioRef.current.src) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.playbackRate = playbackSpeed;
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                setIsPlaying(true);
            }
            return;
        }

        if (!utteranceRef.current) return;

        if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.cancel();
                utteranceRef.current.rate = playbackSpeed;
                window.speechSynthesis.speak(utteranceRef.current);
            }
            setIsPlaying(true);
        }
    };

    const resetAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
        setAudioProgress(0);
    };

    const changeSpeed = (rate) => {
        setPlaybackSpeed(rate);
        if (audioRef.current && audioRef.current.src) {
            audioRef.current.playbackRate = rate;
            if (isPlaying) {
                audioRef.current.pause();
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
        } else if (utteranceRef.current) {
            utteranceRef.current.rate = rate;
            if (isPlaying) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utteranceRef.current);
            }
        }
    };

    const renderHighlightedText = () => {
        const inputWords = inputText ? inputText.split(' ') : [];
        const isLastWordInProgress = inputText && !inputText.endsWith(' ');
        const typedWords = isLastWordInProgress ? inputWords.slice(0, -1) : inputWords.filter(w => w !== '');
        const currentTypingWord = isLastWordInProgress ? inputWords[inputWords.length - 1] : '';

        let globalIndex = 0;

        return mockReferenceLines.map((line, lineIndex) => {
            const lineWords = line.split(' ');
            return (
                <div key={lineIndex} className="mb-4 leading-relaxed font-medium">
                    {lineWords.map((word, wordIdx) => {
                        const index = globalIndex++;
                        let colorClass = "text-gray-700";

                        if (index < typedWords.length) {
                            if (typedWords[index] === word) {
                                colorClass = "text-green-600 bg-green-50 font-bold";
                            } else {
                                colorClass = "text-red-600 bg-red-50 line-through decoration-red-400";
                            }
                        } else if (index === typedWords.length) {
                            if (isLastWordInProgress) {
                                if (word.startsWith(currentTypingWord)) {
                                    colorClass = "text-blue-600 border-b-2 border-blue-400 current-word";
                                } else {
                                    colorClass = "text-red-500 underline decoration-wavy current-word";
                                }
                            } else {
                                colorClass = "text-gray-900 bg-gray-200 current-word shadow-sm";
                            }
                        }
                        return (
                            <span key={index} className={`inline-block mr-1.5 mb-2 px-[2px] rounded ${colorClass} whitespace-pre-wrap break-words`}>
                                {word}
                            </span>
                        );
                    })}
                </div>
            );
        });
    };

    // ── Loading skeleton while fetching from Supabase ─────────────────────────
    if (isLoadingExercises) {
        return (
            <div className="h-full flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#1e3a8a] font-bold text-lg">Loading exercises from database...</p>
                    <p className="text-gray-400 text-sm mt-1">Connecting to Supabase</p>
                </div>
            </div>
        );
    }

    // ── Custom Upload UI ───────────────────────────────────────
    if (viewMode === 'custom-upload') {
        return (
            <div className="h-full flex-1 bg-[#f8fafc] flex flex-col p-4 md:p-8 overflow-y-auto no-scrollbar">
                <div className="max-w-3xl mx-auto w-full space-y-8">
                    <button 
                        onClick={() => {
                             setIsCustomMode(false);
                             setViewMode('selection');
                        }}
                        className="flex items-center text-gray-500 hover:text-[#1e3a8a] font-bold transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Library
                    </button>

                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-[10rem] -z-0 opacity-50" />
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Practice with Your Own Audio</h2>
                            <p className="text-gray-500 font-bold mb-10">Upload your own dictate and transcription logic for customized training.</p>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-black text-gray-700 uppercase tracking-widest">
                                        <Music className="w-4 h-4 mr-2 text-indigo-500" /> 1. Upload Audio File
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="audio/*" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setCustomAudioFile(file);
                                                    setCustomAudioUrl(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="hidden" 
                                            id="custom-audio-upload"
                                        />
                                        <label 
                                            htmlFor="custom-audio-upload"
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${customAudioFile ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-indigo-400'}`}
                                        >
                                            <Upload className={`w-8 h-8 mb-2 ${customAudioFile ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <span className={`text-sm font-bold ${customAudioFile ? 'text-indigo-700' : 'text-gray-500'}`}>
                                                {customAudioFile ? customAudioFile.name : 'Click to select audio (MP3, WAV, etc.)'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-black text-gray-700 uppercase tracking-widest">
                                        <FileText className="w-4 h-4 mr-2 text-indigo-500" /> 2. Paste Transcription Text
                                    </label>
                                    <textarea 
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        placeholder="Paste the correct text here. This will be used to calculate your accuracy..."
                                        className="w-full h-48 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-mono text-sm leading-relaxed"
                                    />
                                </div>

                                <button 
                                    onClick={() => {
                                        if (!customAudioUrl || !customText.trim()) {
                                            alert("Please upload an audio file and provide the transcription text.");
                                            return;
                                        }
                                        
                                        const customEx = {
                                            id: `custom-${Date.now()}`,
                                            title: `Custom Practice: ${customAudioFile?.name || 'Untitled'}`,
                                            category: 'audio',
                                            isAudioCourse: true,
                                            audio: customAudioUrl,
                                            lines: customText.split('\n').filter(l => l.trim() !== ''),
                                            isCustom: true
                                        };
                                        
                                        setSelectedExercise(customEx);
                                        setDbExerciseId(null);
                                        setViewMode('practice');
                                        if (audioRef.current) {
                                            audioRef.current.src = customAudioUrl;
                                        }
                                    }}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center space-x-3"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Start Custom Practice</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Selection UI ───────────────────────────────────────
    if (viewMode === 'selection') {
        const activeList = groupedTests[activeDateTab] || [];
        const moduleTitle = selectedExercise?.category === 'audio' ? 'Audio Dictation' : (selectedExercise?.category === 'comprehension' ? 'Comprehension Mastery' : 'Kailash Chandra Mastery');
        
        return (
            <div className="h-full flex-1 bg-[#f8fafc] flex flex-col p-4 md:p-8 overflow-y-auto no-scrollbar">
                <div className="w-full px-4 md:px-6 mx-auto space-y-8">
                    {/* Module Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-[#0f2167] tracking-tight">{moduleTitle}</h2>
                            <p className="text-gray-500 font-bold mt-1">Select an exercise to begin your practice session.</p>
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

                    {/* Grid Selection */}
                    {activeList.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">No content found for {activeDateTab}</h3>
                            <p className="text-gray-400 max-w-xs mx-auto mt-2 font-bold">Try checking the 'All Practice' tab to see earlier uploads.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {/* CUSTOM PRACTICE CARD */}
                            <div 
                                onClick={() => {
                                    setIsCustomMode(true);
                                    setViewMode('custom-upload');
                                }}
                                className="group bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] p-6 shadow-xl shadow-indigo-100/50 border-2 border-dashed border-indigo-200 hover:border-indigo-600 hover:translate-y-[-8px] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[4rem] group-hover:bg-indigo-500/10 transition-colors" />
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 shadow-sm border border-indigo-200">
                                        <Sparkles className="w-7 h-7 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600">
                                        Practice with Own Content
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider leading-relaxed">
                                        Upload your own audio and transcription text for personalized training.
                                    </p>
                                </div>
                                <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200">
                                    Get Started
                                </button>
                            </div>

                            {activeList.map((test, idx) => (
                                <div 
                                    key={test.id}
                                    onClick={() => {
                                        const t = {...test};
                                        if (t.category === 'audio') {
                                            t.isAudioCourse = true;
                                        }
                                        setSelectedExercise(t);
                                        setDbExerciseId(t.id.startsWith('kc-') ? null : t.id);
                                        setViewMode('practice');
                                        if (t.category === 'audio' && audioRef.current && t.audio) {
                                            audioRef.current.src = t.audio;
                                        }
                                    }}
                                    className="group bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-[#1e3a8a] hover:translate-y-[-8px] transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/5 rounded-bl-[4rem] group-hover:bg-[#1e3a8a]/10 transition-colors" />
                                    
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${test.category === 'audio' ? 'bg-amber-100' : 'bg-blue-50'}`}>
                                        {test.category === 'audio' ? <Headphones className="w-7 h-7 text-amber-600" /> : <FileCheck className="w-7 h-7 text-blue-600" />}
                                    </div>
                                    
                                    <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight group-hover:text-[#1e3a8a]">
                                        {test.title.length > 40 ? test.title.slice(0, 40) + '...' : test.title}
                                    </h3>
                                    
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
                                        <span>{test.lines.join(' ').split(' ').length} Words</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span>{test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Demo'}</span>
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
        );
    }

    if (viewMode === 'practice' && !selectedExercise) {
        return (
            <div className="h-full flex-1 bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="text-center">
                    <Activity className="w-16 h-16 text-[#1e3a8a] mx-auto mb-4 opacity-20" />
                    <p className="text-[#1e3a8a] font-bold text-lg">No exercise selected</p>
                    <button 
                        onClick={() => setViewMode('selection')}
                        className="mt-4 px-6 py-2 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg"
                    >
                        Back to Selection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] flex-1 bg-gray-50 flex flex-col font-sans text-lg overflow-hidden relative">
            <div className="w-full h-full bg-white shadow-xl overflow-hidden border border-gray-100 flex flex-col relative transition-all duration-300">

                {/* Top Bar */}
                <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 shadow-md shrink-0">
                    <div className="flex items-center space-x-2">
                        <select
                            className="bg-blue-800/50 text-white text-[11px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg outline-none border border-blue-700/50 focus:border-blue-400 max-w-[140px] truncate"
                            value={courses ? (courses.find(c => c.id === initialCourse)?.view || '') : (selectedExercise?.id || '')}
                            onChange={(e) => {
                                if (onNavigateCourse && courses) {
                                    onNavigateCourse(e.target.value);
                                } else {
                                    const ex = availableExercises.find(x => x.id === e.target.value);
                                    if (ex) {
                                        const finalEx = { ...ex, isAudioCourse: ex.category === 'audio' };
                                        setSelectedExercise(finalEx);
                                        handleReset();
                                    }
                                }
                            }}
                            disabled={isStarted}
                        >
                            {courses ? courses.map(c => (
                                <option key={c.view} value={c.view} className="bg-white text-gray-900">{c.title}</option>
                            )) : availableExercises.map(ex => (
                                <option key={ex.id} value={ex.id} className="bg-white text-gray-900">{ex.title}</option>
                            ))}
                        </select>
                        <div className="flex items-center space-x-2 ml-2 border-l border-blue-400/30 pl-2 hidden lg:flex">
                            <select
                                className="bg-blue-800/50 text-white text-[11px] font-black px-2 py-1.5 rounded-lg outline-none border border-blue-700/50 focus:border-blue-400"
                                value={selectedDuration}
                                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                                disabled={isStarted}
                            >
                                {Array.from({length: 11}, (_, i) => i + 5).map(m => (
                                    <option key={m} value={m} className="bg-white text-gray-900">{m} Min</option>
                                ))}
                            </select>
                            <select
                                className="bg-blue-800/50 text-white text-[11px] font-black px-2 py-1.5 rounded-lg outline-none border border-blue-700/50 focus:border-blue-400"
                                value={targetWpm}
                                onChange={(e) => setTargetWpm(Number(e.target.value))}
                                disabled={isStarted}
                            >
                                {Array.from({length: 12}, (_, i) => 40 + (i * 10)).map(w => (
                                    <option key={w} value={w} className="bg-white text-gray-900">{w} WPM</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 text-sm font-bold">
                        <div className="flex items-center space-x-1.5 bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-700/30">
                            <Clock className="w-4 h-4 text-blue-200" />
                            <span className={`text-xl font-black tabular-nums tracking-widest ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-1.5 bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-700/30 hidden sm:flex">
                            <Activity className="w-4 h-4 text-blue-200" />
                            <span className="text-xs uppercase tracking-tight">{Math.max(0, wpm)} WPM</span>
                        </div>

                        {/* Top Control Section for Audio Dictations */}
                        {selectedExercise.isAudioCourse && (
                            <div className="flex items-center space-x-2 pl-2 border-l border-blue-400/30">
                                {!isTestActive && countdown === null ? (
                                    <button
                                        onClick={() => setCountdown(5)}
                                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 flex items-center space-x-1.5"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>START TEST</span>
                                    </button>
                                ) : countdown !== null ? (
                                    <div className="px-4 py-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-lg animate-pulse flex items-center space-x-2 border border-red-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{countdown}s</span>
                                    </div>
                                ) : (
                                    <div className="px-4 py-1.5 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center space-x-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span>LIVE</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center space-x-2 pl-2 border-l border-blue-400/30">
                            <button
                                onClick={toggleFullscreen}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all active:scale-95"
                            >
                                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-3 py-1.5 bg-white/10 hover:bg-red-500/20 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isStarted && inputText.length === 0}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center space-x-1.5 active:scale-95 ${(!isStarted && inputText.length === 0)
                                    ? 'bg-blue-400/50 text-blue-200 cursor-not-allowed border border-blue-400/50'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Submit</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Layout */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    
                    {/* Main Arena Content */}
                    <div className="flex-1 flex flex-col w-full relative min-h-0">
                        <div className="flex-1 flex flex-col overflow-hidden w-full relative min-h-0 custom-scrollbar">
                        {/* Action / Dictation Area (Hide in Audio Mode as it's now integrated) */}
                        {!selectedExercise?.isAudioCourse && (
                            <div className="p-6 bg-blue-50/30 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={togglePlayPause}
                                        className="w-12 h-12 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                    </button>
                                    <button
                                        onClick={resetAudio}
                                        className="w-10 h-10 bg-white border border-gray-300 text-gray-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a] rounded-full flex items-center justify-center shadow-sm transition-colors"
                                        title="Restart Audio"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <div className="flex flex-col ml-4">
                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Audio Dictation</span>
                                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1e3a8a] transition-all duration-100 ease-linear"
                                                style={{ width: `${audioProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Speed Controller */}
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1 overflow-x-auto max-w-full">
                                    <Volume2 className="w-4 h-4 text-gray-400 mx-2 shrink-0" />
                                    <div className="flex space-x-1 border-l border-gray-100 pl-2">
                                        {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => changeSpeed(speed)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${playbackSpeed === speed
                                                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`flex-1 p-2 md:p-6 ${selectedExercise?.isAudioCourse ? 'flex flex-col' : 'flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8'} overflow-y-auto lg:overflow-hidden`}>
                            {selectedExercise?.isAudioCourse ? (
                                <div className="flex flex-col space-y-4 h-full min-h-0">
                                    <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 flex flex-col items-center gap-4 md:gap-5 shadow-sm">
                                        
                                        <div className="flex items-center space-x-4 shrink-0 w-full mb-3">
                                            <div className="w-12 h-12 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center shadow-md">
                                                <Headphones className="w-6 h-6" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <h3 className="text-lg font-bold text-gray-800 leading-tight">{selectedExercise?.title}</h3>
                                                <p className="text-xs text-gray-500 font-medium">Listening Transcription</p>
                                            </div>
                                        </div>

                                        {/* HTML5 Native Audio Player Component */}
                                        {selectedExercise?.audio && (
                                            <div className="w-full bg-blue-50/60 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                                                <div className="flex-1 w-full">
                                                    <audio 
                                                        ref={audioRef}
                                                        controls 
                                                        controlsList="nodownload"
                                                        src={selectedExercise?.audio} 
                                                        className="w-full h-[46px] outline-none rounded-xl"
                                                        onTimeUpdate={(e) => {
                                                            const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
                                                            setAudioProgress(progress || 0);
                                                        }}
                                                        onEnded={() => {
                                                            setIsPlaying(false);
                                                            setAudioProgress(100);
                                                        }}
                                                    />
                                                </div>
                                                <div className="shrink-0 flex items-center bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl p-1.5 shadow-sm">
                                                    <div className="flex items-center space-x-1">
                                                        {[0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                                            <button
                                                                key={speed}
                                                                onClick={() => changeSpeed(speed)}
                                                                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${playbackSpeed === speed
                                                                    ? 'bg-[#1e3a8a] text-white shadow-md scale-105'
                                                                    : 'text-gray-500 hover:bg-white hover:text-[#1e3a8a]'
                                                                    }`}
                                                            >
                                                                {speed}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Massive Transcription Field */}
                                    <div className="flex flex-col h-[60vh] md:h-full md:flex-1 bg-white border-2 border-gray-200 rounded-[2rem] p-4 md:p-8 shadow-xl shadow-blue-900/5">
                                        
                                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 h-10 md:h-12 shrink-0">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${isTestActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
                                                    {isTestActive ? 'Live Transcription' : 'Transcription Locked'}
                                                </h3>
                                            </div>
                                            <div className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-black italic tracking-wider shadow-sm hidden sm:block">
                                                NO COPY-PASTE
                                            </div>
                                        </div>
                                        <div className={`flex-1 border-2 rounded-xl p-2 md:p-4 shadow-sm flex flex-col min-h-0 transition-all duration-500 ${isTestActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300 grayscale opacity-60'}`}>
                                            <textarea
                                                ref={textareaRef}
                                                className={`flex-1 w-full h-full bg-transparent text-xl leading-relaxed text-gray-900 outline-none resize-none placeholder-gray-400 font-bold scroll-custom p-8 ${!isTestActive ? 'cursor-not-allowed select-none' : ''}`}
                                                placeholder={isTestActive ? "Listen to the audio and transcribe here..." : "Click 'START TEST' above to begin the countdown..."}
                                                value={inputText}
                                                onChange={handleInputChange}
                                                onCopy={(e) => { e.preventDefault(); alert("Copying is disabled!"); }}
                                                onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled!"); }}
                                                onContextMenu={(e) => { e.preventDefault(); }}
                                                disabled={!isTestActive || timeLeft === 0}
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Reference Text Area */}
                                    <div className="flex flex-col h-[30vh] lg:h-full lg:flex-1 min-h-0">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 shrink-0">Reference Text</h3>
                                        <div 
                                            ref={referenceScrollRef}
                                            className="flex-1 bg-white border border-gray-200 rounded-xl p-3 md:p-5 shadow-sm overflow-y-auto leading-relaxed text-base md:text-lg scroll-smooth min-h-0"
                                        >
                                            {renderHighlightedText()}
                                        </div>
                                    </div>

                                    {/* User Input Area */}
                                    <div className="flex flex-col h-[35vh] lg:h-full lg:flex-1 min-h-0">
                                        <div className="flex items-center justify-between mb-3 shrink-0">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Translation</h3>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={handleReset}
                                                    className="px-4 py-1.5 bg-white hover:bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={!isStarted && inputText.length === 0}
                                                    className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center space-x-2 active:scale-95 ${(!isStarted && inputText.length === 0)
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200/50'
                                                        }`}
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>Submit</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Native HTML5 Audio Player conditionally displayed for Standard Texts that have Audio attached */}
                                        {selectedExercise?.audio && (
                                            <div className="mb-4 w-full bg-blue-50/60 p-3 rounded-2xl border border-blue-100 shadow-sm flex flex-col">
                                                <span className="text-xs text-[#1e3a8a] font-bold uppercase tracking-widest pl-2 flex items-center mb-2"><Headphones className="w-4 h-4 mr-2" /> Dictation Source Audio</span>
                                                <audio 
                                                    ref={audioRef}
                                                    controls 
                                                    controlsList="nodownload"
                                                    src={selectedExercise?.audio} 
                                                    className="w-full h-[46px] outline-none rounded-xl"
                                                    onTimeUpdate={(e) => {
                                                        const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
                                                        setAudioProgress(progress || 0);
                                                    }}
                                                    onEnded={() => {
                                                        setIsPlaying(false);
                                                        setAudioProgress(100);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <textarea
                                            className="flex-1 w-full bg-white border-4 border-gray-100 focus:border-[#1e3a8a] rounded-2xl p-6 shadow-xl shadow-gray-200/50 text-2xl font-bold text-gray-900 outline-none resize-none transition-all duration-300"
                                            placeholder="Start typing your response here. The timer will automatically begin on your first keystroke..."
                                            value={inputText}
                                            onChange={handleInputChange}
                                            onCopy={(e) => { e.preventDefault(); alert("Copying is disabled!"); }}
                                            onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled!"); }}
                                            onContextMenu={(e) => { e.preventDefault(); }}
                                            disabled={timeLeft === 0}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        
                    </div>
                </div>
            </div>

            {/* Results Modal */}
            {showModal && finalStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1e3a8a] py-6 px-6 text-center text-white relative">
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-blue-200 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <FileCheck className="w-16 h-16 mx-auto mb-3 text-blue-100" />
                            <h2 className="text-2xl font-black">Test Submitted!</h2>
                            <p className="text-blue-200 font-medium tracking-wide">Detailed Result Analysis</p>
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
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">Full Mistakes</span>
                                    <span className="text-2xl font-bold text-red-600">{finalStats.fullMistakes}</span>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-1">Half Mistakes</span>
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
                                            className={`w-full py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white font-black rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all ${!attemptId ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                        >
                                            <TrendingUp className="w-5 h-5" />
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
                                            onClick={() => { setShowModal(false); handleReset(); }}
                                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                        >
                                            Close & Retry
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            

            </div>
        </div>
    );
};

export default TypingArena;
