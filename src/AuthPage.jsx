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
        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d6e70]/25 focus:border-[#0d6e70] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d6e70]/25 focus:border-[#0d6e70] transition-all duration-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'login';
    const path = window.location.pathname;
    return (path === '/register' || path === '/signup') ? 'register' : 'login';
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const handlePop = () => {
      const p = window.location.pathname;
      if (p === '/register' || p === '/signup') {
        setTab('register');
      } else if (p === '/login') {
        setTab('login');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  React.useEffect(() => {
    const currentPath = window.location.pathname;
    const targetPath = tab === 'register' ? '/register' : '/login';
    if (currentPath !== targetPath && (currentPath === '/login' || currentPath === '/register' || currentPath === '/signup')) {
      window.history.pushState(null, '', targetPath);
    }
  }, [tab]);

  // ── Forgot password state ─────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // ── Login state ───────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ── Register state ────────────────────────────────────────────────────────
  // regStep: 'form' | 'pending'
  const [regStep, setRegStep] = useState('form');
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', state: '', city: '',
    gender: '', phone: '', email: '', password: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

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
    setForgotEmail('');
    setForgotSent(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN — Email + Password → Admin Guard
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const email = loginEmail.toLowerCase().trim();

    if (!email || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });
      if (authErr) throw authErr;

      // 2. Admin guard — fetch status from custom users table
      const { data: foundUser, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (fetchErr || !foundUser) {
        await supabase.auth.signOut();
        throw new Error('Account record not found. Please contact support.');
      }

      // 3. Status gate (Admins are permanently active and exempt)
      if (foundUser.role !== 'admin') {
        if (foundUser.status === 'pending') {
          await supabase.auth.signOut();
          throw new Error('Your account is pending admin approval. Please wait.');
        }
        if (foundUser.status === 'inactive') {
          await supabase.auth.signOut();
          throw new Error('Your account has been deactivated. Please contact support.');
        }

        const validUntil = foundUser.valid_until || (() => {
          if (foundUser.created_at) {
            const d = new Date(foundUser.created_at);
            d.setDate(d.getDate() + 29);
            return d.toISOString();
          }
          return null;
        })();
        if (validUntil && new Date(validUntil) < new Date()) {
          await supabase.auth.signOut();
          throw new Error('Your account has expired. Please renew your subscription to continue.');
        }
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
  // REGISTER STEP 1 — Validate form → supabase.auth.signUp (sends OTP email)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
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

      // signUp — Supabase registers the credentials in Auth
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

      // Insert active profile into custom users table directly with empty used_trials
      const { error: insertErr } = await supabase.from('users').insert([{
        first_name:  firstName.trim(),
        last_name:   lastName.trim(),
        state:       state.trim(),
        city:        city.trim(),
        gender:      gender,
        phone:       phone.trim(),
        email:       trimmedEmail,
        status:      'active',
        role:        'student',
        used_trials: [],
        joinedDate:  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at:  new Date().toISOString(),
      }]);

      if (insertErr) throw insertErr;

      // Log them in immediately
      const userData = {
        first_name:  firstName.trim(),
        last_name:   lastName.trim(),
        state:       state.trim(),
        city:        city.trim(),
        gender:      gender,
        phone:       phone.trim(),
        email:       trimmedEmail,
        status:      'active',
        role:        'student',
        used_trials: [],
        name:        `${firstName.trim()} ${lastName.trim()}`,
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
        style={{ background: 'linear-gradient(135deg, #07414e 0%, #0d6e70 50%, #0891b2 100%)' }}
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
          className="lg:hidden flex items-center space-x-2 text-gray-500 hover:text-[#0d6e70] transition-colors text-sm font-medium mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4" /><span>Back to Home</span>
        </button>

        <div className={`w-full transition-all duration-300 ${tab === 'register' ? 'max-w-4xl' : 'max-w-md'}`}>

          {/* ── Pending Approval Screen ─────────────────────────────────── */}
          {tab === 'register' && regStep === 'pending' ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-5 shadow-inner border-4 border-amber-200">
                <ShieldCheck className="w-12 h-12 text-amber-500" />
              </div>
              <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Registration Submitted!</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Account Pending Approval</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
                Your account details have been received. Your account is now{' '}
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
                className="w-full flex items-center justify-center space-x-2 bg-[#0d6e70] hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <BookOpen className="w-5 h-5" />
                <span>Go to Login</span>
              </button>
            </div>

          ) : (
            <>
              {/* ── Header ────────────────────────────────────────────── */}
              <div className="mb-8">
                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-[#0d6e70] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {tab === 'forgot'
                      ? 'Password Reset'
                      : tab === 'login'
                      ? 'Welcome Back!'
                      : regStep === 'otp'
                      ? 'Verify Your Email'
                      : '✨ Premium Access'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">
                  {tab === 'forgot'
                    ? (forgotSent ? 'Check Your Email!' : 'Forgot Password?')
                    : tab === 'login'
                    ? 'Sign In to Your Account'
                    : regStep === 'otp'
                    ? 'Check Your Inbox'
                    : 'Join Shorthandians Premium'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {tab === 'forgot'
                    ? (forgotSent
                        ? `A password reset link was sent to ${forgotEmail}. Click it to set your new password.`
                        : 'Enter your email and we\'ll send you a link to set your password.')
                    : tab === 'login'
                    ? 'Enter your email and password to continue.'
                    : regStep === 'otp'
                    ? `A 6-digit OTP was sent to ${regData.email}`
                    : 'Pay the one-time registration fee via UPI and send your payment screenshot to receive your login credentials.'}
                </p>
              </div>

              {/* ── Tab Switcher ───────────────────────────────────────── */}
              {regStep === 'form' && tab !== 'forgot' && (
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  {['login', 'register'].map((t) => (
                    <button
                      key={t}
                      onClick={() => switchTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        tab === t
                          ? 'bg-white text-[#0d6e70] shadow-md'
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
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    placeholder="your@email.com"
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
                        className="text-gray-400 hover:text-[#0d6e70] transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Admin approval notice */}
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>Login is only available after your account is approved by an administrator.</span>
                  </div>

                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-[#0d6e70] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading
                      ? <><Spinner /><span>Signing In…</span></>
                      : <><BookOpen className="w-5 h-5" /><span>Login</span></>}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => switchTab('register')}
                      className="text-gray-500 hover:text-[#0d6e70] font-bold hover:underline transition-colors"
                    >
                      Create a free account
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setForgotEmail(loginEmail); setError(''); }}
                      className="text-[#0d6e70] font-bold hover:underline transition-colors"
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
                        className="w-full flex items-center justify-center space-x-2 bg-[#0d6e70] hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
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
                        className="w-full flex items-center justify-center space-x-3 bg-[#0d6e70] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {loading
                          ? <><Spinner /><span>Sending…</span></>
                          : <><Mail className="w-5 h-5" /><span>Send Password Reset Link</span></>}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#0d6e70] font-bold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  REGISTER — PAYMENT & VERIFICATION UI
              ════════════════════════════════════════════════════════════ */}
              {!success && tab === 'register' && regStep === 'form' && (
                <form onSubmit={handleSignUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#0d6e70]" />
                      Personal Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        id="reg-first-name"
                        label="First Name"
                        icon={User}
                        placeholder="John"
                        value={regData.firstName}
                        onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                        required
                      />
                      <InputField
                        id="reg-last-name"
                        label="Last Name"
                        icon={User}
                        placeholder="Doe"
                        value={regData.lastName}
                        onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-phone"
                        label="Phone Number"
                        icon={Phone}
                        placeholder="10-digit number"
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                        required
                      />
                      <InputField
                        id="reg-email"
                        label="Gmail Address"
                        icon={Mail}
                        type="email"
                        placeholder="john.doe@gmail.com"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        required
                      />
                    </div>

                    <InputField
                      id="reg-password"
                      label="Choose Password"
                      icon={Lock}
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      required
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((v) => !v)}
                          className="text-gray-400 hover:text-[#0d6e70] transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        id="reg-state"
                        label="State"
                        icon={MapPin}
                        placeholder="e.g. UP"
                        value={regData.state}
                        onChange={(e) => setRegData({ ...regData, state: e.target.value })}
                        required
                      />
                      <InputField
                        id="reg-city"
                        label="City"
                        icon={Building}
                        placeholder="e.g. Prayagraj"
                        value={regData.city}
                        onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                        required
                      />
                    </div>

                    <SelectField
                      id="reg-gender"
                      label="Gender"
                      icon={Users}
                      value={regData.gender}
                      onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                      required
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                  </div>

                  {/* Right Column: Payment details */}
                  <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                      <span>💳</span>
                      UPI Payment & Activation
                    </h3>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#0d6e70]/30 to-indigo-400/30 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                        <div className="relative bg-white border-2 border-[#0d6e70]/20 rounded-2xl p-3 shadow-xl">
                          <img
                            src="/QRImage.jpeg"
                            alt="PhonePe Payment QR Code"
                            className="w-40 h-40 object-contain rounded-xl"
                          />
                        </div>
                      </div>
                      <p className="mt-3 text-xs font-black text-gray-800 tracking-widest uppercase">MR. AYUSH PANDEY</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Scan via PhonePe / Any UPI App</p>
                    </div>

                    {/* Pricing Info */}
                    <div className="bg-white border-2 border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <span>🏷️</span> Pricing Details
                      </p>
                      <ul className="space-y-1.5 text-xs font-bold text-gray-700">
                        <li className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <span>Allahabad High Court Formatting</span>
                          <span className="text-green-700 font-black">₹ 600</span>
                        </li>
                        <li className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <span>Pitman Shorthand</span>
                          <span className="text-green-700 font-black">₹ 600</span>
                        </li>
                        <li className="flex justify-between items-center bg-green-50 border border-green-200 px-3 py-2 rounded-lg mt-1 shadow-sm">
                          <span className="text-green-900 font-black">Both Modules (Combo)</span>
                          <span className="text-green-800 font-black text-sm">₹ 1100</span>
                        </li>
                      </ul>
                    </div>

                    {/* Step Instructions */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs font-medium">
                      <p className="font-black text-[#0d6e70] uppercase tracking-widest flex items-center gap-1">
                        <span>📋</span> Next Steps
                      </p>
                      <ul className="space-y-1.5 text-gray-600 list-decimal list-inside">
                        <li>Pay the fee by scanning the QR code above.</li>
                        <li>Take a screenshot of the payment.</li>
                        <li>Submit this form, and send the screenshot to us on WhatsApp to activate your account.</li>
                      </ul>
                    </div>

                    <button
                      id="register-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-3 bg-[#0d6e70] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-wider"
                    >
                      {loading
                        ? <><Spinner /><span>Signing Up…</span></>
                        : <><Sparkles className="w-5 h-5" /><span>Register & Request Activation</span></>}
                    </button>
                    
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchTab('login')} className="text-[#0d6e70] font-black hover:underline">Sign in</button>
                    </p>
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
