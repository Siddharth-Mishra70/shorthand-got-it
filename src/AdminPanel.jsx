import React, { useState, useRef, useCallback } from 'react';
import {
    Users, Headphones, Scale, FileText, BarChart2,
    Settings, LogOut, Search, Plus, Trash2, Keyboard, CheckCircle, Save, Loader2, FileUp,
    BookOpen, Edit2, Edit3, Map, ArrowLeft, ChevronRight, Globe, Upload, X, Zap, ChevronDown,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, RefreshCw, History
} from 'lucide-react';

const STATE_EXAMS = [
    'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
    'Gujarat', 'Punjab', 'Haryana', 'Uttarakhand', 'Delhi',
    'Jharkhand', 'Chhattisgarh', 'Odisha', 'West Bengal', 'Karnataka',
    'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Himachal Pradesh'
];

const MODULE_TYPES = [
    { key: 'highcourt', label: 'High Court Formatting', icon: Scale, color: 'from-blue-600 to-blue-800', bg: 'bg-blue-50', text: 'text-blue-700' },
    { key: 'pitman', label: 'Pitman Exercise', icon: Edit2, color: 'from-purple-600 to-purple-800', bg: 'bg-purple-50', text: 'text-purple-700' },
    { key: 'audio', label: 'Audio Dictation', icon: Headphones, color: 'from-green-600 to-green-800', bg: 'bg-green-50', text: 'text-green-700' },
    { key: 'kailash', label: 'Kailash Chandra', icon: BookOpen, color: 'from-amber-500 to-amber-700', bg: 'bg-amber-50', text: 'text-amber-700' },
    { key: 'comprehension', label: 'Comprehension', icon: FileText, color: 'from-cyan-600 to-cyan-800', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { key: 'state', label: 'State Exam', icon: Globe, color: 'from-rose-600 to-rose-800', bg: 'bg-rose-50', text: 'text-rose-700' },
];

const QUICK_MODULES = [
    { key: 'highcourt', label: 'High Court Formatting', icon: '⚖️', accept: '.pdf,image/*', textLabel: 'Formatting Reference Text' },
    { key: 'pitman',    label: 'Pitman Exercise',       icon: '✏️', accept: '.pdf,image/*', textLabel: 'English Transcription Text' },
    { key: 'audio',     label: 'Audio Dictation',       icon: '🎙️', accept: 'audio/*',      textLabel: 'Dictation Transcription Text' },
    { key: 'kailash',   label: 'Kailash Chandra',         icon: '📖', accept: '.pdf',         textLabel: 'Passage Text' },
    { key: 'comprehension', label: 'Comprehension',         icon: '📝', accept: '.pdf',         textLabel: 'Passage Text' },
];

// ── PURE SUB-COMPONENTS (defined at module scope to prevent remount on re-render) ──

const SidebarItem = ({ icon: Icon, label, tabId, currentTab, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
            currentTab === tabId ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </div>
);

const HcToolBtn = ({ icon: Icon, cmd, title, onAction }) => (
    <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => onAction(cmd)}
        className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title={title}>
        <Icon className="w-3.5 h-3.5" />
    </button>
);

const execHcCommand = (cmd, ref, val = null) => { 
    document.execCommand(cmd, false, val); 
    ref.current?.focus(); 
};

const ModuleCard = ({ mod, onClick }) => {
    const Icon = mod.icon;
    return (
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => onClick(mod.key)}>
            <div className="relative w-44 h-44 rounded-full bg-white shadow-xl flex flex-col justify-center items-center text-center p-5 border-4 border-transparent group-hover:border-red-600 transition-all duration-300">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm leading-tight">{mod.label}</h3>
            </div>
            <button className="mt-5 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full font-semibold shadow-md transition-transform hover:scale-105 text-sm">
                Manage
            </button>
        </div>
    );
};

