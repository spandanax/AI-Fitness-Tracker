import React, { useState } from 'react';
import {
  User,
  Scale,
  Ruler,
  Target,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export function UserProfile({ user, onUserUpdated }) {
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Mercer');
  const [weightKg, setWeightKg] = useState(user?.weight_kg || 70.0);
  const [heightCm, setHeightCm] = useState(user?.height_cm || 175.0);
  const [goal, setGoal] = useState(user?.fitness_goal || 'muscle_building');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const calculateBmi = () => {
    if (!weightKg || !heightCm) return 0;
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await api.updateUser(user?.id || 1, {
        full_name: fullName,
        weight_kg: parseFloat(weightKg),
        height_cm: parseFloat(heightCm),
        fitness_goal: goal,
      });
      setMessage({ type: 'success', text: 'Athlete profile updated successfully!' });
      if (onUserUpdated) onUserUpdated(updated);
    } catch (err) {
      console.error('Failed to update user:', err);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const bmi = calculateBmi();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Athlete Profile</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Personal biometric metrics used for MET calorie estimation and training load calibration
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
          message.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <form onSubmit={handleSave} className="bg-[#141418] border border-neutral-800 rounded-3xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Fitness Goal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">Primary Fitness Goal</label>
            <div className="relative">
              <Target className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="muscle_building">Muscle Hypertrophy & Strength</option>
                <option value="fat_loss">Fat Loss & Conditioning</option>
                <option value="endurance">Endurance & Stamina</option>
                <option value="general_fitness">General Health & Mobility</option>
              </select>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">
              Body Weight (kg) <span className="text-[10px] text-blue-400">(Used for Calorie Equation)</span>
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">Height (cm)</label>
            <div className="relative">
              <Ruler className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="number"
                step="0.5"
                min="100"
                max="250"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Calculated Biometrics Box */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Calculated BMI</span>
            <span className="text-[11px] text-neutral-400">Body Mass Index estimate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-400 font-mono">{bmi}</span>
            <span className="text-xs text-neutral-500">kg/m²</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
