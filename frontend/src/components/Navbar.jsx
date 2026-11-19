import React from 'react';
import { Activity, Flame, Award, Volume2, VolumeX, User, ShieldCheck } from 'lucide-react';

export function Navbar({ activePage, setActivePage, user, voiceEnabled, toggleVoice }) {
  return (
    <header className="h-16 border-b border-neutral-800/80 bg-[#0A0A0C]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              FITNESS<span className="text-blue-500">.AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Trainer Pro
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 -mt-0.5 hidden sm:block">
            Computer Vision Pose Estimation & Biomechanics
          </p>
        </div>
      </div>

      {/* Quick Status and Actions */}
      <div className="flex items-center gap-3">
        {/* Voice Assistant Toggle */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled ? 'Voice Guidance Active' : 'Voice Guidance Muted'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            voiceEnabled
              ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 hover:bg-blue-600/25'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          <span className="hidden md:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
        </button>

        {/* User Points Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{user?.points || 0} pts</span>
        </div>

        {/* Profile Pill */}
        <button
          onClick={() => setActivePage('profile')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name ? user.full_name[0] : 'A'}
          </div>
          <span className="text-xs font-semibold text-neutral-200 hidden sm:inline">
            {user?.full_name || 'Alex Mercer'}
          </span>
        </button>
      </div>
    </header>
  );
}
