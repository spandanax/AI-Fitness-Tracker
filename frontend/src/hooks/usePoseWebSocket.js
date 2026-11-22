import { useState, useEffect, useRef, useCallback } from 'react';

export function usePoseWebSocket(exerciseName, captureFrame, isRunning) {
  const [poseData, setPoseData] = useState({
    exercise: exerciseName,
    reps: 0,
    hold_seconds: 0,
    stage: 'START',
    quality_score: 100,
    angles: {},
    feedback: 'Position yourself in frame to begin tracking',
    status: 'good',
    person_visible: false,
    guidance: 'Position yourself in front of camera',
    duration_seconds: 0,
    fatigue: { fatigue_detected: false, fatigue_level: 'None', message: 'Form is stable' },
    landmarks: [],
    connectionColors: {}
  });

  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const cleanExercise = (exerciseName || 'squat').toLowerCase().trim().replace(/[-\s]+/g, '_');

  // Candidate WebSocket endpoints
  const getCandidateUrls = () => {
    const urls = [];
    const envApiUrl = import.meta.env.VITE_API_URL;
    const isProd = import.meta.env.PROD;

    // 1. If VITE_API_URL is configured, derive ws:// or wss:// from it
    if (envApiUrl) {
      try {
        const trimmed = envApiUrl.replace(/\/+$/, '');
        // Strip any trailing /api/v1 if present in VITE_API_URL
        const originUrl = trimmed.replace(/\/api(\/v1)?$/i, '');
        const wsBase = originUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
        urls.push(`${wsBase}/ws/workout/${cleanExercise}`);
      } catch (e) {
        console.warn('Failed to parse VITE_API_URL for WebSocket:', e);
      }
      // When VITE_API_URL is set, do not attempt localhost connections
      return urls;
    }

    // 2. Production fallback without explicit VITE_API_URL uses window.location host
    if (isProd) {
      if (typeof window !== 'undefined' && window.location.host) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        urls.push(`${protocol}//${window.location.host}/ws/workout/${cleanExercise}`);
      }
      return urls;
    }

    // 3. Local development candidates
    if (typeof window !== 'undefined') {
      // Direct IPv4 loopback (port 8000)
      urls.push(`ws://127.0.0.1:8000/ws/workout/${cleanExercise}`);
      // Vite dev server proxy
      if (window.location.host) {
        urls.push(`ws://${window.location.host}/ws/workout/${cleanExercise}`);
      }
      // Fallback localhost:8000
      urls.push(`ws://localhost:8000/ws/workout/${cleanExercise}`);
    } else {
      urls.push(`ws://127.0.0.1:8000/ws/workout/${cleanExercise}`);
    }

    return [...new Set(urls)];
  };

  useEffect(() => {
    let isMounted = true;
    let currentSocket = null;
    let urlIndex = 0;
    const candidateUrls = getCandidateUrls();

    const connect = () => {
      if (!isMounted) return;
      if (urlIndex >= candidateUrls.length) {
        urlIndex = 0; // cycle back
      }

      const targetUrl = candidateUrls[urlIndex];
      setConnected(false);
      setConnectionError(null);

      try {
        const ws = new WebSocket(targetUrl);
        currentSocket = ws;
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          setConnectionError(null);
          console.log(`Connected to AI Pose WebSocket at ${targetUrl} for ${cleanExercise}`);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'command_ack') return;
            setPoseData(prev => ({
              ...prev,
              ...data,
              landmarks: data.landmarks || [],
              connectionColors: data.connection_colors || data.connectionColors || {}
            }));
          } catch (e) {
            console.error('Failed to parse pose response:', e);
          }
        };

        ws.onerror = (err) => {
          if (!isMounted) return;
          console.warn(`WebSocket error on ${targetUrl}:`, err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Try next candidate URL after short delay
          urlIndex++;
          setTimeout(() => {
            if (isMounted) connect();
          }, 1500);
        };
      } catch (err) {
        console.warn('WebSocket init exception:', err);
        urlIndex++;
        setTimeout(() => {
          if (isMounted) connect();
        }, 1500);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
        currentSocket.close();
      }
    };
  }, [cleanExercise]);

  // Frame sender loop (runs continuously when connected and webcam capture is available)
  useEffect(() => {
    if (!connected || !captureFrame) return;

    intervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const frameB64 = captureFrame();
      if (frameB64) {
        try {
          wsRef.current.send(JSON.stringify({
            image: frameB64,
            active: isRunningRef.current
          }));
        } catch (err) {
          console.warn('Failed to send frame to WebSocket:', err);
        }
      }
    }, 66); // ~15 FPS

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connected, captureFrame]);

  const sendCommand = useCallback((command, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command, ...payload }));
    }
  }, []);

  const resetExercise = useCallback(() => {
    sendCommand('reset');
    setPoseData(prev => ({
      ...prev,
      reps: 0,
      hold_seconds: 0,
      stage: 'START',
      quality_score: 100,
      feedback: 'Ready. Begin your movement.',
      status: 'good',
      duration_seconds: 0,
      fatigue: { fatigue_detected: false, fatigue_level: 'None', message: 'Form is stable' },
      landmarks: []
    }));
  }, [sendCommand]);

  const pauseExercise = useCallback(() => {
    sendCommand('pause');
  }, [sendCommand]);

  const resumeExercise = useCallback(() => {
    sendCommand('resume');
  }, [sendCommand]);

  return {
    poseData,
    connected,
    connectionError,
    resetExercise,
    pauseExercise,
    resumeExercise
  };
}
