import React, { useState } from 'react';
import { 
  User, Lock, Phone, Mail, Eye, EyeOff, BookOpen, 
  ArrowLeft, CheckCircle, AlertCircle, Sparkles 
} from 'lucide-react';
import { supabase } from './supabaseClient';



// ─────────────────────────────────────────────────────────────────────────────
// Reusable Input Field
// ─────────────────────────────────────────────────────────────────────────────
const InputField = ({ id, label, icon: Icon, type = 'text', placeholder, value, onChange, required, rightElement }) => (
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
        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/25 focus:border-[#1e3a8a] transition-all duration-200"
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth Page
// ─────────────────────────────────────────────────────────────────────────────
const AuthPage = ({ onAuthSuccess, onBack }) => {
  // Views: 'login' | 'register' | 'forgot'
  const [tab, setTab] = useState('login'); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  // Register form
  const [regData, setRegData] = useState({ name: '', phone: '', email: '', password: '' });
  // Forgot password
  const [forgotPhone, setForgotPhone] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const inputId = loginData.phone.trim();
    const inputPass = loginData.password.trim();

    if (!inputId || !inputPass) {
      setError('Please enter both phone and password.');
      return;
    }
    setLoading(true);

    try {
      // ── Admin check FIRST ──
      const isAdminPrimary = (inputId === '9999999999' || inputId.toLowerCase() === 'admin');
      if (isAdminPrimary && inputPass === 'admin123') {
        const adminData = { name: 'Administrator', phone: inputId, role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(adminData));
        setSuccess(true);
        setTimeout(() => onAuthSuccess(adminData), 1000);
        return;
      }

      // ── Supabase student login ──
      const { data: foundUser, error: loginErr } = await supabase
        .from('users')
        .select('*')
        .eq('phone', inputId)
        .eq('password', inputPass)
        .single();

      if (loginErr || !foundUser) {
        throw new Error('Invalid credentials. Please check your phone and password.');
      }

      const userData = { ...foundUser, role: 'student' };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      setSuccess(true);
      setTimeout(() => onAuthSuccess(userData), 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const { name, phone, email, password } = regData;

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);

    try {
      // Check if phone or email already exists in Supabase
      const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).single();
      if (existing) {
        throw new Error('An account with this phone number already exists.');
      }

      const newUser = { 
        name: name.trim(), 
        phone: phone.trim(), 
        email: email?.toLowerCase().trim(), 
        password: password.trim(),
        joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: new Date().toISOString()
      };
      const { data: inserted, error: regErr } = await supabase.from('users').insert([newUser]).select().single();
      if (regErr) throw regErr;
      
      const userData = { ...newUser, ...(inserted || {}), role: 'student' };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      setSuccess(true);
      setTimeout(() => onAuthSuccess(userData), 1000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = (e) => {
    e.preventDefault();
    if (!forgotPhone.trim()) {
      setError('Please enter your registered phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('auth_users') || '[]');
      const userExists = users.some(u => u.phone.trim() === forgotPhone.trim());
      
      if (!userExists) {
        setLoading(false);
        setError('No account found with this phone number.');
        return;
      }

      // Add to admin requests
      const requests = JSON.parse(localStorage.getItem('auth_reset_requests') || '[]');
      if (!requests.some(r => r.phone === forgotPhone.trim())) {
        const newReq = {
          id: Date.now(),
          phone: forgotPhone.trim(),
          timestamp: new Date().toLocaleString(),
          status: 'pending'
        };
        localStorage.setItem('auth_reset_requests', JSON.stringify([...requests, newReq]));
      }

      setLoading(false);
      setResetSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Left Panel (Branding) ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1e3a8a 50%, #1a56db 100%)' }}
      >
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors text-sm font-medium mb-14">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center font-black text-blue-900 text-2xl shadow-lg">S</div>
            <span className="text-3xl font-black text-white tracking-tight">Shorthandians</span>
          </div>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            India's premier platform for SSC & High Court steno exam preparation.
          </p>
        </div>

        {/* Feature bullets */}
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

      {/* ── Right Panel (Form) ────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="lg:hidden flex items-center space-x-2 text-gray-500 hover:text-[#1e3a8a] transition-colors text-sm font-medium mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-[#1e3a8a] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tab === 'login' ? 'Welcome Back!' : 'Join for Free'}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">
              {tab === 'login' ? 'Sign In to Your Account' : 'Create Your Account'}
            </h1>
            <p className="text-gray-500 text-sm">
              {tab === 'login'
                ? 'Enter your credentials to access the dashboard.'
                : 'Start your steno journey with Shorthandians today.'}
            </p>
          </div>

          {/* Tab switcher */}
          {tab !== 'forgot' && (
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setSuccess(false); setResetSuccess(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    tab === t
                      ? 'bg-white text-[#1e3a8a] shadow-md'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'login' ? '🔐 Login' : '✨ Register'}
                </button>
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success overlay */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {tab === 'login' ? 'Welcome back!' : 'Account created!'}
              </h3>
              <p className="text-gray-500 text-sm">Redirecting you to the dashboard…</p>
            </div>
          ) : tab === 'login' ? (
            /* ── Login Form ── */
            <form onSubmit={handleLogin} className="space-y-5">
              <InputField
                id="login-phone"
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={loginData.phone}
                onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                required
              />
              <InputField
                id="login-password"
                label="Password (optional for students)"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Admin requires password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer py-1">
                  <input type="checkbox" className="w-4 h-4 accent-[#1e3a8a]" />
                  <span className="text-gray-600 font-medium">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => { setTab('forgot'); setError(''); }}
                  className="text-[#1e3a8a] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg><span>Signing in…</span></>
                ) : (
                  <><BookOpen className="w-5 h-5" /><span>Sign In</span></>
                )}
              </button>
              <p className="text-center text-sm text-gray-500">
                New here?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-[#1e3a8a] font-bold hover:underline">
                  Create a free account
                </button>
              </p>
            </form>
          ) : tab === 'forgot' ? (
            /* ── Forgot Password Form ── */
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {resetSuccess ? (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Administrator has been notified. Your password will be reset shortly. Please contact support if you don't receive an update.
                  </p>
                  <button
                    onClick={() => { setTab('login'); setResetSuccess(false); }}
                    className="w-full bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotRequest} className="space-y-6">
                  <InputField
                    id="forgot-phone"
                    label="Registered Phone Number"
                    icon={Phone}
                    type="tel"
                    placeholder="Enter your phone to reset"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    required
                  />
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Note:</strong> For security reasons, password resets require administrator approval. 
                      Once submitted, the admin will verify your identity.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300"
                  >
                    {loading ? (
                      <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg><span>Submitting…</span></>
                    ) : (
                      <><span>Submit Reset Request</span></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="w-full text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
                  >
                    Cancel and Return
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ── Register Form ── */
            /* ... existing register form ... */
            <form onSubmit={handleRegister} className="space-y-5">
              <InputField
                id="reg-name"
                label="Full Name"
                icon={User}
                placeholder="Your full name"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                required
              />
              <InputField
                id="reg-phone"
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                required
              />
              <InputField
                id="reg-email"
                label="Email (optional)"
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              />
              <InputField
                id="reg-password"
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                required
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <p className="text-xs text-gray-400">
                By registering, you agree to our{' '}
                <span className="text-[#1e3a8a] font-semibold cursor-pointer hover:underline">Terms of Service</span>.
              </p>
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg><span>Creating account…</span></>
                ) : (
                  <><Sparkles className="w-5 h-5" /><span>Create Free Account</span></>
                )}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-[#1e3a8a] font-bold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
