import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = ({ isLoggedIn, user, onLoginClick, onLogout, onDashboard }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Courses', href: '#courses' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const textClass = scrolled ? 'text-gray-700 hover:text-[#1e3a8a] hover:bg-blue-50' : 'text-white/90 hover:text-white hover:bg-white/15';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <div className="w-11 h-11 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-blue-400/40 transition-shadow duration-300">
                <span className="text-white font-black text-xl leading-none">S</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div>
            </div>
            <span
              className={`text-2xl font-black tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-[#1e3a8a]' : 'text-white drop-shadow'
              }`}
            >
              Shorthandians
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${textClass}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn && user ? (
              /* Logged-in state */
              <div className="flex items-center space-x-2">
                {/* User chip */}
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                    scrolled ? 'bg-blue-50 text-[#1e3a8a] border border-blue-100' : 'bg-white/15 text-white border border-white/20'
                  }`}
                >
                  <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-blue-900" />
                  </div>
                  <span>{user.name}</span>
                </div>

                {/* Dashboard shortcut */}
                <button
                  onClick={onDashboard}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
                    scrolled ? 'bg-[#1e3a8a] text-white hover:bg-blue-700' : 'bg-white/20 text-white hover:bg-white/30 border border-white/25'
                  } hover:shadow-md`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                {/* Logout */}
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className={`p-2.5 rounded-full transition-colors ${
                    scrolled ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Logged-out state */
              <button
                id="navbar-login-btn"
                onClick={onLoginClick}
                className="group relative overflow-hidden px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 bg-[#1e3a8a] text-white hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Login / Register</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-[#1e3a8a] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-[#1e3a8a] hover:bg-blue-50' : 'text-white hover:bg-white/15'
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        } bg-white/98 backdrop-blur-md border-t border-blue-100 shadow-lg`}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-gray-700 font-semibold hover:text-[#1e3a8a] hover:bg-blue-50 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-2 pb-1 space-y-2 border-t border-gray-100 mt-2">
            {isLoggedIn && user ? (
              <>
                <button
                  onClick={() => { setMenuOpen(false); onDashboard?.(); }}
                  className="w-full bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onLogout?.(); }}
                  className="w-full border-2 border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); onLoginClick?.(); }}
                className="w-full bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
