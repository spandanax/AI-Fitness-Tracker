import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Users,
  Award,
  Flame,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export function Leaderboard({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await api.getLeaderboard(50);
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-extrabold text-sm shadow-md shadow-amber-500/20">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 flex items-center justify-center font-extrabold text-sm">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-extrabold text-sm">
          3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-900 text-neutral-400 font-mono flex items-center justify-center font-semibold text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Community Leaderboard</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Rankings computed in real time from verified database workout sessions and unlocked achievements
        </p>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Global Athlete Standings</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">SQLite Real DB Records</span>
        </div>

        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-900/40 text-neutral-400">
                  <th className="py-4 px-6 font-semibold">Rank</th>
                  <th className="py-4 px-6 font-semibold">Athlete</th>
                  <th className="py-4 px-6 font-semibold">Total Workouts</th>
                  <th className="py-4 px-6 font-semibold">Verified Reps</th>
                  <th className="py-4 px-6 font-semibold">Badges</th>
                  <th className="py-4 px-6 font-semibold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {leaderboard.map(entry => {
                  const isCurrent = user?.id === entry.user_id;
                  return (
                    <tr
                      key={entry.user_id}
                      className={`transition ${
                        isCurrent
                          ? 'bg-blue-600/10 hover:bg-blue-600/15'
                          : 'hover:bg-neutral-800/30'
                      }`}
                    >
                      <td className="py-4 px-6">
                        {getRankBadge(entry.rank)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {entry.full_name ? entry.full_name[0] : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {entry.full_name} {isCurrent && <span className="text-blue-400 font-normal text-[10px] ml-1">(You)</span>}
                            </span>
                            <span className="text-neutral-500 text-[10px]">@{entry.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-neutral-300 font-mono font-medium">
                        {entry.total_workouts} sessions
                      </td>
                      <td className="py-4 px-6 text-neutral-300 font-mono font-bold">
                        {entry.total_reps} reps
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                          {entry.achievements_count} badges
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-extrabold text-amber-400 text-sm">
                        {entry.points} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Loading real rankings from database...
          </div>
        )}
      </div>
    </div>
  );
}
