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
    if (typeof window !== 'undefined') {
      const is127 = window.location.hostname === '127.0.0.1';
      if (is127) {
        urls.push(`ws://127.0.0.1:8000/ws/workout/${cleanExercise}`);
        urls.push(`ws://localhost:8000/ws/workout/${cleanExercise}`);
      } else {
        urls.push(`ws://localhost:8000/ws/workout/${cleanExercise}`);
        urls.push(`ws://127.0.0.1:8000/ws/workout/${cleanExercise}`);
      }
      // Also try Vite dev proxy ws
      if (window.location.port === '5173') {
        urls.push(`ws://${window.location.host}/ws/workout/${cleanExercise}`);
      }
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
