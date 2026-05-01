import React, { useEffect } from 'react';
import { Lock, X, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

const LoginRequiredModal = ({ onLogin, onRegister, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 20, 60, 0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-modal-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top gradient banner */}
        <div
          className="px-8 pt-10 pb-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 60%, #1a56db 100%)' }}
        >
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Lock icon */}
          <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 bg-white/15 border border-white/25 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 relative z-10">Login Required</h2>
          <p className="text-blue-200 text-sm leading-relaxed relative z-10">
            This content is protected. Please sign in or create a free account to access
            the courses and practice tools.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          {/* Feature teaser */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6">
            <div className="flex items-center space-x-2 text-[#1e3a8a] font-bold text-sm mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>What you'll unlock after signing in:</span>
            </div>
            <ul className="space-y-2">
              {[
                '⚡ Real-time WPM tracking & dictation practice',
                '⚖️ High Court formatting & Pitman exercises',
                '📊 Detailed result analysis after every test',
                '🎙️ Audio speed control from 0.7× to 1.2×',
              ].map((item) => (
                <li key={item} className="text-gray-600 text-xs font-medium">{item}</li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              id="modal-login-btn"
              onClick={onLogin}
              className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
            <button
              id="modal-register-btn"
              onClick={onRegister}
              className="w-full flex items-center justify-center space-x-3 bg-amber-400 hover:bg-amber-300 text-blue-900 font-black py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account</span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Registration is <span className="font-bold text-green-600">100% free</span> — no credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
