import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward, Clock, Activity, CheckCircle2, Share2, X, FileCheck, TrendingUp } from 'lucide-react';
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

const TypingArena = ({ initialCourse = 'kc-1', onTestComplete }) => {
    const [availableExercises, setAvailableExercises] = useState(() => {
        const stored = localStorage.getItem('admin_kailash_data_list');
        let newKc = [];
        if (stored) {
            const list = JSON.parse(stored);
            newKc = list.map((item, idx) => ({
                id: `kc-${idx + 1}`,
                title: `Kailash Chandra Vol (Test #${list.length - idx})`,
                lines: item.text.split('\n').filter(line => line.trim() !== '')
            }));
        } else {
            const legacy = localStorage.getItem('admin_kailash_data');
            if (legacy) {
                newKc = [{
                    id: 'kc-1',
                    title: 'Kailash Chandra Vol (Daily Update)',
                    lines: legacy.split('\n').filter(line => line.trim() !== '')
                }];
            }
        }
        
        let exercises = [...mockExercises];
        if (newKc.length > 0) {
            exercises = exercises.filter(e => e.id !== 'kc-1');
            exercises = [...newKc, ...exercises];
        }
        return exercises;
    });

    const [selectedExercise, setSelectedExercise] = useState(() => {
        return availableExercises.find(e => e.title.includes(initialCourse) || e.id === initialCourse) || availableExercises[0];
    });
    const mockReferenceLines = selectedExercise.lines;
    const mockReferenceText = mockReferenceLines.join(' ');

    const [inputText, setInputText] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [audioProgress, setAudioProgress] = useState(0);
    const utteranceRef = useRef(null);
    const referenceScrollRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [attemptId, setAttemptId] = useState(null);

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

        const timeElapsed = (600 - timeLeft) / 60; // in minutes
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
                // Ensure the currently typed word stays near the middle of the reference text container
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
        setTimeLeft(600);
        setWpm(0);
        setAccuracy(100);
        setIsPlaying(false);
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

        const timeElapsedMin = (600 - timeLeft) / 60;
        const validTime = timeElapsedMin > 0 ? timeElapsedMin : 1;

        const totalWords = typedWords.length;

        // Final WPM formula: (Total Words - Full Mistakes - (Half Mistakes * 0.5)) / Time
        const deduction = fullMistakes + (halfMistakes * 0.5);
        let finalWpm = (totalWords - deduction) / validTime;
        finalWpm = Math.max(0, Math.round(finalWpm));

        // Final accuracy 
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

        try {
            const { attemptId: newId } = await saveTestResult(supabase, {
                userId: '00000000-0000-0000-0000-000000000000', // Mock UUID
                exerciseId: selectedExercise.title,
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
        const text = `Hi Ayush Sir, I've just submitted my Shorthandians mock test.\n\n*Exercise:* Kailash Chandra Vol 1\n*WPM:* ${finalStats?.wpm}\n*Accuracy:* ${finalStats?.accuracy}%\n*Full Mistakes:* ${finalStats?.fullMistakes}\n*Half Mistakes:* ${finalStats?.halfMistakes}\n\nPlease review my performance. Thank you!`;
        window.open(`https://wa.me/917080811235?text=${encodeURIComponent(text)}`, '_blank');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
        }
        return () => window.speechSynthesis?.cancel();
    }, [mockReferenceText, playbackSpeed]);

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
                utteranceRef.current.rate = playbackSpeed;
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

    const changeSpeed = (rate) => {
        setPlaybackSpeed(rate);
        if (utteranceRef.current) {
            utteranceRef.current.rate = rate;
            if (isPlaying) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utteranceRef.current);
            }
        }
    };

    // Word Highlight Logic
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8 font-sans">
            <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col">

                {/* Top Bar */}
                <div className="bg-[#1e3a8a] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-bold tracking-wide">Exercise:</h2>
                        <select
                            className="bg-blue-800/50 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none border border-blue-700 focus:border-blue-400"
                            value={selectedExercise.id}
                            onChange={(e) => {
                                const ex = availableExercises.find(x => x.id === e.target.value);
                                setSelectedExercise(ex);
                                handleReset();
                            }}
                            disabled={isStarted}
                        >
                            {availableExercises.map(ex => (
                                <option key={ex.id} value={ex.id} className="bg-white text-gray-900">{ex.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-6 text-sm md:text-base font-semibold">
                        <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-200" />
                            <span className={`tracking-wider ${timeLeft <= 60 ? 'text-red-300 animate-pulse' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-200" />
                            <span>{Math.max(0, wpm)} WPM</span>
                        </div>

                        <div className="flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-200" />
                            <span>{accuracy}% Acc</span>
                        </div>
                    </div>
                </div>

                {/* Tabs for Multiple KC Tests */}
                {selectedExercise.id.startsWith('kc-') && availableExercises.filter(e => e.id.startsWith('kc-')).length > 1 && (
                    <div className="bg-blue-50 border-b border-gray-200 px-6 py-3 flex space-x-3 overflow-x-auto custom-scrollbar">
                        {availableExercises.filter(e => e.id.startsWith('kc-')).map((test) => (
                            <button
                                key={test.id}
                                onClick={() => { setSelectedExercise(test); handleReset(); }}
                                className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors shadow-sm ${selectedExercise.id === test.id ? 'bg-[#1e3a8a] text-white ring-2 ring-blue-300 ring-offset-1' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                            >
                                {test.title}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action / Dictation Area */}
                <div className="p-6 bg-blue-50/30 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
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
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1">
                        <Volume2 className="w-4 h-4 text-gray-400 mx-2" />
                        <div className="flex space-x-1 border-l border-gray-100 pl-2">
                            {[0.5, 0.7, 0.8, 1.0, 1.2].map(speed => (
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

                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
                    {/* Reference Text Area */}
                    <div className="flex flex-col h-[45vh] min-h-[300px]">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 shrink-0">Reference Text</h3>
                        <div 
                            ref={referenceScrollRef}
                            className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-y-auto leading-relaxed text-lg scroll-smooth"
                        >
                            {renderHighlightedText()}
                        </div>
                    </div>

                    {/* User Input Area */}
                    <div className="flex flex-col h-[45vh] min-h-[300px]">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 shrink-0">Your Translation</h3>
                        <textarea
                            className="flex-1 w-full bg-white border-2 border-gray-200 focus:border-[#1e3a8a] rounded-xl p-5 shadow-sm text-lg outline-none resize-none transition-colors"
                            placeholder="Start typing here... (Timer will start on your first keystroke)"
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
                </div>

                {/* Bottom Actions */}
                <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-xl transition-colors shadow-sm"
                    >
                        Reset Practice
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isStarted && inputText.length === 0}
                        className={`px-8 py-3 font-bold rounded-xl transition-transform shadow-md flex items-center space-x-2 ${(!isStarted && inputText.length === 0)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                            }`}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Submit Test</span>
                    </button>
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
    );
};

export default TypingArena;
