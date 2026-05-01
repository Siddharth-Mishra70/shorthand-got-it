import React, { useEffect, useRef } from 'react';
import { ArrowRight, Star, Users, Award, ChevronDown } from 'lucide-react';

const StatBadge = ({ value, label }) => (
  <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/15 transition-colors duration-300">
    <span className="text-3xl font-black text-white leading-none">{value}</span>
    <span className="text-white/75 text-xs font-medium mt-1 text-center leading-snug">{label}</span>
  </div>
);

const HeroSection = ({ onJoinNow }) => {
  const headlineRef = useRef(null);

  useEffect(() => {
    // Staggered reveal animation
    const el = headlineRef.current;
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100);
    }
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 45%, #1a56db 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>

      {/* Main Hero Content */}
      <div ref={headlineRef} className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-28 pb-16">
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold px-5 py-2 rounded-full mb-8 shadow-lg animate-pulse-slow">
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>India's #1 Shorthand Coaching Platform</span>
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
        </div>

        {/* Main Headline */}
        <h1 className="hero-headline text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Crack{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}>
            SSC & High Court
          </span>{' '}
          <br className="hidden sm:block" />
          Steno Exams with{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #93c5fd, #60a5fa)' }}>
            Shorthandians
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-4 leading-relaxed">
          Master Pitman Shorthand, dictation speed, and court formatting — all in one powerful platform.
        </p>

        {/* Mentor Byline */}
        <div className="inline-flex items-center space-x-3 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full mb-10">
          <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center font-black text-blue-900 text-xs">
            AP
          </div>
          <span className="text-white/90 text-sm font-medium">
            Under the guidance of{' '}
            <span className="font-bold text-white">Ayush Pandey</span>
          </span>
          <Award className="w-4 h-4 text-amber-300" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            id="join-now-btn"
            onClick={onJoinNow}
            className="group relative overflow-hidden bg-amber-400 hover:bg-amber-300 text-blue-900 font-black px-10 py-4 rounded-full text-lg shadow-2xl shadow-amber-500/30 hover:shadow-amber-400/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center space-x-3"
          >
            <span>Join Now — It's Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <button className="group flex items-center space-x-2 text-white/85 font-semibold hover:text-white transition-colors duration-200 px-6 py-4">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 group-hover:border-white/80 flex items-center justify-center transition-colors duration-200">
              <ArrowRight className="w-4 h-4 rotate-0" />
            </div>
            <span>Explore Courses</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-xl mx-auto">
          <StatBadge value="5000+" label="Students Trained" />
          <StatBadge value="95%" label="Success Rate" />
          <StatBadge value="50+" label="Practice Tests" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 animate-bounce">
        <span className="text-xs font-medium mb-1 tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5" />
      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0,80 C360,20 1080,20 1440,80 L1440,80 L0,80 Z"
            fill="#f3f4f6"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
