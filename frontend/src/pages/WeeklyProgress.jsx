import React from 'react';
import {
  CalendarCheck2,
  Flame,
  Award,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { WeeklyActivityChart } from '../charts/WeeklyActivityChart';

export function WeeklyProgress({ analytics }) {
  const weeklyData = analytics?.weekly_activity || [];
  const totalWeeklyReps = weeklyData.reduce((acc, d) => acc + (d.total_reps || 0), 0);
  const totalWeeklyCalories = weeklyData.reduce((acc, d) => acc + (d.calories || 0), 0);
  const activeDaysCount = weeklyData.filter(d => d.workouts_count > 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Weekly Progress</h1>
        <p className="text-sm text-neutral-400 mt-1">
          7-day training consistency, target completion, and volume tracking
        </p>
      </div>

      {/* 7-Day Consistency Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {weeklyData.map((day, idx) => {
          const hasWorkouts = day.workouts_count > 0;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-center transition ${
                hasWorkouts
                  ? 'bg-blue-600/10 border-blue-500/40 text-white'
                  : 'bg-[#141418] border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block">
                {day.day_name}
              </span>
              <span className="text-[10px] text-neutral-400 block mb-2">
                {day.date.split('-').slice(1).join('/')}
              </span>
              <div className="my-2">
                {hasWorkouts ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-neutral-700 mx-auto flex items-center justify-center text-[10px]">
                    -
                  </div>
                )}
              </div>
              <span className="text-xs font-mono font-bold block text-neutral-300">
                {hasWorkouts ? `${day.total_reps} reps` : 'Rest'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Target Progress Bar */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Weekly Workout Consistency Goal</h3>
          </div>
          <span className="text-xs font-bold text-blue-400 font-mono">
            {activeDaysCount} / 5 Days
          </span>
        </div>

        <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, (activeDaysCount / 5) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400">
          Aim for at least 5 active training days per week to optimize cardiovascular and hypertrophy gains.
        </p>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-neutral-400 uppercase font-semibold">Weekly Reps</span>
          <div className="text-3xl font-extrabold text-white font-mono">{totalWeeklyReps}</div>
          <span className="text-xs text-neutral-500">Total volume logged</span>
        </div>

        <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-neutral-400 uppercase font-semibold">Weekly Calories</span>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">{Math.round(totalWeeklyCalories)} kcal</div>
          <span className="text-xs text-neutral-500">Estimated metabolic burn</span>
        </div>

        <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-neutral-400 uppercase font-semibold">Active Days</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{activeDaysCount} days</div>
          <span className="text-xs text-neutral-500">Last 7-day window</span>
        </div>
      </div>
    </div>
  );
}
