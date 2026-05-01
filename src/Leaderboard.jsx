import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Target, Zap, Crown,
  ArrowLeft, Loader2, Users, Star, TrendingUp
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ─── Helper: Rank Badge Config ─────────────────────────────────────────────────

const RANK_CONFIG = {
  1: {
    label: '🥇',
    color: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-400/60',
    glow: 'shadow-yellow-400/30',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-yellow-400',
    podiumHeight: 'h-32',
    scale: 'scale-105',
    crown: true,
  },
  2: {
    label: '🥈',
    color: 'from-slate-300 to-slate-400',
    border: 'border-slate-300/60',
    glow: 'shadow-slate-300/30',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    ring: 'ring-slate-300',
    podiumHeight: 'h-24',
    scale: 'scale-100',
    crown: false,
  },
  3: {
    label: '🥉',
    color: 'from-orange-400 to-amber-600',
    border: 'border-orange-400/60',
    glow: 'shadow-orange-400/30',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-400',
    podiumHeight: 'h-20',
    scale: 'scale-100',
    crown: false,
  },
};

// ─── Avatar Generator ──────────────────────────────────────────────────────────

const getInitials = (name = '') =>
  name.trim().charAt(0).toUpperCase() || '?';

const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-violet-600',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

// ─── Podium Card (Top 3) ───────────────────────────────────────────────────────

const PodiumCard = ({ user, rank }) => {
  const cfg = RANK_CONFIG[rank];
  const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

  return (
    <div className={`flex flex-col items-center ${order} ${cfg.scale} transition-transform duration-500`}>
      {/* Crown Icon for #1 */}
      {cfg.crown && (
        <div className="mb-2 animate-bounce">
          <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
        </div>
      )}

      {/* Avatar */}
      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(user.first_name)} flex items-center justify-center text-white text-2xl font-black shadow-2xl ${cfg.glow} ring-4 ${cfg.ring} mb-3`}>
        {getInitials(user.first_name)}
        <span className="absolute -bottom-1 -right-1 text-xl leading-none">{cfg.label}</span>
      </div>

      {/* Name + Stats */}
      <p className="text-sm font-black text-gray-900 text-center truncate max-w-[100px]">{user.first_name}</p>
      <div className="mt-1.5 flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-lg font-black text-blue-600">{user.best_wpm}</span>
        <span className="text-xs font-bold text-gray-400">WPM</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <Target className="w-3 h-3 text-emerald-500" />
        <span className="text-xs font-bold text-emerald-600">{user.best_accuracy}%</span>
      </div>

      {/* Podium Block */}
      <div className={`w-24 ${cfg.podiumHeight} mt-4 rounded-t-2xl bg-gradient-to-b ${cfg.color} flex items-center justify-center shadow-lg`}>
        <span className="text-white font-black text-2xl opacity-40">#{rank}</span>
      </div>
    </div>
  );
};

// ─── List Row (Ranks 4–10) ─────────────────────────────────────────────────────

const LeaderboardRow = ({ user, rank }) => {
  return (
    <div className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Rank Number */}
      <div className="w-8 text-center font-black text-gray-300 text-lg shrink-0">
        {rank}
      </div>

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(user.first_name)} flex items-center justify-center text-white font-black text-base shadow-sm shrink-0`}>
        {getInitials(user.first_name)}
      </div>

      {/* Name */}
      <p className="flex-1 font-bold text-gray-800 text-sm truncate group-hover:text-blue-800 transition-colors">
        {user.first_name}
      </p>

      {/* WPM Badge */}
      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100">
        <Zap className="w-3.5 h-3.5" />
        <span className="font-black text-sm">{user.best_wpm}</span>
        <span className="text-xs font-bold opacity-60">WPM</span>
      </div>

      {/* Accuracy Badge */}
      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 shrink-0">
        <Target className="w-3.5 h-3.5" />
        <span className="font-black text-sm">{user.best_accuracy}%</span>
      </div>
    </div>
  );
};

// ─── Main Leaderboard Component ───────────────────────────────────────────────

const Leaderboard = ({ onBack }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchErr } = await supabase
          .from('users')
          .select('first_name, best_wpm, best_accuracy')
          .gt('best_wpm', 0)
          .order('best_wpm', { ascending: false })
          .limit(10);

        if (fetchErr) throw fetchErr;
        setLeaders(data || []);
      } catch (err) {
        setError('Could not load the leaderboard. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#f5f7ff] font-sans">
      {/* ── Background Orbs ── */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 pb-16">

        {/* ── Back Button ── */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        )}

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2167] to-[#1e3a8a] rounded-3xl shadow-2xl shadow-blue-900/20 mb-5">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Leaderboard</h1>
          <p className="text-gray-500 font-medium">Top stenographers on the Shorthandians platform</p>

          {/* Live Indicator */}
          <div className="inline-flex items-center gap-2 mt-4 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Rankings</span>
          </div>
        </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-400 font-medium">Loading champions...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
            <p className="text-red-600 font-bold">{error}</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && leaders.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-700 mb-2">No Rankings Yet</h3>
            <p className="text-gray-400 text-sm">Be the first to complete a test and claim the top spot!</p>
          </div>
        )}

        {/* ── Podium (Top 3) ── */}
        {!loading && !error && top3.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)] p-8 mb-6">
            <div className="flex items-center gap-2 mb-8">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Hall of Fame</span>
            </div>

            {/* Podium Layout: 2 | 1 | 3 */}
            <div className="flex items-end justify-center gap-4">
              {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
              {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
              {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
            </div>
          </div>
        )}

        {/* ── Rest of Rankings (4–10) ── */}
        {!loading && !error && rest.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(30,58,138,0.08)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rankings</span>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-4 px-5 mb-3 text-xs font-black text-gray-300 uppercase tracking-widest">
              <span className="w-8 text-center">#</span>
              <span className="w-10 shrink-0" />
              <span className="flex-1">Student</span>
              <span className="w-24 text-center">Speed</span>
              <span className="w-24 text-center">Accuracy</span>
            </div>

            <div className="space-y-2">
              {rest.map((user, idx) => (
                <LeaderboardRow key={idx} user={user} rank={idx + 4} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-xs font-bold text-gray-300 mt-10 uppercase tracking-widest">
          Shorthandians · Elite Stenography Academy
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
