import React from 'react';
import {
  Play,
  Flame,
  Award,
  TrendingUp,
  Activity,
  Timer,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { WeeklyActivityChart } from '../charts/WeeklyActivityChart';

export function HomeDashboard({ analytics, onStartExercise, setActivePage, user }) {
  const quickExercises = [
    { id: 'squat', name: 'Squats', target: 'Quads & Glutes', reps: '10-15 reps', color: 'from-blue-600 to-indigo-600' },
    { id: 'pushup', name: 'Push-ups', target: 'Chest & Triceps', reps: '10-20 reps', color: 'from-indigo-600 to-purple-600' },
    { id: 'plank', name: 'Plank', target: 'Core Stability', reps: '30-60s hold', color: 'from-emerald-600 to-teal-600' },
    { id: 'bicep_curls', name: 'Bicep Curls', target: 'Biceps & Forearms', reps: '10-12 reps', color: 'from-cyan-600 to-blue-600' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-neutral-900 to-indigo-950/40 border border-blue-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            AI Computer Vision Trainer Active
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-blue-400">{user?.full_name || 'Alex'}</span>!
          </h1>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Ready to train with real-time pose estimation? Step into camera view, maintain strict form, and track every rep with millimeter biomechanical accuracy.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onStartExercise('squat')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Live Workout
            </button>
            <button
              onClick={() => setActivePage('exercises')}
              className="px-6 py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold text-sm transition"
            >
              Explore 13 Exercises
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Workouts</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {analytics?.total_workouts || 0}
            </span>
            <span className="text-xs text-neutral-400">sessions completed</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Reps Counted</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {analytics?.total_reps || 0}
            </span>
            <span className="text-xs text-neutral-400">verified reps</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Calories</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {analytics?.total_calories || 0}
            </span>
            <span className="text-xs text-neutral-400">kcal burned</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Quality</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {analytics?.avg_quality_score || 0}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">biomechanic score</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Quick Workout Launch</h2>
          <button
            onClick={() => setActivePage('exercises')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            View all 13 exercises <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickExercises.map(ex => (
            <div
              key={ex.id}
              onClick={() => onStartExercise(ex.id)}
              className="bg-[#141418] hover:bg-neutral-800/60 border border-neutral-800 rounded-2xl p-5 cursor-pointer transition transform hover:-translate-y-1 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${ex.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                <Play className="w-5 h-5 fill-white" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                {ex.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">{ex.target}</p>
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
                <span>Recommended:</span>
                <span className="font-semibold text-neutral-300">{ex.reps}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Trend */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
            <p className="text-xs text-neutral-400">Verified repetitions across the last 7 days</p>
          </div>
          <button
            onClick={() => setActivePage('analytics')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            Full Analytics &rarr;
          </button>
        </div>
        <WeeklyActivityChart data={analytics?.weekly_activity || []} />
      </div>

      {/* Recent Workout History */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Workout History</h3>
          <span className="text-xs text-neutral-500 font-mono">SQLite DB Synchronized</span>
        </div>

        {analytics?.recent_sessions && analytics.recent_sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400">
                  <th className="pb-3 font-semibold">Exercise</th>
                  <th className="pb-3 font-semibold">Reps / Hold</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Form Quality</th>
                  <th className="pb-3 font-semibold">Calories</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {analytics.recent_sessions.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 font-bold text-white uppercase">{s.exercise_type}</td>
                    <td className="py-3 font-mono text-neutral-200">{s.reps_completed} reps</td>
                    <td className="py-3 text-neutral-400">{Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        s.avg_quality_score >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        s.avg_quality_score >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {s.avg_quality_score}%
                      </span>
                    </td>
                    <td className="py-3 text-amber-400 font-mono">{s.calories_burned} kcal</td>
                    <td className="py-3 text-neutral-400">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-xs">
            No previous workout sessions recorded. Start your first session to see history!
          </div>
        )}
      </div>
    </div>
  );
}
