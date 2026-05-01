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

  // ── Register state ────────────────────────────────────────────────────────
  // regStep: 'form' | 'otp' | 'pending'
  const [regStep, setRegStep] = useState('form');
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', state: '', city: '',
    gender: '', phone: '', email: '', password: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(0);

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
    setRegStep('form');
    setOtpCode('');
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
  // REGISTER — Validate form → supabase.auth.signUp (Log in directly)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const { firstName, lastName, state, city, gender, phone, email, password } = regData;

    if (!firstName.trim() || !lastName.trim() || !state.trim() || !city.trim() ||
      !gender || !phone.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.toLowerCase().trim();

      // Check for duplicate phone / email
      const { data: existingPhone } = await supabase
        .from('users').select('id').eq('phone', phone.trim()).maybeSingle();
      if (existingPhone) throw new Error('An account with this phone number already exists.');

      const { data: existingEmail } = await supabase
        .from('users').select('id').eq('email', trimmedEmail).maybeSingle();
      if (existingEmail) throw new Error('An account with this email already exists.');

      // signUp
      const { error: signUpErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpErr) throw signUpErr;

      // Insert profile into custom users table as ACTIVE
      const { error: insertErr } = await supabase.from('users').insert([{
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        state: state.trim(),
        city: city.trim(),
        gender: gender,
        phone: phone.trim(),
        email: trimmedEmail,
        status: 'active',
        role: 'student',
        joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: new Date().toISOString(),
      }]);

      if (insertErr) throw insertErr;

      const userData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        state: state.trim(),
        city: city.trim(),
        gender: gender,
        phone: phone.trim(),
        email: trimmedEmail,
        status: 'active',
        role: 'student',
        name: `${firstName.trim()} ${lastName.trim()}`.trim()
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      setSuccess(true);
      setTimeout(() => onAuthSuccess(userData), 1000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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

          {/* ── Pending Approval Screen ─────────────────────────────────── */}
          {tab === 'register' && regStep === 'pending' ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-5 shadow-inner border-4 border-amber-200">
                <ShieldCheck className="w-12 h-12 text-amber-500" />
              </div>
              <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Email Verified Successfully!</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Account Created!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
                Your email has been verified. Your account is now{' '}
                <strong className="text-amber-600">pending admin approval</strong>.
                You will be able to log in once an administrator activates your account.
              </p>

              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-6">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> What happens next?
                </p>
                <ul className="text-sm text-amber-800 space-y-2 font-medium">
                  <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Admin reviews your registration details</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Your account status is updated to Active</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5">•</span>You can then log in with your email & password</li>
                </ul>
              </div>

              <button
                onClick={() => switchTab('login')}
                className="w-full flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <BookOpen className="w-5 h-5" />
                <span>Go to Login</span>
              </button>
            </div>

          ) : (
            <>
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
                    : tab === 'login'
                      ? 'Sign In to Your Account'
                      : 'Create Your Account'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {tab === 'forgot'
                    ? (forgotSent
                      ? `A password reset link was sent to ${forgotEmail}. Click it to set your new password.`
                      : 'Enter your email and we\'ll send you a link to set your password.')
                    : tab === 'login'
                      ? 'Enter your email or phone and password to continue.'
                      : 'Fill in your details to get started.'}
                </p>
              </div>

              {/* ── Tab Switcher ───────────────────────────────────────── */}
              {regStep === 'form' && tab !== 'forgot' && (
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  {['login', 'register'].map((t) => (
                    <button
                      key={t}
                      onClick={() => switchTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === t
                        ? 'bg-white text-[#1e3a8a] shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {t === 'login' ? '🔐 Login' : '✨ Register'}
                    </button>
                  ))}
                </div>
              )}

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
                    <button
                      type="button"
                      onClick={() => switchTab('register')}
                      className="text-gray-500 hover:text-[#1e3a8a] font-bold hover:underline transition-colors"
                    >
                      Create a free account
                    </button>
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

              {/* ══════════════════════════════════════════════════════════
                  REGISTER — STEP 1: Fill form + Send OTP
              ════════════════════════════════════════════════════════════ */}
              {!success && tab === 'register' && regStep === 'form' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField id="reg-first-name" label="First Name" icon={User} placeholder="First name"
                      value={regData.firstName} onChange={(e) => setRegData({ ...regData, firstName: e.target.value })} required />
                    <InputField id="reg-last-name" label="Last Name" icon={User} placeholder="Last name"
                      value={regData.lastName} onChange={(e) => setRegData({ ...regData, lastName: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField id="reg-state" label="State" icon={MapPin} placeholder="Your state"
                      value={regData.state} onChange={(e) => setRegData({ ...regData, state: e.target.value })} required />
                    <InputField id="reg-city" label="City" icon={Building} placeholder="Your city"
                      value={regData.city} onChange={(e) => setRegData({ ...regData, city: e.target.value })} required />
                  </div>

                  <SelectField id="reg-gender" label="Gender" icon={Users}
                    value={regData.gender} onChange={(e) => setRegData({ ...regData, gender: e.target.value })} required
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />

                  <InputField id="reg-phone" label="Phone Number" icon={Phone} type="tel"
                    placeholder="e.g. 9876543210"
                    value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} required />

                  <InputField id="reg-email" label="Email Address" icon={Mail} type="email"
                    placeholder="you@gmail.com"
                    value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} required />

                  <InputField
                    id="reg-password"
                    label="Create Password"
                    icon={Lock}
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((v) => !v)}
                        className="text-gray-400 hover:text-[#1e3a8a] transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* OTP notice */}
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium">
                    <User className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <span>Create an account to start your journey. You will be automatically logged in after registration.</span>
                  </div>

                  <p className="text-xs text-gray-400">
                    By registering, you agree to our{' '}
                    <span className="text-[#1e3a8a] font-semibold cursor-pointer hover:underline">Terms of Service</span>.
                  </p>

                  <button
                    id="reg-send-otp-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading
                      ? <><Spinner /><span>Creating Account…</span></>
                      : <><User className="w-5 h-5" /><span>Create Account</span></>}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchTab('login')} className="text-[#1e3a8a] font-bold hover:underline">Sign in</button>
                  </p>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════
                  REGISTER — STEP 2: Enter OTP
              ════════════════════════════════════════════════════════════ */}
              {!success && tab === 'register' && regStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">

                  {/* Email display card */}
                  <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">OTP sent to</p>
                      <p className="text-sm font-black text-[#1e3a8a] break-all">{regData.email}</p>
                      <p className="text-xs text-gray-500">Check your inbox (and spam folder)</p>
                    </div>
                  </div>

                  {/* OTP input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      OTP Code (6 digits) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="• • • • • •"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                        className="w-full pl-11 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-black text-center text-gray-900 tracking-[0.5em] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/25 focus:border-[#1e3a8a] transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-center">OTP expires in 5 minutes</p>
                  </div>

                  <button
                    id="verify-otp-btn"
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading
                      ? <><Spinner /><span>Verifying…</span></>
                      : <><ShieldCheck className="w-5 h-5" /><span>Verify & Create Account</span></>}
                  </button>

                  {/* Resend + change email */}
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setRegStep('form'); setOtpCode(''); setError(''); }}
                      className="text-gray-400 hover:text-gray-600 font-bold transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Change Details
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || otpResendTimer > 0}
                      className="text-[#1e3a8a] font-bold hover:underline disabled:text-gray-300 disabled:no-underline transition-colors"
                    >
                      {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
