import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  Star,
  Target,
  Shield,
  Crown,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

const ICON_MAP = {
  Award,
  Zap,
  Trophy,
  Flame,
  Star,
  Target,
  Shield,
  Crown,
  Activity: Award,
  Anchor: Shield
};

export function Achievements({ user }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const data = await api.getAchievements(user?.id || 1);
        setAchievements(data);
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, [user]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((acc, a) => acc + (a.points || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Achievements & Badges</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real milestone trophies unlocked by completing workouts with verified form
          </p>
        </div>

        {/* User Total Points */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400/80 block">Total Gamification Score</span>
            <span className="text-xl font-extrabold text-white font-mono">{user?.points || totalPoints} points</span>
          </div>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Badge Mastery Level</h3>
            <p className="text-xs text-neutral-400">
              {unlockedCount} of {achievements.length} achievements unlocked
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-neutral-400">Progress</span>
            <span className="text-blue-400">{Math.round((unlockedCount / (achievements.length || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(unlockedCount / (achievements.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map(badge => {
          const Icon = ICON_MAP[badge.icon] || Trophy;
          return (
            <div
              key={badge.badge_key}
              className={`p-6 rounded-3xl border transition space-y-4 ${
                badge.unlocked
                  ? 'bg-[#141418] border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-[#101115] border-neutral-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  badge.unlocked
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20'
                    : 'bg-neutral-800 text-neutral-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                {badge.unlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Unlocked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">{badge.title}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold font-mono">+{badge.points} pts</span>
                {badge.unlocked && badge.unlocked_at && (
                  <span className="text-neutral-500 text-[10px]">
                    {new Date(badge.unlocked_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
