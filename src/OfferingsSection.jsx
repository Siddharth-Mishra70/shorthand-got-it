import React from 'react';
import {
  BookOpen,
  Scale,
  FileCheck2,
  PenTool,
  Volume2,
  Headphones,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
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
      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor} shadow-sm border border-black/5`}>
        <Sparkles className="w-3 h-3" />
        <span>{badge}</span>
      </div>
    </div>

    {/* Icon + Title */}
    <div className="px-6 pt-4 pb-2">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e3a8a]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
        <Icon className="w-7 h-7 text-[#1e3a8a]" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2 leading-snug group-hover:text-[#1e3a8a] transition-colors">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{description}</p>
    </div>

    {/* Highlights list */}
    <div className="px-6 pb-2 flex-1">
      <ul className="space-y-2">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-center space-x-2 text-xs font-bold text-gray-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3a8a] flex-shrink-0" />
            <span className="truncate">{h}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* CTA */}
    <div className="px-6 pb-6 pt-5">
      <button
        onClick={onStart}
        className="w-full group/btn flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 uppercase text-xs tracking-widest"
      >
        <span>Enroll Now</span>
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────────────────────────
const OfferingsSection = ({ onNavigate }) => {
  const offerings = [
    {
      icon: Scale,
      title: 'High Court Legal',
      description: 'Court-specific dictations & legal vocabulary builder for High Court Steno exams.',
      badge: 'PREMIUM',
      badgeColor: 'bg-amber-100 text-amber-700',
      gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
      highlights: ['Legal Formatter', 'Court Vocabulary', 'Judicial Judgements'],
      view: 'formatting',
    },
    {
      icon: PenTool,
      title: 'Pitman Exercises',
      description: 'Step-by-step practice for basic and advanced Pitman exercises to build foundational speed.',
      badge: 'PAID',
      badgeColor: 'bg-amber-100 text-amber-700',
      gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
      highlights: ['Pitman Mastery', 'Stroke Comparison', 'Speed Drills'],
      view: 'pitman',
    },
  ];

  return (
    <section id="courses" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-black tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Practice Portal Courses
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Explore All Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Practice Modules
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Every module available in the student portal is now listed here. 
            Choose your specialization and start practicing like a professional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {offerings.map((o, i) => (
            <OfferingCard
              key={i}
              {...o}
              onStart={() => onNavigate(o.view)}
            />
          ))}
        </div>

        {/* ── Bottom CTA Banner ──────────────────────────────── */}
        <div className="mt-20 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#0f2167] via-[#1e3a8a] to-[#1a56db] p-10 sm:p-14 text-center shadow-2xl">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
              Ready to Ace Your Shorthand Exam?
            </h3>
            <p className="text-blue-100/75 text-lg mb-10 max-w-xl mx-auto font-medium">
              Join 10,000+ students already using our portal to build speed and accuracy every single day.
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="group inline-flex items-center space-x-3 bg-white text-[#1e3a8a] hover:bg-amber-400 hover:text-blue-900 font-black px-12 py-5 rounded-2xl text-lg shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
            >
              <span>Go to Full Student Portal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferingsSection;
