import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
    Activity, Clock, TrendingUp, TrendingDown, CheckCircle2, 
    ArrowLeft, Award, BookOpen, Target, ChevronRight, BarChart2,
    Zap, Sparkles, Star, Target as TargetIcon, Search, Filter
} from 'lucide-react';

const StudentPerformanceDashboard = ({ user, onBack, onViewResult, onTakeTest }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchAllResults = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                // Fetch all test results for current student, newest to oldest
                const { data, error } = await supabase
                    .from('test_results')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setResults(data || []);
            } catch (err) {
                console.error('Failed to fetch performance data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllResults();
    }, [user]);

    // Grouping by category - EXACT NAMES FROM APP.JSX
    const moduleInfo = {
        'formatting': { title: 'Allahabad High Court', icon: TargetIcon, color: 'indigo', view: 'formatting' },
        // 'kailash': { title: 'Kailash Chandra', icon: BookOpen, color: 'rose', view: 'arena-kc' },
        // 'audio': { title: 'Audio Dictations', icon: Zap, color: 'amber', view: 'arena-audio' },
        'pitman': { title: 'Pitman Shorthand', icon: Star, color: 'blue', view: 'pitman' },
        // 'comprehension': { title: 'Comprehension', icon: CheckCircle2, color: 'green', view: 'arena-comp' },
        // 'state': { title: 'State Exams', icon: BarChart2, color: 'purple', view: 'arena-state' },
    };

    const modulesWithData = results.reduce((acc, r) => {
        // Prioritize category from the mistakes_data JSON we now use, then fallback
        let cat = r.mistakes_data?.category || r.category || r.exercise_category;
        
        // --- Normalization Map (Sync labels between Admin and Dashboard) ---
        const normMap = {
            'highcourt':        'formatting',
            'formatting':        'formatting',
            'dictation':         'audio',
            'audio dictation':   'audio',
            'audio section':     'audio',
            'audio':             'audio',
            'pitman':            'pitman',
            'pitman aps':        'pitman',
            'pitman shorthand':  'pitman',
            'pitman exercise':   'pitman',
            'kailash':           'kailash',
            'kailash chandra':   'kailash',
            'kailash dictation': 'kailash',
            'state':             'state',
            'state exam':        'state',
            'comprehension':     'comprehension'
        };
        if (cat && typeof cat === 'string' && normMap[cat.toLowerCase().trim()]) {
            cat = normMap[cat.toLowerCase().trim()];
        }

        // --- Fallback Inference for legacy results or missing category ---
        if (!cat || !moduleInfo[cat]) {
            const exId = String(r.exercise_id || '').toLowerCase();
            const rawText = (String(r.mistakes_data?.original_text || '') + ' ' + String(r.mistakes_data?.attempted_text || '')).toLowerCase();
            const exTitle = (r.mistakes_data?.exercise_title || '').toLowerCase();
            
            if (exId.includes('formatting') || exId.includes('highcourt') || exId.includes('hc-') || exTitle.includes('formatting')) {
                cat = 'formatting';
            } else if (exId.includes('pitman') || exId.includes('shorthand') || exId.includes('aps') || exTitle.includes('pitman') || exTitle.includes('aps')) {
                cat = 'pitman';
            } else if (exId.includes('kc-') || exId.includes('kailash') || exId.includes('vol') || exTitle.includes('kailash')) {
                cat = 'kailash';
            } else if (exId.includes('comp-') || exId.includes('comprehension') || exTitle.includes('theory')) {
                cat = 'comprehension';
            } else if (exId.includes('state-') || exId.includes('exam') || exTitle.includes('state')) {
                cat = 'state';
            } else {
                cat = 'audio'; 
            }
        }
        
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    const filteredModuleInfo = useMemo(() => {
        const enrolled = user?.enrolled_courses || [];
        if (user?.role === 'admin') return moduleInfo;

        const filtered = {};
        const mapping = { 'hc-formatting': 'formatting', 'pitman-ex': 'pitman' };
        
        Object.entries(moduleInfo).forEach(([key, info]) => {
            const courseId = Object.keys(mapping).find(id => mapping[id] === key);
            if (enrolled.includes(courseId)) {
                filtered[key] = info;
            }
        });
        return filtered;
    }, [user?.enrolled_courses, user?.role]);

    const filteredModulesList = useMemo(() => {
        if (activeFilter === 'all') return Object.entries(filteredModuleInfo);
        return Object.entries(filteredModuleInfo).filter(([key]) => key === activeFilter);
    }, [activeFilter, filteredModuleInfo]);

    const PerformanceGauge = ({ current, previous }) => {
        if (!current) return (
            <div className="relative flex flex-col items-center opacity-50 grayscale">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="128" cy="128" r="80" className="stroke-gray-100 fill-none" strokeWidth="12" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest">No Data Yet</span>
                    </div>
                </div>
            </div>
        );
        
        let metric = 'WPM';
        let currentVal = current.wpm || 0;
        let prevVal = previous?.wpm || 0;
        let accCurrent = current.accuracy || 0;
        let accPrev = previous?.accuracy || 0;

        const cat = String(current.exercise_category || '').toLowerCase();
        if (cat === 'formatting' || cat === 'highcourt' || !current.wpm) {
             metric = 'Score';
             currentVal = current.accuracy || 0;
             prevVal = previous?.accuracy || 0;
        }

        const diffNum = currentVal - prevVal;
        const accDiff = accCurrent - accPrev;
        const isBetter = diffNum >= 0; 
        
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        const progress = (currentVal / (metric === 'WPM' ? 120 : 100)) * circumference;

        return (
            <div className="relative flex flex-col items-center">
                <div className="relative w-64 h-64 flex items-center justify-center transform transition-all duration-700 hover:scale-105">
                   <svg className="w-full h-full -rotate-90">
                       <circle cx="128" cy="128" r={radius} className="stroke-blue-100 fill-none" strokeWidth="12" />
                       <circle 
                           cx="128" cy="128" r={radius} 
                           className={`fill-none transition-all duration-1000 ease-out ${isBetter ? 'stroke-[#1e3a8a]' : 'stroke-rose-500'}`} 
                           strokeWidth="12"
                           strokeDasharray={circumference}
                           strokeDashoffset={circumference - Math.min(progress, circumference)}
                           strokeLinecap="round"
                       />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                       <span className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Latest {metric}</span>
                       <span className={`text-6xl font-black ${isBetter ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
                           {typeof currentVal === 'number' ? currentVal.toFixed(0) : currentVal}
                       </span>
                       <div className={`mt-2 flex items-center gap-1 text-sm font-black animate-in fade-in slide-in-from-bottom-2 ${isBetter ? 'text-green-600' : 'text-rose-500'}`}>
                            {previous ? (isBetter ? '+' : '') : ''}
                            {previous ? (diffNum.toFixed(1)) : '---'}
                       </div>
                   </div>
                </div>
                <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 px-6 rounded-[2rem] shadow-sm">
                        <div className="flex flex-col items-center border-r border-gray-200 pr-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Accuracy</span>
                            <span className="text-2xl font-black text-gray-900">{accCurrent.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Trend</span>
                            <div className={`flex items-center gap-1 text-lg font-black ${accDiff >= 0 ? 'text-green-600' : 'text-rose-500'}`}>
                                {accDiff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {accDiff >= 0 ? '+' : ''}{accDiff.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full bg-gray-50 flex flex-col font-sans pb-20">
            <div className="w-full p-4 md:p-8 lg:p-12 space-y-12">
                
                {/* 1. FILTER TABS */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-[#1e3a8a] text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                            All Modules
                        </button>
                        {Object.entries(filteredModuleInfo).map(([key, info]) => (
                            <button 
                                key={key}
                                onClick={() => setActiveFilter(key)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeFilter === key ? 'bg-[#1e3a8a] text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                {info.title.split(' ').pop()}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Module View</span>
                    </div>
                </div>

                {/* 2. HUGE CENTRAL METER SECTION */}
                {!loading && results.length > 0 && activeFilter === 'all' && (
                    <div className="w-full flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 px-6 py-2 rounded-full shadow-sm mb-4">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-black text-[#1e3a8a] uppercase tracking-widest">Live Progress Analysis</span>
                        </div>

                        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 items-center gap-12 bg-white rounded-[4rem] p-12 shadow-2xl relative overflow-hidden ring-1 ring-black/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[100px] -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] -ml-32 -mb-32 opacity-40" />
                            
                            <div className="hidden lg:flex flex-col space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Experience</h3>
                                    <p className="text-4xl font-black text-gray-900">{results.length} Tests</p>
                                </div>
                                <div className="h-px bg-gray-100 w-full" />
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Mastery Level</h3>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-8 h-8 text-amber-500" />
                                        <span className="text-3xl font-black text-[#1e3a8a]">Expert</span>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100 w-full" />
                                <button onClick={() => onViewResult(results[0].id)} className="bg-[#1e3a8a] text-white p-6 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-blue-900/10">
                                    <div className="text-left">
                                        <span className="text-[10px] font-black uppercase text-blue-200">View Latest</span>
                                        <p className="font-black text-lg">Detailed Report</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </button>
                            </div>

                            <div className="flex justify-center z-10">
                                <PerformanceGauge current={results[0]} previous={results[1]} />
                            </div>

                            <div className="flex flex-col space-y-6">
                                <div className="bg-gray-50/50 p-8 rounded-[3rem] space-y-6 border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-blue-800/40 uppercase tracking-[0.2em] mb-3">Lifetime Records</span>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-black/[0.02]">
                                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Star className="w-5 h-5 text-amber-500" /></div>
                                                <div>
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Peak Accuracy</span>
                                                    <span className="text-xl font-black text-gray-900">{Math.max(...results.map(r => r.accuracy || 0)).toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-black/[0.02]">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-blue-500" /></div>
                                                <div>
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Speed</span>
                                                    <span className="text-xl font-black text-gray-900">{Math.max(...results.map(r => r.wpm || 0))} WPM</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col border-t border-gray-200 pt-6">
                                        <div className="flex justify-between items-center mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <span>Shorthandian Rank</span>
                                            <span className="text-[#1e3a8a]">{Math.min(100, Math.round(results.length * 5))}%</span>
                                        </div>
                                        <div className="w-full bg-white h-4 rounded-full p-1 border border-black/5 shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-blue-400 to-[#1e3a8a] rounded-full" style={{ width: `${Math.min(100, results.length * 5)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                         <div className="w-16 h-16 rounded-full border-4 border-blue-50 border-t-[#1e3a8a] animate-spin shadow-2xl" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8"><BookOpen className="w-16 h-16 text-blue-100" /></div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Start Your Performance Tracking</h2>
                        <p className="text-gray-500 max-w-lg mb-10 text-lg font-medium">Complete any test to see your interactive meter and analysis dashboard.</p>
                        <button onClick={onBack} className="bg-[#1e3a8a] text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Start Your First Test</button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="flex items-center gap-6">
                            <div className="h-px bg-gray-200 flex-1" />
                             <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] px-4">Detailed Module Breakdown</h2>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                            {filteredModulesList.map(([modKey, modMeta]) => {
                                const modResults = modulesWithData[modKey] || [];
                                const currentTest = modResults[0]; 
                                const previousTest = modResults[1] || null;
                                const hasData = modResults.length > 0;
                                const Icon = modMeta.icon;

                                return (
                                    <div key={modKey} className={`bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl transition-all flex flex-col relative group ${!hasData ? 'opacity-60 hover:opacity-100' : 'hover:-translate-y-2 hover:shadow-2xl'}`}>
                                        <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
                                            <div className={`w-12 h-12 bg-${modMeta.color}-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <Icon className={`w-6 h-6 text-${modMeta.color}-500`} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="text-base font-black text-gray-900 truncate tracking-tight">{modMeta.title}</h3>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{modResults.length} Tests Attempted</span>
                                            </div>
                                        </div>

                                        {hasData ? (
                                            <div className="space-y-6 flex-1">
                                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-black/[0.02]">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase">Recent Metrics</span>
                                                        <span className="text-[10px] font-black text-[#1e3a8a] bg-blue-50 px-2.5 py-1 rounded-lg">LATEST</span>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div className="flex flex-col">
                                                             <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Accuracy</span>
                                                             <span className="text-2xl font-black text-gray-900">{currentTest.accuracy?.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-black/5 shadow-sm">
                                                             {(currentTest.accuracy >= (previousTest?.accuracy || 0)) ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                                                             <span className="text-[11px] font-black text-gray-600">
                                                                  {((currentTest.accuracy || 0) - (previousTest?.accuracy || 0)).toFixed(1)}%
                                                             </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => onViewResult(currentTest.id)} className="w-full bg-[#1e3a8a] text-white font-black uppercase text-[10px] py-4 rounded-2xl tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg">View Full Report</button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col justify-center items-center text-center py-6">
                                                <Lock className="w-8 h-8 text-gray-200 mb-3" />
                                                <p className="text-xs font-bold text-gray-400 mb-4">No content practiced in this module yet.</p>
                                                <button 
                                                    onClick={() => onTakeTest && onTakeTest(modMeta.view)} 
                                                    className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest border-b-2 border-blue-100 hover:border-[#1e3a8a] transition-all"
                                                >
                                                    Go Practice →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple Lock icon replacement since I used Lucide but added it here
const Lock = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default StudentPerformanceDashboard;
