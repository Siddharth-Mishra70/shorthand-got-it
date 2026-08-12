import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  GraduationCap,
  Headphones,
  Scale,
  FileText,
  CreditCard,
  MessageCircle,
  PlayCircle,
  ArrowLeft,
  LogOut,
  User,
  BarChart2,
  CheckCircle,
  Lock,
} from 'lucide-react';

import TypingArena from './TypingArena';
import HighCourtFormatting from './HighCourtFormatting';
import PitmanAPSModule from './PitmanAPSModule';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import OfferingsSection from './OfferingsSection';
import AboutContactSection from './AboutContactSection';
import AuthPage from './AuthPage';
import LoginRequiredModal from './LoginRequiredModal';
import LiveDemoInteractive from './LiveDemoInteractive';
import ResultAnalysisPage from './ResultAnalysisPage';
import AdminPanel from './AdminPanel';
import StateExamModule from './StateExamModule';
import StudentPerformanceDashboard from './StudentPerformanceDashboard';
import MobilePracticeSection from './MobilePracticeSection';
import FAQSection from './FAQSection';
import ErrorBoundary from './ErrorBoundary';
import { verifyTestAccess } from './lib/saveTestResult';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      active
        ? 'bg-[#0d6e70] text-white'
        : 'text-gray-600 hover:bg-blue-50 hover:text-[#0d6e70]'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </div>
);

