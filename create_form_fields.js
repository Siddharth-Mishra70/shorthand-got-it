import fs from 'fs';
const file = './src/AdminPanel.jsx';
let d = fs.readFileSync(file, 'utf8');

// Add jobTitle & testType state to AdminPanel
d = d.replace(`    // Supabase Auto-Sync`, `    // Global extra fields for Test Data (Job Title & Test Type)
    const [globalJobTitle, setGlobalJobTitle] = useState('');
    const [globalTestType, setGlobalTestType] = useState('');

    const resetGlobalDocs = () => {
        setGlobalJobTitle('');
        setGlobalTestType('');
    };

    // Supabase Auto-Sync`);

// Add to newTest schemas (7 places)
d = d.replace(/title:\s*quickTitle.*?category:\s*quickModule,/s, match => match + `\n            job_title: globalJobTitle,\n            test_type: globalTestType,`);
d = d.replace(/title:\s*stateUploadTitle,.*?\n.*?type:\s*stateSubModule,/s, match => match + `\n            job_title: globalJobTitle,\n            test_type: globalTestType,`);
d = d.replace(/const newTest = \{\n\s*id: testId,\n\s*title: hcTitle,/s, match => `const newTest = {\n            id: testId,\n            title: hcTitle,\n            job_title: globalJobTitle,\n            test_type: globalTestType,`);
d = d.replace(/const dbPayload = \{\n\s*title: hcTitle,/s, match => `const dbPayload = {\n                    title: hcTitle,\n                    job_title: globalJobTitle,\n                    test_type: globalTestType,`);
// audio
d = d.replace(/const newTest = \{ \n\s*id: testId, \n\s*title: audioTitle,/s, match => `const newTest = { \n                id: testId, \n                title: audioTitle, \n                job_title: globalJobTitle,\n                test_type: globalTestType,`);
d = d.replace(/const dbPayload = \{\n\s*title: audioTitle,/s, match => `const dbPayload = {\n                    title: audioTitle,\n                    job_title: globalJobTitle,\n                    test_type: globalTestType,`);
d = d.replace(/const audioItem = \{ \.\.\.newItem, audio: stateUploadPdf, category: 'audio' \};/g, `const audioItem = { ...newItem, audio: stateUploadPdf, category: 'audio', job_title: globalJobTitle, test_type: globalTestType };`);

// kc
d = d.replace(/const newTest = \{ \n\s*id: testId, \n\s*title: finalTitle, \n\s*original_text: kcText,/s, match => `const newTest = { \n            id: testId, \n            title: finalTitle, \n            job_title: globalJobTitle,\n            test_type: globalTestType,\n            original_text: kcText,`);
d = d.replace(/await supabase\.from\('exercises'\)\.update\(\{ title: finalTitle, original_text: kcText \}\)/s, `await supabase.from('exercises').update({ title: finalTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: kcText })`);
// comp
d = d.replace(/const newTest = \{\n\s*id: testId,\n\s*title: compTitle,/s, match => `const newTest = {\n            id: testId,\n            title: compTitle,\n            job_title: globalJobTitle,\n            test_type: globalTestType,`);
d = d.replace(/const dbPayload = \{ title: compTitle, original_text: compText, category: 'comprehension' \};/s, `const dbPayload = { title: compTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: compText, category: 'comprehension' };`);

// quick
d = d.replace(/const dbPayload = \{\n\s*title: newItem.title,/s, match => `const dbPayload = {\n                    title: newItem.title,\n                    job_title: globalJobTitle,\n                    test_type: globalTestType,`);
// pitman
d = d.replace(/const dbPayload = \{\n\s*title: pitmanTitle,/s, match => `const dbPayload = {\n                    title: pitmanTitle,\n                    job_title: globalJobTitle,\n                    test_type: globalTestType,`);
d = d.replace(/const newTest = \{\n\s*id: testId, title: pitmanTitle, original_text: pitmanText,/s, match => `const newTest = {\n                id: testId, title: pitmanTitle, job_title: globalJobTitle, test_type: globalTestType, original_text: pitmanText,`);

// Edit hooks
d = d.replace(/setQuickTitle\(item\.title \|\| ''\);/, `setQuickTitle(item.title || '');\n        setGlobalJobTitle(item.job_title || '');\n        setGlobalTestType(item.test_type || '');`);
d = d.replace(/setStateUploadTitle\(item\.title \|\| ''\);/, `setStateUploadTitle(item.title || '');\n        setGlobalJobTitle(item.job_title || '');\n        setGlobalTestType(item.test_type || '');`);
d = d.replace(/setAudioTitle\(test\.title \|\| ''\);/, `setAudioTitle(test.title || '');\n        setGlobalJobTitle(test.job_title || '');\n        setGlobalTestType(test.test_type || '');`);
d = d.replace(/setHcTitle\(test\.title \|\| ''\);/, `setHcTitle(test.title || '');\n        setGlobalJobTitle(test.job_title || '');\n        setGlobalTestType(test.test_type || '');`);
d = d.replace(/setPitmanTitle\(test\.title \|\| ''\);/, `setPitmanTitle(test.title || '');\n        setGlobalJobTitle(test.job_title || '');\n        setGlobalTestType(test.test_type || '');`);
d = d.replace(/setKcTitle\(test\.title \|\| ''\);/, match => `setGlobalJobTitle(test.job_title || '');\n        setGlobalTestType(test.test_type || '');\n        ` + match);
d = d.replace(/setCompTitle\(test\.title \|\| ''\);/, `setCompTitle(test.title || '');\n        setGlobalJobTitle(test.job_title || '');\n        setGlobalTestType(test.test_type || '');`);

// Cancel hooks clearing
d = d.replace(/setQuickTitle\(''\);/g, `setQuickTitle(''); resetGlobalDocs();`);
d = d.replace(/setStateUploadTitle\(''\);/g, `setStateUploadTitle(''); resetGlobalDocs();`);
d = d.replace(/setAudioTitle\(''\);/g, `setAudioTitle(''); resetGlobalDocs();`);
d = d.replace(/setHcTitle\(''\);/g, `setHcTitle(''); resetGlobalDocs();`);
d = d.replace(/setPitmanTitle\(''\);/g, `setPitmanTitle(''); resetGlobalDocs();`);
d = d.replace(/setKcTitle\(''\);/g, `setKcTitle(''); resetGlobalDocs();`);
d = d.replace(/setCompTitle\(''\);/g, `setCompTitle(''); resetGlobalDocs();`);

// UploadForm props & UI
d = d.replace(/saving,/g, "jobTitle, setJobTitle, testType, setTestType, saving,");
d = d.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">\s*<div>\s*<label className="block text-sm font-bold text-gray-700 mb-2">Title<\/label>.*?<\/div>\s*<div>\s*<label className="block text-sm font-bold text-gray-700 mb-2">\{fileLabel\}<\/label>.*?<\/div>\s*<\/div>/s, match => {
    return match + `\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">\n            <div>\n                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam</label>\n                <input type="text" value={jobTitle || ''} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />\n            </div>\n            <div>\n                <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section</label>\n                <input type="text" value={testType || ''} onChange={e => setTestType(e.target.value)} placeholder="e.g. Skill Test, Mock Test" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />\n            </div>\n        </div>`;
});

// Pass props to UploadForm calls
d = d.replace(/<UploadForm isEdit/g, `<UploadForm jobTitle={globalJobTitle} setJobTitle={setGlobalJobTitle} testType={globalTestType} setTestType={setGlobalTestType} isEdit`);
d = d.replace(/<UploadForm\n\s*isEdit/g, `<UploadForm\n                            jobTitle={globalJobTitle} setJobTitle={setGlobalJobTitle} testType={globalTestType} setTestType={setGlobalTestType}\n                            isEdit`);

// UI Injection for non-UploadForm blocks: (Quick Upload, High Court, Kailash, Audio)
let fieldsJSX = `
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4/5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Exam (Optional)</label>
                                        <input type="text" value={globalJobTitle || ''} onChange={e => setGlobalJobTitle(e.target.value)} placeholder="e.g. Stenographer Gr. C" className="w-full px-4/3 py-2.5/3 border border-gray-300 rounded-lg/xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type Section (Optional)</label>
                                        <input type="text" value={globalTestType || ''} onChange={e => setGlobalTestType(e.target.value)} placeholder="e.g. Mock Test, Skill Test" className="w-full px-4/3 py-2.5/3 border border-gray-300 rounded-lg/xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 bg-white" />
                                    </div>
                                </div>`;

let hcFields = fieldsJSX.replace(/mb-4\/5/g, 'mb-5').replace(/px-4\/3/g, 'p-3').replace(/py-2\.5\/3/g, 'p-3').replace(/rounded-lg\/xl/g, 'rounded-lg');
d = d.replace(/(<label className="block text-sm font-bold text-gray-700 mb-2">PDF Reference \(Optional\)<\/label>.*?<\/div>\s*<\/div>)/s, match => match + hcFields);

let kcFields = fieldsJSX.replace(/mb-4\/5/g, 'mb-4').replace(/px-4\/3/g, 'p-3').replace(/py-2\.5\/3/g, 'p-3').replace(/rounded-lg\/xl/g, 'rounded-lg');
d = d.replace(/(<label className="block text-sm font-bold text-gray-700 mb-2">Exercise Title \/ Number<\/label>.*?<\/div>)/s, match => match + kcFields);

let audioFields = fieldsJSX.replace(/mb-4\/5/g, 'mb-4').replace(/px-4\/3/g, 'p-3').replace(/py-2\.5\/3/g, 'p-3').replace(/rounded-lg\/xl/g, 'rounded-lg');
d = d.replace(/(<label className="block text-sm font-bold text-gray-700 mb-2">Map to State Exam \(Optional\)<\/label>.*?<\/div>\s*<\/div>)/s, match => match + audioFields);

let quickFields = fieldsJSX.replace(/mb-4\/5/g, 'mb-4').replace(/px-4\/3/g, 'px-4').replace(/py-2\.5\/3/g, 'py-2.5').replace(/rounded-lg\/xl/g, 'rounded-xl');
d = d.replace(/(<label className="block text-sm font-bold text-gray-700 mb-1\.5">\s*\{quickModule === 'audio'.*?<\/div>)/s, match => quickFields + `\n                                    ` + match);

fs.writeFileSync(file, d);
console.log('Modifications written successfully!');
