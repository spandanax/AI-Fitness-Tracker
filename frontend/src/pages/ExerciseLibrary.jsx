import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Play,
  Flame,
  Camera,
  Info,
  AlertCircle,
  RotateCcw,
  X,
  Dumbbell,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

// --- Fuzzy Search & Typo-Tolerance Algorithms ---

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return d[m][n];
}

function stem(word) {
  if (!word || word.length < 4) return word;
  return word.replace(/ves$/, 'f').replace(/ies$/, 'y').replace(/(es|s)$/, '');
}

function getMatchScore(ex, rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return 100;

  const qNorm = query.replace(/[^a-z0-9]/g, '');
  const qStem = stem(query);

  const nameLower = (ex.name || '').toLowerCase();
  const nameNorm = nameLower.replace(/[^a-z0-9]/g, '');
  const idLower = (ex.id || '').toLowerCase();
  const idNorm = idLower.replace(/[^a-z0-9]/g, '');
  const categoryLower = (ex.category || '').toLowerCase();
  const descLower = (ex.description || '').toLowerCase();

  // 1. Exact match on name or ID
  if (nameLower === query || nameNorm === qNorm || idLower === query || idNorm === qNorm) {
    return 100;
  }

  // 2. Starts with query
  if (nameLower.startsWith(query) || nameNorm.startsWith(qNorm) || idLower.startsWith(query) || idNorm.startsWith(qNorm)) {
    return 90;
  }

  // 3. Substring of name or ID
  if (nameLower.includes(query) || nameNorm.includes(qNorm) || idLower.includes(query) || idNorm.includes(qNorm)) {
    return 80;
  }

  // 4. Target muscles direct/stem match
  const muscles = Array.isArray(ex.target_muscles) ? ex.target_muscles : [];
  for (const muscle of muscles) {
    const mLower = muscle.toLowerCase();
    const mNorm = mLower.replace(/[^a-z0-9]/g, '');
    if (mLower === query || mNorm === qNorm) return 75;
    if (mLower.includes(query) || mNorm.includes(qNorm) || stem(mLower).includes(qStem) || qStem.includes(stem(mLower))) return 70;
  }

  // 5. Category or description match
  if (categoryLower.includes(query)) return 60;
  if (descLower.includes(query)) return 50;

  // 6. Token matching & stemming
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const nameTokens = nameLower.split(/[\s\-_]+/).filter(Boolean);
  const idTokens = idLower.split(/[\s\-_]+/).filter(Boolean);
  const muscleTokens = muscles.flatMap(m => m.toLowerCase().split(/[\s\-_]+/)).filter(Boolean);

  const allTokens = [...nameTokens, ...idTokens, ...muscleTokens];
  const allStems = allTokens.map(stem);

  const allTokensMatch = queryTokens.every(qTok => {
    const qtStem = stem(qTok);
    return allTokens.some(t => t.startsWith(qTok) || t.includes(qTok)) ||
           allStems.some(s => s.startsWith(qtStem) || s.includes(qtStem) || qtStem.includes(s));
  });

  if (allTokensMatch) return 65;

  // 7. Typo-tolerant edit distance on name/id/muscles
  if (query.length >= 4) {
    const maxDist = query.length <= 7 ? 2 : 3;
    let bestDist = 999;

    for (const token of [...nameTokens, ...idTokens, nameLower, nameNorm, idNorm]) {
      const d1 = levenshtein(query, token);
      const d2 = levenshtein(qStem, stem(token));
      const d = Math.min(d1, d2);
      if (d < bestDist) bestDist = d;
    }

    if (bestDist <= maxDist) {
      return 40 - bestDist * 10;
    }
  }

  return 0;
}

