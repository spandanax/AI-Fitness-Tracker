import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer,
  Flame,
  Zap,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  RefreshCw,
  Loader2,
  Target,
  Trophy,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { usePoseWebSocket } from '../hooks/usePoseWebSocket';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SkeletonCanvas } from '../components/SkeletonCanvas';
import { PostureBadge } from '../components/PostureBadge';
import { QualityScoreCard } from '../components/QualityScoreCard';
import { FatigueIndicator } from '../components/FatigueIndicator';
import { RestTimerModal } from '../components/RestTimerModal';
import { api } from '../services/api';

const ALL_EXERCISES = [
  { id: 'squat', name: 'Squats', target: 'Lower Body' },
  { id: 'pushup', name: 'Push-ups', target: 'Upper Body' },
  { id: 'pullup', name: 'Pull-ups', target: 'Upper Body' },
  { id: 'dip', name: 'Dips', target: 'Upper Body' },
  { id: 'lunge', name: 'Lunges', target: 'Lower Body' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', target: 'Cardio' },
  { id: 'plank', name: 'Plank', target: 'Core Stability' },
  { id: 'bicep_curls', name: 'Bicep Curls', target: 'Arms' },
  { id: 'shoulder_press', name: 'Shoulder Press', target: 'Upper Body' },
  { id: 'mountain_climbers', name: 'Mountain Climbers', target: 'Core' },
  { id: 'crunches', name: 'Crunches', target: 'Core' },
  { id: 'burpees', name: 'Burpees', target: 'Full Body' },
  { id: 'calf_raises', name: 'Calf Raises', target: 'Lower Body' },
];

const REP_TARGET_PRESETS = [5, 10, 12, 15, 20];
const PLANK_TARGET_PRESETS = [15, 30, 45, 60, 90];

export function LiveWorkout({
  initialExercise = 'squat',
  user,
  voiceEnabled: externalVoiceEnabled,
  setVoiceEnabled: externalSetVoiceEnabled,
  onWorkoutSaved
}) {
  const [exercise, setExercise] = useState(initialExercise);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [summaryModalData, setSummaryModalData] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Countdown & Sets state
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1 | 'START'
  const [targetReps, setTargetReps] = useState(initialExercise === 'plank' ? 30 : 12);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState([]);

  // Hooks
  const { videoRef, permissionGranted, error: webcamError, errorType, isLoading: cameraLoading, startCamera, captureFrame } = useWebcam();
  const { poseData, connected, resetExercise, pauseExercise, resumeExercise } = usePoseWebSocket(exercise, captureFrame, isRunning);
  const { speak, enabled: localVoiceEnabled, setEnabled: localSetVoiceEnabled } = useSpeechSynthesis();

  const voiceEnabled = externalVoiceEnabled !== undefined ? externalVoiceEnabled : localVoiceEnabled;
  const setVoiceEnabled = externalSetVoiceEnabled !== undefined ? externalSetVoiceEnabled : localSetVoiceEnabled;

  const prevRepsRef = useRef(0);
  const prevFeedbackRef = useRef('');
  const hasAnnouncedTargetRef = useRef(false);
  const countdownTimeoutsRef = useRef([]);

  // Sync target when exercise switches
  useEffect(() => {
    if (exercise === 'plank') {
      setTargetReps(30);
    } else {
      setTargetReps(12);
    }
    setIsCustomTarget(false);
    hasAnnouncedTargetRef.current = false;
  }, [exercise]);

  // Workout duration timer
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setWorkoutDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle Speech Feedback when feedback or reps change
  useEffect(() => {
    if (!isRunning) return;

    // Rep completion vocalization
    if (poseData.reps > prevRepsRef.current) {
      prevRepsRef.current = poseData.reps;
      if (exercise === 'plank') {
        if (poseData.reps % 10 === 0 && poseData.reps > 0) {
          speak(`${poseData.reps} seconds held! Strong core.`, { cooldownMs: 3000, force: true });
        }
      } else {
        speak(`${poseData.reps}`, { cooldownMs: 1100, force: true });
      }
    }

    // Voice posture guidance (with cooldown to prevent repetitive spam)
    if (poseData.feedback && poseData.feedback !== prevFeedbackRef.current) {
      prevFeedbackRef.current = poseData.feedback;
      if (poseData.status === 'warning' || poseData.status === 'bad') {
        speak(poseData.feedback, { cooldownMs: 4000 });
      }
    }
  }, [poseData.reps, poseData.feedback, poseData.status, isRunning, exercise, speak]);

  // Target reached celebration
  useEffect(() => {
    if (!isRunning || hasAnnouncedTargetRef.current) return;
    if (targetReps > 0 && poseData.reps >= targetReps) {
      hasAnnouncedTargetRef.current = true;
      speak(`Target reached! ${poseData.reps} ${exercise === 'plank' ? 'seconds held' : 'reps completed'}. Outstanding effort!`, { force: true });
    }
  }, [poseData.reps, targetReps, isRunning, exercise, speak]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const clearCountdown = () => {
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    countdownTimeoutsRef.current = [];
    setCountdown(null);
  };

  // Trigger 3-2-1-START countdown
  const startCountdownAndWorkout = () => {
    clearCountdown();
    setCountdown(3);
    speak('Three', { force: true });

    const t1 = setTimeout(() => {
      setCountdown(2);
      speak('Two', { force: true });
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdown(1);
      speak('One', { force: true });
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdown('START');
      speak('Start!', { force: true });
    }, 3000);

    const t4 = setTimeout(() => {
      setCountdown(null);
      handleStartWorkout();
    }, 3800);

    countdownTimeoutsRef.current = [t1, t2, t3, t4];
  };

  // Start Workout Session on backend
  const handleStartWorkout = async () => {
    try {
      if (!activeSessionId) {
        const sess = await api.startWorkout(user?.id || 1, exercise, targetReps);
        setActiveSessionId(sess.id);
      }
      setIsRunning(true);
      resetExercise();
      prevRepsRef.current = 0;
      hasAnnouncedTargetRef.current = false;
    } catch (err) {
      console.error('Failed to initialize workout session:', err);
      setIsRunning(true); // Still allow tracking offline
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (isRunning) {
      setIsRunning(false);
      pauseExercise();
      speak('Workout paused.', { force: true });
    } else {
      setIsRunning(true);
      resumeExercise();
      speak('Resuming workout.', { force: true });
    }
  };

  // Complete current set and transition to next set
  const handleNextSet = () => {
    setIsRunning(false);
    pauseExercise();

    const currentReps = poseData.reps;
    const currentQuality = poseData.quality_score;
    const setRecord = {
      setNumber: currentSet,
      reps: currentReps,
      target: targetReps,
      qualityScore: currentQuality,
      durationSeconds: workoutDuration
    };

    setCompletedSets(prev => [...prev, setRecord]);
    setCurrentSet(s => s + 1);
    hasAnnouncedTargetRef.current = false;
    resetExercise();
    prevRepsRef.current = 0;
    setShowRestTimer(true);
    speak(`Set ${currentSet} completed with ${currentReps} ${exercise === 'plank' ? 'seconds' : 'reps'}. Rest now.`, { force: true });
  };

  // Rest Timer Finished
  const handleRestFinished = () => {
    setShowRestTimer(false);
    speak(`Rest interval complete! Get ready for Set ${currentSet}.`, { force: true });
    startCountdownAndWorkout();
  };

  // Stop & Save Workout
  const handleStopWorkout = async () => {
    clearCountdown();
    setIsRunning(false);
    pauseExercise();
    setIsFinishing(true);

    const previousReps = completedSets.reduce((acc, s) => acc + (s.reps || 0), 0);
    const totalReps = previousReps + poseData.reps;
    const totalSets = completedSets.length + (poseData.reps > 0 ? 1 : 0);

    const allScores = [...completedSets.map(s => s.qualityScore), poseData.quality_score].filter(Boolean);
    const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 100;

    const finishPayload = {
      duration_seconds: workoutDuration,
      reps_completed: totalReps,
      sets_completed: Math.max(1, totalSets),
      avg_quality_score: avgScore,
      fatigue_detected: poseData.fatigue?.fatigue_detected || false,
      feedback_summary: poseData.feedback || 'Completed workout session',
      reps: []
    };

    if (activeSessionId) {
      try {
        const result = await api.finishWorkout(activeSessionId, finishPayload);
        setSummaryModalData(result);
        speak('Workout completed! Outstanding effort.', { force: true });
        if (onWorkoutSaved) onWorkoutSaved();
      } catch (e) {
        console.error('Failed to finish workout on backend:', e);
        setSummaryModalData({
          session: {
            exercise_type: exercise,
            reps_completed: totalReps,
            sets_completed: Math.max(1, totalSets),
            duration_seconds: workoutDuration,
            avg_quality_score: avgScore
          },
          calories_burned: Math.round((workoutDuration / 60) * 7.5 * 10) / 10,
          newly_unlocked_achievements: []
        });
      }
    } else {
      setSummaryModalData({
        session: {
          exercise_type: exercise,
          reps_completed: totalReps,
          sets_completed: Math.max(1, totalSets),
          duration_seconds: workoutDuration,
          avg_quality_score: avgScore
        },
        calories_burned: Math.round((workoutDuration / 60) * 7.5 * 10) / 10,
        newly_unlocked_achievements: []
      });
    }

    setIsFinishing(false);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const presets = exercise === 'plank' ? PLANK_TARGET_PRESETS : REP_TARGET_PRESETS;
  const isTargetReached = targetReps > 0 && poseData.reps >= targetReps;
  const progressPercent = targetReps > 0 ? Math.min(100, Math.round((poseData.reps / targetReps) * 100)) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141418] border border-neutral-800/80 rounded-2xl p-4">
        {/* Exercise Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-neutral-400">Exercise:</label>
          <select
            value={exercise}
            disabled={isRunning || countdown !== null}
            onChange={(e) => {
              setExercise(e.target.value);
              resetExercise();
              setCurrentSet(1);
              setCompletedSets([]);
            }}
            className="bg-neutral-900 border border-neutral-700 text-white text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
          >
            {ALL_EXERCISES.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.target})
              </option>
            ))}
          </select>

          {/* Set Badge */}
          <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
            Set {currentSet}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isRunning && workoutDuration === 0 && countdown === null ? (
            <button
              onClick={startCountdownAndWorkout}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Workout
            </button>
          ) : countdown !== null ? (
            <button
              onClick={clearCountdown}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm flex items-center gap-2 border border-neutral-700"
            >
              Cancel Countdown
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePause}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                {isRunning ? 'Pause' : 'Resume'}
              </button>

              <button
                onClick={handleNextSet}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                title="Finish current set and rest before the next set"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="hidden sm:inline">Next Set</span>
              </button>

              <button
                onClick={handleStopWorkout}
                disabled={isFinishing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 transition"
              >
                <Square className="w-4 h-4 fill-white" />
                Finish Workout
              </button>
            </>
          )}

          {/* Rest Timer Button */}
          <button
            onClick={() => setShowRestTimer(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-2 transition"
            title="Open Rest Timer"
          >
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Rest Timer</span>
          </button>

          {/* Skeleton Toggle */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`p-2.5 rounded-xl border transition ${
              showSkeleton
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white'
            }`}
            title={showSkeleton ? 'Hide Skeleton Overlay' : 'Show Skeleton Overlay'}
          >
            {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Camera Video Left + Live Metrics Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Live Webcam Panel */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Skeleton Canvas Overlay */}
            {showSkeleton && (
              <SkeletonCanvas
                landmarks={poseData.landmarks}
                status={poseData.status}
                angles={poseData.angles}
                connectionColors={poseData.connectionColors}
              />
            )}

            {/* Countdown Overlay (3-2-1-START) */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in duration-200">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-40 h-40 rounded-full border-4 border-blue-500/30 animate-ping absolute" />
                  <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                    <span className="text-6xl font-black text-white font-mono tracking-tighter">
                      {countdown}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {countdown === 'START' ? 'Go! Perform Your Movement' : 'Get into Position!'}
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  {ALL_EXERCISES.find(e => e.id === exercise)?.name} • Set {currentSet}
                </p>
                <button
                  onClick={clearCountdown}
                  className="px-4 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Top Overlay: Camera Positioning Guidance & Connection */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${
                  connected
                    ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/70 text-rose-400 border-rose-500/30'
                }`}>
                  {connected ? '● AI Vision Active' : '○ Connecting...'}
                </span>
                {poseData.guidance && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-black/60 text-neutral-200 border border-neutral-700/60 backdrop-blur-md">
                    {poseData.guidance}
                  </span>
                )}
              </div>

              {/* Workout Duration Clock */}
              <div className="px-3.5 py-1.5 rounded-full bg-black/70 border border-neutral-700 text-white font-mono font-bold text-xs backdrop-blur-md flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-blue-400" />
                <span>{formatTimer(workoutDuration)}</span>
              </div>
            </div>

            {/* Bottom Overlay: Live Posture Feedback Badge */}
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex items-end justify-between">
              <div className="pointer-events-auto max-w-md">
                <PostureBadge
                  status={poseData.status}
                  message={poseData.feedback}
                />
              </div>

              {/* Joint Angles Floating Card */}
              {Object.keys(poseData.angles).length > 0 && (
                <div className="pointer-events-auto bg-black/70 border border-neutral-800 backdrop-blur-md rounded-xl px-3 py-2 text-[11px] font-mono text-neutral-300 space-y-0.5">
                  {Object.entries(poseData.angles).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-neutral-400 capitalize">{k.replace('_', ' ')}:</span>
                      <span className="font-bold text-blue-400">{Math.round(v)}°</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(cameraLoading || webcamError) && (
              <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
                {cameraLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Initializing Camera…</h3>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Camera Permission Required</h3>
                    <p className="text-sm text-neutral-400 max-w-sm mb-4">{webcamError}</p>
                    <p className="text-xs text-neutral-500 mb-2">Please grant webcam access in your browser toolbar.</p>
                    <button onClick={startCamera} className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500 text-rose-400 rounded hover:bg-rose-500/30">
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Fatigue Warning Banner */}
          <FatigueIndicator fatigue={poseData.fatigue} />
        </div>

        {/* Right Sidebar: Real-time Stats & Gauges */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Big Repetition Counter */}
          <div className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {exercise === 'plank' ? 'Hold Duration' : 'Repetitions'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Stage: {poseData.stage}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-7xl font-extrabold text-white font-mono tracking-tight leading-none">
                {poseData.reps}
              </span>
              <span className="text-lg font-bold text-neutral-400">
                {exercise === 'plank' ? 'seconds' : 'completed'}
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 my-3">
              <div className="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isTargetReached
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Target: {targetReps} {exercise === 'plank' ? 's' : 'reps'}</span>
                <span className={`font-semibold ${isTargetReached ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {isTargetReached ? 'Target Reached! 🎉' : `${Math.max(0, targetReps - poseData.reps)} to goal`}
                </span>
              </div>
            </div>

            {/* Target Selector Buttons */}
            <div className="pt-3 border-t border-neutral-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Rep Target
                </span>
                <button
                  onClick={() => setIsCustomTarget(!isCustomTarget)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  {isCustomTarget ? 'Presets' : 'Custom'}
                </button>
              </div>

              {!isCustomTarget ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {presets.map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setTargetReps(val);
                        hasAnnouncedTargetRef.current = false;
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                        targetReps === val
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={targetReps}
                    onChange={(e) => {
                      setTargetReps(Math.max(1, parseInt(e.target.value) || 1));
                      hasAnnouncedTargetRef.current = false;
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter target..."
                  />
                  <span className="text-xs text-neutral-400 font-semibold">{exercise === 'plank' ? 'sec' : 'reps'}</span>
                </div>
              )}
            </div>

            {/* Subtle glow */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Form Quality Score Card */}
          <QualityScoreCard
            score={poseData.quality_score}
            lastRep={poseData.last_rep}
          />

          {/* Sets History Card */}
          {completedSets.length > 0 && (
            <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Completed Sets ({completedSets.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {completedSets.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-neutral-900/70 border border-neutral-800">
                    <span className="font-bold text-white">Set {s.setNumber}</span>
                    <span className="text-neutral-300 font-mono">{s.reps} {exercise === 'plank' ? 's' : 'reps'}</span>
                    <span className="text-emerald-400 font-semibold font-mono">{Math.round(s.qualityScore)}% quality</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Assistant Status Card */}
          <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${voiceEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-neutral-500'}`}>
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Speech Synthesis</span>
                <span className="text-[11px] text-neutral-400">
                  {voiceEnabled ? 'Active spoken coaching cues' : 'Audio guidance muted'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                voiceEnabled
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400'
              }`}
            >
              {voiceEnabled ? 'Mute' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        onTimerFinished={handleRestFinished}
      />

      {/* Workout Completion Summary Modal */}
      {summaryModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141418] border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">Workout Completed!</h3>
              <p className="text-xs text-neutral-400">Great session! Data saved to your workout history.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Reps</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {summaryModalData.session?.reps_completed || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Duration</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {formatTimer(summaryModalData.session?.duration_seconds || 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Est. Calories</span>
                <span className="text-2xl font-extrabold text-amber-400 font-mono">
                  {summaryModalData.calories_burned || 0} kcal
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Form Quality</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {Math.round(summaryModalData.session?.avg_quality_score || 0)}%
                </span>
              </div>
            </div>

            {/* Achievements Unlocked */}
            {summaryModalData.newly_unlocked_achievements && summaryModalData.newly_unlocked_achievements.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Achievement Unlocked!</span>
                </div>
                {summaryModalData.newly_unlocked_achievements.map(ach => (
                  <div key={ach.badge_key} className="text-xs">
                    <strong className="text-white">{ach.title}:</strong> {ach.description} (+{ach.points_awarded} pts)
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setSummaryModalData(null);
                setWorkoutDuration(0);
                setCurrentSet(1);
                setCompletedSets([]);
                resetExercise();
              }}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
