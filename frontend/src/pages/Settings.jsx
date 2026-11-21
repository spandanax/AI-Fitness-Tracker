import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  Camera,
  Server,
  Zap,
  CheckCircle2,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export function Settings() {
  const { enabled, setEnabled, rate, setRate, volume, setVolume, speak } = useSpeechSynthesis();
  const [testSuccess, setTestSuccess] = useState(false);

  const handleTestSpeech = () => {
    speak('Form is looking fantastic! Maintain depth and keep your core braced.', { force: true });
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Configure real-time voice synthesis, computer vision sensitivity, and backend network connections
        </p>
      </div>

      {/* Voice Assistant Section */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Browser Speech Synthesis Coach</h3>
            <p className="text-xs text-neutral-400">Real-time audible coaching cues during repetitions</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-white block">Enable Voice Guidance</span>
              <span className="text-xs text-neutral-400">Speak repetition counts, depth reminders, and posture corrections</span>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                enabled ? 'bg-blue-600 justify-end' : 'bg-neutral-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
            </button>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-neutral-400">Speech Rate / Speed</span>
              <span className="text-blue-400 font-mono">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Speech Volume Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-neutral-400">Speech Volume</span>
              <span className="text-blue-400 font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleTestSpeech}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-blue-400" />
              Test Voice Audio
            </button>
            {testSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Speaking sample cue...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Backend & Computer Vision Config */}
      <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Backend & Vision Endpoints</h3>
            <p className="text-xs text-neutral-400">FastAPI backend connection settings</p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-sans font-bold">REST API Base URL</span>
              <span className="text-white">http://localhost:8000/api/v1</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-sans font-bold text-[10px]">
              Ready
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-sans font-bold">WebSocket Streaming Endpoint</span>
              <span className="text-white">ws://localhost:8000/ws/workout/:exercise</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-sans font-bold text-[10px]">
              Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-sans font-bold">Pose Detector Model</span>
              <span className="text-white">MediaPipe Pose (BlazePose Heavy • 33 3D Landmarks)</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-sans font-bold text-[10px]">
              Local
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
