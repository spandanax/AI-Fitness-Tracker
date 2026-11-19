import React from 'react';
import { BatteryCharging, BatteryWarning, AlertCircle } from 'lucide-react';

export function FatigueIndicator({ fatigue }) {
  if (!fatigue) return null;

  const { fatigue_detected, fatigue_level, message, speed_drop_pct, quality_drop_pts } = fatigue;

  if (!fatigue_detected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400">
        <BatteryCharging className="w-4 h-4 text-emerald-400" />
        <span>Energy Baseline: Normal</span>
      </div>
    );
  }

  const isHigh = fatigue_level === 'High';

  return (
    <div className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${
      isHigh
        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
        : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
    }`}>
      <div className="flex items-start gap-2.5">
        <BatteryWarning className={`w-5 h-5 shrink-0 mt-0.5 ${isHigh ? 'text-rose-400' : 'text-amber-400'}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              {fatigue_level} Fatigue Detected
            </span>
            <span className="text-[10px] text-neutral-400">Movement Analytics</span>
          </div>
          <p className="text-xs text-neutral-200 mt-1">
            {message}
          </p>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/10 text-[11px] text-neutral-300">
            {speed_drop_pct > 0 && (
              <span>Pace Drop: <strong>+{speed_drop_pct}%</strong> slower</span>
            )}
            {quality_drop_pts > 0 && (
              <span>Form Decline: <strong>-{quality_drop_pts}</strong> pts</span>
            )}
          </div>
          <p className="text-[9px] text-neutral-400 mt-1.5 italic">
            *Non-medical fatigue estimation based on kinematic speed & range-of-motion.
          </p>
        </div>
      </div>
    </div>
  );
}
