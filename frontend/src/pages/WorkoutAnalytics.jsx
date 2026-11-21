import React from 'react';
import {
  Activity,
  Flame,
  Award,
  Calendar,
  Timer,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { WeeklyActivityChart } from '../charts/WeeklyActivityChart';
import { QualityTrendChart } from '../charts/QualityTrendChart';
import { ExerciseDistributionChart } from '../charts/ExerciseDistributionChart';

export function WorkoutAnalytics({ analytics }) {
  const formatSeconds = (secs) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workout Analytics</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Detailed biomechanical trends, exercise volume, and physiological estimates from SQLite database
        </p>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Workouts</span>
          <div className="text-3xl font-extrabold text-white font-mono">{analytics?.total_workouts || 0}</div>
          <span className="text-xs text-neutral-500">Verified session records</span>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Repetitions</span>
          <div className="text-3xl font-extrabold text-indigo-400 font-mono">{analytics?.total_reps || 0}</div>
          <span className="text-xs text-neutral-500">Counted via pose estimation</span>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Active Duration</span>
          <div className="text-3xl font-extrabold text-blue-400 font-mono">
            {formatSeconds(analytics?.total_duration_seconds || 0)}
          </div>
          <span className="text-xs text-neutral-500">Time under tension</span>
        </div>

        <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Estimated Calories</span>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">{analytics?.total_calories || 0} kcal</div>
          <span className="text-xs text-neutral-500">MET-based physiological model</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Daily Workout Repetitions</h3>
          </div>
          <WeeklyActivityChart data={analytics?.weekly_activity || []} />
        </div>

        <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Movement Quality Score Trajectory</h3>
          </div>
          <QualityTrendChart data={analytics?.weekly_activity || []} />
        </div>
      </div>

      {/* Exercise Distribution & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Exercise Distribution</h3>
          </div>
          <ExerciseDistributionChart data={analytics?.exercise_breakdown || []} />
        </div>

        <div className="lg:col-span-7 bg-[#141418] border border-neutral-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Exercise Breakdown Stats</h3>
          {analytics?.exercise_breakdown && analytics.exercise_breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="pb-3 font-semibold">Exercise</th>
                    <th className="pb-3 font-semibold">Sessions</th>
                    <th className="pb-3 font-semibold">Reps</th>
                    <th className="pb-3 font-semibold">Quality</th>
                    <th className="pb-3 font-semibold">Calories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {analytics.exercise_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/30 transition">
                      <td className="py-3 font-bold text-white uppercase">{row.exercise_type}</td>
                      <td className="py-3 text-neutral-300 font-mono">{row.total_workouts}</td>
                      <td className="py-3 text-blue-400 font-mono font-bold">{row.total_reps}</td>
                      <td className="py-3 text-emerald-400 font-mono">{row.avg_quality_score}%</td>
                      <td className="py-3 text-amber-400 font-mono">{row.total_calories} kcal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No exercise breakdown logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
