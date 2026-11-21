import React, { useState } from 'react';
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';

export function PostureAnalysis({ onStartExercise }) {
  const [activeTab, setActiveTab] = useState('squat');

  const exerciseGuides = {
    squat: {
      title: 'Squat Biomechanics & Fault Detection',
      primaryJoints: 'Hip (23/24), Knee (25/26), Ankle (27/28), Shoulder (11/12)',
      rules: [
        {
          name: 'Squat Depth (Knee Flexion)',
          optimal: '85° - 95° (Thighs parallel to floor)',
          fault: 'Knee angle > 105° (Partial repetition)',
          impact: 'Underdevelops glutes and quadriceps; partial rep rejected by counter.',
          status: 'critical'
        },
        {
          name: 'Spine & Torso Inclination',
          optimal: 'Torso angle >= 60° relative to femur',
          fault: 'Torso angle < 55° (Excessive forward collapse / good-morning squat)',
          impact: 'Shifts excessive shear forces onto the lumbar spine.',
          status: 'warning'
        },
        {
          name: 'Knee-Ankle Horizontal Offset',
          optimal: 'Knees tracking over toes (< 0.20 normalized offset)',
          fault: 'Knees collapsing inward (valgus) or shifting excessively forward',
          impact: 'Increases patellofemoral and ACL joint stress.',
          status: 'warning'
        }
      ]
    },
    pushup: {
      title: 'Push-up Posture & Spine Alignment',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24), Ankle (27/28)',
      rules: [
        {
          name: 'Elbow Depth & Lockout',
          optimal: 'Elbow angle <= 90° at bottom, > 155° at top',
          fault: 'Elbow angle > 95° (Shallow chest descent)',
          impact: 'Reduces pectoral muscle activation and range-of-motion.',
          status: 'critical'
        },
        {
          name: 'Plank Line Alignment',
          optimal: 'Shoulder-Hip-Ankle angle 160° - 180°',
          fault: 'Hip angle < 150° (Sagging hips or pike)',
          impact: 'Exposes lower back to hyperextension; core loses engagement.',
          status: 'warning'
        }
      ]
    },
    plank: {
      title: 'Plank Core Stabilization Mechanics',
      primaryJoints: 'Shoulder (11/12), Hip (23/24), Ankle (27/28)',
      rules: [
        {
          name: 'Spine Neutrality (Rigid Line)',
          optimal: 'Body angle 160° - 180° with horizontal alignment',
          fault: 'Angle < 155° (Sagging belly or peaked hips)',
          impact: 'Transfers tension off core onto the lumbar vertebrae; pauses timer.',
          status: 'critical'
        }
      ]
    },
    bicep_curls: {
      title: 'Bicep Curl Isolation Biomechanics',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24)',
      rules: [
        {
          name: 'Peak Flexion & Extension',
          optimal: 'Elbow angle <= 45° at peak, > 150° at baseline',
          fault: 'Elbow angle > 50° at top (Incomplete contraction)',
          impact: 'Misses peak tension at the short head of the biceps.',
          status: 'critical'
        },
        {
          name: 'Elbow Translation & Body Swing',
          optimal: 'Elbow stays pinned within 0.12 of shoulder line',
          fault: 'Elbow flaring forward or torso rocking back and forth',
          impact: 'Momentum cheating reduces bicep hypertrophy stimulus.',
          status: 'warning'
        }
      ]
    }
  };

  const currentGuide = exerciseGuides[activeTab] || exerciseGuides.squat;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Posture Correction Engine</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Explainable, rule-based biomechanical analysis evaluating real-time joints, angles, and postural faults
        </p>
      </div>

      {/* Exercise Selector Tabs */}
      <div className="flex gap-2 border-b border-neutral-800 pb-3">
        {Object.keys(exerciseGuides).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Active Guide Card */}
      <div className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{currentGuide.title}</h2>
            <p className="text-xs text-neutral-400 mt-1">
              <strong>Tracked Landmarks:</strong> {currentGuide.primaryJoints}
            </p>
          </div>
          <button
            onClick={() => onStartExercise(activeTab)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            Train This Form Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {currentGuide.rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <ScanEye className="w-4 h-4 text-blue-400" />
                  {rule.name}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  rule.status === 'critical'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {rule.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Target Form Criteria</span>
                  </div>
                  <p>{rule.optimal}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Detected Fault Condition</span>
                  </div>
                  <p>{rule.fault}</p>
                </div>
              </div>

              <div className="text-xs text-neutral-400 pt-1">
                <strong className="text-neutral-300">Biomechanical Impact:</strong> {rule.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