const CircularCourseCard = ({ title, type, isPremium, courseId, user, onTakeTest }) => {
  const access = verifyTestAccess(user, courseId);
  const isLocked = !access.allowed;

  return (
    <div className="flex flex-col items-center group w-full max-w-[280px]">
      <div className={`relative w-full aspect-square rounded-full bg-white shadow-xl flex flex-col justify-center items-center text-center p-6 border-4 border-transparent transition-all duration-300 ${
        isLocked ? 'opacity-75 grayscale-[30%]' : 'group-hover:border-[#0d6e70]'
      }`}>
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
          {isLocked ? (
            <span className="px-3 py-1 text-[10px] sm:text-xs font-black rounded-full shadow-sm bg-red-100 text-red-700 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {user && user.status === 'inactive' ? 'INACTIVE' :
               user && user.valid_until && new Date(user.valid_until) < new Date() ? 'EXPIRED' :
               'LOCKED'}
            </span>
          ) : (
            <span className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-full shadow-sm ${
              isPremium ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {isPremium ? 'PAID' : 'FREE'}
            </span>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
          {isLocked ? <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#0d6e70]" />}
        </div>
        <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm leading-tight mb-1 px-2">{title}</h3>
        <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">{type}</p>
        {isLocked && (
          <p className="text-[9px] text-red-500 font-bold mt-1 px-1 leading-tight">
            {access.reason?.substring(0, 60)}{access.reason?.length > 60 ? '...' : ''}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          if (isLocked) {
            alert(`🔒 ${access.reason}`);
            return;
          }
          onTakeTest();
        }}
        className={`mt-6 w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 ${
          isLocked
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#0d6e70] hover:bg-blue-800 text-white'
        }`}
      >
        {isLocked ? (
          <><Lock className="w-4 h-4" /><span>Locked</span></>
        ) : (
          <><PlayCircle className="w-4 h-4" /><span>Take Test</span></>
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Protected Route Wrapper
// Redirects to auth if user is not logged in
// ─────────────────────────────────────────────────────────────────────────────
const useProtectedNav = (isLoggedIn, setCurrentView, setShowAuthModal, setPendingView) => {
  return (targetView) => {
    const protectedViews = ['dashboard', 'arena-kc', 'arena-audio', 'arena-comp', 'arena-state', 'formatting', 'pitman'];
    if (protectedViews.includes(targetView) && !isLoggedIn) {
      setPendingView(targetView);   // remember where they wanted to go
      setShowAuthModal(true);       // show login required popup
    } else {
      setCurrentView(targetView);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// URL Mapping Helpers
// ─────────────────────────────────────────────────────────────────────────────
const cleanPath = (path) => {
  if (!path) return '';
  let p = path.trim();
  if (p.endsWith('/') && p.length > 1) {
    p = p.slice(0, -1);
  }
  return p;
};

const getViewFromPath = (pathOrHash) => {
  let path = pathOrHash || '';
  if (path.includes('#')) {
    path = path.split('#')[1] || '';
  }
  const p = cleanPath(path);
  if (!p || p === '/') return 'landing';
  if (p === '/login' || p === '/register' || p === '/signup') return 'auth';
  if (p === '/dashboard') return 'dashboard';
  if (p === '/dashboard/results') return 'results';
  if (p.startsWith('/dashboard/results/')) {
    const id = p.slice('/dashboard/results/'.length);
    return `results:${id}`;
  }
  if (p === '/dashboard/formatting') return 'formatting';
  if (p === '/dashboard/pitman') return 'pitman';
  if (p === '/dashboard/arena-audio') return 'arena-audio';
  if (p === '/dashboard/arena-kc') return 'arena-kc';
  if (p === '/dashboard/arena-comp') return 'arena-comp';
  if (p === '/dashboard/arena-state') return 'arena-state';
  if (p === '/dashboard/subscription') return 'subscription';
  if (p.startsWith('/admin')) return 'admin';
  return 'landing';
};

const getPathFromView = (view, userRole) => {
  if (view === 'landing') return '/';
  if (view === 'auth') {
    return window.location.pathname === '/register' || window.location.pathname === '/signup'
      ? window.location.pathname
      : '/login';
  }
  if (view === 'dashboard') {
    return userRole === 'admin' ? '/admin/students' : '/dashboard';
  }
  if (view === '/dashboard/results' || view === 'results') return '/dashboard/results';
  if (view.startsWith('results:')) {
    const id = view.split(':')[1];
    return `/dashboard/results/${id}`;
  }
  if (view === 'formatting') return '/dashboard/formatting';
  if (view === 'pitman') return '/dashboard/pitman';
  if (view === 'arena-audio') return '/dashboard/arena-audio';
  if (view === 'arena-kc') return '/dashboard/arena-kc';
  if (view === 'arena-comp') return '/dashboard/arena-comp';
  if (view === 'arena-state') return '/dashboard/arena-state';
  if (view === 'subscription') return '/dashboard/subscription';
  if (view === 'admin') return '/admin/students';
  return '/';
};

// ─────────────────────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────────────────────
function App() {
    // ── State (Initialized from LocalStorage) ────────────────
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('currentUser');
    });
    
    const [user, setUser] = useState(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem('currentUser');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [currentView, setCurrentView] = useState(() => {
        if (typeof window === 'undefined') return 'landing';
        const path = window.location.hash ? window.location.hash.slice(1) : window.location.pathname;
        const viewFromPath = getViewFromPath(path);
        
        const currentUserStr = localStorage.getItem('currentUser');
        const hasSession = !!currentUserStr;
        
        const protectedViews = ['dashboard', 'arena-kc', 'arena-comp', 'arena-state', 'arena-audio', 'formatting', 'pitman', 'results', 'admin'];
        const isProtected = protectedViews.includes(viewFromPath) || viewFromPath.startsWith('results:');
        
        if (isProtected && !hasSession) {
            return 'auth';
        }
        
        if (path === '/' || path === '') {
            return hasSession ? 'dashboard' : 'landing';
        }
        
        return viewFromPath;
    });
    
    const [showAuthModal, setShowAuthModal] = useState(false); // Login Required popup
    const [pendingView, setPendingView] = useState(null);      // where to go after login
    const [arenaTab, setArenaTab] = useState('transcribe');     // 'transcribe' | 'analysis'
    const [lastAttemptId, setLastAttemptId] = useState(null);

    // ── Non-admin Redirect Safety ─────────────────────────────
    useEffect(() => {
        if (currentView === 'admin' && isLoggedIn && user?.role !== 'admin') {
            setCurrentView('dashboard');
        }
    }, [currentView, isLoggedIn, user?.role]);

    // ── Popstate Listener ─────────────────────────────────────
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.hash ? window.location.hash.slice(1) : window.location.pathname;
            const viewFromPath = getViewFromPath(path);
            
            const protectedViews = ['dashboard', 'arena-kc', 'arena-comp', 'arena-state', 'arena-audio', 'formatting', 'pitman', 'results', 'admin'];
            const isProtected = protectedViews.includes(viewFromPath) || viewFromPath.startsWith('results:');
            
            if (isProtected && !isLoggedIn) {
                setCurrentView('auth');
            } else {
                setCurrentView(viewFromPath);
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isLoggedIn]);

    // ── URL Synchronization ──────────────────────────────────
    useEffect(() => {
        const targetPath = getPathFromView(currentView, user?.role);
        const currentPath = window.location.pathname;
        
        if (currentView === 'admin' && currentPath.startsWith('/admin')) {
            return;
        }
        if (currentView === 'auth' && (currentPath === '/login' || currentPath === '/register' || currentPath === '/signup')) {
            return;
        }
        
        if (cleanPath(currentPath) !== cleanPath(targetPath)) {
            window.history.pushState(null, '', targetPath);
        }
    }, [currentView, user?.role]);



  // Navigate to a specific attempt result page after saving
  const navigateToResult = (attemptId) => {
    setCurrentView(`results:${attemptId}`);
  };

  const allCourses = [
    { id: 'hc-formatting', title: 'Allahabad High Court', type: 'Formatting Test', isPremium: true, view: 'formatting', category: 'formatting' },
    { id: 'pitman-ex', title: 'Pitman Shorthand', type: 'Exercise Practice', isPremium: true, view: 'pitman', category: 'pitman' },
    { id: 'audio-dict', title: 'Audio Dictations', type: '80/100/120 WPM', isPremium: false, view: 'arena-audio', category: 'audio' },
    { id: 'kailash-chandra', title: 'Kailash Chandra', type: 'Standard Dictations', isPremium: false, view: 'arena-kc', category: 'kailash' },
    { id: 'comprehension', title: 'Comprehension', type: 'Theory & Test', isPremium: false, view: 'arena-comp', category: 'comprehension' },
    { id: 'state-exam', title: 'State Exams', type: 'Selection Focused', isPremium: true, view: 'arena-state', category: 'state' },
  ];

  const enrolled = user?.enrolled_courses || [];
  // Show ALL courses on the dashboard — lock state is handled per-card by verifyTestAccess
  const courses = allCourses;

  const currentViewData = courses.find((c) => c.view === currentView);

  // Protected navigation helper
  const navigate = useProtectedNav(isLoggedIn, setCurrentView, setShowAuthModal, setPendingView);

  // ── Auth Handlers ─────────────────────────────────────────
    const handleAuthSuccess = (userData) => {
        setIsLoggedIn(true);
        setUser(userData);
        
        // Admins should strictly go to Admin Dashboard
        if (userData?.role === 'admin') {
            setCurrentView('dashboard');
            setPendingView(null);
            return;
        }
        
        // After login, strictly go to the Dashboard
        setCurrentView('dashboard');
        setPendingView(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setIsLoggedIn(false);
        setUser(null);
        setCurrentView('landing');
    };

  // Modal helpers
  const openAuthFromModal = (tab = 'login') => {
    setShowAuthModal(false);
    const path = tab === 'register' ? '/register' : '/login';
    window.history.pushState(null, '', path);
    setCurrentView('auth');
  };

    // ── Protected View Guard ──────────────────────────────────
    useEffect(() => {
        const protectedViews = ['dashboard', 'arena-kc', 'arena-comp', 'arena-state', 'arena-audio', 'formatting', 'pitman', 'results'];
        const isProtected = protectedViews.includes(currentView) || currentView.startsWith('results:');
        
        // Add a check to avoid flickering/mis-redirects if we just logged in or are loading
        if (isProtected && !isLoggedIn) {
            // Check if there is a session being restored before kicking them out
            const sessionFound = localStorage.getItem('currentUser');
            if (!sessionFound) {
                setCurrentView('auth');
                return;
            }
        }

        // Verify session status against database to kick out deleted/blocked users
        const verifySessionStatus = async () => {
            if (isLoggedIn && user?.email && isProtected) {
                try {
                    const { data: userRecord, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .maybeSingle();

                    if (error || !userRecord) {
                        handleLogout();
                    } else if (userRecord.role === 'admin') {
                        // Admins are permanently active and exempt from status/expiry gates
                        return;
                    } else if (userRecord.status === 'inactive') {
                        handleLogout();
                    } else {
                        const validUntil = userRecord.valid_until || (() => {
                            if (userRecord.created_at) {
                                const d = new Date(userRecord.created_at);
                                d.setDate(d.getDate() + 29);
                                return d.toISOString();
                            }
                            return null;
                        })();
                        if (validUntil && new Date(validUntil) < new Date()) {
                            handleLogout();
                        }
                    }
                } catch (err) {
                    console.error('Session verification failed:', err);
                }
            }
        };

        verifySessionStatus();
    }, [currentView, isLoggedIn, user?.email]);

  // ── Auth Page ─────────────────────────────────────────────
  if (currentView === 'auth') {
    return (
      <ErrorBoundary>
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setCurrentView('landing')}
        />
      </ErrorBoundary>
    );
  }

  // ── Course Sub-views (Protected) ──────────────────────────
  if (currentView === 'arena-state') {
    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <div className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
                    <button onClick={() => setCurrentView('dashboard')} className="flex items-center space-x-2 text-[#0d6e70] font-bold hover:text-blue-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Dashboard</span> <span className="sm:hidden text-xs">Back</span>
                    </button>
                </div>
            </div>
            <StateExamModule 
              onBack={() => setCurrentView('dashboard')} 
              onNavigateCourse={setCurrentView} 
              category="state"
            />
        </div>
    );
  }

  if (currentView === 'arena-kc' || currentView === 'arena-audio' || currentView === 'arena-comp') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Arena Header with Tabs */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setArenaTab('transcribe');
              }}
              className="flex items-center space-x-2 text-[#0d6e70] font-bold hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden text-xs">Back</span>
            </button>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setArenaTab('transcribe')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'transcribe'
                    ? 'bg-white text-[#0d6e70] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dictation Arena
              </button>
              <button
                onClick={() => setArenaTab('analysis')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'analysis'
                    ? 'bg-white text-[#0d6e70] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Result Analysis
              </button>
            </div>

            <div className="w-10 opacity-0 pointer-events-none" /> {/* Spacer */}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {arenaTab === 'transcribe' ? (
            <TypingArena
              initialCourse={currentViewData?.id || 'kc-1'}
              category={currentViewData?.category}
              onNavigateCourse={setCurrentView}
              onTestComplete={(id) => {
                setLastAttemptId(id);
                setArenaTab('analysis');
              }}
            />
          ) : (
            <ResultAnalysisPage
              attemptId={lastAttemptId}
              onBack={() => setArenaTab('transcribe')}
              user={user}
            />
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'formatting') {
    return <HighCourtFormatting onBack={() => setCurrentView('dashboard')} user={user} onTestComplete={(id) => setCurrentView(`results:${id}`)} />;
  }

  if (currentView === 'pitman') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setArenaTab('transcribe');
              }}
              className="flex items-center space-x-2 text-[#0d6e70] font-bold hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden text-xs">Back</span>
            </button>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setArenaTab('transcribe')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'transcribe'
                    ? 'bg-white text-[#0d6e70] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dictation Arena
              </button>
              <button
                onClick={() => setArenaTab('analysis')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'analysis'
                    ? 'bg-white text-[#0d6e70] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Result Analysis
              </button>
            </div>
            <div className="w-10 opacity-0 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {arenaTab === 'transcribe' ? (
            <PitmanAPSModule
              onBack={() => setCurrentView('dashboard')}
              category="pitman"
              onTestComplete={(id) => {
                setLastAttemptId(id);
                setArenaTab('analysis');
              }}
            />
          ) : (
            <ResultAnalysisPage
              attemptId={lastAttemptId}
              onBack={() => setArenaTab('transcribe')}
              user={user}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Result Analysis Page (Protected) ─────────────────────
  // Supports both 'results' (demo) and 'results:UUID' (real data)
  // ── Result Analysis Page (Protected) ─────────────────────
  // Supports both 'results' (demo) and 'results:UUID' (real data)
  // ── Result Analysis Page & Dashboard (Protected) ───────────
  // ── Result Analysis Page Deep-Dive (Protected Overlay) ───
  if (currentView.startsWith('results:')) {
    const attemptId = currentView.split(':')[1];
    return (
      <ResultAnalysisPage
        attemptId={attemptId}
        onBack={() => setCurrentView('results')}
        onNavigateToTest={(id) => setCurrentView(`results:${id}`)}
        user={user}
      />
    );
  }


  // ── Subscription Detail Page (Protected) ───────────────────
  if (currentView === 'subscription') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Reuse Header */}
        <header className="bg-white shadow-sm border-b z-10">
          <div className="w-full px-4 py-4 flex justify-between items-center">
             <button onClick={() => setCurrentView('dashboard')} className="flex items-center space-x-2 text-[#0d6e70] font-bold hover:text-blue-800 transition-colors">
                 <ArrowLeft className="w-4 h-4" /> <span>Back to Dashboard</span>
             </button>
             <h2 className="text-xl font-black text-gray-800">My Subscription</h2>
             <div className="w-10 opacity-0 pointer-events-none" />
          </div>
        </header>
        
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-5">
                <div className="bg-gradient-to-r from-[#07414e] to-[#0d6e70] p-8 text-white text-center">
                    <div className="inline-block px-4 py-1.5 bg-amber-400 text-blue-900 rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-lg">Premium Active</div>
                    <h3 className="text-3xl font-black mb-2">Master Course Plan</h3>
                    <p className="opacity-80 text-sm">
                        {user?.valid_until 
                            ? `Valid until: ${new Date(user.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` 
                            : 'Unlimited / Lifetime Access'}
                    </p>
                </div>
                
                <div className="p-8 md:p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Plan Features</h4>
                            <ul className="space-y-3">
                                {[
                                    'Unlimited Shorthand Dictations',
                                    'Full High Court Formatting Access',
                                    'Pitman Exercise Mastery Course',
                                    'Advanced Result Analytics',
                                    'Personalized Performance Tracking'
                                ].map(feat => (
                                    <li key={feat} className="flex items-center text-gray-700 text-sm font-bold">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Account Details</h4>
                            <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">Student:</span>
                                    <span className="text-gray-900 font-black">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">Phone:</span>
                                    <span className="text-gray-900 font-black">{user?.phone}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">Joined:</span>
                                    <span className="text-gray-900 font-black">{user?.joinedDate || '21 Mar 2026'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        Download Payment Receipt
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // ── Landing Page ──────────────────────────────────────────
  if (currentView === 'landing') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 text-sans">
          {/* Login Required Modal */}
          {showAuthModal && (
            <LoginRequiredModal
              onLogin={() => openAuthFromModal('login')}
              onRegister={() => openAuthFromModal('login')}
              onClose={() => { setShowAuthModal(false); setPendingView(null); }}
            />
          )}

          <Navbar
            isLoggedIn={isLoggedIn}
            user={user}
            onLoginClick={() => setCurrentView('auth')}
            onLogout={handleLogout}
            onDashboard={() => navigate('dashboard')}
          />
          <HeroSection onJoinNow={() => navigate('dashboard')} />
          <LiveDemoInteractive onRegister={() => setCurrentView('auth')} />
          <OfferingsSection onNavigate={(view) => navigate(view)} />
          <MobilePracticeSection />
          <AboutContactSection />
          <FAQSection />
        </div>
      </ErrorBoundary>
    );
  }

  // ── Dashboard (Protected) ─────────────────────────────────
  if (user?.role === 'admin') {
    return <AdminPanel user={user} onLogout={handleLogout} supabase={supabase} />;
  }

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          {/* Header */}
          <header className="bg-white shadow-sm border-b z-10">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0d6e70] rounded-lg flex justify-center items-center shadow-sm">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <h1
                  className="text-2xl font-black text-[#0d6e70] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCurrentView('landing')}
                >
                  Shorthandians
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* User badge */}
                {user && (
                  <div className="hidden md:flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                    <div className="w-7 h-7 bg-[#0d6e70] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-[#0d6e70] text-sm">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name}</span>
                  </div>
                )}

                <a
                  href="https://wa.me/917080811235"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Support</span>
                </a>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 border-2 border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 px-4 py-2 rounded-full font-semibold transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 py-6 px-4 flex flex-col md:min-h-[calc(100vh-80px)] shrink-0">
              <nav className="space-y-2 flex-1 outline-none">
                <SidebarItem
                  icon={GraduationCap}
                  label="Student Portal"
                  active={currentView === 'dashboard'}
                  onClick={() => setCurrentView('dashboard')}
                />
                <SidebarItem
                  icon={BarChart2}
                  label="My Performance"
                  active={currentView === 'results'}
                  onClick={() => setCurrentView('results')}
                />
                <SidebarItem 
                   icon={CreditCard} 
                   label="Subscription Detail" 
                   active={currentView === 'subscription'}
                   onClick={() => setCurrentView('subscription')}
                />
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100 hidden md:block">
                <div className="bg-blue-50 p-4 rounded-xl text-center shadow-inner">
                  <h4 className="font-bold text-[#0d6e70] mb-2">Need More Tests?</h4>
                  <p className="text-xs text-gray-600 mb-3">Upgrade for unlimited access to premium dictations.</p>
                  <button className="text-sm font-black text-white bg-[#0d6e70] w-full py-2 rounded-lg hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 shadow-lg">
                    View Plans
                  </button>
                </div>
              </div>
            </aside>

            {/* Dashboard Content */}
            <main className={`flex-1 overflow-y-auto bg-gray-50 bg-dot-pattern ${currentView === 'dashboard' ? 'p-6 lg:p-10' : 'p-0'}`}>
              {currentView === 'dashboard' ? (
                  <>
                    <div className="mb-8 p-6 lg:p-10 pb-0">
                      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Welcome back, {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || 'Student'}! 👋
                      </h2>
                      <p className="text-gray-600">Explore our premium shorthand courses and dictations.</p>
                    </div>
          
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 w-full place-items-center p-6 lg:p-10">
                      {courses.map((course, idx) => (
                        <CircularCourseCard
                          key={idx}
                          title={course.title}
                          type={course.type}
                          isPremium={course.isPremium}
                          courseId={course.id}
                          user={user}
                          onTakeTest={() => setCurrentView(course.view)}
                        />
                      ))}
                    </div>
                  </>
              ) : currentView === 'results' ? (
                  <StudentPerformanceDashboard 
                      user={user} 
                      onBack={() => setCurrentView('dashboard')}
                      onViewResult={(id) => setCurrentView(`results:${id}`)}
                      onTakeTest={(view) => setCurrentView(view)}
                  />
              ) : (
                    <div className="p-6 lg:p-10">
                        <p className="text-gray-500 italic">Select a module from the dashboard to proceed.</p>
                    </div>
              )}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    );
}

export default App;
