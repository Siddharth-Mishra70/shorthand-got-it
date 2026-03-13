import React, { useState } from 'react';
import {
    Users, Headphones, Scale, FileText, BarChart2,
    Settings, LogOut, Search, Plus, Edit2, Trash2, Keyboard, CheckCircle, Save, Loader2, FileUp
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const AdminPanel = ({ user, onLogout }) => {
    const [currentTab, setCurrentTab] = useState('students');
    const [kcText, setKcText] = useState('');
    const [kcSaved, setKcSaved] = useState(false);
    const [isAddingNewKc, setIsAddingNewKc] = useState(false);
    const [kailashTests, setKailashTests] = useState(() => {
        const saved = localStorage.getItem('admin_kailash_data_list');
        if (saved) return JSON.parse(saved);
        const legacy = localStorage.getItem('admin_kailash_data');
        if (legacy) return [{ id: Date.now(), text: legacy, date: 'Legacy Upload' }];
        return [];
    });
    
    // High Court PDF Upload State
    const [isExtractingHc, setIsExtractingHc] = useState(false);
    const [hcText, setHcText] = useState(() => localStorage.getItem('admin_highcourt_pdf_text') || '');

    // Audio Upload State
    const [audioUploaded, setAudioUploaded] = useState(false);

    const handleSaveKcData = () => {
        if (!kcText.trim()) return;
        const newTest = {
            id: Date.now(),
            text: kcText,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedTests = [newTest, ...kailashTests];
        setKailashTests(updatedTests);
        localStorage.setItem('admin_kailash_data_list', JSON.stringify(updatedTests));
        setKcText('');
        setIsAddingNewKc(false);
        setKcSaved(true);
        setTimeout(() => setKcSaved(false), 3000);
    };

    const SidebarItem = ({ icon: Icon, label, tabId }) => (
        <div
            onClick={() => setCurrentTab(tabId)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                currentTab === tabId
                    ? 'bg-[#1e3a8a] text-white'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-[#1e3a8a]'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </div>
    );

    const renderContent = () => {
        switch (currentTab) {
            case 'students':
                return (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Student Registration Details</h2>
                            <div className="flex bg-white border border-gray-300 rounded-lg px-3 py-2 items-center shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a] focus-within:border-transparent transition-all">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input type="text" placeholder="Search students..." className="outline-none text-sm bg-transparent" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Name</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Phone</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Joined Date</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">Rahul Kumar</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">+91 9876543210</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">12 Mar 2024</td>
                                        <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">Active</span></td>
                                        <td className="px-6 py-4 text-sm text-right space-x-3">
                                            <button className="text-blue-600 hover:text-blue-800 transition-colors tooltip" title="Edit">
                                                <Edit2 className="w-4 h-4 inline" />
                                            </button>
                                            <button className="text-red-500 hover:text-red-700 transition-colors tooltip" title="Delete">
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">Sneha Patel</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">+91 8765432109</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">13 Mar 2024</td>
                                        <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">Active</span></td>
                                        <td className="px-6 py-4 text-sm text-right space-x-3">
                                            <button className="text-blue-600 hover:text-blue-800 transition-colors tooltip" title="Edit">
                                                <Edit2 className="w-4 h-4 inline" />
                                            </button>
                                            <button className="text-red-500 hover:text-red-700 transition-colors tooltip" title="Delete">
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'audio':
                return (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Audio Dictations Management</h2>
                            <div>
                                <input 
                                    type="file" 
                                    id="audio-upload" 
                                    className="hidden" 
                                    accept="audio/*" 
                                    onChange={(e) => {
                                        if (e.target.files?.length > 0) {
                                            setAudioUploaded(true);
                                            setTimeout(() => setAudioUploaded(false), 3000);
                                        }
                                    }}
                                />
                                <label htmlFor="audio-upload" className="bg-[#1e3a8a] cursor-pointer text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-blue-800 transition-all shadow-md hover:-translate-y-0.5">
                                    <Plus className="w-4 h-4 mr-2" /> Upload Audio
                                </label>
                            </div>
                        </div>
                        {audioUploaded && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <strong>Success!</strong> &nbsp;Audio file uploaded successfully for dictation tests.
                            </div>
                        )}
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                                <Headphones className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">No Dictations Uploaded</h3>
                            <p className="max-w-md mx-auto text-sm">Upload audio files here for students to practice dictation tests.</p>
                        </div>
                    </div>
                );
            case 'highcourt':
                return (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">High Court Data Management</h2>
                            <div>
                                <input 
                                    type="file" 
                                    id="hc-pdf-upload" 
                                    className="hidden" 
                                    accept=".pdf"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setIsExtractingHc(true);
                                        try {
                                            const arrayBuffer = await file.arrayBuffer();
                                            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                                            let fullText = '';
                                            for (let i = 1; i <= pdf.numPages; i++) {
                                                const page = await pdf.getPage(i);
                                                const textContent = await page.getTextContent();
                                                const pageText = textContent.items.map(item => item.str).join(' ');
                                                fullText += pageText + '\\n\\n';
                                            }
                                            setHcText(fullText);
                                            localStorage.setItem('admin_highcourt_pdf_text', fullText);
                                        } catch (err) {
                                            console.error("PDF Extraction Error:", err);
                                            alert("Failed to extract text from PDF");
                                        }
                                        setIsExtractingHc(false);
                                        e.target.value = null; // reset
                                    }}
                                />
                                <label htmlFor="hc-pdf-upload" className="bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-blue-800 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer">
                                    {isExtractingHc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />} 
                                    {isExtractingHc ? 'Extracting PDF...' : 'Upload PDF Document'}
                                </label>
                            </div>
                        </div>
                        
                        {hcText ? (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-[#1e3a8a] mb-2 border-b pb-2 flex justify-between items-center">
                                    <span>Extracted PDF Preview</span>
                                    <span className="text-xs text-gray-400 font-normal">This data is now visible to students.</span>
                                </h3>
                                <textarea
                                    value={hcText}
                                    readOnly
                                    className="w-full h-80 p-4 text-sm font-serif leading-relaxed text-gray-700 border border-gray-100 rounded-lg bg-gray-50 focus:outline-none resize-y"
                                ></textarea>
                            </div>
                        ) : (
                            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                                    <Scale className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">No High Court Data</h3>
                                <p className="max-w-md mx-auto text-sm">Upload a PDF document. The platform will extract the text automatically and push it to the High Court formatting mock test.</p>
                            </div>
                        )}
                    </div>
                );
            case 'kailash':
                return (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Kailash Chandra Uploads</h2>
                            <button 
                                onClick={() => setIsAddingNewKc(true)}
                                className={`px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all shadow-md bg-[#1e3a8a] text-white hover:bg-blue-800 hover:-translate-y-0.5`}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add New Test
                            </button>
                        </div>
                        
                        {kcSaved && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <strong>Success!</strong> &nbsp;The new Dictation Test has been published to students.
                            </div>
                        )}

                        {isAddingNewKc && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1e3a8a]/20 mb-8 animate-in slide-in-from-top-2">
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">New Dictation Text (Kailash Chandra Vol)</label>
                                    <p className="text-xs text-gray-500 mb-4">Paste the text content here. It will be added as a selectable tab for the students.</p>
                                    <textarea
                                        value={kcText}
                                        onChange={(e) => setKcText(e.target.value)}
                                        placeholder="Start typing or pasting the passage here..."
                                        className="w-full h-[250px] p-4 text-base font-serif leading-relaxed border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent resize-y"
                                    ></textarea>
                                </div>
                                <div className="flex justify-end space-x-3 mt-4">
                                    <button 
                                        onClick={() => { setIsAddingNewKc(false); setKcText(''); }}
                                        className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveKcData}
                                        className="px-5 py-2 rounded-lg text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center shadow"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Save & Publish
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Uploaded Tests ({kailashTests.length})</h3>
                            {kailashTests.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                    No tests uploaded yet.
                                </div>
                            ) : (
                                kailashTests.map((test, idx) => (
                                    <div key={test.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-[#1e3a8a]">Kailash Chandra Vol Test #{kailashTests.length - idx}</h4>
                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">{test.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-serif">
                                            {test.text}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            case 'results':
                return (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">All Student Results</h2>
                            <div className="flex bg-white border border-gray-300 rounded-lg px-3 py-2 items-center shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a] focus-within:border-transparent transition-all">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input type="text" placeholder="Search results..." className="outline-none text-sm bg-transparent" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Student Name</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Test Taken</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Stats (WPM / Acc)</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Date Completed</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">Rahul Kumar</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">Kailash Chandra Vol 1</td>
                                        <td className="px-6 py-4 text-sm text-gray-600"><span className="font-bold text-[#1e3a8a]">85 WPM</span> / <span className="font-bold text-green-600">92%</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">14 Mar 2024, 10:30 AM</td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <button className="text-[#1e3a8a] hover:text-blue-700 hover:underline font-bold transition-colors">View Analysis</button>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">Sneha Patel</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">SSC Grade C & D Mock</td>
                                        <td className="px-6 py-4 text-sm text-gray-600"><span className="font-bold text-[#1e3a8a]">102 WPM</span> / <span className="font-bold text-green-600">98%</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">13 Mar 2024, 2:15 PM</td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <button className="text-[#1e3a8a] hover:text-blue-700 hover:underline font-bold transition-colors">View Analysis</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white shadow-sm border-b z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-700 rounded-lg flex justify-center items-center shadow-sm">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            Admin <span className="text-red-700">Portal</span>
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full">
                            <div className="w-7 h-7 bg-red-700 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">AD</span>
                            </div>
                            <span className="font-semibold text-red-700 text-sm">{user?.name || 'Administrator'}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 px-4 py-2 rounded-full font-semibold transition-all text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 w-full mx-auto flex flex-col md:flex-row overflow-hidden relative max-w-[1600px]">
                <aside className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 py-6 px-4 flex flex-col md:min-h-[calc(100vh-80px)] shrink-0">
                    <div className="px-4 mb-4 text-xs font-black text-gray-400 uppercase tracking-wider">Management</div>
                    <nav className="space-y-2 flex-1">
                        <SidebarItem icon={Users} label="Student Details" tabId="students" />
                        <SidebarItem icon={Headphones} label="Audio Dictations" tabId="audio" />
                        <SidebarItem icon={Scale} label="High Court Data" tabId="highcourt" />
                        <SidebarItem icon={FileText} label="Load Mock Tests" tabId="mock_tests" />
                        <SidebarItem icon={Keyboard} label="Kailash Chandra Upload" tabId="kailash" />
                        <div className="my-4 border-t border-gray-100"></div>
                        <div className="px-4 mb-4 text-xs font-black text-gray-400 uppercase tracking-wider">Reports</div>
                        <SidebarItem icon={BarChart2} label="All Student Results" tabId="results" />
                    </nav>
                </aside>
                <main className="flex-1 p-6 lg:p-10 bg-gray-50 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
