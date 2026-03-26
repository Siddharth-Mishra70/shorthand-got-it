import React, { useState, useRef } from 'react';
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
    Keyboard
} from 'lucide-react';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';

const HighCourtFormatting = ({ onBack }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [finalText, setFinalText] = useState('');
    const [pastAttempts, setPastAttempts] = useState([]);
    const [showPastAttempts, setShowPastAttempts] = useState(false);
    const [viewMode, setViewMode] = useState('selection'); // 'selection' | 'writing'
    const [activeDateTab, setActiveDateTab] = useState('Today');
    const editorRef = useRef(null);

    const [hcTests, setHcTests] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState(null); // Initialize as null, will be set in useEffect
    
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
                    const remoteIds = new Set(allHcTests.map(t => t.id));
                    const uniqueLocal = parsed.filter(t => !remoteIds.has(t.id));
                    allHcTests = [...allHcTests, ...uniqueLocal];
                } catch (e) {}
            }

            setHcTests(allHcTests);
            if (allHcTests.length > 0) {
                setSelectedTestId(allHcTests[0].id);
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

    // Smart detection for HTML tags in original_text (Fallback schema support)
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(selectedTest?.original_text || selectedTest?.text || '');
    
    // Admin's formatted HTML answer key — displayed in reference panel
    const answerKeyHtml = selectedTest?.formatted_html || (hasHtmlTags ? selectedTest?.original_text || selectedTest?.text : null);
    
    // Strip HTML tags to get clean plain text for word-by-word analysis
    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return (tmp.innerText || tmp.textContent || '').trim();
    };

    // Plain text shown to student as reference (no formatting clues)
    const referenceText = hasHtmlTags ? stripHtml(selectedTest?.original_text || selectedTest?.text) : (selectedTest?.original_text?.trim() || selectedTest?.text?.trim() || defaultSample);
    // Plain-text version of the answer key — used for scoring comparison
    const answerKeyText = answerKeyHtml ? stripHtml(answerKeyHtml) : null;

    // Help to render text by ensuring real newlines and JSX breaks
    const renderFormattedText = (text) => {
        // Ultimate fallback to ensure NO blank areas
        const content = text || referenceText || defaultSample;
        const cleanText = String(content).replace(/\\n/g, '\n');
        
        return cleanText.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
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
        const content = editorRef.current.innerHTML;

        if (!content.trim() || content === '<br>') return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('formatting_attempts')
                .insert([
                    {
                        user_id: '00000000-0000-0000-0000-000000000000',
                        html_content: content,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                if (error.code === 'PGRST205') {
                    // Table doesn't exist yet in Supabase — using localStorage fallback
                    console.warn('[HighCourt] formatting_attempts table not found. Create it in Supabase. Saving locally for now.');
                } else {
                    console.warn('[HighCourt] Supabase insert failed, saving locally:', error.message);
                }
                localStorage.setItem(`formatting_attempt_${Date.now()}`, JSON.stringify({ html_content: content, timestamp: Date.now() }));
            }
        } catch (err) {
            // Network / connection error — silent local fallback
            localStorage.setItem(`formatting_attempt_${Date.now()}`, JSON.stringify({ html_content: content, timestamp: Date.now() }));
        } finally {
            // Always show analysis regardless of database connection
            const resultText = editorRef.current.innerText;
            setFinalText(resultText);
            const newAttempt = { text: resultText, timestamp: new Date().toLocaleString() };
            const updatedAttempts = [newAttempt, ...pastAttempts];
            setPastAttempts(updatedAttempts);
            localStorage.setItem('hc_formatting_attempts', JSON.stringify(updatedAttempts));
            setSubmitted(true);
            setIsSubmitting(false);
        }
    };

    const handleRetake = () => {
        setSubmitted(false);
        setFinalText('');
        if (editorRef.current) {
            editorRef.current.innerHTML = '<p><br></p>';
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setFinalText('');
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
                </div>
                <div>
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

            <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col overflow-hidden p-4 lg:p-6 gap-6">
                {!submitted || !finalText ? (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        {/* Top Half: PDF or Sample Document */}
                        <div className="h-[40vh] min-h-[250px] flex gap-4 overflow-hidden">
                            {/* Rules Sidebar (Collapsible/Small) */}
                            <div className="hidden lg:flex flex-col bg-white border-l-4 border-[#1e3a8a] shadow-sm p-4 rounded-xl w-64 shrink-0 overflow-y-auto">
                                <h3 className="font-bold text-sm border-b pb-2 mb-3 text-gray-800 flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-[#1e3a8a]" />
                                    <span>Guidelines</span>
                                </h3>
                                <ul className="space-y-2 text-xs text-gray-700">
                                    {rules.map((rule, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="text-[#1e3a8a] mr-1.5">•</span>
                                            <span>{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Reference Content */}
                            <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="bg-gray-100 px-4 py-2 border-b text-xs font-bold text-gray-600 uppercase tracking-wider flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <span className="font-black text-[#1e3a8a]">{selectedTest?.title || 'No Test Selected'}</span>
                                        <div className="h-4 w-px bg-gray-300" />
                                        <span>Reference Document</span>
                                        {answerKeyHtml && (
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
                                <div className="flex-1 bg-gray-50 relative h-full min-h-0">
                                    {selectedTest ? (
                                        docViewMode === 'pdf' && selectedTest.pdf ? (
                                            <iframe src={selectedTest.pdf} className="absolute inset-0 w-full h-full border-none" title="Reference PDF" />
                                        ) : (
                                            /* WORD VIEW */
                                            <div className="absolute inset-0 overflow-y-auto">
                                                <div className="p-6 md:p-8">
                                                    {answerKeyHtml ? (
                                                        /* Render admin's rich-formatted HTML — students see exact target format */
                                                        <div
                                                            className="bg-white shadow-sm border border-gray-100 p-6 md:p-8 text-sm md:text-base text-gray-900 leading-relaxed"
                                                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                                                            dangerouslySetInnerHTML={{ __html: answerKeyHtml }}
                                                        />
                                                    ) : (
                                                        /* Legacy plain-text fallback */
                                                        <div className="bg-white shadow-sm border border-gray-100 p-6 md:p-8 text-sm md:text-base font-serif text-gray-900 whitespace-pre-wrap leading-relaxed">
                                                            {renderFormattedText(referenceText)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        /* No test selected — show default sample */
                                        <div className="absolute inset-0 overflow-y-auto">
                                            <div className="p-6 md:p-8 flex flex-col items-center">
                                                <div className="bg-white shadow-sm border border-gray-100 p-6 md:p-8 text-sm md:text-base font-serif text-gray-900 whitespace-pre-wrap leading-relaxed w-full">
                                                    {renderFormattedText(defaultSample)}
                                                </div>
                                                <p className="mt-4 text-xs text-gray-400 font-bold uppercase italic">Viewing default reference format</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Half: Editor */}
                        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-0">
                            <div className="bg-gray-100 px-4 py-2 border-b text-xs font-bold text-gray-600 uppercase tracking-wider flex justify-between items-center">
                                <span>Your Editor Workspace</span>
                                <span className="text-gray-400 font-normal">Apply Bold, Italics, and Alignment carefully</span>
                            </div>
                            
                            <div className="flex-1 p-3 bg-gray-50 flex flex-col min-h-0">
                                <div className="bg-white h-full shadow-sm border border-gray-300 rounded overflow-hidden flex flex-col">
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
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        className="flex-1 p-8 outline-none font-serif text-lg leading-relaxed overflow-y-auto"
                                        style={{ fontFamily: "'Courier New', Courier, monospace" }}
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
                                        originalText={answerKeyText || referenceText}
                                        originalHtml={answerKeyHtml}
                                        attemptedText={pastAttempts[0].text}
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
                                            {pastAttempts.slice(1).map((attempt, idx) => (
                                                <div key={idx} className="opacity-90 transform scale-[0.98] origin-top bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="text-sm font-bold text-gray-500 mb-2 border-b pb-2">Attempt at {attempt.timestamp}</div>
                                                    <DetailedAnalysisPanel
                                                        originalText={answerKeyText || referenceText}
                                                        originalHtml={answerKeyHtml}
                                                        attemptedText={attempt.text}
                                                        title={`Previous Attempt ${pastAttempts.length - 1 - idx}`}
                                                    />
                                                </div>
                                            ))}
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
