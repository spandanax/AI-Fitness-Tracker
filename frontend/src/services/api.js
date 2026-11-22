// Backend API Base Configuration:
// In production or when VITE_API_URL is configured, use it directly (ensuring /api/v1 suffix).
// In local development without VITE_API_URL, fall back to localhost / proxy candidates.
const envApiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD;

const getCandidateBases = () => {
  if (envApiUrl) {
    const trimmed = envApiUrl.replace(/\/+$/, '');
    const baseWithApi = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
    // When an explicit backend URL is provided (e.g., in production), only use that URL
    return [baseWithApi];
  }

  if (isProd) {
    // Production without explicit VITE_API_URL uses origin-relative /api/v1
    return ['/api/v1'];
  }

  // Local development fallbacks only
  return [
    'http://127.0.0.1:8000/api/v1',
    'http://localhost:8000/api/v1',
    '/api/v1'
  ];
};

const CANDIDATE_BASES = getCandidateBases();

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
      if (res.status === 500 && base === '/api/v1' && !isProd) {
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
  const failureMsg = envApiUrl
    ? `Unable to connect to backend at ${envApiUrl}: ${lastError?.message || 'Network error'}`
    : `Unable to connect to backend server: ${lastError?.message || 'Connection refused'}`;
  throw new Error(failureMsg);
}

async function handleResponse(res, errorMessage) {
  if (!res.ok) {
    let errorBody = '';
    try {
      errorBody = await res.text();
    } catch {
      errorBody = res.statusText;
    }

    if (res.status === 500 && (!errorBody || errorBody.includes('ECONNREFUSED')) && !envApiUrl) {
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
