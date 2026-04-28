import React, { useState } from 'react';
import {
  User, Lock, Phone, Mail, BookOpen,
  ArrowLeft, CheckCircle, AlertCircle, Sparkles, MapPin, Building, Users,
  KeyRound, ShieldCheck, Clock, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Input Field
// ─────────────────────────────────────────────────────────────────────────────
const InputField = ({
  id, label, icon: Icon, type = 'text', placeholder,
  value, onChange, required, rightElement, disabled,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/25 focus:border-[#1e3a8a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
  </div>
);

const SelectField = ({ id, label, icon: Icon, value, onChange, required, options, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/25 focus:border-[#1e3a8a] transition-all duration-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled>Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

// ── Spinner helper ────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth Page
// ─────────────────────────────────────────────────────────────────────────────
const AuthPage = ({ onAuthSuccess, onBack }) => {
  // 'login' | 'register' | 'forgot'
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ── Forgot password state ─────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // ── Login state ───────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);



  // ── Helpers ───────────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setOtpResendTimer(60);
    const iv = setInterval(() => {
      setOtpResendTimer((t) => {
        if (t <= 1) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccess(false);
    setForgotEmail('');
    setForgotSent(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN — Email + Password → Admin Guard
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const identifier = loginEmail.toLowerCase().trim();

    if (!identifier || !loginPassword) {
      setError('Please enter your email or phone and password.');
      return;
    }

    setLoading(true);
    try {
      // --- Hardcoded Admin Bypass ---
      if (identifier === '9999999999' && loginPassword === 'admin123') {
        const adminUser = {
          role: 'admin',
          first_name: 'Admin',
          name: 'Admin',
          status: 'active',
          phone: '9999999999'
        };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        setSuccess(true);
        setTimeout(() => onAuthSuccess(adminUser), 1000);
        return;
      }

      let emailForAuth = identifier;

      // If identifier looks like a phone number, lookup email
      if (/^\d{10}$/.test(identifier)) {
        const { data: userByPhone, error: phoneErr } = await supabase
          .from('users')
          .select('email')
          .eq('phone', identifier)
          .maybeSingle();

        if (!phoneErr && userByPhone?.email) {
          emailForAuth = userByPhone.email;
        } else {
          throw new Error('Account with this phone number not found.');
        }
      }

      // 1. Sign in with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password: loginPassword,
      });
      if (authErr) throw authErr;

      // 2. Admin guard — fetch status from custom users table
      const { data: foundUser, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', emailForAuth)
        .maybeSingle();

      if (fetchErr || !foundUser) {
        await supabase.auth.signOut();
        throw new Error('Account record not found. Please contact support.');
      }


      if (foundUser.status === 'inactive') {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // 4. Active — proceed
      const userData = {
        ...foundUser,
        role: foundUser.role || 'student',
        name: foundUser.first_name
          ? `${foundUser.first_name} ${foundUser.last_name || ''}`.trim()
          : foundUser.name || 'Student',
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      setSuccess(true);
      setTimeout(() => onAuthSuccess(userData), 1000);
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        // Could be wrong password OR existing OTP-only account with no password set
        setError('INVALID_CREDENTIALS');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — sends Supabase password-reset link
  // ─────────────────────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    const email = forgotEmail.toLowerCase().trim();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetErr) throw resetErr;
      setForgotSent(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 50%, #1a56db 100%)' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors text-sm font-medium mb-14">
            <ArrowLeft className="w-4 h-4" /><span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center font-black text-blue-900 text-2xl shadow-lg">S</div>
            <span className="text-3xl font-black text-white tracking-tight">Shorthandians</span>
          </div>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            India's premier platform for SSC & High Court steno exam preparation.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {[
            { icon: '⚡', text: 'Real-time WPM tracking & speed analysis' },
            { icon: '🎙️', text: 'Audio speed control from 0.7× to 1.2×' },
            { icon: '⚖️', text: 'High Court formatting & Pitman exercises' },
            { icon: '📊', text: 'Detailed accuracy reports after every test' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center space-x-4">
              <span className="text-2xl">{icon}</span>
              <span className="text-white/80 text-sm font-medium">{text}</span>
            </div>
          ))}

          <div className="pt-6 border-t border-white/15 mt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center font-black text-blue-900 text-sm shadow">AP</div>
              <div>
                <p className="text-white font-bold text-sm">Ayush Pandey</p>
                <p className="text-blue-300 text-xs">Director, Shorthandians · Prayagraj</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 overflow-y-auto">
        <button
          onClick={onBack}
          className="lg:hidden flex items-center space-x-2 text-gray-500 hover:text-[#1e3a8a] transition-colors text-sm font-medium mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4" /><span>Back to Home</span>
        </button>

        <div className="w-full max-w-md">


              {/* ── Header ────────────────────────────────────────────── */}
              <div className="mb-8">
                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-[#1e3a8a] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {tab === 'forgot'
                      ? 'Password Reset'
                      : tab === 'login'
                        ? 'Welcome Back!'
                        : 'Join for Free'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">
                  {tab === 'forgot'
                    ? (forgotSent ? 'Check Your Email!' : 'Forgot Password?')
                    : 'Sign In to Your Account'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {tab === 'forgot'
                    ? (forgotSent
                      ? `A password reset link was sent to ${forgotEmail}. Click it to set your new password.`
                      : 'Enter your email and we\'ll send you a link to set your password.')
                    : 'Enter your email or phone and password to continue.'}
                </p>
              </div>



              {/* ── Error ─────────────────────────────────────────────── */}
              {error && error !== 'INVALID_CREDENTIALS' && (
                <div className="flex items-start space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {error === 'INVALID_CREDENTIALS' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium space-y-2">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Incorrect email or password.</span>
                  </div>
                  <p className="text-xs text-red-600 pl-7">
                    If you registered before this update, you may not have a password yet.{' '}
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setForgotEmail(loginEmail); setError(''); }}
                      className="font-black underline hover:text-red-800 transition-colors"
                    >
                      Click here to set your password →
                    </button>
                  </p>
                </div>
              )}

              {/* ── Login Success overlay ──────────────────────────────── */}
              {success && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Welcome back!</h3>
                  <p className="text-gray-500 text-sm">Redirecting you to the dashboard…</p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  LOGIN FORM — Email + Password
              ════════════════════════════════════════════════════════════ */}
              {!success && tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <InputField
                    id="login-email"
                    label="Email Address or Phone"
                    icon={Mail}
                    type="text"
                    placeholder="your@email.com or phone number"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />

                  <InputField
                    id="login-password"
                    label="Password"
                    icon={Lock}
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="text-gray-400 hover:text-[#1e3a8a] transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />



                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading
                      ? <><Spinner /><span>Signing In…</span></>
                      : <><BookOpen className="w-5 h-5" /><span>Login</span></>}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <div></div>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setForgotEmail(loginEmail); setError(''); }}
                      className="text-[#1e3a8a] font-bold hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════
                  FORGOT PASSWORD
              ════════════════════════════════════════════════════════════ */}
              {!success && tab === 'forgot' && (
                <div className="space-y-5">
                  {forgotSent ? (
                    <div className="text-center py-4 space-y-5">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-green-100">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-left text-sm text-blue-800 space-y-2">
                        <p className="font-black text-blue-900">What to do next:</p>
                        <ol className="list-decimal list-inside space-y-1.5 font-medium">
                          <li>Open the reset email sent to <strong>{forgotEmail}</strong></li>
                          <li>Click the link inside — it will open a page to set your new password</li>
                          <li>Come back here and log in with your new password</li>
                        </ol>
                      </div>
                      <button
                        onClick={() => switchTab('login')}
                        className="w-full flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Login</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>
                          If you registered before our password update, your account has no password yet.
                          Enter your email below to receive a secure link to set one.
                        </span>
                      </div>
                      <InputField
                        id="forgot-email"
                        label="Registered Email Address"
                        icon={Mail}
                        type="email"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                      <button
                        id="forgot-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {loading
                          ? <><Spinner /><span>Sending…</span></>
                          : <><Mail className="w-5 h-5" /><span>Send Password Reset Link</span></>}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#1e3a8a] font-bold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                      </button>
                    </form>
                  )}
                </div>
              )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
