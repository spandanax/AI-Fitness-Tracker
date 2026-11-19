import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export function PostureBadge({ status = 'good', message = 'Maintaining proper alignment' }) {
  const configs = {
    good: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
      dot: 'bg-emerald-400 animate-pulse',
      icon: CheckCircle2,
      label: 'Good Posture',
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
      dot: 'bg-amber-400 animate-ping',
      icon: AlertTriangle,
      label: 'Posture Caution',
    },
    bad: {
      bg: 'bg-rose-950/40 border-rose-500/40 text-rose-400',
      dot: 'bg-rose-500 animate-bounce',
      icon: AlertCircle,
      label: 'Correction Needed',
    },
  };

  const config = configs[status] || configs.good;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md ${config.bg} transition-all duration-300`}>
      <div className="relative flex items-center justify-center">
        <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        <Icon className="w-5 h-5 ml-1.5 shrink-0" />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold tracking-wider uppercase opacity-80">
          {config.label}
        </span>
        <span className="text-sm font-medium text-white leading-tight">
          {message}
        </span>
      </div>
    </div>
  );
}
