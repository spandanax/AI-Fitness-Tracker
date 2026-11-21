import React from 'react';
import {
  LayoutDashboard,
  Video,
  BookOpen,
  ScanEye,
  BarChart3,
  CalendarCheck2,
  Trophy,
  Users,
  User,
  Settings,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Workout', icon: Video, badge: 'AI Live' },
    { id: 'exercises', label: 'Exercise Library', icon: BookOpen, count: '13' },
    { id: 'posture', label: 'AI Posture Analysis', icon: ScanEye },
    { id: 'analytics', label: 'Workout Analytics', icon: BarChart3 },
    { id: 'progress', label: 'Weekly Progress', icon: CalendarCheck2 },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  ];

  const bottomItems = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-neutral-800/80 bg-[#0C0D11] flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-1">
        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 py-2">
          Core Workspaces
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-blue-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 font-mono">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-neutral-800/60 space-y-1">
        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 py-1">
          Preferences
        </div>
        {bottomItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <div className="pt-3 px-3">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-400">
            <span className="text-white font-semibold block">MediaPipe Pose v1.0</span>
            <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
              Vision Tracking Engine
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
