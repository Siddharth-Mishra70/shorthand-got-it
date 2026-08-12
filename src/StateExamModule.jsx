import React, { useState, useEffect } from 'react';
import { ArrowLeft, Map, ChevronRight, Scale, Edit2, Headphones, BookOpen, FileText, Search, X } from 'lucide-react';

const STATE_EXAMS = [
    'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
    'Gujarat', 'Punjab', 'Haryana', 'Uttarakhand', 'Delhi',
    'Jharkhand', 'Chhattisgarh', 'Odisha', 'West Bengal', 'Karnataka',
    'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Himachal Pradesh'
];

const MODULE_TYPES = [
    { key: 'highcourt', label: 'High Court Formatting', icon: Scale },
    { key: 'pitman', label: 'Pitman Exercise', icon: Edit2 },
    { key: 'audio', label: 'Audio Dictation', icon: Headphones },
    { key: 'kailash', label: 'Kailash Chandra', icon: BookOpen },
    { key: 'comprehension', label: 'Comprehension', icon: FileText },
];

const StateExamModule = ({ onBack, onSelectTest, onNavigateCourse }) => {
    const [stateExams, setStateExams] = useState({});
    const [selectedState, setSelectedState] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('admin_state_exams');
        if (saved) {
            try {
                setStateExams(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // 1. View: Select State
    if (!selectedState) {
        return (
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 h-full">
                <div className="w-full mx-auto flex flex-col">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">State Exams</h2>
                    <p className="text-gray-600 mb-8">Select a state to practice its native mock tests and formatting exercises.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {STATE_EXAMS.map(state => {
                            const totalItems = ['highcourt', 'pitman', 'audio', 'kailash', 'comprehension'].reduce((acc, t) => acc + (stateExams[`${state}__${t}`]?.length || 0), 0);
                            return (
                                <button key={state} onClick={() => setSelectedState(state)}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-[#0d6e70] hover:shadow-md transition-all text-left flex flex-col group">
                                    <div className="flex w-full justify-between items-center mb-3">
                                        <Map className="w-7 h-7 text-[#0d6e70]" />
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0d6e70]" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">{state}</h3>
                                    <p className="text-xs text-gray-500">{totalItems} available test{totalItems !== 1 && 's'}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // 2. View: Select Module in State
    if (!selectedModule) {
        return (
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 h-full">
                <div className="max-w-4xl mx-auto flex flex-col">
                    <button onClick={() => setSelectedState(null)} className="self-start flex items-center mb-6 text-gray-500 hover:text-[#0d6e70] transition-colors font-bold">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to States
                    </button>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{selectedState} Exams</h2>
                    <p className="text-gray-600 mb-8">Select a test category for {selectedState}.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MODULE_TYPES.map(mod => {
                            const items = stateExams[`${selectedState}__${mod.key}`] || [];
                            const Icon = mod.icon;
                            return (
                                <button key={mod.key} onClick={() => setSelectedModule(mod)}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#0d6e70] hover:shadow-md transition-all text-left flex items-center group">
                                    <div className="w-12 h-12 bg-blue-50 text-[#0d6e70] rounded-xl flex justify-center items-center mr-4">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg">{mod.label}</h3>
                                        <p className="text-sm text-gray-500">{items.length} test{items.length !== 1 && 's'}</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#0d6e70]" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const [searchQuery, setSearchQuery] = useState('');
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset currentPage when search query or activeDateTab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeDateTab]);

    // 3. View: List Tests
    let tests = stateExams[`${selectedState}__${selectedModule.key}`] || [];
    
    // ── Free Trial 'Latest Test Only' Logic ──
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (user && user.role !== 'admin') {
            const enrolled = user.enrolled_courses || [];
            if (!enrolled.includes('state-exam')) {
                if (tests.length > 0) tests = [tests[0]];
            }
        }
    } catch(e) {}

    const filteredTests = React.useMemo(() => {
        if (!searchQuery.trim()) return tests;
        const q = searchQuery.toLowerCase();
        return tests.filter(ex => 
            (ex.title || '').toLowerCase().includes(q) ||
            (ex.job_title || '').toLowerCase().includes(q) ||
            (ex.test_type || '').toLowerCase().includes(q) ||
            (ex.original_text || ex.text || '').toLowerCase().includes(q)
        );
    }, [tests, searchQuery]);

    const groupedTests = React.useMemo(() => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        const cats = { 'Today': [], 'Yesterday': [], 'All Practice': [] };
        
        filteredTests.forEach(ex => {
            const dateStr = ex.created_at ? new Date(ex.created_at).toLocaleDateString() : new Date().toLocaleDateString();
            if (dateStr === today) cats['Today'].push(ex);
            else if (dateStr === yesterday) cats['Yesterday'].push(ex);
            cats['All Practice'].push(ex);
        });
        return cats;
    }, [filteredTests]);

    // Robust Date Tab fallback
    useEffect(() => {
        if (selectedState && selectedModule && groupedTests['Today']?.length === 0 && groupedTests['Yesterday']?.length === 0) {
            setActiveDateTab('All Practice');
        }
    }, [groupedTests, selectedState, selectedModule]);

    const activeList = groupedTests[activeDateTab] || [];
    const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE);
    const paginatedList = activeList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 h-full">
            <div className="max-w-4xl mx-auto flex flex-col space-y-6">
                <button onClick={() => setSelectedModule(null)} className="self-start flex items-center text-gray-500 hover:text-[#0d6e70] transition-colors font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Categories
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <selectedModule.icon className="w-8 h-8 text-[#0d6e70]" />
                        <h2 className="text-3xl font-extrabold text-gray-900">{selectedState} • {selectedModule.label}</h2>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 gap-1">
                        {['Today', 'Yesterday', 'All Practice'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveDateTab(tab); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeDateTab === tab ? 'bg-[#0d6e70] text-white shadow-lg' : 'text-gray-400 hover:text-blue-900'}`}
                            >
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
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
                        <p className="text-gray-500 font-bold mb-1">No tests available</p>
                        <p className="text-sm text-gray-400">Admins haven't published any tests for this category yet matching this state/filter.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* List Items */}
                        <div className="space-y-3">
                            {paginatedList.map((test, idx) => {
                                const dateStr = test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
                                const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                const ModuleIcon = selectedModule.icon;
                                
                                return (
                                    <div
                                        key={test.id}
                                        onClick={() => {
                                            let targetRoute = 'arena-kc';
                                            if (selectedModule.key === 'highcourt') targetRoute = 'formatting';
                                            if (selectedModule.key === 'pitman') targetRoute = 'pitman';
                                            if (selectedModule.key === 'audio') targetRoute = 'arena-audio';
                                            if (selectedModule.key === 'kailash') targetRoute = 'arena-kc';
                                            if (selectedModule.key === 'comprehension') targetRoute = 'arena-comp';

                                            localStorage.setItem('active_selected_test_id', test.id);
                                            onNavigateCourse(targetRoute);
                                        }}
                                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#0d6e70]/30 transition-all duration-200 cursor-pointer flex items-center gap-4 px-5 py-4 relative overflow-hidden"
                                    >
                                        {/* Left accent bar on hover */}
                                        <div className="absolute left-0 top-0 h-full w-1 bg-[#0d6e70] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center rounded-l-2xl" />

                                        {/* Index badge */}
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-[#0d6e70] flex items-center justify-center shrink-0 transition-colors">
                                            <span className="text-sm font-black text-[#0d6e70] group-hover:text-white transition-colors">{globalIdx}</span>
                                        </div>

                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <ModuleIcon className="w-5 h-5 text-[#0d6e70]" />
                                        </div>

                                        {/* Title + chips */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-900 text-sm md:text-base group-hover:text-[#0d6e70] transition-colors truncate">{test.title}</h3>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{selectedModule.label}</span>
                                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{dateStr}</span>
                                                {test.job_title && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{test.job_title}</span>}
                                                {test.test_type && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{test.test_type}</span>}
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
    );
};

export default StateExamModule;