const UploadForm = ({ title, setTitle, text, setText, pdf, setPdf, onFileSelect, onSave, onCancel, jobTitle, setJobTitle, testType, setTestType, saving, accept = ".pdf,image/*", textLabel = "Practice Text", fileLabel = "File Upload (Optional)", isEdit = false }) => (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input type="text" value={title || ''} onChange={e => setTitle(e.target.value)} placeholder="Enter title..." className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{fileLabel}</label>
                <label className="flex items-center justify-center w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-all">
                    <FileUp className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">{pdf ? '✓ File loaded' : 'Click to upload'}</span>
                    <input type="file" accept={accept} className="hidden" onChange={e => {
                        const f = e.target.files[0]; if (!f) return;
                        if (onFileSelect) onFileSelect(f);
                        const r = new FileReader(); r.onload = ev => setPdf(ev.target.result); r.readAsDataURL(f);
                    }} />
                </label>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam</label>
                <input type="text" value={jobTitle || ''} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section</label>
                <input type="text" value={testType || ''} onChange={e => setTestType(e.target.value)} placeholder="e.g. Skill Test, Mock Test" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
            </div>
        </div>
        <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">{textLabel}</label>
            <textarea value={text || ''} onChange={e => setText(e.target.value)} placeholder="Paste text content here..." className="w-full h-40 p-4 font-serif border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-y" />
        </div>
        <div className="flex justify-end space-x-3">
            <button onClick={onCancel} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
            <button onClick={onSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center shadow">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {isEdit ? 'Update' : 'Save & Publish'}
            </button>
        </div>
    </div>
);

const TestList = ({ tests, onDelete, emptyMsg, onEdit }) => {
    // Helper to clean up preview text if it's JSON-encoded (High Court style)
    const getPreviewText = (raw) => {
        if (!raw) return '';
        if (raw.trim().startsWith('{') && raw.includes('"plain"')) {
            try {
                const parsed = JSON.parse(raw.replace(/\r?\n/g, '\\n'));
                return parsed.plain || raw;
            } catch (e) { return raw; }
        }
        return raw;
    };

    return (
        <div className="space-y-3">
            {tests.length === 0 ? (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center text-gray-400">{emptyMsg}</div>
            ) : tests.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start group hover:border-red-200 transition-all">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800">{t.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{t.created_at ? new Date(t.created_at).toLocaleDateString() : t.date}</p>
                        {(t.original_text || t.text) && (
                            <p className="text-xs text-gray-500 italic font-serif mt-2 line-clamp-2">
                                {'"'}{getPreviewText(t.original_text || t.text)?.slice(0, 120)}{'..."'}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        {onEdit && (
                            <button onClick={() => onEdit(t.id)} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => onDelete(t.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AdminPanel = ({ user, onLogout, supabase }) => {
    const [currentTab, setCurrentTab] = useState('students');

    // ── Quick Upload Drawer state ──
    const [quickOpen, setQuickOpen] = useState(false);
    const [quickModule, setQuickModule] = useState('');
    const [quickState, setQuickState] = useState('');
    const [quickTitle, setQuickTitle] = useState('');
    const [quickText, setQuickText] = useState('');
    const [quickFile, setQuickFile] = useState(null);
    const [quickSaving, setQuickSaving] = useState(false);
    const [quickSuccess, setQuickSuccess] = useState(false);
    const [editingQuickId, setEditingQuickId] = useState(null);
    // Home dashboard = 'home', else module key  
    const [activeModule, setActiveModule] = useState('home');

    // State Exam sub-state
    const [selectedState, setSelectedState] = useState(null);
    const [stateSubModule, setStateSubModule] = useState(null);

    // KC / Kailash Chandra
    const [kcText, setKcText] = useState('');
    const [kcTitle, setKcTitle] = useState('');
    const [kcVolume, setKcVolume] = useState('Volume 1');
    const [kcSaved, setKcSaved] = useState(false);
    const [isAddingNewKc, setIsAddingNewKc] = useState(false);
    const [editingKcId, setEditingKcId] = useState(null);
    const [kailashTests, setKailashTests] = useState(() => {
        const saved = localStorage.getItem('admin_kailash_data_list');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // Comprehension Section
    const [compId, setCompId] = useState(null);
    const [compTitle, setCompTitle] = useState('');
    const [compText, setCompText] = useState('');
    const [compPdf, setCompPdf] = useState(null);
    const [isAddingComp, setIsAddingComp] = useState(false);
    const [isSavingComp, setIsSavingComp] = useState(false);
    const [editingCompId, setEditingCompId] = useState(null);
    const [compTests, setCompTests] = useState(() => {
        const saved = localStorage.getItem('admin_comprehension_data_list');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // High Court State
    const [isAddingHc, setIsAddingHc] = useState(false);
    const [editingHcId, setEditingHcId] = useState(null);
    const [hcTitle, setHcTitle] = useState('');
    const [hcText, setHcText] = useState('');
    const [hcFormattedHtml, setHcFormattedHtml] = useState('');
    const [hcPdf, setHcPdf] = useState(null);
    const [isUploadingHc, setIsUploadingHc] = useState(false);
    const [hcSuccess, setHcSuccess] = useState(false);
    const hcEditorRef = useRef(null);
    const quickHcEditorRef = useRef(null);
    const [hcTests, setHcTests] = useState(() => {
        const saved = localStorage.getItem('admin_highcourt_data_list');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // Pitman State
    const [isAddingPitman, setIsAddingPitman] = useState(false);
    const [editingPitmanId, setEditingPitmanId] = useState(null);
    const [pitmanTitle, setPitmanTitle] = useState('');
    const [pitmanText, setPitmanText] = useState('');
    const [pitmanPdf, setPitmanPdf] = useState(null);
    const [rawPitmanFile, setRawPitmanFile] = useState(null);
    const [pitmanSuccess, setPitmanSuccess] = useState(false);
    const [isUploadingPitman, setIsUploadingPitman] = useState(false);
    const [pitmanTests, setPitmanTests] = useState(() => {
        const saved = localStorage.getItem('admin_pitman_data_list');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // Audio Upload State
    const [audioUploaded, setAudioUploaded] = useState(false);
    const [pendingAudio, setPendingAudio] = useState(null);
    const [pendingAudioText, setPendingAudioText] = useState('');
    const [audioPublishing, setAudioPublishing] = useState(false);
    
    // New Audio UI State
    const [isAddingAudio, setIsAddingAudio] = useState(false);
    const [editingAudioId, setEditingAudioId] = useState(null);
    const [audioTitle, setAudioTitle] = useState('');
    const [audioState, setAudioState] = useState('');
    const [pendingAudioFile, setPendingAudioFile] = useState(null);
    const [audioSuccess, setAudioSuccess] = useState(false);
    const [audioTests, setAudioTests] = useState(() => {
        const saved = localStorage.getItem('admin_published_audio_list');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // Dynamic User Data
    const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('auth_users') || '[]'));
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [resetRequests, setResetRequests] = useState(() => JSON.parse(localStorage.getItem('auth_reset_requests') || '[]'));
    const [allResults, setAllResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [selectedResultDate, setSelectedResultDate] = useState('All');
    const [resultSearchTerm, setResultSearchTerm] = useState('');

    // State Exam uploads (stored per state+type)
    const [stateExams, setStateExams] = useState(() => {
        const saved = localStorage.getItem('admin_state_exams');
        return saved ? JSON.parse(saved) : {};
    });
    const [stateUploadTitle, setStateUploadTitle] = useState('');
    const [stateUploadText, setStateUploadText] = useState('');
    const [stateUploadPdf, setStateUploadPdf] = useState(null);
    const [isAddingStateContent, setIsAddingStateContent] = useState(false);
    const [stateUploadSaving, setStateUploadSaving] = useState(false);
    const [editingStateId, setEditingStateId] = useState(null);

    // Global extra fields for Test Data (Job Title & Test Type)
    const [globalJobTitle, setGlobalJobTitle] = useState('');
    const [globalTestType, setGlobalTestType] = useState('');

    const resetGlobalDocs = () => {
        setGlobalJobTitle('');
        setGlobalTestType('');
    };

    // Supabase Auto-Sync
    React.useEffect(() => {
        const syncData = async () => {
            if (!supabase || supabase.supabaseUrl?.includes('placeholder')) return;
            const { data: hc } = await supabase.from('exercises').select('*').eq('category', 'highcourt').is('is_hidden', false).order('created_at', { ascending: false });
            if (hc) {
                const seen = new Set();
                setHcTests(hc.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }));
            }
            const { data: pit } = await supabase.from('exercises').select('*').eq('category', 'pitman').is('is_hidden', false).order('created_at', { ascending: false });
            if (pit) {
                const seen = new Set();
                setPitmanTests(pit.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }));
            }
            const { data: kc } = await supabase.from('exercises').select('*').eq('category', 'kailash').is('is_hidden', false).order('created_at', { ascending: false });
            if (kc) {
                const seen = new Set();
                setKailashTests(kc.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }));
            }
            const { data: comp } = await supabase.from('exercises').select('*').eq('category', 'comprehension').is('is_hidden', false).order('created_at', { ascending: false });
            if (comp) {
                const seen = new Set();
                setCompTests(comp.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }));
            }
            const { data: aud } = await supabase.from('exercises').select('*').in('category', ['audio', 'Audio Dictation']).is('is_hidden', false).order('created_at', { ascending: false });
            if (aud) {
                // Deduplicate and map audio
                const seenIds = new Set();
                const cleanAud = aud.filter(a => { if (seenIds.has(a.id)) return false; seenIds.add(a.id); return true; });
                setAudioTests(cleanAud.map(a => ({ ...a, audio: a.audio_url || a.audio })));
            }
            
            // Sync Admin Test Results Page
            setLoadingResults(true);
            try {
                // 1. Fetch BOTH tables separately (bypass Failing Silently native join)
                const [{ data: resultsInDb }, { data: usersInDb }, { data: exRecords }] = await Promise.all([
                    supabase.from('test_results').select('*').order('created_at', { ascending: false }),
                    supabase.from('users').select('*'),
                    supabase.from('exercises').select('id, title').is('is_hidden', false)
                ]);

                // Update Student Management list state independently
                if (usersInDb) setUsers(usersInDb);

                const exMap = {};
                if (exRecords) exRecords.forEach(e => exMap[e.id] = e.title);

                // 2. Manual Merge in JavaScript (Explicitly requested find strategy)
                if (resultsInDb && usersInDb) {
                    const mergedResults = resultsInDb.map(test => {
                        const foundUser = usersInDb.find(u => u.id === test.user_id);
                        
                        // Priority: Match found in DB > Manual JSON data name > Redundant student_name > Unknown
                        const fallbackName = test.student_name || test.mistakes_data?.student_name;
                        const studentNameValue = foundUser ? foundUser.name : (fallbackName || 'Unknown Student');

                        return {
                            ...test,
                            studentName: studentNameValue, // Specific key name 'studentName'
                            exercise_title: exMap[test.exercise_id] || test.exercise_id || 'Unknown Test'
                        };
                    });

                    // Match the rendering logic name: we'll set studentAuthName to studentName for safety 
                    // AND set allResults.
                    setAllResults(mergedResults.map(m => ({ ...m, studentAuthName: m.studentName })));
                } else if (resultsInDb) {
                    // Fail-safe if users table is completely empty but results exist
                    setAllResults(resultsInDb.map(r => ({
                        ...r,
                        studentAuthName: r.student_name || r.mistakes_data?.student_name || 'Unknown Student'
                    })));
                }
            } catch (err) {
                console.error('[AdminResultSync] Manual merge failed:', err);
            } finally {
                setLoadingResults(false);
            }
        };
        syncData();
    }, [supabase]);

    const saveStateExams = (updated) => {
        setStateExams(updated);
        try {
            localStorage.setItem('admin_state_exams', JSON.stringify(updated));
        } catch (err) {
            console.error('Storage quota exceeded:', err);
            alert('Storage is full! Please use a smaller file or delete old uploads.');
        }
    };

    const openQuickEdit = (item, moduleKey) => {
        setQuickModule(moduleKey);
        setQuickTitle(item.title || '');
        setGlobalJobTitle(item.job_title || '');
        setGlobalTestType(item.test_type || '');
        setQuickText(item.original_text || item.text || '');
        setQuickFile(null); // We don't load dataURLs back into state usually, just show "current file" in the UI if we want
        setEditingQuickId(item.id);
        const isHc = moduleKey === 'highcourt';
        setQuickOpen(true);
        if (isHc) {
            setTimeout(() => {
                if (quickHcEditorRef.current) {
                    quickHcEditorRef.current.innerHTML = item.formatted_html || `<p>${(item.original_text || item.text || '').replace(/\\n/g, '<br/>')}</p>`;
                }
            }, 100);
        }
    };

    // ── Quick Upload save handler ──
    const handleQuickSave = async () => {
        if (!quickModule) return;
        setQuickSaving(true);
        const isEdit = !!editingQuickId;
        const testId = isEdit ? editingQuickId : crypto.randomUUID();
        const allLocalTests = [...hcTests, ...pitmanTests, ...kailashTests, ...audioTests, ...compTests];
        const existingItem = isEdit ? allLocalTests.find(t => t.id === testId) : null;

        const isHc = quickModule === 'highcourt';
        const qHtml = isHc ? (quickHcEditorRef.current?.innerHTML || '') : '';
        const qTextStripped = isHc ? (quickHcEditorRef.current?.innerText || quickText) : quickText;

        const newItem = {
            id: testId,
            title: quickTitle.trim() || `${QUICK_MODULES.find(m => m.key === quickModule)?.label} — ${new Date().toLocaleDateString()}`,
            original_text: isHc ? qTextStripped : quickText,
            formatted_html: qHtml,
            pdf: quickFile || existingItem?.pdf || existingItem?.image_url,
            audio: quickModule === 'audio' ? (quickFile || existingItem?.audio || existingItem?.audio_url) : undefined,
            category: quickModule,
            job_title: globalJobTitle,
            test_type: globalTestType,
            state: quickState || null,
            created_at: existingItem?.created_at || new Date().toISOString(),
        };

        const updateList = (list, setFunc, storageKey) => {
            const updated = isEdit ? list.map(t => t.id === testId ? newItem : t) : [newItem, ...list];
            setFunc(updated);
            try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch(e) {}
        };

        // If a state is selected → save to state exams
        if (quickState) {
            const key = `${quickState}__${quickModule}`;
            const existing = (stateExams[key] || []).filter(i => i.id !== testId); // Remove old version if edit
            const updated = { ...stateExams, [key]: [newItem, ...existing] };
            saveStateExams(updated);
        }

        // Update Module-specific lists
        if (quickModule === 'highcourt') {
            updateList(hcTests, setHcTests, 'admin_highcourt_data_list');
        } else if (quickModule === 'pitman') {
            updateList(pitmanTests, setPitmanTests, 'admin_pitman_data_list');
        } else if (quickModule === 'kailash') {
            updateList(kailashTests, setKailashTests, 'admin_kailash_data_list');
        } else if (quickModule === 'comprehension') {
            updateList(compTests, setCompTests, 'admin_comprehension_data_list');
        } else if (quickModule === 'audio') {
            updateList(audioTests, setAudioTests, 'admin_published_audio_list');
        }

        // Try Supabase sync
        if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
            try {
                // Only send columns confirmed to exist in Supabase schema
                const hcEncoded = isHc ? JSON.stringify({ __hc: true, plain: qTextStripped, html: qHtml, job_title: globalJobTitle || '', test_type: globalTestType || '' }) : null;
                const dbPayload = {
                    title: newItem.title,
                    original_text: isHc ? hcEncoded : quickText,
                    category: quickModule === 'audio' ? 'Audio Dictation' : quickModule,
                    audio_url: quickModule === 'audio' ? newItem.audio : undefined,
                    image_url: quickModule === 'pitman' ? newItem.pdf : undefined
                };
                
                if (isEdit) {
                    await supabase.from('exercises').update(dbPayload).eq('id', testId);
                } else {
                    await supabase.from('exercises').insert({ id: testId, ...dbPayload });
                }
            } catch (err) {
                console.warn('Supabase sync failed (Quick Upload):', err);
            }
        }

        setTimeout(() => {
            setQuickSaving(false);
            setQuickSuccess(true);
            setTimeout(() => {
                setQuickSuccess(false);
                setQuickOpen(false);
                setQuickModule('');
                setQuickState('');
                setQuickTitle(''); resetGlobalDocs();
                setQuickText('');
                setQuickFile(null);
                if (quickHcEditorRef.current) quickHcEditorRef.current.innerHTML = '';
            }, 1200);
        }, 600);
    };

    const handleSaveStateContent = () => {
        if (!stateUploadTitle.trim() || (!stateUploadText.trim() && !stateUploadPdf)) return;
        setStateUploadSaving(true);
        const key = `${selectedState}__${stateSubModule}`;
        
        const isEdit = !!editingStateId;
        const testId = isEdit ? editingStateId : crypto.randomUUID();
        const existingItems = stateExams[key] || [];
        const existingItem = isEdit ? existingItems.find(i => i.id === testId) : null;

        const newItem = {
            id: testId,
            title: stateUploadTitle,
            original_text: stateUploadText,
            pdf: stateUploadPdf,
            state: selectedState,
            type: stateSubModule,
            job_title: globalJobTitle,
            test_type: globalTestType,
            created_at: existingItem?.created_at || new Date().toISOString()
        };

        const updatedItems = isEdit 
            ? existingItems.map(i => i.id === testId ? newItem : i)
            : [newItem, ...existingItems];

        const updatedExams = { ...stateExams, [key]: updatedItems };
        
        // Helper to update global lists
        const updateGlobalList = (list, setFunc, storageKey, category) => {
            const globalItem = { ...newItem, category };
            const updated = isEdit 
                ? list.map(t => t.id === testId ? globalItem : t)
                : [globalItem, ...list];
            // If it's an edit and the item wasn't in the global list, we might want to add it?
            // But usually they should be in sync. 
            // For safety, let's check if it exists in edit mode
            if (isEdit && !list.find(t => t.id === testId)) {
                updated.unshift(globalItem);
            }
            setFunc(updated);
            localStorage.setItem(storageKey, JSON.stringify(updated));
        };

        // Also push to matching global lists so student portal sees them
        if (stateSubModule === 'highcourt') {
            updateGlobalList(hcTests, setHcTests, 'admin_highcourt_data_list', 'highcourt');
        } else if (stateSubModule === 'pitman') {
            updateGlobalList(pitmanTests, setPitmanTests, 'admin_pitman_data_list', 'pitman');
        } else if (stateSubModule === 'kailash') {
            updateGlobalList(kailashTests, setKailashTests, 'admin_kailash_data_list', 'kailash');
        } else if (stateSubModule === 'comprehension') {
            updateGlobalList(compTests, setCompTests, 'admin_comprehension_data_list', 'comprehension');
        } else if (stateSubModule === 'audio') {
            const audioItem = { ...newItem, audio: stateUploadPdf, category: 'audio', job_title: globalJobTitle, test_type: globalTestType };
            const updated = isEdit 
                ? audioTests.map(t => t.id === testId ? audioItem : t)
                : [audioItem, ...audioTests];
            if (isEdit && !audioTests.find(t => t.id === testId)) updated.unshift(audioItem);
            setAudioTests(updated);
            localStorage.setItem('admin_published_audio_list', JSON.stringify(updated));
        }

        saveStateExams(updatedExams);
        setStateUploadTitle(''); resetGlobalDocs();
        setStateUploadText('');
        setStateUploadPdf(null);
        setIsAddingStateContent(false);
        setStateUploadSaving(false);
        setEditingStateId(null);
    };

    const handleEditStateItem = (id, key) => {
        const item = (stateExams[key] || []).find(i => i.id === id);
        if (!item) return;
        setStateUploadTitle(item.title || '');
        setGlobalJobTitle(item.job_title || '');
        setGlobalTestType(item.test_type || '');
        setStateUploadText(item.original_text || item.text || '');
        setStateUploadPdf(item.pdf || null);
        setEditingStateId(id);
        setIsAddingStateContent(true);
    };

    const handleDeleteStateItem = async (key, id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('Supabase delete error:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            // Success: Update state
            const updatedStateExams = { ...stateExams, [key]: (stateExams[key] || []).filter(i => i.id !== id) };
            saveStateExams(updatedStateExams);
            
            // Also synchronize global module lists
            const modKey = key.split('__')[1];
            if (modKey === 'highcourt') {
                const up = hcTests.filter(t => t.id !== id);
                setHcTests(up); localStorage.setItem('admin_highcourt_data_list', JSON.stringify(up));
            } else if (modKey === 'pitman') {
                const up = pitmanTests.filter(t => t.id !== id);
                setPitmanTests(up); localStorage.setItem('admin_pitman_data_list', JSON.stringify(up));
            } else if (modKey === 'kailash') {
                const up = kailashTests.filter(t => t.id !== id);
                setKailashTests(up); localStorage.setItem('admin_kailash_data_list', JSON.stringify(up));
            } else if (modKey === 'audio') {
                const up = audioTests.filter(t => t.id !== id);
                setAudioTests(up); localStorage.setItem('admin_published_audio_list', JSON.stringify(up));
            } else if (modKey === 'comprehension') {
                const up = compTests.filter(t => t.id !== id);
                setCompTests(up); localStorage.setItem('admin_comprehension_data_list', JSON.stringify(up));
            }
        } catch (err) {
            console.error('Delete operation failed:', err);
            alert('Operation failed. Please check your connection.');
        }
    };

    const handleDeleteUser = async (phone) => {
        if (window.confirm('Delete this student?')) {
            try {
                if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                    const { error } = await supabase.from('users').delete().eq('phone', phone);
                    if (error) {
                        console.error('Delete student failed:', error.message);
                        alert('Failed to delete: ' + error.message);
                        return;
                    }
                }
                const updatedUsers = users.filter(u => u.phone !== phone);
                setUsers(updatedUsers);
                localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
            } catch (err) {
                console.error('Delete student operation failed:', err);
                alert('Operation failed. Please check your connection.');
            }
        }
    };

    const handleSaveAudioData = async () => {
        if (!audioTitle.trim() || (!pendingAudio && !pendingAudioFile)) { alert('Title and audio file are required.'); return; }
        
        setAudioPublishing(true);
        const isEdit = !!editingAudioId;
        const testId = isEdit ? editingAudioId : crypto.randomUUID();
        const newStateVal = audioState === 'None' ? null : (audioState || null);
        
        let finalAudioUrl = pendingAudio;
        
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                // 1. Upload to Supabase Storage if brand new file
                if (pendingAudioFile) {
                    const fileExt = pendingAudioFile.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('shorthand-media')
                        .upload(`audio/${fileName}`, pendingAudioFile);
                        
                    if (uploadError) throw uploadError;

                    // 2. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('shorthand-media')
                        .getPublicUrl(`audio/${fileName}`);
                        
                    finalAudioUrl = publicUrl;
                }

                // 3. Save to DB using only confirmed schema columns
                const dbPayload = {
                    title: audioTitle,
                    audio_url: finalAudioUrl,
                    category: 'Audio Dictation',
                    original_text: pendingAudioText
                };

                if (isEdit) {
                    const { error } = await supabase.from('exercises').update(dbPayload).eq('id', testId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('exercises').insert([{ id: testId, ...dbPayload }]);
                    if (error) throw error;
                }
            } else throw new Error('offline');
            
            // Show Success Notification
            setAudioSuccess(true);
            setTimeout(() => setAudioSuccess(false), 3000);

            // Local Mock UI Sync to prevent required refresh
            const newTest = { 
                id: testId, 
                title: audioTitle, 
                job_title: globalJobTitle,
                test_type: globalTestType, 
                original_text: pendingAudioText, 
                audio: finalAudioUrl, // maintain internal property name for array rendering
                category: 'audio', 
                state: newStateVal, 
                created_at: isEdit ? audioTests.find(t => t.id === testId)?.created_at || new Date().toISOString() : new Date().toISOString() 
            };
            
            const updated = isEdit ? audioTests.map(t => t.id === testId ? newTest : t) : [newTest, ...audioTests];
            setAudioTests(updated);
            try { localStorage.setItem('admin_published_audio_list', JSON.stringify(updated)); } catch {}
            
            if (newStateVal) {
                const key = `${newStateVal}__audio`;
                const existing = stateExams[key] || [];
                const newExams = { ...stateExams, [key]: isEdit ? existing.map(e => e.id === testId ? newTest : e) : [newTest, ...existing] };
                saveStateExams(newExams);
            }
        } catch (err) {
            console.error('Audio upload error:', err);
            alert('Failed to save audio completely. Detail: ' + err.message);
        } finally { 
            // Reset state
            setAudioPublishing(false); 
            setIsAddingAudio(false); 
            setEditingAudioId(null);
            setAudioTitle(''); resetGlobalDocs(); 
            setPendingAudio(''); 
            setPendingAudioFile(null);
            setPendingAudioText(''); 
            setAudioState('');
        }
    };

    const handleEditAudio = (id) => {
        const test = audioTests.find(t => t.id === id);
        if (!test) return;
        setAudioTitle(test.title || '');
        setGlobalJobTitle(test.job_title || '');
        setGlobalTestType(test.test_type || '');
        setPendingAudioText(test.original_text || test.text || '');
        setPendingAudio(test.audio_url || test.audio || test.pdf || null);
        setPendingAudioFile(null);
        setAudioState(test.state || 'None');
        setEditingAudioId(id);
        setIsAddingAudio(true);
    };

    const handleDeleteAudio = async (id) => {
        if (!window.confirm('Delete this Audio Dictation?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('Audio delete failed:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            // Success: Update state
            const updatedAudioTests = audioTests.filter(t => t.id !== id);
            setAudioTests(updatedAudioTests); 
            localStorage.setItem('admin_published_audio_list', JSON.stringify(updatedAudioTests));
            
            const test = audioTests.find(t => t.id === id);
            if (test && test.state) {
                const key = `${test.state}__audio`;
                if (stateExams[key]) {
                    saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== id) });
                }
            }
        } catch (err) {
            console.error('Audio delete operation failed:', err);
            alert('Operation failed. Please try again.');
        }
    };

    const handleSaveHcData = async () => {
        const editorHtml = hcEditorRef.current?.innerHTML || '';
        const editorText = hcEditorRef.current?.innerText || hcText;
        if (!hcTitle.trim() || (!editorText.trim() && !hcPdf)) { alert('Title and formatted text or PDF are required.'); return; }
        
        setIsUploadingHc(true);
        const isEdit = !!editingHcId;
        const testId = isEdit ? editingHcId : crypto.randomUUID();
        const newTest = {
            id: testId,
            title: hcTitle,
            job_title: globalJobTitle,
            test_type: globalTestType,
            original_text: editorText.trim(),      // plain text — shown to student as reference
            formatted_html: editorHtml,             // rich HTML — used as answer key for scoring
            pdf: hcPdf,
            category: 'highcourt',
            created_at: isEdit ? hcTests.find(t => t.id === testId)?.created_at || new Date().toISOString() : new Date().toISOString()
        };
        
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                // Save ALL content to Supabase:
                // - original_text: JSON-encoded (for compatibility & scoring)
                // - formatted_html: the raw rich HTML (gives student portal full document)
                const encodedContent = JSON.stringify({
                    __hc: true,
                    plain: editorText.trim(),
                    html: editorHtml,
                    job_title: globalJobTitle || '',
                    test_type: globalTestType || ''
                });

                const dbPayload = {
                    title: hcTitle,
                    original_text: encodedContent,
                    category: 'highcourt'
                };

                if (isEdit) {
                    const { error } = await supabase.from('exercises').update(dbPayload).eq('id', testId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('exercises').insert([{ id: testId, ...dbPayload }]);
                    if (error) throw error;
                }
            } else throw new Error('offline');
            
            // Show success toast notification
            setHcSuccess(true);
            setTimeout(() => setHcSuccess(false), 3000); // clear toast after 3s
            
            // Synchronize with Local UI list
            const updated = isEdit ? hcTests.map(t => t.id === testId ? newTest : t) : [newTest, ...hcTests];
            setHcTests(updated);
            try { localStorage.setItem('admin_highcourt_data_list', JSON.stringify(updated)); } catch { }
            
        } catch (err) {
            console.error('Supabase save error:', err);
            
            // Offline fallback / Graceful degradation
            const updated = isEdit ? hcTests.map(t => t.id === testId ? newTest : t) : [newTest, ...hcTests];
            setHcTests(updated);
            try { localStorage.setItem('admin_highcourt_data_list', JSON.stringify(updated)); } catch { }
            
            alert('Failed to save to Supabase. Saved offline. Check console for details.');
        } finally {
            setIsUploadingHc(false);
            // Clear the form
            setHcTitle(''); resetGlobalDocs(); 
            setHcText(''); 
            setHcFormattedHtml(''); 
            setHcPdf(null);
            setIsAddingHc(false); 
            setEditingHcId(null);
            if (hcEditorRef.current) hcEditorRef.current.innerHTML = '<p><br></p>';
        }
    };

    // Decode HC JSON to extract rich HTML for the editor
    const decodeHcHtmlForEditor = (test) => {
        if (!test) return '<p><br></p>';
        // Priority 1: explicit formatted_html column
        if (test.formatted_html && test.formatted_html.trim().length > 10) {
            return test.formatted_html;
        }
        // Priority 2: extract html from JSON-encoded original_text
        const raw = String(test.original_text || test.text || '').trim();
        if (raw.startsWith('{') && raw.includes('"plain"')) {
            try {
                const jsonStart = raw.indexOf('{');
                const sanitized = raw.substring(jsonStart).replace(/\r?\n/g, '\\n');
                const parsed = JSON.parse(sanitized);
                if (parsed.html && parsed.html.trim().length > 10) return parsed.html;
                if (parsed.plain) return `<p>${parsed.plain.replace(/\n/g, '<br/>')}</p>`;
            } catch (e) { /* fall through */ }
        }
        // Priority 3: raw HTML or plain text
        if (/<[^>]+>/.test(raw)) return raw;
        return `<p>${raw.replace(/\n/g, '<br/>')}</p>`;
    };

    const handleEditHc = (id) => {
        const test = hcTests.find(t => t.id === id);
        if (!test) return;
        setHcTitle(test.title || '');
        setGlobalJobTitle(test.job_title || '');
        setGlobalTestType(test.test_type || '');
        setHcText(test.original_text || test.text || '');
        setHcFormattedHtml(test.formatted_html || '');
        setHcPdf(test.pdf || null);
        setEditingHcId(id);
        setIsAddingHc(true);
        // Delay slightly so the editor ref is mounted
        setTimeout(() => {
            if (hcEditorRef.current) {
                hcEditorRef.current.innerHTML = decodeHcHtmlForEditor(test);
            }
        }, 50);
    };

    const handleSavePitmanData = async () => {
        // More granular validation
        if (!pitmanTitle.trim()) {
            alert('Title is required.');
            return;
        }
        if (!pitmanText.trim()) {
            alert('English Text Solution (Transcription) is required.');
            return;
        }
        
        // For NEW exercises, image/pdf is required. 
        // For EDITS, it's optional (we keep existing if not uploading)
        const isEdit = !!editingPitmanId;
        if (!isEdit && !pitmanPdf && !rawPitmanFile) {
            alert('Shorthand Image or PDF solution is required.');
            return;
        }
        
        setIsUploadingPitman(true);
        const isEdit = !!editingPitmanId;
        const testId = isEdit ? editingPitmanId : crypto.randomUUID();
        let finalImageUrl = isEdit ? pitmanTests.find(t => t.id === testId)?.image_url || pitmanPdf : pitmanPdf;

        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                // Upload physical image directly to Bucket and map URL
                if (rawPitmanFile) {
                    const ext = rawPitmanFile.name.split('.').pop() || 'png';
                    const fileName = `pitman_${Date.now()}_${Math.random().toString(36).substring(2,7)}.${ext}`;
                    
                    const { error: uploadErr } = await supabase.storage.from('shorthand-media').upload(fileName, rawPitmanFile, { upsert: true });
                    if (uploadErr) throw uploadErr;
                    
                    const { data: publicData } = supabase.storage.from('shorthand-media').getPublicUrl(fileName);
                    finalImageUrl = publicData.publicUrl;
                }

                const dbPayload = {
                    title: pitmanTitle,
                    job_title: globalJobTitle,
                    test_type: globalTestType,
                    original_text: pitmanText,
                    image_url: finalImageUrl,
                    category: 'Pitman Shorthand'
                };

                if (isEdit) {
                    const { error } = await supabase.from('exercises').update(dbPayload).eq('id', testId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('exercises').insert([{ id: testId, ...dbPayload }]);
                    if (error) throw error;
                }
            } else {
                throw new Error('offline');
            }
            
            // Success Routine
            setPitmanSuccess(true);
            setTimeout(() => setPitmanSuccess(false), 3000);

            const newTest = {
                id: testId, title: pitmanTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: pitmanText, image_url: finalImageUrl, pdf: finalImageUrl, category: 'Pitman Shorthand',
                created_at: isEdit ? pitmanTests.find(t => t.id === testId)?.created_at || new Date().toISOString() : new Date().toISOString()
            };
            const updated = isEdit ? pitmanTests.map(t => t.id === testId ? newTest : t) : [newTest, ...pitmanTests];
            setPitmanTests(updated);
            try { localStorage.setItem('admin_pitman_data_list', JSON.stringify(updated)); } catch {}
        } catch (err) {
            console.error('Save Pitman Error:', err);
            const newTest = { id: testId, title: pitmanTitle, original_text: pitmanText, image_url: finalImageUrl, pdf: pitmanPdf, category: 'Pitman Shorthand', created_at: new Date().toISOString() };
            const updated = isEdit ? pitmanTests.map(t => t.id === testId ? newTest : t) : [newTest, ...pitmanTests];
            try { localStorage.setItem('admin_pitman_data_list', JSON.stringify(updated)); } catch {}
            setPitmanTests(updated);
            alert('Supabase save failed. Data cached locally. Check console.');
        } finally { 
            setIsUploadingPitman(false); 
            setPitmanTitle(''); resetGlobalDocs(); 
            setPitmanText(''); 
            setPitmanPdf(null); 
            setRawPitmanFile(null);
            setIsAddingPitman(false); 
            setEditingPitmanId(null); 
        }
    };

    const handleEditPitman = (id) => {
        const test = pitmanTests.find(t => t.id === id);
        if (!test) return;
        setPitmanTitle(test.title || '');
        setGlobalJobTitle(test.job_title || '');
        setGlobalTestType(test.test_type || '');
        setPitmanText(test.original_text || test.text || '');
        setPitmanPdf(test.pdf || null);
        setEditingPitmanId(id);
        setIsAddingPitman(true);
    };

    const handleSaveKcData = async () => {
        if (!kcText.trim()) return;
        
        const isEdit = !!editingKcId;
        const testId = isEdit ? editingKcId : crypto.randomUUID();
        
        // If it's an edit, we still want to ensure the target format: Title (Volume X)
        // If they changed the title/volume in the edit form, composite them.
        let finalTitle = kcTitle.trim();
        if (!finalTitle.match(/\(.*?\)$/)) {
             finalTitle = `${finalTitle || `Kailash Chandra - Exercise ${new Date().toLocaleDateString()}`} (${kcVolume})`;
        } else if (isEdit) {
            // They edited it but it already has parenthesis, we'll try to reconstruct cleanly
             finalTitle = `${finalTitle.replace(/\s*\(.*?\)$/, '')} (${kcVolume})`;
        } else {
             finalTitle = `${finalTitle || `Kailash Chandra - Exercise ${new Date().toLocaleDateString()}`} (${kcVolume})`;
        }

        const newTest = { 
            id: testId, 
            title: finalTitle, 
            job_title: globalJobTitle,
            test_type: globalTestType,
            original_text: kcText, 
            category: 'kailash', 
            created_at: isEdit ? kailashTests.find(t => t.id === testId)?.created_at || new Date().toISOString() : new Date().toISOString() 
        };
        
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                if (isEdit) {
                    const { error } = await supabase.from('exercises').update({ title: finalTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: kcText }).eq('id', testId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('exercises').insert(newTest);
                    if (error) throw error;
                }
            } else throw new Error('offline');
            const updated = isEdit ? kailashTests.map(t => t.id === testId ? newTest : t) : [newTest, ...kailashTests];
            setKailashTests(updated);
            try { localStorage.setItem('admin_kailash_data_list', JSON.stringify(updated)); } catch {}
        } catch {
            const updated = isEdit ? kailashTests.map(t => t.id === testId ? newTest : t) : [newTest, ...kailashTests];
            setKailashTests(updated);
            try { localStorage.setItem('admin_kailash_data_list', JSON.stringify(updated)); } catch {}
        } finally { setKcText(''); setKcTitle(''); resetGlobalDocs(); setKcVolume('Volume 1'); setIsAddingNewKc(false); setEditingKcId(null); }
    };

    const handleEditKc = (id) => {
        const test = kailashTests.find(t => t.id === id);
        if (!test) return;
        
        const match = test.title.match(/^(.*?)\s*\(([^()]+)\)$/);
        if (match) {
            setKcTitle(match[1].trim());
            
            // if it's not a standard predefined Volume list item, still populate it
            setKcVolume(match[2].trim());
        } else {
            setGlobalJobTitle(test.job_title || '');
        setGlobalTestType(test.test_type || '');
        setKcTitle(test.title || '');
            setKcVolume('Volume 1');
        }
        
        setKcText(test.original_text || test.text || '');
        setEditingKcId(id);
        setIsAddingNewKc(true);
    };

    const handleDeleteHc = async (id) => {
        if (!window.confirm('Delete this test?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('High Court delete failed:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            const test = hcTests.find(t => t.id === id);
            const updatedHcTests = hcTests.filter(t => t.id !== id);
            setHcTests(updatedHcTests); 
            localStorage.setItem('admin_highcourt_data_list', JSON.stringify(updatedHcTests));
            
            if (test && test.state) {
                const key = `${test.state}__highcourt`;
                if (stateExams[key]) saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== id) });
            }
        } catch (err) {
            console.error('HC delete operation failed:', err);
            alert('Operation failed. Please try again.');
        }
    };

    const handleDeletePitman = async (id) => {
        if (!window.confirm('Delete this exercise?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('Pitman delete failed:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            const test = pitmanTests.find(t => t.id === id);
            const updatedPitmanTests = pitmanTests.filter(t => t.id !== id);
            setPitmanTests(updatedPitmanTests); 
            localStorage.setItem('admin_pitman_data_list', JSON.stringify(updatedPitmanTests));
            
            if (test && test.state) {
                const key = `${test.state}__pitman`;
                if (stateExams[key]) saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== id) });
            }
        } catch (err) {
            console.error('Pitman delete operation failed:', err);
            alert('Operation failed. Please try again.');
        }
    };

    const handleDeleteKc = async (id) => {
        if (!window.confirm('Delete this test?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('Kailash delete failed:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            const test = kailashTests.find(t => t.id === id);
            const updatedKcTests = kailashTests.filter(t => t.id !== id);
            setKailashTests(updatedKcTests); 
            localStorage.setItem('admin_kailash_data_list', JSON.stringify(updatedKcTests));
            
            if (test && test.state) {
                const key = `${test.state}__kailash`;
                if (stateExams[key]) saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== id) });
            }
        } catch (err) {
            console.error('KC delete operation failed:', err);
            alert('Operation failed. Please try again.');
        }
    };

    const handleSaveCompData = async () => {
        if (!compTitle.trim() || !compText.trim()) { alert('Title and text are required.'); return; }
        setIsSavingComp(true);
        const isEdit = !!editingCompId;
        const testId = isEdit ? editingCompId : crypto.randomUUID();
        const newTest = {
            id: testId,
            title: compTitle,
            job_title: globalJobTitle,
            test_type: globalTestType,
            original_text: compText,
            pdf: compPdf,
            category: 'comprehension',
            created_at: isEdit ? compTests.find(t => t.id === testId)?.created_at || new Date().toISOString() : new Date().toISOString()
        };

        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const dbPayload = { title: compTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: compText, category: 'comprehension' };
                if (isEdit) await supabase.from('exercises').update(dbPayload).eq('id', testId);
                else await supabase.from('exercises').insert([{ id: testId, ...dbPayload }]);
            }
            const updated = isEdit ? compTests.map(t => t.id === testId ? newTest : t) : [newTest, ...compTests];
            setCompTests(updated);
            localStorage.setItem('admin_comprehension_data_list', JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingComp(false); setCompTitle(''); resetGlobalDocs(); setCompText(''); setCompPdf(null); setIsAddingComp(false); setEditingCompId(null);
        }
    };

    const handleEditComp = (id) => {
        const test = compTests.find(t => t.id === id);
        if (!test) return;
        setCompTitle(test.title || '');
        setGlobalJobTitle(test.job_title || '');
        setGlobalTestType(test.test_type || '');
        setCompText(test.original_text || test.text || '');
        setCompPdf(test.pdf || null);
        setEditingCompId(id);
        setIsAddingComp(true);
    };

    const handleDeleteComp = async (id) => {
        if (!window.confirm('Delete this comprehension?')) return;
        try {
            if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                const { error } = await supabase.from('exercises').update({ is_hidden: true }).eq('id', id);
                if (error) {
                    console.error('Comprehension delete failed:', error.message);
                    alert('Failed to delete: ' + error.message);
                    return;
                }
            }
            
            const test = compTests.find(t => t.id === id);
            const updatedCompTests = compTests.filter(t => t.id !== id);
            setCompTests(updatedCompTests); 
            localStorage.setItem('admin_comprehension_data_list', JSON.stringify(updatedCompTests));
            
            if (test && test.state) {
                const key = `${test.state}__comprehension`;
                if (stateExams[key]) saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== id) });
            }
        } catch (err) {
            console.error('Comp delete operation failed:', err);
            alert('Operation failed. Please try again.');
        }
    };

    const handleClearStorage = () => {
        if (window.confirm('Clear all published content? Student results will remain.')) {
            ['admin_published_audio_list', 'admin_highcourt_pdf_published', 'admin_kailash_data_list', 'admin_highcourt_data_list', 'admin_pitman_data_list', 'admin_state_exams'].forEach(k => localStorage.removeItem(k));
            window.location.reload();
        }
    };

    // ── MODULE CONTENT RENDERER ───────────────────────────────
    const renderModuleContent = () => {
        if (activeModule === 'home') {
            return (
                <div>
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome, {user?.name || 'Administrator'}! 👋</h2>
                        <p className="text-gray-500">Select a module below to upload or manage content for students.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 justify-items-center">
                        {MODULE_TYPES.map(mod => <ModuleCard key={mod.key} mod={mod} onClick={setActiveModule} />)}
                    </div>
                </div>
            );
        }

        if (activeModule === 'highcourt') {
            const onAction = (cmd) => execHcCommand(cmd, hcEditorRef);
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <h2 className="text-2xl font-bold text-gray-800">Allahabad High Court Formatting</h2>
                        <button onClick={() => {
                            if (isAddingHc) { setIsAddingHc(false); setEditingHcId(null); setHcTitle(''); resetGlobalDocs(); setHcPdf(null); if (hcEditorRef.current) hcEditorRef.current.innerHTML = '<p><br></p>'; }
                            else { setIsAddingHc(true); setEditingHcId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 transition-colors shadow">
                            {isAddingHc && !editingHcId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>

                    {hcSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <strong>Success!</strong>&nbsp;Test successfully saved to the database.
                        </div>
                    )}

                    {isAddingHc && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6 animate-in slide-in-from-top-2">
                            {editingHcId && <div className="mb-4 text-xs font-bold text-blue-600 bg-blue-50 py-2 px-3 rounded inline-block">✎ Editing Existing Test</div>}
                            {/* Title + PDF row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                    <input type="text" value={hcTitle} onChange={e => setHcTitle(e.target.value)} placeholder="e.g. Allahabad HC — Set 01" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">PDF Reference (Optional)</label>
                                    <label className="flex items-center justify-center w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-all">
                                        <FileUp className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-sm text-gray-500">{hcPdf ? '✓ PDF loaded' : 'Click to upload PDF'}</span>
                                        <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setHcPdf(ev.target.result); r.readAsDataURL(f); }} />
                                    </label>
                                </div>
                            </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam (Optional)</label>
                                        <input type="text" value={globalJobTitle || ''} onChange={e => setGlobalJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section (Optional)</label>
                                        <input type="text" value={globalTestType || ''} onChange={e => setGlobalTestType(e.target.value)} placeholder="e.g. Mock Test, Skill Test" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                </div>

                            {/* Rich-text editor — ANSWER KEY */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Answer Key — Formatted Text</label>
                                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">🔒 Hidden from students · used for scoring</span>
                                </div>

                                {/* Toolbar */}
                                <div className="flex items-center gap-1 p-1.5 bg-gray-50 border border-gray-200 rounded-t-lg flex-wrap">
                                    <div className="flex space-x-0.5 border-r pr-2 mr-1">
                                        <HcToolBtn icon={Bold} cmd="bold" title="Bold" onAction={onAction} />
                                        <HcToolBtn icon={Italic} cmd="italic" title="Italic" onAction={onAction} />
                                        <HcToolBtn icon={Underline} cmd="underline" title="Underline" onAction={onAction} />
                                    </div>
                                    <div className="flex space-x-0.5 border-r pr-2 mr-1">
                                        <HcToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" onAction={onAction} />
                                        <HcToolBtn icon={AlignCenter} cmd="justifyCenter" title="Center" onAction={onAction} />
                                        <HcToolBtn icon={AlignRight} cmd="justifyRight" title="Align Right" onAction={onAction} />
                                        <HcToolBtn icon={AlignJustify} cmd="justifyFull" title="Justify" onAction={onAction} />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Courier New</span>
                                </div>

                                {/* Editor area */}
                                <div
                                    ref={hcEditorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="min-h-[200px] p-5 border border-t-0 border-gray-200 rounded-b-lg outline-none font-serif text-sm leading-relaxed bg-white whitespace-pre-wrap"
                                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                                    onInput={() => setHcFormattedHtml(hcEditorRef.current?.innerHTML || '')}
                                    data-placeholder="Type the correctly formatted court text here. Apply bold, center, underline, etc. Students will only see unformatted plain text — this HTML is the answer key."
                                />
                                <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; font-style: italic; }`}</style>
                                <p className="mt-1.5 text-xs text-gray-400">Students see the <strong>plain text</strong> version. The formatting you apply here is used to score their submission.</p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setIsAddingHc(false); setEditingHcId(null); setHcTitle(''); resetGlobalDocs(); setHcPdf(null); if (hcEditorRef.current) hcEditorRef.current.innerHTML = '<p><br></p>'; }} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button onClick={handleSaveHcData} disabled={isUploadingHc} className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center shadow">
                                    {isUploadingHc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {editingHcId ? 'Update' : 'Save & Publish'}
                                </button>
                            </div>
                        </div>
                    )}

                    <TestList tests={hcTests} onDelete={handleDeleteHc} onEdit={handleEditHc} emptyMsg="No High Court tests uploaded yet." />
                </div>
            );
        }

        if (activeModule === 'pitman') {
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <h2 className="text-2xl font-bold text-gray-800">Pitman Shorthand Exercises</h2>
                        <button onClick={() => {
                            if (isAddingPitman) { setIsAddingPitman(false); setEditingPitmanId(null); setPitmanTitle(''); resetGlobalDocs(); setPitmanPdf(null); setRawPitmanFile(null); setPitmanText(''); }
                            else { setIsAddingPitman(true); setEditingPitmanId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 transition-colors shadow">
                            {isAddingPitman && !editingPitmanId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>

                    {pitmanSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <strong>Success!</strong>&nbsp;Pitman Exercise successfully uploaded to Database.
                        </div>
                    )}

                    {isAddingPitman && (
                        <>
                            {editingPitmanId && <div className="mb-2 text-xs font-bold text-blue-600 bg-blue-50 py-2 px-3 rounded inline-block animate-in fade-in">✎ Editing Existing Pitman Test</div>}
                            <UploadForm jobTitle={globalJobTitle} setJobTitle={setGlobalJobTitle} testType={globalTestType} setTestType={setGlobalTestType} isEdit={!!editingPitmanId} title={pitmanTitle} setTitle={setPitmanTitle} text={pitmanText} setText={setPitmanText} pdf={pitmanPdf} setPdf={setPitmanPdf} onFileSelect={setRawPitmanFile} onSave={handleSavePitmanData} onCancel={() => { setIsAddingPitman(false); setEditingPitmanId(null); setPitmanTitle(''); resetGlobalDocs(); setPitmanText(''); setPitmanPdf(null); setRawPitmanFile(null); }} saving={isUploadingPitman} textLabel="English Transcription Text (Solution)" fileLabel="Shorthand Image Upload (Required)" accept="image/*" />
                        </>
                    )}
                    <TestList tests={pitmanTests} onDelete={handleDeletePitman} onEdit={handleEditPitman} emptyMsg="No Pitman exercises uploaded yet." />
                </div>
            );
        }

        if (activeModule === 'kailash') {
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <h2 className="text-2xl font-bold text-gray-800">Kailash Chandra Management</h2>
                        <button onClick={() => {
                            if (isAddingNewKc) { setIsAddingNewKc(false); setEditingKcId(null); setKcText(''); setKcTitle(''); resetGlobalDocs(); setKcVolume('Volume 1'); }
                            else { setIsAddingNewKc(true); setEditingKcId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 transition-colors shadow">
                            {isAddingNewKc && !editingKcId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>
                    {isAddingNewKc && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6 animate-in slide-in-from-top-2">
                            {editingKcId && <div className="mb-4 text-xs font-bold text-blue-600 bg-blue-50 py-2 px-3 rounded inline-block animate-in fade-in">✎ Editing Existing Kailash Chandra Dictation</div>}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Volume / Category</label>
                                <div className="flex space-x-2">
                                    <select value={kcVolume} onChange={e => setKcVolume(e.target.value)} className="w-1/2 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500">
                                        {[...Array(24)].map((_, i) => (
                                            <option key={i} value={`Volume ${i + 1}`}>Volume {i + 1}</option>
                                        ))}
                                        <option value="New Volume">Add New Volume...</option>
                                    </select>
                                    {(!kcVolume.startsWith('Volume ') && kcVolume !== 'New Volume') || kcVolume === 'New Volume' ? (
                                        <input type="text" value={kcVolume === 'New Volume' ? '' : kcVolume} placeholder="Enter Custom Volume Name" onChange={(e) => setKcVolume(e.target.value)} className="w-1/2 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                                    ) : null}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Exercise Title / Number</label>
                                <input type="text" value={kcTitle} onChange={e => setKcTitle(e.target.value)} placeholder="e.g. Exercise 5" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam (Optional)</label>
                                        <input type="text" value={globalJobTitle || ''} onChange={e => setGlobalJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section (Optional)</label>
                                        <input type="text" value={globalTestType || ''} onChange={e => setGlobalTestType(e.target.value)} placeholder="e.g. Mock Test, Skill Test" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Dictation Text</label>
                                <textarea value={kcText} onChange={e => setKcText(e.target.value)} placeholder="Paste dictation text here..." className="w-full h-48 p-4 font-serif border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-y" />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setIsAddingNewKc(false); setEditingKcId(null); setKcText(''); setKcTitle(''); resetGlobalDocs(); setKcVolume('Volume 1'); }} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button onClick={handleSaveKcData} className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center shadow">
                                    <Save className="w-4 h-4 mr-2" />{editingKcId ? 'Update' : 'Save & Publish'}
                                </button>
                            </div>
                        </div>
                    )}
                    <TestList tests={kailashTests} onDelete={handleDeleteKc} onEdit={handleEditKc} emptyMsg="No Kailash Chandra exercises uploaded yet." />
                </div>
            );
        }

        if (activeModule === 'comprehension') {
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <h2 className="text-2xl font-bold text-gray-800">Comprehension Management</h2>
                        <button onClick={() => {
                            if (isAddingComp) { setIsAddingComp(false); setEditingCompId(null); setCompTitle(''); resetGlobalDocs(); setCompText(''); setCompPdf(null); }
                            else { setIsAddingComp(true); setEditingCompId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 transition-colors shadow">
                            {isAddingComp && !editingCompId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>
                    {isAddingComp && (
                        <UploadForm jobTitle={globalJobTitle} setJobTitle={setGlobalJobTitle} testType={globalTestType} setTestType={setGlobalTestType} isEdit={!!editingCompId} title={compTitle} setTitle={setCompTitle} text={compText} setText={setCompText} pdf={compPdf} setPdf={setCompPdf} onSave={handleSaveCompData} onCancel={() => { setIsAddingComp(false); setEditingCompId(null); setCompTitle(''); resetGlobalDocs(); setCompText(''); setCompPdf(null); }} saving={isSavingComp} />
                    )}
                    <TestList tests={compTests} onDelete={handleDeleteComp} onEdit={handleEditComp} emptyMsg="No Comprehension exercises uploaded yet." />
                </div>
            );
        }

        if (activeModule === 'audio') {
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <h2 className="text-2xl font-bold text-gray-800">Audio Dictation Management</h2>
                        <button onClick={() => {
                            if (isAddingAudio) { setIsAddingAudio(false); setEditingAudioId(null); setAudioTitle(''); resetGlobalDocs(); setPendingAudio(null); setPendingAudioFile(null); setPendingAudioText(''); setAudioState(''); }
                            else { setIsAddingAudio(true); setEditingAudioId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 transition-colors shadow">
                            {isAddingAudio && !editingAudioId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>

                    {audioSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <strong>Success!</strong>&nbsp;Audio Dictation successfully uploaded and mapped to database.
                        </div>
                    )}

                    {isAddingAudio && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6 animate-in slide-in-from-top-2">
                            {editingAudioId && <div className="mb-4 text-xs font-bold text-blue-600 bg-blue-50 py-2 px-3 rounded inline-block animate-in fade-in">✎ Editing Existing Audio Dictation</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Dictation Title / Tag</label>
                                    <input type="text" value={audioTitle || ''} onChange={e => setAudioTitle(e.target.value)} placeholder="e.g. Dictation #401" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Map to State Exam (Optional)</label>
                                    <select value={audioState} onChange={e => setAudioState(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white">
                                        <option value="None">-- Select State (Optional) --</option>
                                        {STATE_EXAMS.map(state => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                </div>
                            </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam (Optional)</label>
                                        <input type="text" value={globalJobTitle || ''} onChange={e => setGlobalJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section (Optional)</label>
                                        <input type="text" value={globalTestType || ''} onChange={e => setGlobalTestType(e.target.value)} placeholder="e.g. Mock Test, Skill Test" className="w-full p-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Transcription Text (Solution & Accuracy)</label>
                                <textarea value={pendingAudioText || ''} onChange={e => setPendingAudioText(e.target.value)} placeholder="Paste full transcription text here..." className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm resize-y" />
                            </div>

                            <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-between">
                                {pendingAudio ? (
                                    <div className="flex items-center space-x-4 w-full">
                                        <Headphones className="w-8 h-8 text-[#1e3a8a]" />
                                        <audio controls src={pendingAudio} className="h-10 flex-1" />
                                        <button onClick={() => { setPendingAudio(null); setPendingAudioFile(null); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg font-bold text-sm transition-colors">Replace File</button>
                                    </div>
                                ) : (
                                    <label className="w-full flex items-center justify-center space-x-2 text-gray-500 font-bold cursor-pointer hover:text-[#1e3a8a] py-2">
                                        <Plus className="w-5 h-5" /> <span>Upload Base Audio File (.mp3, .wav)</span>
                                        <input type="file" accept="audio/*" className="hidden" onChange={e => {
                                            const f = e.target.files[0]; if (!f) return;
                                            setPendingAudioFile(f);
                                            const r = new FileReader(); r.onload = ev => setPendingAudio(ev.target.result); r.readAsDataURL(f);
                                        }} />
                                    </label>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setIsAddingAudio(false); setEditingAudioId(null); setAudioTitle(''); resetGlobalDocs(); setPendingAudio(null); setPendingAudioFile(null); setPendingAudioText(''); setAudioState(''); }} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button onClick={handleSaveAudioData} disabled={audioPublishing} className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center shadow">
                                    {audioPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {editingAudioId ? 'Update' : 'Save & Publish'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <TestList tests={audioTests} onDelete={handleDeleteAudio} onEdit={handleEditAudio} emptyMsg="No Audio Dictations uploaded yet." />
                </div>
            );
        }

        if (activeModule === 'state') {
            // State list view
            if (!selectedState) {
                return (
                    <div>
                        <div className="flex items-center mb-6 space-x-3">
                            <button onClick={() => setActiveModule('home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                            <h2 className="text-2xl font-bold text-gray-800">State Exam Management</h2>
                        </div>
                        <p className="text-gray-500 mb-6">Select a state to upload exam content (Audio Dictation, Pitman, High Court, Comprehension).</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {STATE_EXAMS.map(state => {
                                const totalItems = ['highcourt', 'pitman', 'audio', 'kailash', 'comprehension'].reduce((acc, t) => acc + (stateExams[`${state}__${t}`]?.length || 0), 0);
                                return (
                                    <div key={state} onClick={() => setSelectedState(state)}
                                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-red-400 hover:shadow-md cursor-pointer transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <Map className="w-6 h-6 text-red-600" />
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm">{state}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} uploaded</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            // Sub-module selection within state
            if (!stateSubModule) {
                const subModules = [
                    { key: 'highcourt', label: 'High Court Formatting', icon: Scale, color: 'from-blue-600 to-blue-800' },
                    { key: 'pitman', label: 'Pitman Exercise', icon: Edit2, color: 'from-purple-600 to-purple-800' },
                    { key: 'audio', label: 'Audio Dictation', icon: Headphones, color: 'from-green-600 to-green-800' },
                    { key: 'kailash', label: 'Kailash Chandra', icon: BookOpen, color: 'from-amber-500 to-amber-700' },
                    { key: 'comprehension', label: 'Comprehension', icon: FileText, color: 'from-cyan-600 to-cyan-800' },
                ];
                return (
                    <div>
                        <div className="flex items-center mb-2 space-x-3">
                            <button onClick={() => setSelectedState(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">State Exam</p>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedState}</h2>
                            </div>
                        </div>
                        <p className="text-gray-500 mb-6 ml-11">Select the type of content you want to upload for {selectedState} students.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                            {subModules.map(sm => {
                                const Icon = sm.icon;
                                const count = (stateExams[`${selectedState}__${sm.key}`] || []).length;
                                return (
                                    <div key={sm.key} className="flex flex-col items-center group cursor-pointer" onClick={() => setStateSubModule(sm.key)}>
                                        <div className="relative w-40 h-40 rounded-full bg-white shadow-xl flex flex-col justify-center items-center text-center p-5 border-4 border-transparent group-hover:border-red-600 transition-all duration-300">
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${sm.color} flex items-center justify-center mb-2 shadow`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-xs leading-tight">{sm.label}</h3>
                                            <span className="text-[10px] text-gray-400 mt-1">{count} uploaded</span>
                                        </div>
                                        <button className="mt-4 bg-red-700 hover:bg-red-800 text-white px-5 py-1.5 rounded-full font-semibold shadow text-xs transition-transform hover:scale-105">Upload</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            // State + Sub-module content view
            const stateKey = `${selectedState}__${stateSubModule}`;
            const stateItems = stateExams[stateKey] || [];
            const subLabel = { highcourt: 'High Court Formatting', pitman: 'Pitman Exercise', audio: 'Audio Dictation', kailash: 'Kailash Chandra', comprehension: 'Comprehension' }[stateSubModule];
            const acceptMap = { audio: 'audio/*', highcourt: '.pdf,image/*', pitman: '.pdf,image/*', kailash: '.pdf', comprehension: '.pdf' };
            return (
                <div>
                    <div className="flex items-center mb-6 space-x-3">
                        <button onClick={() => setStateSubModule(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">{selectedState} › State Exam</p>
                            <h2 className="text-2xl font-bold text-gray-800">{subLabel}</h2>
                        </div>
                        <button onClick={() => {
                            if (isAddingStateContent) { setIsAddingStateContent(false); setEditingStateId(null); setStateUploadTitle(''); resetGlobalDocs(); setStateUploadText(''); setStateUploadPdf(null); }
                            else { setIsAddingStateContent(true); setEditingStateId(null); }
                        }} className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-800 shadow">
                            {isAddingStateContent && !editingStateId ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add New</>}
                        </button>
                    </div>
                    {isAddingStateContent && (
                        <UploadForm
                            jobTitle={globalJobTitle} setJobTitle={setGlobalJobTitle} testType={globalTestType} setTestType={setGlobalTestType}
                            isEdit={!!editingStateId}
                            title={stateUploadTitle} setTitle={setStateUploadTitle}
                            text={stateUploadText} setText={setStateUploadText}
                            pdf={stateUploadPdf} setPdf={setStateUploadPdf}
                            onSave={handleSaveStateContent}
                            onCancel={() => { setIsAddingStateContent(false); setEditingStateId(null); setStateUploadTitle(''); resetGlobalDocs(); setStateUploadText(''); setStateUploadPdf(null); }}
                            saving={stateUploadSaving}
                            accept={acceptMap[stateSubModule]}
                            textLabel={stateSubModule === 'audio' ? 'Dictation Transcription Text' : 'Content Text'}
                        />
                    )}
                    <TestList tests={stateItems} onDelete={(id) => handleDeleteStateItem(stateKey, id)} onEdit={(id) => handleEditStateItem(id, stateKey)} emptyMsg={`No ${subLabel} content uploaded for ${selectedState} yet.`} />
                </div>
            );
        }

        return null;
    };

    // ── STUDENT MANAGEMENT TAB ─────────────────────────────────
    const renderStudents = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
                <div className="flex bg-white border border-gray-300 rounded-lg px-3 py-2 items-center shadow-sm">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={studentSearchTerm || ''}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="outline-none text-sm bg-transparent" 
                    />
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Name</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Phone</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Joined</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Status</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => {
                            const nameLower = (u.name || '').toLowerCase();
                            const phoneLower = (u.phone || '').toLowerCase();
                            const term = studentSearchTerm.toLowerCase();
                            return nameLower.includes(term) || phoneLower.includes(term);
                        }).length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-gray-400">No students found matching your search.</td></tr>
                        ) : users.filter(u => {
                            const nameLower = (u.name || '').toLowerCase();
                            const phoneLower = (u.phone || '').toLowerCase();
                            const term = studentSearchTerm.toLowerCase();
                            return nameLower.includes(term) || phoneLower.includes(term);
                        }).map(u => (
                            <tr key={u.phone} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{u.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{u.phone}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{u.joinedDate}</td>
                                <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">Active</span></td>
                                <td className="px-6 py-4 text-sm text-right">
                                    <button onClick={() => handleDeleteUser(u.phone)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // ── RESULT ANALYSIS TAB ────────────────────────────────────
    const renderResults = () => {
        // Compute unique dates for tabs
        const dateGroups = ['All'];
        allResults.forEach(res => {
            const dateStr = new Date(res.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!dateGroups.includes(dateStr)) dateGroups.push(dateStr);
        });

        const filteredResults = allResults.filter(res => {
            const matchesDate = selectedResultDate === 'All' || new Date(res.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) === selectedResultDate;
            const matchesSearch = !resultSearchTerm || 
                res.studentAuthName.toLowerCase().includes(resultSearchTerm.toLowerCase()) || 
                res.exercise_title.toLowerCase().includes(resultSearchTerm.toLowerCase());
            return matchesDate && matchesSearch;
        });

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Result Analysis</h2>
                            <p className="text-gray-500 text-sm font-medium">Monitor student performance and exam metrics</p>
                        </div>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all"
                            title="Refresh Data"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex bg-white border border-gray-200 rounded-xl px-4 py-2.5 items-center shadow-sm w-full md:w-72 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search by student or test..." 
                            value={resultSearchTerm || ''}
                            onChange={(e) => setResultSearchTerm(e.target.value)}
                            className="outline-none text-sm bg-transparent w-full font-medium" 
                        />
                    </div>
                </div>

                {/* Date Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {dateGroups.map(date => (
                        <button
                            key={date}
                            onClick={() => setSelectedResultDate(date)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                selectedResultDate === date 
                                    ? 'bg-red-700 text-white border-red-700 shadow-lg shadow-red-200 scale-105' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-700'
                            }`}
                        >
                            {date}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Student</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Test Name</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">WPM / Accuracy</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loadingResults ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-red-100 border-t-red-700 rounded-full animate-spin mb-4"></div>
                                            <span className="font-black text-gray-400 text-xs uppercase tracking-widest">Fetching records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <BarChart2 className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 font-bold italic">No test results found for this selection.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredResults.map(res => (
                                <tr key={res.id} className="group hover:bg-red-50/30 transition-all duration-200">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-50 to-red-100 text-red-700 flex items-center justify-center font-black text-xs border border-red-200 shadow-sm">
                                                {res.studentAuthName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-gray-900 leading-tight">{res.studentAuthName}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    ID: {res.user_id?.slice(0, 8) || 'No-ID'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-gray-600 font-medium truncate max-w-[240px]" title={res.exercise_title}>
                                            {res.exercise_title}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-red-700">{res.wpm}</span>
                                            <span className="text-[10px] font-black text-red-700/50 uppercase tracking-tighter mr-2">WPM</span>
                                            <div className="w-px h-4 bg-gray-100 mx-1"></div>
                                            <span className="text-sm font-black text-green-600">{res.accuracy}%</span>
                                            <span className="text-[10px] font-black text-green-600/50 uppercase tracking-tighter">Acc</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                                {new Date(res.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {new Date(res.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (currentTab === 'students') return renderStudents();
        if (currentTab === 'results') return renderResults();
        if (currentTab === 'content') return renderModuleContent();
        if (currentTab === 'settings') return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h2>
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Browser Storage Management</h3>
                    <p className="text-sm text-gray-600 mb-6">Clear all published content if storage is full.</p>
                    <button onClick={handleClearStorage} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">Reset System Memory</button>
                </div>
            </div>
        );
    };

    // ── Quick Upload Drawer JSX (inlined — NOT a sub-component to avoid remount lag) ──
    const selectedQuickMod = QUICK_MODULES.find(m => m.key === quickModule);
    const quickDrawerJSX = (
        <React.Fragment>
            {/* Backdrop */}
            {quickOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setQuickOpen(false)}
                />
            )}

            {/* Drawer (Full Screen Mode) */}
            <div
                className={`fixed inset-0 bg-white z-50 flex flex-col transition-all duration-300 ease-in-out ${
                    quickOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-10'
                }`}
            >
                {/* Drawer Header */}
                <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg leading-none">Quick Upload</h2>
                            <p className="text-red-200 text-xs mt-0.5">Upload content to any module directly</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setQuickOpen(false)}
                        className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Success State */}
                {quickSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-1">Published!</h3>
                        <p className="text-gray-500 text-sm">Content is now live for students.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                        {/* Step 1 – Module */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                                Step 1 · Select Module <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={quickModule}
                                    onChange={e => { setQuickModule(e.target.value); setQuickFile(null); }}
                                    className="w-full appearance-none pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                                >
                                    <option value="">— Choose a module —</option>
                                    {QUICK_MODULES.map(m => (
                                        <option key={m.key} value={m.key}>{m.icon} {m.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Step 2 – State (optional) */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                                Step 2 · Target State
                                <span className="ml-2 text-gray-400 font-normal normal-case">optional — leave blank for all students</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={quickState}
                                    onChange={e => setQuickState(e.target.value)}
                                    className="w-full appearance-none pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                                >
                                    <option value="">All Students (no specific state)</option>
                                    {STATE_EXAMS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            {quickState && (
                                <div className="mt-2 flex items-center space-x-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                                    <Map className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span className="text-xs text-rose-700 font-semibold">Will be added to <strong>{quickState}</strong> State Exam</span>
                                </div>
                            )}
                        </div>

                        {/* Step 3 – Content fields (only show if module selected) */}
                        {quickModule && (
                            <React.Fragment>
                                <div className="border-t border-gray-100 pt-5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                                        Step 3 · Content Details
                                    </label>

                                    {/* Title */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
                                        <input
                                            type="text"
                                            value={quickTitle || ''}
                                            onChange={e => setQuickTitle(e.target.value)}
                                            placeholder="e.g. Bihar High Court Test — Set 01"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                                        />
                                    </div>

                                    {/* File upload */}
                                    <div className="mb-4">
                                        
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam (Optional)</label>
                                        <input type="text" value={globalJobTitle || ''} onChange={e => setGlobalJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section (Optional)</label>
                                        <input type="text" value={globalTestType || ''} onChange={e => setGlobalTestType(e.target.value)} placeholder="e.g. Mock Test, Skill Test" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                </div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                            {quickModule === 'audio' ? 'Audio File' : 'PDF / Image'}
                                            <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <label className={`flex items-center justify-center w-full border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
                                            quickFile
                                                ? 'border-green-400 bg-green-50'
                                                : 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50'
                                        }`}>
                                            {quickFile ? (
                                                <><CheckCircle className="w-4 h-4 mr-2 text-green-500" /><span className="text-sm font-semibold text-green-700">File loaded ✓</span></>
                                            ) : (
                                                <><FileUp className="w-4 h-4 mr-2 text-gray-400" /><span className="text-sm text-gray-500">Click to upload file</span></>
                                            )}
                                            <input
                                                type="file"
                                                accept={selectedQuickMod?.accept}
                                                className="hidden"
                                                onChange={e => {
                                                    const f = e.target.files[0];
                                                    if (!f) return;
                                                    const r = new FileReader();
                                                    r.onload = ev => setQuickFile(ev.target.result);
                                                    r.readAsDataURL(f);
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Text Content / Editor */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between items-center">
                                            <span>{selectedQuickMod?.textLabel}</span>
                                            {quickModule === 'highcourt' && (
                                                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-black tracking-tighter uppercase">Answer Key — Richmond Text</span>
                                            )}
                                        </label>

                                        {quickModule === 'highcourt' ? (
                                            <div className="flex flex-col border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-400">
                                                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 border-b border-gray-200">
                                                    <HcToolBtn icon={Bold} cmd="bold" title="Bold" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                    <HcToolBtn icon={Italic} cmd="italic" title="Italic" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                    <HcToolBtn icon={Underline} cmd="underline" title="Underline" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                    <div className="w-px h-4 bg-gray-300 mx-1" />
                                                    <HcToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                    <HcToolBtn icon={AlignCenter} cmd="justifyCenter" title="Center" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                    <HcToolBtn icon={AlignRight} cmd="justifyRight" title="Align Right" onAction={(cmd) => execHcCommand(cmd, quickHcEditorRef)} />
                                                </div>
                                                <div
                                                    ref={quickHcEditorRef}
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onInput={(e) => setQuickText(e.target.innerText)}
                                                    data-placeholder="Type or paste the formatted text here... Apply bold, center alignment etc. as needed for the High Court answer key."
                                                    className="w-full h-48 px-4 py-3 outline-none overflow-y-auto text-sm font-serif leading-relaxed bg-white"
                                                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                                                />
                                            </div>
                                        ) : (
                                            <textarea
                                                value={quickText || ''}
                                                onChange={e => setQuickText(e.target.value)}
                                                placeholder="Paste the content / transcription text here…"
                                                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl text-sm font-serif outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none transition-all placeholder:italic placeholder:text-gray-300"
                                            />
                                        )}
                                        {quickModule === 'highcourt' && (
                                            <p className="mt-2 text-[10px] text-gray-400 leading-tight">Apply all required High Court formatting here. Students will see plain text, but this version will be used for automated checking.</p>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        )}

                        <div className="pt-8 border-t border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <History className="w-3.5 h-3.5 mr-2" />
                                Recent Contributions
                            </h4>
                            <div className="space-y-3">
                                {[
                                    ...hcTests.map(t => ({ ...t, mod: 'highcourt', icon: '⚖️' })),
                                    ...pitmanTests.map(t => ({ ...t, mod: 'pitman', icon: '✍️' })),
                                    ...kailashTests.map(t => ({ ...t, mod: 'kailash', icon: '📖' })),
                                    ...audioTests.map(t => ({ ...t, mod: 'audio', icon: '🎧' })),
                                    ...compTests.map(t => ({ ...t, mod: 'comprehension', icon: '📝' }))
                                ]
                                .sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                                .slice(0, 5)
                                .map(item => (
                                    <div key={item.id} className="group bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-red-200 rounded-xl p-3 flex items-center justify-between transition-all">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm shrink-0">
                                                {item.icon}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">
                                                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {item.mod === 'audio' ? 'Audio Dictation' : item.mod.charAt(0).toUpperCase() + item.mod.slice(1)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button 
                                                onClick={() => openQuickEdit(item, item.mod)}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Quick Edit"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!window.confirm('Delete this recent item?')) return;
                                                    if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
                                                        try { await supabase.from('exercises').delete().eq('id', item.id); } catch(err) { console.error('DB Delete failed:', err); }
                                                    }
                                                    if (item.mod === 'highcourt') {
                                                        const up = hcTests.filter(t => t.id !== item.id); setHcTests(up); localStorage.setItem('admin_highcourt_data_list', JSON.stringify(up));
                                                    } else if (item.mod === 'pitman') {
                                                        const up = pitmanTests.filter(t => t.id !== item.id); setPitmanTests(up); localStorage.setItem('admin_pitman_data_list', JSON.stringify(up));
                                                    } else if (item.mod === 'kailash') {
                                                        const up = kailashTests.filter(t => t.id !== item.id); setKailashTests(up); localStorage.setItem('admin_kailash_data_list', JSON.stringify(up));
                                                    } else if (item.mod === 'audio') {
                                                        const up = audioTests.filter(t => t.id !== item.id); setAudioTests(up); localStorage.setItem('admin_published_audio_list', JSON.stringify(up));
                                                    } else if (item.mod === 'comprehension') {
                                                        const up = compTests.filter(t => t.id !== item.id); setCompTests(up); localStorage.setItem('admin_comprehension_data_list', JSON.stringify(up));
                                                    }
                                                    if (item.state) {
                                                        const key = `${item.state}__${item.mod}`;
                                                        if (stateExams[key]) saveStateExams({ ...stateExams, [key]: stateExams[key].filter(e => e.id !== item.id) });
                                                    }
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Drawer Footer */}
                {!quickSuccess && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center space-x-3">
                        <button
                            onClick={() => { setQuickOpen(false); setEditingQuickId(null); }}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleQuickSave}
                            disabled={quickSaving || !quickModule || (!quickTitle.trim() && !quickText.trim() && !quickFile && !editingQuickId)}
                            className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-red-200"
                        >
                            {quickSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                            ) : (
                                <>{editingQuickId ? <Save className="w-4 h-4" /> : <Zap className="w-4 h-4" />}<span>{editingQuickId ? 'Save Changes' : 'Publish Now'}</span></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    return (
        <>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white shadow-sm border-b z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-700 rounded-lg flex justify-center items-center shadow-sm">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin <span className="text-red-700">Portal</span></h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full">
                            <div className="w-7 h-7 bg-red-700 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">AD</span></div>
                            <span className="font-semibold text-red-700 text-sm">{user?.name || 'Administrator'}</span>
                        </div>
                        <button onClick={onLogout} className="flex items-center space-x-2 border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 px-4 py-2 rounded-full font-semibold transition-all text-sm">
                            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 w-full mx-auto flex flex-col md:flex-row overflow-hidden relative max-w-[1600px]">
                <aside className="w-full md:w-60 bg-white md:border-r border-b md:border-b-0 py-6 px-4 flex flex-col shrink-0">
                    <div className="px-4 mb-3 text-xs font-black text-gray-400 uppercase tracking-wider">Management</div>
                    <nav className="space-y-1 flex-1">
                        <SidebarItem icon={Users} label="Student Management" tabId="students" currentTab={currentTab} onClick={() => { setCurrentTab('students'); setActiveModule('home'); setSelectedState(null); setStateSubModule(null); }} />
                        <SidebarItem icon={BarChart2} label="Result Analysis" tabId="results" currentTab={currentTab} onClick={() => { setCurrentTab('results'); setActiveModule('home'); setSelectedState(null); setStateSubModule(null); }} />
                        <div className="my-3 border-t border-gray-100" />
                        <div
                            onClick={() => setCurrentTab('content')}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${currentTab === 'content' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}
                        >
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">Content Manager</span>
                        </div>
                        <div className="my-3 border-t border-gray-100" />
                        <SidebarItem icon={Settings} label="System Settings" tabId="settings" currentTab={currentTab} onClick={() => { setCurrentTab('settings'); setActiveModule('home'); setSelectedState(null); setStateSubModule(null); }} />
                    </nav>

                    {/* Quick Upload Button (Moved from bottom FAB) */}
                    <div className="mt-auto px-2 pt-6">
                        <button
                            onClick={() => setQuickOpen(true)}
                            className="w-full flex items-center justify-center space-x-2 bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                            <Upload className="w-5 h-5" />
                            <span>Quick Upload</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-10 bg-gray-50 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>

        {/* ── Quick Upload Drawer (Full Screen) ──────────────────── */}
        {quickDrawerJSX}
        </>
    );
};

export default AdminPanel;
