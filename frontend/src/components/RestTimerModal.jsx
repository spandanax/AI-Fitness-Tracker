import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Bell } from 'lucide-react';

export function RestTimerModal({ isOpen, onClose, onTimerFinished }) {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (onTimerFinished) {
        onTimerFinished();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimerFinished]);

  const selectDuration = (secs) => {
    setDuration(secs);
    setTimeLeft(secs);
    setIsActive(false);
  };

  const toggleTimer = () => {
    if (timeLeft === 0) setTimeLeft(duration);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Rest Interval Timer</h3>
        </div>

        {/* Circular Countdown Progress */}
        <div className="relative flex items-center justify-center my-6">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              stroke="#262833"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="84"
              stroke="#3B82F6"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 84}
              strokeDashoffset={2 * Math.PI * 84 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {formattedTime}
            </span>
            <span className="text-xs uppercase tracking-wider text-neutral-400 mt-1">
              {isActive ? 'Resting...' : timeLeft === 0 ? 'Rest Complete!' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[30, 45, 60, 90].map(s => (
            <button
              key={s}
              onClick={() => selectDuration(s)}
              className={`py-2 text-xs font-semibold rounded-xl border transition ${
                duration === s
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {s}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTimer}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isActive ? 'Pause Rest' : 'Start Rest'}
          </button>
          <button
            onClick={resetTimer}
            className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
