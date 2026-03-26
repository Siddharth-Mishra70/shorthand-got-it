import React from 'react';
import {
  BookOpen,
  Scale,
  FileCheck2,
  PenTool,
  Gauge,
  Volume2,
  LayoutTemplate,
  BarChart3,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Offering Card
// ─────────────────────────────────────────────────────────────────────────────
const OfferingCard = ({ icon: Icon, title, description, badge, badgeColor, highlights, gradient, onStart }) => (
  <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-400 overflow-hidden flex flex-col">
    {/* Top gradient bar */}
    <div className={`h-1.5 w-full ${gradient}`}></div>

    {/* Badge */}
    <div className="px-6 pt-5 pb-0 flex items-start justify-between">
      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
        <Sparkles className="w-3 h-3" />
        <span>{badge}</span>
      </div>
    </div>

    {/* Icon + Title */}
    <div className="px-6 pt-4 pb-2">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e3a8a]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-[#1e3a8a]" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2 leading-snug">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">{description}</p>
    </div>

    {/* Highlights list */}
    <div className="px-6 pb-2 flex-1">
      <ul className="space-y-2">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* CTA */}
    <div className="px-6 pb-6 pt-5">
      <button
        onClick={onStart}
        className="w-full group/btn flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>Start Practising</span>
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Feature Tile
// ─────────────────────────────────────────────────────────────────────────────
const FeatureTile = ({ icon: Icon, title, description, color, bgColor }) => (
  <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-7 h-7 ${color}`} />
    </div>
    <div>
      <h4 className="font-black text-gray-900 text-base mb-1">{title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────────────────────────
const OfferingsSection = ({ onNavigate }) => {
  const offerings = [
    {
      icon: BookOpen,
      title: 'Kailash Chandra Volumes',
      description:
        'Complete Vol. 1–24 dictation series with real-time WPM tracking and instant result analysis.',
      badge: 'FREE',
      badgeColor: 'bg-green-100 text-green-700',
      gradient: 'bg-gradient-to-r from-green-400 to-emerald-500',
      highlights: [
        'All 24 volumes covered',
        'Speed range: 80–180 WPM',
        'Instant transcript comparison',
      ],
      view: 'arena',
    },
    {
      icon: Scale,
      title: 'Legal Dictations',
      description:
        'Court-specific dictation material curated for High Court Steno exams like Patna, Allahabad & more.',
      badge: 'PREMIUM',
      badgeColor: 'bg-amber-100 text-amber-700',
      gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
      highlights: [
        'Patna, Allahabad HC material',
        'High Court formatting tools',
        'Judicial vocabulary builder',
      ],
      view: 'formatting',
    },
    {
      icon: FileCheck2,
      title: 'SSC Mock Tests',
      description:
        'Full-length SSC Grade C & D mock tests with timed sessions and detailed performance breakdown.',
      badge: 'PREMIUM',
      badgeColor: 'bg-amber-100 text-amber-700',
      gradient: 'bg-gradient-to-r from-purple-400 to-indigo-500',
      highlights: [
        'SSC Grade C & D pattern',
        'Timed exam simulation',
        'Accuracy & error breakdown',
      ],
      view: 'arena',
    },
    {
      icon: PenTool,
      title: 'Pitman Exercises',
      description:
        'Structured Pitman shorthand exercises with stroke-by-stroke guidance for rapid speed building.',
      badge: 'FREE',
      badgeColor: 'bg-green-100 text-green-700',
      gradient: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      highlights: [
        'Exercise 110 & beyond',
        'Pitman stroke images',
        'Progress-based unlocking',
      ],
      view: 'pitman',
    },
  ];

  const features = [
    {
      icon: Gauge,
      title: 'Real-time WPM Tracking',
      description:
        'Live words-per-minute counter updates as you type so you always know exactly how fast you are going.',
      color: 'text-[#1e3a8a]',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Volume2,
      title: 'Audio Speed Control (0.7× – 1.2×)',
      description:
        'Fine-tune playback speed to build comfort at slower paces and push limits at faster ones.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: LayoutTemplate,
      title: 'High Court Formatting Tools',
      description:
        'Built-in court transcript formatter that checks margins, indentation, and judicial language standards.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: BarChart3,
      title: 'Detailed Result Analysis',
      description:
        'Get word-level accuracy reports, error heatmaps, and trend graphs after every practice session.',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <section id="courses" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Section Header ─────────────────────────────────── */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            What We Offer
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Ace Steno
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Curated content, powerful tools, and expert guidance — all in one platform built
            exclusively for steno aspirants.
          </p>
        </div>

        {/* ── Offering Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-24">
          {offerings.map((o, i) => (
            <OfferingCard
              key={i}
              {...o}
              onStart={() => onNavigate(o.view)}
            />
          ))}
        </div>

        {/* ── Features Divider ───────────────────────────────── */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Built for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Serious Aspirants
            </span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Every feature is designed to accelerate your steno speed and accuracy.
          </p>
        </div>

        {/* ── Features Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <FeatureTile key={i} {...f} />
          ))}
        </div>

        {/* ── Bottom CTA Banner ──────────────────────────────── */}
        <div className="mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f2167] via-[#1e3a8a] to-[#1a56db] p-10 sm:p-14 text-center shadow-2xl">
          {/* decorative orbs */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Ready to Start Your Journey?
            </h3>
            <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto">
              Join 5,000+ students who are already practising daily on Shorthandians.
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center space-x-3 bg-amber-400 hover:bg-amber-300 text-blue-900 font-black px-10 py-4 rounded-full text-lg shadow-xl hover:shadow-amber-400/40 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OfferingsSection;
