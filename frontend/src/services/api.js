// Base endpoints to try:
// 1. Direct http://127.0.0.1:8000/api/v1 (IPv4 loopback, fastest, avoids proxy 500)
// 2. Direct http://localhost:8000/api/v1
// 3. Vite dev server proxy '/api/v1'
const CANDIDATE_BASES = [
  'http://127.0.0.1:8000/api/v1',
  'http://localhost:8000/api/v1',
  '/api/v1'
];

let workingBase = null;

async function request(endpoint, options = {}) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const basesToTry = workingBase
    ? [workingBase, ...CANDIDATE_BASES.filter(b => b !== workingBase)]
    : CANDIDATE_BASES;

  let lastError = null;
  let lastRes = null;

  for (const base of basesToTry) {
    try {
      const url = `${base}${path}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      // If Vite proxy returns 500 (target backend unreachable), don't treat as workingBase; try direct backend URLs
      if (res.status === 500 && base === '/api/v1') {
        lastRes = res;
        continue;
      }

      // If connection succeeded
      workingBase = base;
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastRes) return lastRes;
  throw new Error(`Unable to connect to backend server on port 8000: ${lastError?.message || 'Connection refused'}`);
}

async function handleResponse(res, errorMessage) {
  if (!res.ok) {
    let errorBody = '';
    try {
      errorBody = await res.text();
    } catch {
      errorBody = res.statusText;
    }

    if (res.status === 500 && (!errorBody || errorBody.includes('ECONNREFUSED'))) {
      throw new Error(`Backend server is not running on port 8000. Start it by running 'python run_backend.py' in your terminal.`);
    }

    throw new Error(`${errorMessage} (${res.status}): ${errorBody || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Users
  async getUser(userId = 1) {
    const res = await request(`/users/${userId}`);
    return handleResponse(res, 'Failed to fetch user');
  },

  async updateUser(userId, data) {
    const res = await request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to update user profile');
  },

  // Exercises
  async getExercises() {
    const res = await request('/exercises/');
    return handleResponse(res, 'Failed to fetch exercise catalog');
  },

  async getExercise(exerciseId) {
    const res = await request(`/exercises/${exerciseId}`);
    return handleResponse(res, 'Failed to fetch exercise details');
  },

  // Workouts
  async startWorkout(userId, exerciseType, targetReps = 10) {
    const res = await request('/workouts/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, exercise_type: exerciseType, target_reps: targetReps }),
    });
    return handleResponse(res, 'Failed to start workout');
  },

  async finishWorkout(sessionId, finishData) {
    const res = await request(`/workouts/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify(finishData),
    });
    return handleResponse(res, 'Failed to finish workout');
  },

  async getWorkouts(userId = 1, limit = 50) {
    const res = await request(`/workouts/?user_id=${userId}&limit=${limit}`);
    return handleResponse(res, 'Failed to fetch workouts');
  },

  async getWorkoutDetail(sessionId) {
    const res = await request(`/workouts/${sessionId}`);
    return handleResponse(res, 'Failed to fetch workout details');
  },

  // Analytics
  async getAnalytics(userId = 1) {
    const res = await request(`/analytics/${userId}`);
    return handleResponse(res, 'Failed to fetch analytics');
  },

  // Achievements
  async getAchievements(userId = 1) {
    const res = await request(`/achievements/${userId}`);
    return handleResponse(res, 'Failed to fetch achievements');
  },

  // Leaderboard
  async getLeaderboard(limit = 50) {
    const res = await request(`/leaderboard/?limit=${limit}`);
    return handleResponse(res, 'Failed to fetch leaderboard');
  },
};
