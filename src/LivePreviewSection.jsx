import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Type,
  Minus,
  Plus,
  Eye,
} from 'lucide-react';

// ─── Sample data ─────────────────────────────────────────────
const ORIGINAL =
  'This petition under Article 226 of the Constitution challenges the order dated 15th March, 2024 passed by the Education Department withdrawing recognition from "Bright Future Public School" on grounds of non-compliance with infrastructural norms, violation of natural justice, and provisions of the Right of Children to Free and Compulsory Education Act, 2009. The order was passed without prior notice, lacks proper facilities including adequate classroom space, and violates procedural requirements. The petitioner seeks quashing of the order and directions for fresh consideration, having heard eminent learned counsel for the parties and perused the record this Court finds that the impugned order suffer from.';

const TYPED =
  'This petition under Article 226 of the Constitution challenges the order dated 15th March, 2024 passed by the education Department withdrawing recognition from "Bright Future Public School" on grounds of non-compliance with infrastructural norms, violation of natural justice, and provisions of the Right of Children to Free and compulsory Education Act, 2009. The order was passed without prior notice, lacks proper facilites including adequate classroom space, and violates procedural requirements. The petitioner seeks quashing of the order and direction for fresh consideration. having heard emminent learned counsel for the parties and perused the record this Court finds that the impugned order suffers from.';

// Highlight differences word by word (simplified)
const buildComparison = () => {
  const orig = ORIGINAL.split(' ');
  const typed = TYPED.split(' ');
  return typed.map((word, i) => {
    const origWord = orig[i] || '';
    if (word === origWord) return { word, type: 'correct' };
    const lower = word.toLowerCase();
    const origLower = origWord.toLowerCase();
    if (lower === origLower) return { word, type: 'capital' };   // capitalisation error
    return { word, type: 'wrong' };
  });
};

const comparison = buildComparison();

