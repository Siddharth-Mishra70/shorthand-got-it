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
    ChevronUp
} from 'lucide-react';
import DetailedAnalysisPanel from './DetailedAnalysisPanel';

const HighCourtFormatting = ({ onBack }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [finalText, setFinalText] = useState('');
    const [pastAttempts, setPastAttempts] = useState([]);
    const [showPastAttempts, setShowPastAttempts] = useState(false);
    const editorRef = useRef(null);

    const sampleDocument = localStorage.getItem('admin_highcourt_pdf_text') || `IN THE HIGH COURT OF JUDICATURE AT PATNA
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
                console.error("Supabase Error, using local fallback:", error);
                localStorage.setItem(`formatting_attempt_${Date.now()}`, JSON.stringify({ html_content: content, timestamp: Date.now() }));
            }
        } catch (err) {
            console.error("Fetch Error, using local fallback:", err);
            localStorage.setItem(`formatting_attempt_${Date.now()}`, JSON.stringify({ html_content: content, timestamp: Date.now() }));
        } finally {
            // Always show analysis regardless of database connection success
            const resultText = editorRef.current.innerText;
            setFinalText(resultText);
            setPastAttempts(prev => [
                { text: resultText, timestamp: new Date().toLocaleTimeString() },
                ...prev
            ]);
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Header */}
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="hover:bg-blue-800 p-2 rounded-full transition-colors"
                        title="Back to Dashboard"
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
                    <>
                        {/* Top Half: Rules & Sample Document */}
                        <div className="w-full flex flex-col lg:flex-row gap-6 h-[45vh] min-h-[300px]">

                    {/* Rules Sidebar */}
                    <div className="bg-white border-l-4 border-[#1e3a8a] shadow-sm p-4 rounded-xl flex-shrink-0 lg:w-1/4 overflow-y-auto">
                        <h3 className="font-bold border-b pb-2 mb-3 text-gray-800 flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-[#1e3a8a]" />
                            <span>Exact Formatting Guidelines</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {rules.map((rule, idx) => (
                                <li key={idx} className="flex items-start">
                                    <span className="text-[#1e3a8a] mr-2">•</span>
                                    <span>{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sample Document Box */}
                    <div className="bg-white flex-1 border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-gray-100 px-4 py-3 border-b text-sm font-bold text-gray-600 uppercase tracking-wider shrink-0">
                            Sample Document
                        </div>
                        <div className="p-6 overflow-y-auto bg-[#fafafa] flex-1">
                            <div className="bg-white shadow-sm border border-gray-200 p-8 min-h-full text-sm md:text-base font-serif text-gray-900 whitespace-pre-wrap leading-loose">
                                {sampleDocument}
                            </div>
                        </div>
                    </div>
                </div>

                        {/* Bottom Half: Native Rich Text Editor or Analysis */}
                        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[45vh] min-h-[300px]">
                            <div className="bg-gray-100 px-4 py-3 border-b text-sm font-bold text-gray-600 uppercase tracking-wider flex justify-between items-center">
                                <span>Your Editor Workspace</span>
                                <span className="text-xs font-normal text-gray-500">Replicate the document exactly</span>
                            </div>

                    <div className="flex-1 p-4 bg-gray-50 flex flex-col">
                        <div className="bg-white h-full shadow-sm border border-gray-300 rounded overflow-hidden flex flex-col">

                            {/* Custom Toolbar */}
                            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
                                <div className="flex space-x-1 border-r pr-2">
                                    <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" />
                                    <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" />
                                    <ToolbarButton icon={Underline} command="underline" title="Underline (Ctrl+U)" />
                                </div>

                                <div className="flex space-x-1 border-r pr-2 pl-2">
                                    <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
                                    <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
                                    <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
                                    <ToolbarButton icon={AlignJustify} command="justifyFull" title="Justify" />
                                </div>

                                <div className="flex space-x-2 pl-2 text-sm text-gray-500 items-center">
                                    <span className="font-semibold px-2 py-1 bg-white border rounded">Font: Courier New (Default)</span>
                                </div>
                            </div>

                            {/* Editor Content Area */}
                            <div
                                ref={editorRef}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                className="flex-1 p-8 outline-none font-serif text-lg leading-relaxed overflow-y-auto min-h-0"
                                style={{ fontFamily: "'Courier New', Courier, monospace" }}
                            >
                                <p><br /></p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
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
                                        originalText={sampleDocument}
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
                                                        originalText={sampleDocument}
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
