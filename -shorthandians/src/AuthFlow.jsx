import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, User, Phone, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Clock, Loader2, Sparkles, 
  BookOpen, ArrowLeft, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ─── Shared Components ────────────────────────────────────────────────────────

const Input = ({ label, icon: Icon, type = 'text', placeholder, value, onChange, required, rightElement }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-gray-700 block px-1 capitalize">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all duration-300"
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

const Alert = ({ type, message }) => {
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
      isError ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
    }`}>
      {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Clock className="w-5 h-5 shrink-0" />}
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AuthFlow = ({ onAuthSuccess, onBack }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'otp' | 'pending'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    loginIdentifier: '', // Email
  });
  
  const [otpToken, setOtpToken] = useState('');

  const clearMessages = () => setError('');

  // 1. REGISTRATION logic
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      // Step A: Supabase Auth Sign Up
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            full_name: formData.name,
            phone: formData.phone 
          }
        }
      });

      if (signUpErr) throw signUpErr;

      // Ensure user inserted with active status
      const { error: dbErr } = await supabase.from('users').insert([{
        first_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'active',
        role: 'student',
        joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: new Date().toISOString()
      }]);

      if (dbErr) throw dbErr;

      // Auto-login after registration
      const finalUser = {
        first_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'active',
        role: 'student',
      };
      
      localStorage.setItem('currentUser', JSON.stringify(finalUser));
      onAuthSuccess?.(finalUser);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. LOGIN logic with ADMIN GUARD
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      // --- Hardcoded Admin Bypass ---
      if (formData.loginIdentifier === '9999999999' && formData.password === 'admin123') {
        const adminUser = {
          role: 'admin',
          first_name: 'Admin',
          name: 'Admin',
          status: 'active',
          phone: '9999999999'
        };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        onAuthSuccess?.(adminUser);
        setLoading(false);
        return;
      }

      let emailForAuth = formData.loginIdentifier.trim().toLowerCase();

      if (/^\d{10,}$/.test(emailForAuth)) {
        const { data: userByPhone, error: phoneErr } = await supabase
          .from('users')
          .select('email')
          .eq('phone', emailForAuth)
          .maybeSingle();

        if (!phoneErr && userByPhone?.email) {
          emailForAuth = userByPhone.email;
        } else {
          throw new Error('Account with this phone number not found.');
        }
      }

      const authParams = { email: emailForAuth, password: formData.password };

      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword(authParams);
      if (authErr) throw authErr;

      // --- ADMIN GUARD: Fetch status from custom table ---
      const emailToLookup = emailForAuth;
      
      const { data: userRecord, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', emailToLookup)
        .maybeSingle();

      if (fetchErr || !userRecord) {
        await supabase.auth.signOut();
        throw new Error('Account record missing. Please contact support.');
      }



      if (userRecord.status === 'inactive') {
        await supabase.auth.signOut();
        setError('Your account has been blocked. Please contact support.');
        return;
      }

      // If 'active', handle success
      const finalUser = {
        ...userRecord,
        role: userRecord.role || 'student'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(finalUser));
      onAuthSuccess?.(finalUser);

    } catch (err) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Rendering Helper ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fcfdff] font-sans flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-indigo-50/30">
      
      {/* Decorative Blur Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2167] to-[#1e3a8a] rounded-3xl shadow-2xl shadow-blue-900/20 mb-6 group hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={onBack}>
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 italic">Shorthandians</h1>
          <p className="text-gray-500 font-medium tracking-wide">Elite Stenography Academy</p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_32px_64px_-16px_rgba(30,58,138,0.1)] p-8 md:p-10">
          
          {tab === 'pending' ? (
            <div className="text-center py-6 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-2 border-green-100">
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Email Verified!</h2>
              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8">
                <p className="text-amber-800 font-bold mb-2 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" /> Status: Pending
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your account is currently pending Admin approval. You will be able to login once an administrator activates your workspace.
                </p>
              </div>
              <button 
                onClick={() => setTab('login')}
                className="w-full py-4 bg-[#1e3a8a] text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                Return to Login <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              {tab !== 'otp' && (
                <div className="flex bg-gray-100/50 p-1.5 rounded-2xl mb-8">
                  {['login', 'register'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); clearMessages(); }}
                      className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                        tab === t ? 'bg-white text-[#1e3a8a] shadow-xl' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

              {/* LOGIN FORM */}
              {tab === 'login' && (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <Input 
                    label="Email Address or Phone" 
                    icon={Mail} 
                    type="text"
                    placeholder="name@gmail.com or 9999999999" 
                    value={formData.loginIdentifier}
                    onChange={(e) => setFormData({...formData, loginIdentifier: e.target.value})}
                    required
                  />
                  <Input 
                    label="Password" 
                    icon={Lock} 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    rightElement={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#1e3a8a] hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] flex items-center justify-center gap-3 group disabled:bg-blue-300"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                      <>
                        <span className="uppercase tracking-widest text-sm">Sign In</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {tab === 'register' && (
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5">
                    <Input label="Full Name" icon={User} placeholder="Raju Mishra" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    <Input label="Email Address" icon={Mail} type="email" placeholder="you@domain.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    <Input label="Phone Number" icon={Phone} type="tel" placeholder="9876543210" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                    <Input label="Create Password" icon={Lock} type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#1e3a8a] text-white font-black rounded-2xl mt-4 shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:bg-blue-300"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span className="uppercase tracking-widest text-sm">Create Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP FLOW */}
              {tab === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#1e3a8a]">
                      <KeyRound className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Check Your Email</h3>
                    <p className="text-sm text-gray-500 leading-relaxed px-4">
                      We've sent a numeric OTP to <strong className="text-gray-900 font-black">{formData.email}</strong>. Enter it below to register.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="• • • • • •" 
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full text-center text-4xl font-black tracking-[0.4em] py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                    />
                    <p className="text-center text-xs font-bold text-gray-400 capitalize">Enter 6-digit Verification Token</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading || otpToken.length < 6}
                      className="w-full py-4 bg-[#1e3a8a] text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 group active:scale-95 disabled:bg-blue-200"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Registration'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTab('register')}
                      className="w-full py-3 text-sm font-bold text-gray-400 hover:text-[#1e3a8a] transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Use different email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
            <button onClick={onBack} className="text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
            <p className="text-xs font-bold text-blue-900/30">SECURE TRANSACTION</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
