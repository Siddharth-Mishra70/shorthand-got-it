import React, { useState, useEffect } from 'react';
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
import LivePreviewSection from './LivePreviewSection';
import ResultAnalysisPage from './ResultAnalysisPage';
import AdminPanel from './AdminPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      active
        ? 'bg-[#1e3a8a] text-white'
        : 'text-gray-600 hover:bg-blue-50 hover:text-[#1e3a8a]'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </div>
);

const CircularCourseCard = ({ title, type, isPremium, onTakeTest }) => (
  <div className="flex flex-col items-center group">
    <div className="relative w-48 h-48 rounded-full bg-white shadow-xl flex flex-col justify-center items-center text-center p-6 border-4 border-transparent group-hover:border-[#1e3a8a] transition-all duration-300">
      <div className="absolute top-2 right-2">
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {isPremium ? 'PAID' : 'FREE'}
        </span>
      </div>
      <FileText className="w-8 h-8 text-[#1e3a8a] mb-2" />
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{type}</p>
    </div>
    <button
      onClick={onTakeTest}
      className="mt-6 bg-[#1e3a8a] hover:bg-blue-800 text-white px-6 py-2 rounded-full font-semibold shadow-md transition-transform transform hover:scale-105 flex items-center space-x-2"
    >
      <PlayCircle className="w-4 h-4" />
      <span>Take Test</span>
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Protected Route Wrapper
// Redirects to auth if user is not logged in
// ─────────────────────────────────────────────────────────────────────────────
const useProtectedNav = (isLoggedIn, setCurrentView, setShowAuthModal, setPendingView) => {
  return (targetView) => {
    const protectedViews = ['dashboard', 'arena', 'formatting', 'pitman'];
    if (protectedViews.includes(targetView) && !isLoggedIn) {
      setPendingView(targetView);   // remember where they wanted to go
      setShowAuthModal(true);       // show login required popup
    } else {
      setCurrentView(targetView);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // ── State ─────────────────────────────────────────────────
  // Views: 'landing' | 'auth' | 'dashboard' | 'arena' | 'formatting' | 'pitman' | 'results' | 'results:UUID'
  const [currentView, setCurrentView] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false); // Login Required popup
  const [pendingView, setPendingView] = useState(null);      // where to go after login
  const [arenaTab, setArenaTab] = useState('transcribe');     // 'transcribe' | 'analysis'
  const [lastAttemptId, setLastAttemptId] = useState(null);

  // Navigate to a specific attempt result page after saving
  const navigateToResult = (attemptId) => {
    setCurrentView(`results:${attemptId}`);
  };

  const courses = [
    { id: 'kc-1', title: 'Kailash Chandra Vol 1-24', type: 'Dictation Series', isPremium: false, view: 'arena-kc' },
    { id: 'ssc-cd', title: 'SSC Grade C & D', type: 'Exam Preparation', isPremium: true, view: 'arena-ssc' },
    { id: 'patna', title: 'Patna High Court', type: 'Court Specific', isPremium: true, view: 'formatting' },
    { id: 'allahabad', title: 'Allahabad HC APS', type: 'Exercise 110 (Pitman)', isPremium: false, view: 'pitman' },
  ];

  const currentViewData = courses.find((c) => c.view === currentView);

  // Protected navigation helper
  const navigate = useProtectedNav(isLoggedIn, setCurrentView, setShowAuthModal, setPendingView);

  // ── Auth Handlers ─────────────────────────────────────────
  const handleAuthSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    // Redirect to pending view (if user was trying to access something) or dashboard
    if (pendingView) {
      setCurrentView(pendingView);
      setPendingView(null);
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('landing');
  };

  // Modal helpers
  const openAuthFromModal = (tab = 'login') => {
    setShowAuthModal(false);
    setCurrentView('auth');
  };

  // ── Protected View Guard ──────────────────────────────────
  // If user navigates directly to a protected view via state, kick them out
  useEffect(() => {
    const protectedViews = ['dashboard', 'arena-kc', 'arena-ssc', 'formatting', 'pitman', 'results'];
    const isProtected = protectedViews.includes(currentView) || currentView.startsWith('results:');
    if (isProtected && !isLoggedIn) {
      setCurrentView('auth');
    }
  }, [currentView, isLoggedIn]);

  // ── Auth Page ─────────────────────────────────────────────
  if (currentView === 'auth') {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  // ── Course Sub-views (Protected) ──────────────────────────
  if (currentView === 'arena-kc' || currentView === 'arena-ssc') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Arena Header with Tabs */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setArenaTab('transcribe');
              }}
              className="flex items-center space-x-2 text-[#1e3a8a] font-bold hover:text-blue-800 transition-colors"
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
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dictation Arena
              </button>
              <button
                onClick={() => setArenaTab('analysis')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'analysis'
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
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
              courses={courses}
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
            />
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'formatting') {
    return <HighCourtFormatting onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'pitman') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setArenaTab('transcribe');
              }}
              className="flex items-center space-x-2 text-[#1e3a8a] font-bold hover:text-blue-800 transition-colors"
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
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dictation Arena
              </button>
              <button
                onClick={() => setArenaTab('analysis')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  arenaTab === 'analysis'
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Result Analysis
              </button>
            </div>
            <div className="w-10 opacity-0 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {arenaTab === 'transcribe' ? (
            <PitmanAPSModule
              onBack={() => setCurrentView('dashboard')}
              onTestComplete={(id) => {
                setLastAttemptId(id);
                setArenaTab('analysis');
              }}
            />
          ) : (
            <ResultAnalysisPage
              attemptId={lastAttemptId}
              onBack={() => setArenaTab('transcribe')}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Result Analysis Page (Protected) ─────────────────────
  // Supports both 'results' (demo) and 'results:UUID' (real data)
  if (currentView === 'results' || currentView.startsWith('results:')) {
    const attemptId = currentView.includes(':') ? currentView.split(':')[1] : undefined;
    return (
      <ResultAnalysisPage
        attemptId={attemptId}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  // ── Landing Page ──────────────────────────────────────────
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Login Required Modal */}
        {showAuthModal && (
          <LoginRequiredModal
            onLogin={() => openAuthFromModal('login')}
            onRegister={() => openAuthFromModal('register')}
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
        <LivePreviewSection />
        <OfferingsSection onNavigate={(view) => navigate(view)} />
        <AboutContactSection />
      </div>
    );
  }

  // ── Dashboard (Protected) ─────────────────────────────────
  if (user?.role === 'admin') {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-lg flex justify-center items-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1
              className="text-2xl font-black text-[#1e3a8a] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setCurrentView('landing')}
            >
              Shorthandians
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* User badge */}
            {user && (
              <div className="hidden md:flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                <div className="w-7 h-7 bg-[#1e3a8a] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-[#1e3a8a] text-sm">{user.name}</span>
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
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 py-6 px-4 flex flex-col md:min-h-[calc(100vh-80px)]">
          <nav className="space-y-2 flex-1">
            <SidebarItem
              icon={GraduationCap}
              label="Student Portal"
              active={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
            />
            <SidebarItem icon={Headphones} label="Audio Dictations" />
            <SidebarItem
              icon={Scale}
              label="High Court Formatting"
              active={currentView === 'formatting'}
              onClick={() => setCurrentView('formatting')}
            />
            <SidebarItem icon={FileText} label="Mock Tests" />
            <SidebarItem icon={CreditCard} label="Subscription" />
            <SidebarItem
              icon={BarChart2}
              label="Result Analysis"
              active={currentView === 'results'}
              onClick={() => setCurrentView('results')}
            />
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-100 hidden md:block">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <h4 className="font-bold text-[#1e3a8a] mb-2">Need More Tests?</h4>
              <p className="text-xs text-gray-600 mb-3">Upgrade for unlimited access.</p>
              <button className="text-sm font-semibold text-white bg-[#1e3a8a] w-full py-2 rounded-lg hover:bg-blue-800 transition-colors">
                View Plans
              </button>
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-10 bg-gray-50 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Welcome back, {user?.name || 'Student'}! 👋
            </h2>
            <p className="text-gray-600">Explore our premium shorthand courses and dictations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 justify-items-center">
            {courses.map((course, idx) => (
              <CircularCourseCard
                key={idx}
                title={course.title}
                type={course.type}
                isPremium={course.isPremium}
                onTakeTest={() => setCurrentView(course.view)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