// ─── Stat card ────────────────────────────────────────────────
const StatCard = ({ value, label, color, bg }) => (
  <div className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl ${bg} border`} style={{ borderColor: color + '33' }}>
    <span className="text-2xl font-black" style={{ color }}>{value}</span>
    <span className="text-xs font-semibold text-gray-500 text-center leading-tight mt-0.5">{label}</span>
  </div>
);

// ─── Mistake pill list ────────────────────────────────────────
const MistakeList = ({ items, color, bg }) => (
  <div className={`rounded-xl ${bg} border px-4 py-3 h-full`} style={{ borderColor: color + '30' }}>
    <div className="flex flex-wrap gap-1.5">
      {items.map((w, i) => (
        <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: color + '18', color }}>
          {w}
        </span>
      ))}
    </div>
  </div>
);

// ─── Main Section ─────────────────────────────────────────────
const LivePreviewSection = () => {
  const [activeTab, setActiveTab] = useState('missing');

  const stats = [
    { value: '203', label: 'Total Words', color: '#1e3a8a', bg: 'bg-blue-50' },
    { value: '198', label: 'User Words', color: '#0369a1', bg: 'bg-sky-50' },
    { value: '68',  label: 'Total Mistakes', color: '#dc2626', bg: 'bg-red-50' },
    { value: '15',  label: 'Capital Mistakes', color: '#d97706', bg: 'bg-amber-50' },
    { value: '12',  label: 'Spelling Mistakes', color: '#7c3aed', bg: 'bg-purple-50' },
    { value: '66.5%', label: 'Accuracy', color: '#16a34a', bg: 'bg-green-50' },
  ];

  const mistakeTabs = [
    {
      id: 'missing',
      label: 'Missing Words',
      icon: Minus,
      color: '#dc2626',
      bg: 'bg-red-50',
      count: 5,
      items: ['ran', 'that', 'Act the', 'drastic', 'proper'],
    },
    {
      id: 'extra',
      label: 'Extra Words',
      icon: Plus,
      color: '#d97706',
      bg: 'bg-amber-50',
      count: 4,
      items: ['having', 'of', 'the', 'to', 'an'],
    },
    {
      id: 'spelling',
      label: 'Spelling Mistakes',
      icon: Type,
      color: '#7c3aed',
      bg: 'bg-purple-50',
      count: 12,
      items: ['facilites → facilities', 'emminent → eminent', 'resuling → resulting', 'including → included', 'insuffisrate → insufficient'],
    },
    {
      id: 'capital',
      label: 'Capitalisation',
      icon: AlertTriangle,
      color: '#0369a1',
      bg: 'bg-sky-50',
      count: 15,
      items: ['education → Education', 'department → Department', 'Might → might', 'Children → children', 'Tries → tries'],
    },
  ];

  const activeTabData = mistakeTabs.find((t) => t.id === activeTab);

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Live Demo
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">
            See{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Shorthandians
            </span>{' '}
            in Action
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Experience the power of our comprehensive stenography training platform with{' '}
            <span className="font-semibold text-[#1e3a8a]">real-time analysis</span>,{' '}
            <span className="font-semibold text-[#1e3a8a]">detailed feedback</span>, and{' '}
            <span className="font-semibold text-[#1e3a8a]">advanced performance tracking</span>.
          </p>
        </div>

        {/* Main Preview Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Card Header Bar */}
          <div className="bg-gradient-to-r from-[#0f2167] to-[#1e3a8a] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <div className="w-3 h-3 bg-amber-400 rounded-full" />
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
              <span className="text-white/80 text-sm font-semibold">Shorthandians · Typing Arena</span>
            </div>
            <div className="flex items-center space-x-2 text-white/60 text-xs font-medium">
              <Eye className="w-3.5 h-3.5" />
              <span>Result Preview</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">

            {/* Paragraph Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Original Paragraph */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center space-x-2 bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-700">Original Paragraph</span>
                </div>
                <div className="p-4 text-sm text-gray-700 leading-7 font-mono max-h-44 overflow-y-auto">
                  {ORIGINAL}
                </div>
              </div>

              {/* Comparison Result */}
              <div className="rounded-2xl border border-blue-200 overflow-hidden">
                <div className="flex items-center space-x-2 bg-blue-50 border-b border-blue-200 px-4 py-2.5">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-[#1e3a8a]">Comparison Result</span>
                </div>
                <div className="p-4 text-sm leading-7 font-mono max-h-44 overflow-y-auto">
                  {comparison.map((token, i) => {
                    const cls =
                      token.type === 'correct'
                        ? 'text-gray-700'
                        : token.type === 'capital'
                        ? 'bg-amber-100 text-amber-800 rounded px-0.5'
                        : 'bg-red-100 text-red-700 rounded px-0.5 line-through decoration-red-400';
                    return (
                      <span key={i} className={cls}>
                        {token.word}{' '}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Mistake Summary */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-5 py-3">
                <div>
                  <h4 className="font-black text-gray-800 text-sm">Mistake Summary</h4>
                  <p className="text-xs text-gray-400 font-medium">Comprehensive analysis of errors and corrections</p>
                </div>
                <button
                  className="flex items-center space-x-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm hover:shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Dictation Report</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {mistakeTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                        isActive
                          ? 'border-[#1e3a8a] text-[#1e3a8a] bg-blue-50/60'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span
                        className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{ background: tab.color }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content - before/after columns */}
              {activeTabData && (
                <div className="p-5">
                  {activeTabData.id === 'missing' || activeTabData.id === 'extra' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Original</p>
                        <MistakeList
                          items={activeTabData.items}
                          color={activeTabData.color}
                          bg={activeTabData.bg}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Typed</p>
                        <MistakeList
                          items={activeTabData.items.map((w) => '—')}
                          color="#9ca3af"
                          bg="bg-gray-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Incorrect</p>
                        <MistakeList
                          items={activeTabData.items.map((w) => w.split('→')[0].trim())}
                          color={activeTabData.color}
                          bg={activeTabData.bg}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Correct</p>
                        <MistakeList
                          items={activeTabData.items.map((w) => (w.includes('→') ? w.split('→')[1].trim() : w))}
                          color="#16a34a"
                          bg="bg-green-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-6 font-medium">
          🔒 Full result analysis is available after login — completely free for registered students.
        </p>
      </div>
    </section>
  );
};

export default LivePreviewSection;
