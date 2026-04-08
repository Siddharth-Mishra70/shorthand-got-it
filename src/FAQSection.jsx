import React, { useState } from 'react';
import { 
    Plus, 
    Minus, 
    HelpCircle, 
    BookOpen, 
    Headphones, 
    Cpu, 
    CreditCard, 
    ShieldCheck, 
    Zap,
    ChevronDown,
    Search
} from 'lucide-react';

const FAQ_DATA = [
    {
        id: 1,
        question: "How do I start a typing test for High Court exams?",
        answer: "Navigate to the 'High Court Formatting' module from your dashboard. You can select from various mock tests designed specifically for high court pattern. Once you start, you'll see a split-screen with the reference text and your typing area.",
        category: "Basics",
        icon: ShieldCheck
    },
    {
        id: 2,
        question: "Can I practice shorthand on a mobile device?",
        answer: "Yes! Our platform is fully mobile-responsive. You can access all dictation exercises and theory materials on your phone or tablet while traveling or commuting. However, for full-scale typing tests, we recommend a keyboard connected via OTG or a laptop.",
        category: "Features",
        icon: Cpu
    },
    {
        id: 3,
        question: "How is the WPM and Accuracy calculated?",
        answer: "We use the standard 5-character word formula: (Total Characters / 5) / Time. Accuracy is calculated based on the Levenshtein distance algorithm, which accounts for substitutions, omissions, and insertions, similar to actual exam evaluations.",
        category: "Dictation",
        icon: Zap
    },
    {
        id: 4,
        question: "Do you provide audio for dictation exercises?",
        answer: "Absolutely. Our 'Audio Dictation' module features high-quality audio recordings at various speeds (60wpm, 80wpm, 100wpm, etc.). You can listen, transcribe, and then evaluate your transcription against the original text.",
        category: "Features",
        icon: Headphones
    },
    {
        id: 5,
        question: "Is there a free trial for the premium modules?",
        answer: "Every student gets access to our 'Basic Training' and several trial mock tests upon registration. For advanced state-specific exams and unlimited kailash chandra exercises, you'll need a premium subscription.",
        category: "Pricing",
        icon: CreditCard
    },
    {
        id: 6,
        question: "What are 'Kailash Chandra' exercises?",
        answer: "Kailash Chandra is a standard curriculum for shorthand students in India. Our platform provides digital versions of these exercises where you can listen to dictations and perform automated evaluations of your transcriptions.",
        category: "Basics",
        icon: BookOpen
    },
    {
        id: 7,
        question: "How do I view my previous test results?",
        answer: "Go to your 'Analytics' or 'Profile' section. There you will find a detailed history of all your attempts, including WPM, accuracy percentages, and word-by-word error analysis for every test you've ever taken.",
        category: "Basics",
        icon: Zap
    },
    {
        id: 8,
        question: "Is my data secure on the platform?",
        answer: "We use industry-standard encryption and Supabase Auth to ensure your personal data and practice history are safe. Your results are only visible to you and (optionally) to your designated instructor/admin.",
        category: "Pricing",
        icon: ShieldCheck
    }
];

const CATEGORIES = ["All", "Basics", "Features", "Dictation", "Pricing"];

const FAQCard = ({ faq, isOpen, onToggle }) => {
    const Icon = faq.icon;
    
    return (
        <div 
            className={`group bg-white rounded-3xl p-6 transition-all duration-300 border-2 ${
                isOpen ? 'border-blue-600 shadow-2xl shadow-blue-100' : 'border-gray-50 shadow-sm hover:border-blue-100 hover:shadow-xl hover:shadow-gray-100'
            }`}
        >
            <button 
                onClick={onToggle}
                className="w-full flex items-start justify-between gap-4 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen ? 'bg-blue-600 text-white rotate-12' : 'bg-blue-50 text-blue-600'
                    }`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="pt-1">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {faq.category}
                        </span>
                        <h4 className={`text-lg font-black leading-tight transition-colors ${isOpen ? 'text-blue-600' : 'text-gray-900'}`}>
                            {faq.question}
                        </h4>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isOpen ? 'bg-blue-600 border-blue-600 text-white rotate-180' : 'border-gray-100 text-gray-400'
                }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                <div className="pl-16 pr-4">
                    <div className="h-px w-12 bg-blue-100 mb-4" />
                    <p className="text-gray-500 font-medium leading-relaxed">
                        {faq.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const [activeFilter, setActiveFilter] = useState("All");
    const [openId, setOpenId] = useState(null);

    const filteredFaqs = activeFilter === "All" 
        ? FAQ_DATA 
        : FAQ_DATA.filter(f => f.category === activeFilter);

    return (
        <section className="py-24 lg:py-32 bg-white relative overflow-hidden" id="faq">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] opacity-60"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 lg:mb-20">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
                        <HelpCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Support Center</span>
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Frequently Asked <span className="text-blue-600">Questions</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium leading-relaxed">
                        Find answers to common questions about our platform, dictation evaluation, and shorthand practice techniques.
                    </p>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveFilter(cat); setOpenId(null); }}
                            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                activeFilter === cat
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-1'
                                    : 'bg-white text-gray-400 border-2 border-gray-50 hover:border-blue-100 hover:text-blue-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FAQ Grid */}
                {filteredFaqs.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                        {filteredFaqs.map(faq => (
                            <FAQCard 
                                key={faq.id} 
                                faq={faq} 
                                isOpen={openId === faq.id}
                                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                        <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="font-bold text-gray-400">No questions found in this category.</p>
                    </div>
                )}

                {/* Bottom Support Callout */}
                <div className="mt-20 text-center">
                    <p className="text-gray-500 font-medium mb-6">
                        Still have more questions? Our support team is here to help!
                    </p>
                    <button className="px-10 py-5 bg-gray-900 hover:bg-[#0f172a] text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 shadow-xl active:scale-95 group">
                        <span className="flex items-center gap-3">
                            Contact Support
                            <Zap className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
