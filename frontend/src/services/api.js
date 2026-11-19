const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  // Users
  async getUser(userId = 1) {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(userId, data) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return res.json();
  },

  // Exercises
  async getExercises() {
    const res = await fetch(`${API_BASE}/exercises/`);
    if (!res.ok) throw new Error('Failed to fetch exercise catalog');
    return res.json();
  },

  async getExercise(exerciseId) {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}`);
    if (!res.ok) throw new Error('Failed to fetch exercise details');
    return res.json();
  },

  // Workouts
  async startWorkout(userId, exerciseType, targetReps = 10) {
    const res = await fetch(`${API_BASE}/workouts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, exercise_type: exerciseType, target_reps: targetReps }),
    });
    if (!res.ok) throw new Error('Failed to start workout');
    return res.json();
  },

  async finishWorkout(sessionId, finishData) {
    const res = await fetch(`${API_BASE}/workouts/${sessionId}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finishData),
    });
    if (!res.ok) throw new Error('Failed to finish workout');
    return res.json();
  },

  async getWorkouts(userId = 1, limit = 50) {
    const res = await fetch(`${API_BASE}/workouts/?user_id=${userId}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return res.json();
  },

  async getWorkoutDetail(sessionId) {
    const res = await fetch(`${API_BASE}/workouts/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch workout details');
    return res.json();
  },

  // Analytics
  async getAnalytics(userId = 1) {
    const res = await fetch(`${API_BASE}/analytics/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Achievements
  async getAchievements(userId = 1) {
    const res = await fetch(`${API_BASE}/achievements/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch achievements');
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(limit = 50) {
    const res = await fetch(`${API_BASE}/leaderboard/?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },
};
