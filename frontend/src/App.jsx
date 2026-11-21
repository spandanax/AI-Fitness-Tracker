import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './pages/HomeDashboard';
import { LiveWorkout } from './pages/LiveWorkout';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { PostureAnalysis } from './pages/PostureAnalysis';
import { WorkoutAnalytics } from './pages/WorkoutAnalytics';
import { WeeklyProgress } from './pages/WeeklyProgress';
import { Achievements } from './pages/Achievements';
import { Leaderboard } from './pages/Leaderboard';
import { UserProfile } from './pages/UserProfile';
import { Settings } from './pages/Settings';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [user, setUser] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const { enabled: voiceEnabled, setEnabled: setVoiceEnabled } = useSpeechSynthesis();

  // Load initial data from backend
  const refreshData = async () => {
    try {
      const [userData, exerciseData, analyticsData] = await Promise.all([
        api.getUser(1).catch(() => null),
        api.getExercises().catch(() => []),
        api.getAnalytics(1).catch(() => null),
      ]);
      if (userData) setUser(userData);
      if (exerciseData) setExercises(exerciseData);
      if (analyticsData) setAnalytics(analyticsData);
    } catch (e) {
      console.warn('Initial data load warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStartExercise = (exerciseId) => {
    setSelectedExercise(exerciseId);
    setActivePage('live');
  };

  const renderActivePage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0C]">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard':
        return (
          <HomeDashboard
            analytics={analytics}
            onStartExercise={handleStartExercise}
            setActivePage={setActivePage}
            user={user}
          />
        );
      case 'live':
        return (
          <LiveWorkout
            initialExercise={selectedExercise}
            user={user}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            onWorkoutSaved={refreshData}
          />
        );
      case 'exercises':
        return (
          <ExerciseLibrary
            exercises={exercises}
            onSelectExercise={handleStartExercise}
            onRefresh={refreshData}
          />
        );
      case 'posture':
        return <PostureAnalysis onStartExercise={handleStartExercise} />;
      case 'analytics':
        return <WorkoutAnalytics analytics={analytics} />;
      case 'progress':
        return <WeeklyProgress analytics={analytics} />;
      case 'achievements':
        return <Achievements user={user} />;
      case 'leaderboard':
        return <Leaderboard user={user} />;
      case 'profile':
        return <UserProfile user={user} onUserUpdated={(u) => setUser(u)} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <HomeDashboard
            analytics={analytics}
            onStartExercise={handleStartExercise}
            setActivePage={setActivePage}
            user={user}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0C] text-gray-100">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        voiceEnabled={voiceEnabled}
        toggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 overflow-y-auto">{renderActivePage()}</main>
      </div>
    </div>
  );
}
