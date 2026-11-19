import React from 'react';
import { Sparkles, TrendingUp, Award } from 'lucide-react';

export function QualityScoreCard({ score = 100, lastRep = null }) {
  const getScoreColor = (s) => {
    if (s >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (s >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return 'Elite Technique';
    if (s >= 80) return 'Solid Form';
    if (s >= 70) return 'Acceptable';
    return 'Needs Attention';
  };

  return (
    <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Form Quality Score
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>

      <div className="flex items-baseline gap-2 my-2">
        <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
          {score}
        </span>
        <span className="text-sm font-semibold text-neutral-500">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden my-1">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 85 ? 'bg-gradient-to-r from-blue-500 to-emerald-400' :
            score >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
            'bg-gradient-to-r from-rose-600 to-rose-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {lastRep ? (
        <div className="mt-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Last Rep #{lastRep.rep_number}:</span>
          <span className="text-neutral-200 font-medium">
            {lastRep.duration ? `${lastRep.duration}s • ` : ''}{lastRep.faults || 'Clean'}
          </span>
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-500">
          Evaluates ROM, joint alignment & stability
        </div>
      )}
    </div>
  );
}
