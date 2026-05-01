import React, { useState, useEffect } from 'react';
import { ArrowLeft, Map, ChevronRight, Scale, Edit2, Headphones, BookOpen, FileText } from 'lucide-react';

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
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-[#1e3a8a] hover:shadow-md transition-all text-left flex flex-col group">
                                    <div className="flex w-full justify-between items-center mb-3">
                                        <Map className="w-7 h-7 text-[#1e3a8a]" />
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1e3a8a]" />
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
                    <button onClick={() => setSelectedState(null)} className="self-start flex items-center mb-6 text-gray-500 hover:text-[#1e3a8a] transition-colors font-bold">
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
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-[#1e3a8a] hover:shadow-md transition-all text-left flex items-center group">
                                    <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-xl flex justify-center items-center mr-4">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg">{mod.label}</h3>
                                        <p className="text-sm text-gray-500">{items.length} test{items.length !== 1 && 's'}</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#1e3a8a]" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // 3. View: List Tests
    const tests = stateExams[`${selectedState}__${selectedModule.key}`] || [];

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 h-full">
            <div className="max-w-4xl mx-auto flex flex-col">
                <button onClick={() => setSelectedModule(null)} className="self-start flex items-center mb-6 text-gray-500 hover:text-[#1e3a8a] transition-colors font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Categories
                </button>
                <div className="flex items-center space-x-3 mb-2">
                    <selectedModule.icon className="w-8 h-8 text-[#1e3a8a]" />
                    <h2 className="text-3xl font-extrabold text-gray-900">{selectedState} • {selectedModule.label}</h2>
                </div>
                <p className="text-gray-600 mb-8">Select a test below to start practicing.</p>

                {tests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
                        <p className="text-gray-500 font-bold mb-1">No tests available</p>
                        <p className="text-sm text-gray-400">Admins haven't published any tests for this category yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tests.map(test => (
                            <button key={test.id} onClick={() => {
                                // Based on module, redirect to appropriate viewer by injecting this test's logic.
                                // The simplest way right now is to pass the test context and route they selected up to `App.jsx`
                                // Or we could just route to the respective sections ('arena-audio', 'formatting', 'pitman', 'arena-kc')!
                                let targetRoute = 'arena-kc';
                                if (selectedModule.key === 'highcourt') targetRoute = 'formatting';
                                if (selectedModule.key === 'pitman') targetRoute = 'pitman';
                                if (selectedModule.key === 'audio') targetRoute = 'arena-audio';
                                if (selectedModule.key === 'kailash') targetRoute = 'arena-kc';
                                if (selectedModule.key === 'comprehension') targetRoute = 'arena-comp';

                                localStorage.setItem('active_selected_test_id', test.id);
                                onNavigateCourse(targetRoute);
                            }}
                                className="w-full text-left bg-white p-5 rounded-xl border border-gray-200 hover:border-[#1e3a8a] hover:shadow-md transition-all flex justify-between items-center group">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{test.title}</h3>
                                    <p className="text-xs text-gray-400">Added on {new Date(test.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-blue-50 text-[#1e3a8a] px-4 py-2 rounded-lg font-bold text-sm tracking-wider group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                                    START
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StateExamModule;
