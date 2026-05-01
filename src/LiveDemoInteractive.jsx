import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Type,
  Minus,
  Plus,
  Eye,
  RefreshCw,
  Zap,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import generateDetailedAnalysis from './lib/generateDetailedAnalysis';

// ─── Default Text ─────────────────────────────────────────────
const DEFAULT_TEXT =
  "This petition under Article 226 of the Constitution challenges the order dated 15th March, 2024 passed by the Education Department withdrawing recognition from Bright Future Public School on grounds of non-compliance with norms and violation of natural justice. The order was passed without prior notice and lacks proper facilities.";

// ─── Stat card ────────────────────────────────────────────────
const StatCard = ({ value, label, color, bg }) => (
  <div className={`flex flex-col items-center justify-center px-4 py-4 rounded-2xl ${bg} border transition-all duration-300 hover:shadow-lg`} style={{ borderColor: color + '33' }}>
    <span className="text-3xl font-black mb-1" style={{ color }}>{value}</span>
    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 text-center leading-tight">{label}</span>
  </div>
);

const LiveDemoInteractive = ({ onRegister }) => {
  const [isTyping, setIsTyping] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const textareaRef = useRef(null);

  // Focus removed to prevent auto-scrolling on load

  const handleStartTyping = (e) => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    setTypedText(e.target.value);
  };

  const handleSubmit = () => {
    console.log("Submitting demo text...");
    if (typedText.trim().length === 0) {
      alert("Please type some text before checking!");
      return;
    }
    setEndTime(Date.now());
    setIsTyping(false);
    setShowResult(true);
  };

  const handleReset = () => {
    setTypedText('');
    setStartTime(null);
    setEndTime(null);
    setIsTyping(true);
    setShowResult(false);
  };

  // ── Run analysis ────────────────────────────────────────────
  const analysis = useMemo(() => {
    if (!showResult) return null;
    const durationSec = startTime && endTime ? (endTime - startTime) / 1000 : 0;
    return generateDetailedAnalysis(DEFAULT_TEXT, typedText, { durationSec });
  }, [showResult, typedText, startTime, endTime]);

  const stats = analysis ? [
    { value: analysis.summary.totalWords, label: 'Total Words', color: '#1e3a8a', bg: 'bg-blue-50' },
    { value: analysis.summary.attemptedWords, label: 'Typed Words', color: '#0369a1', bg: 'bg-sky-50' },
    { value: analysis.summary.totalMistakes, label: 'Total Mistakes', color: '#dc2626', bg: 'bg-red-50' },
    { value: analysis.summary.accuracy + '%', label: 'Accuracy', color: '#16a34a', bg: 'bg-green-50' },
    { value: analysis.summary.wpm || '0', label: 'Speed (WPM)', color: '#7c3aed', bg: 'bg-purple-50' },
    { value: analysis.summary.correctWords, label: 'Correct Words', color: '#10b981', bg: 'bg-emerald-50' },
  ] : [];

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100" id="live-demo">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-4">
            <Zap className="w-3 h-3 fill-current" />
            <span>Free Practice Trial</span>
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Try Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-600">
               Practice Dashboard
            </span>{' '}
            Now
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Experience our <span className="font-bold text-gray-900">precision-engine</span> analysis with this free trial. 
            Type the passage below to see how our system analyzes your speed and accuracy.
          </p>
        </div>

        {/* Main Interactive Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden transition-all duration-500 transform hover:scale-[1.01]">

          {/* Card Header Bar */}
          <div className="bg-gradient-to-r from-[#0f2167] via-[#1e3a8a] to-[#2563eb] px-8 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-3.5 h-3.5 bg-[#ff5f57] rounded-full shadow-inner" />
                <div className="w-3.5 h-3.5 bg-[#febc2e] rounded-full shadow-inner" />
                <div className="w-3.5 h-3.5 bg-[#28c840] rounded-full shadow-inner" />
              </div>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <span className="text-white font-bold text-sm tracking-wide">
                {isTyping ? 'Practice Mode · Active Trial' : 'Analysis Mode · Review Results'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-white/80 text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              {isTyping ? <Type className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
              <span>{isTyping ? 'Trial' : 'Checked'}</span>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {isTyping ? (
              /* ─── TYPING MODE ─── */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Reference Text */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-8">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Type className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Original Dictation Passage</span>
                    </div>
                    <p className="text-xl text-gray-700 leading-relaxed font-serif italic select-none">
                      "{DEFAULT_TEXT}"
                    </p>
                  </div>
                </div>

                {/* Typing Area */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={typedText}
                    onChange={handleStartTyping}
                    placeholder="Start typing the passage here..."
                    className="w-full h-48 sm:h-56 p-6 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-300 text-lg leading-relaxed font-mono resize-none shadow-sm placeholder:text-gray-300"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center space-x-4">
                    <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                      {typedText.trim().split(/\s+/).filter(Boolean).length} / {DEFAULT_TEXT.split(' ').length} Words
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <span className="text-sm font-semibold italic">Draft your response above. Timer starts on first key.</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="group w-full sm:w-auto bg-[#1e3a8a] hover:bg-blue-700 text-white font-black px-10 py-5 rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(30,58,138,0.3)] hover:shadow-[0_15px_40px_rgba(30,58,138,0.4)] flex items-center justify-center space-x-3 transform hover:-translate-y-1"
                  >
                    <span>Check My Speed & Accuracy</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              /* ─── RESULT MODE ─── */
              <div className="space-y-10 animate-in zoom-in-95 fade-in duration-700">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                  ))}
                </div>

                {/* Comparison Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="flex flex-col rounded-3xl border border-gray-200 bg-gray-50/50 overflow-hidden hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3 bg-white border-b border-gray-200 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-black text-gray-800 uppercase tracking-tight">Original Paragraph</span>
                    </div>
                    <div className="p-8 text-sm sm:text-base text-gray-600 leading-8 font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
                      {DEFAULT_TEXT}
                    </div>
                  </div>

                  {/* Typed & Highlighted */}
                  <div className="flex flex-col rounded-3xl border border-blue-200 bg-blue-50/30 overflow-hidden hover:border-blue-300 transition-colors shadow-inner">
                    <div className="flex items-center space-x-3 bg-white border-b border-blue-100 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-black text-blue-900 uppercase tracking-tight">Your Comparison result</span>
                    </div>
                    <div className="p-8 text-sm sm:text-base leading-8 font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
                      {analysis?.wordDiff.map((token, i) => {
                        let cls = "";
                        if (token.type === 'correct') cls = "text-gray-700";
                        else if (token.type === 'capital') cls = "bg-amber-100 text-amber-800 rounded px-1 border-b-2 border-amber-300 mx-0.5";
                        else if (token.type === 'missing') cls = "bg-red-50 text-red-300 rounded px-1 border-b-2 border-red-200 line-through opacity-70 mx-0.5";
                        else if (token.type === 'extra') cls = "bg-purple-100 text-purple-800 rounded px-1 border-b-2 border-purple-300 mx-0.5";
                        else cls = "bg-red-100 text-red-700 rounded px-1 border-b-2 border-red-400 mx-0.5 font-bold";
                        
                        return (
                          <span key={i} className={`${cls} transition-colors duration-200`}>
                            {token.word}{' '}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleReset}
                    className="flex items-center space-x-2 text-gray-400 hover:text-[#1e3a8a] font-bold text-sm transition-colors group"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Try Another Session</span>
                  </button>

                  <button
                    onClick={onRegister}
                    className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black px-10 py-5 rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(22,163,74,0.3)] hover:shadow-[0_15px_40px_rgba(22,163,74,0.4)] flex items-center space-x-3 transform hover:scale-105"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    <span>Unlock Full Detailed Analysis - Sign In Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSS for custom scrollbar */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.02);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.2);
          }
        `}} />

        {/* Bottom trust badge */}
        <div className="mt-10 flex flex-col items-center">
          <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Trusted by 5,000+ Aspirants</p>
          <div className="flex items-center space-x-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
             <span className="font-black text-2xl tracking-tighter">STUDENTIA</span>
             <span className="font-serif italic text-xl">Shorthandians</span>
             <span className="font-mono text-lg font-bold">TYPE-PRO</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemoInteractive;