export function ExerciseLibrary({ exercises = [], onSelectExercise, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localExercises, setLocalExercises] = useState(exercises || []);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [detailExercise, setDetailExercise] = useState(null);

  const categories = ['All', 'Lower Body', 'Upper Body', 'Core', 'Cardio & Full Body', 'Arms'];

  // Keep local state in sync with props, and self-heal by fetching from API if empty
  const fetchExercises = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await api.getExercises();
      if (data && Array.isArray(data) && data.length > 0) {
        setLocalExercises(data);
        if (onRefresh) onRefresh();
      } else {
        setApiError('No exercises returned from backend.');
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setApiError(err.message || 'Unable to connect to backend exercises API. Ensure FastAPI is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      setLocalExercises(exercises);
      setApiError(null);
    } else {
      fetchExercises();
    }
  }, [exercises]);

  const matchCategory = (exCategory, selectedCat) => {
    if (!selectedCat || selectedCat === 'All') return true;
    const cat = (exCategory || '').toLowerCase();
    const sel = selectedCat.toLowerCase();
    if (sel === 'cardio & full body') {
      return cat.includes('cardio') || cat.includes('full body') || cat.includes('plyometric');
    }
    if (sel === 'core') return cat.includes('core');
    if (sel === 'arms') return cat.includes('arm');
    if (sel === 'upper body') return cat.includes('upper');
    if (sel === 'lower body') return cat.includes('lower');
    return cat.includes(sel);
  };

  const filteredExercises = useMemo(() => {
    const scored = (localExercises || [])
      .filter(ex => matchCategory(ex.category, selectedCategory))
      .map(ex => ({ ex, score: getMatchScore(ex, search) }))
      .filter(item => item.score > 0);

    // If there are strong matches (score >= 60), drop low-confidence typo fallbacks
    const maxScore = Math.max(0, ...scored.map(s => s.score));
    if (maxScore >= 60) {
      return scored.filter(s => s.score >= 50).map(s => s.ex);
    }

    return scored.map(s => s.ex);
  }, [localExercises, search, selectedCategory]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Exercise Library</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold font-mono">
              {localExercises.length > 0 ? `${localExercises.length} Total` : 'Catalog'}
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            All 13 AI-tracked exercises with anatomical joint angle targets & camera guidance
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or muscles (e.g. squat, pushup)..."
            className="w-full bg-[#141418] border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedCategory === cat
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#141418] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}

        {(search || selectedCategory !== 'All') && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition flex items-center gap-1.5 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* API Connection Error State */}
      {apiError && !isLoading && (
        <div className="p-6 rounded-3xl bg-rose-950/30 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">Exercise Catalog Unavailable</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            onClick={fetchExercises}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-neutral-800 rounded-full"></div>
                <div className="h-4 w-16 bg-neutral-800 rounded-md"></div>
              </div>
              <div className="h-6 w-32 bg-neutral-800 rounded-lg"></div>
              <div className="h-10 w-full bg-neutral-800/60 rounded-lg"></div>
              <div className="h-24 w-full bg-neutral-900 rounded-2xl"></div>
              <div className="h-10 w-full bg-neutral-800/50 rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State When No Results Found */}
      {!isLoading && !apiError && filteredExercises.length === 0 && (
        <div className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shadow-inner">
            <Dumbbell className="w-7 h-7 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No exercises found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {search
                ? `No exercises matched "${search}" in the "${selectedCategory}" category.`
                : `No exercises found in category "${selectedCategory}".`}
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Search & Reset Filters
          </button>
        </div>
      )}

      {/* Exercise Grid */}
      {!isLoading && filteredExercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map(ex => (
            <div
              key={ex.id}
              className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-700 transition space-y-5 group shadow-sm hover:shadow-xl hover:shadow-black/40"
            >
              <div className="space-y-4">
                {/* Category & Difficulty */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {ex.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    ex.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                    ex.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {ex.difficulty}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => setDetailExercise(ex)}
                      className="text-xl font-bold text-white group-hover:text-blue-400 transition cursor-pointer"
                    >
                      {ex.name}
                    </h3>
                    <button
                      onClick={() => setDetailExercise(ex)}
                      className="text-neutral-500 hover:text-blue-400 p-1 transition"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                {/* Target Muscles */}
                <div className="flex flex-wrap gap-1.5">
                  {ex.target_muscles?.map(m => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Angle Targets Box */}
                {ex.angle_targets && (
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      <span>Biomechanical Angle Targets</span>
                    </div>
                    {Object.entries(ex.angle_targets).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-neutral-400">
                        <span className="capitalize">{k.replace('_', ' ')}:</span>
                        <span className="font-mono font-semibold text-blue-300">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Camera Guidance Box */}
                {ex.camera_setup && (
                  <div className="flex items-start gap-2 text-[11px] text-neutral-400">
                    <Camera className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <span>{ex.camera_setup}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold font-mono">
                  <Flame className="w-4 h-4" />
                  <span>MET {ex.met_value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailExercise(ex)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs transition"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onSelectExercise(ex.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Start Workout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141418] border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {detailExercise.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    detailExercise.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                    detailExercise.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {detailExercise.difficulty}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10">
                    MET {detailExercise.met_value}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{detailExercise.name}</h2>
              </div>
              <button
                onClick={() => setDetailExercise(null)}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-300 leading-relaxed">
              {detailExercise.description}
            </p>

            {/* Target Muscles */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Target Muscle Groups</h4>
              <div className="flex flex-wrap gap-2">
                {detailExercise.target_muscles?.map(m => (
                  <span key={m} className="text-xs px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Coaching Cues */}
            {detailExercise.key_cues && detailExercise.key_cues.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Form & Technique Cues</h4>
                <div className="space-y-2">
                  {detailExercise.key_cues.map((cue, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Biomechanical Angle Targets */}
            {detailExercise.angle_targets && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Target Joint Angles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(detailExercise.angle_targets).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 flex justify-between items-center text-xs">
                      <span className="text-neutral-400 capitalize">{k.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-blue-400">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Camera Setup Guidance */}
            {detailExercise.camera_setup && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
                <Camera className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Camera Positioning</span>
                  <span>{detailExercise.camera_setup}</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setDetailExercise(null)}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectExercise(detailExercise.id);
                  setDetailExercise(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
