import { useState, useEffect, useRef, useCallback } from 'react';

export function usePoseWebSocket(exerciseName, captureFrame, isRunning) {
  const [poseData, setPoseData] = useState({
    exercise: exerciseName,
    reps: 0,
    hold_seconds: 0,
    stage: 'START',
    quality_score: 100,
    angles: {},
    feedback: 'Connecting to AI trainer...',
    status: 'good',
    person_visible: false,
    guidance: 'Position yourself in front of camera',
    duration_seconds: 0,
    fatigue: { fatigue_detected: false, fatigue_level: 'None', message: 'Form is stable' },
    landmarks: []
  });

  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Initialize and connect WebSocket
  useEffect(() => {
    let isMounted = true;
    const wsUrl = `ws://localhost:8000/ws/workout/${exerciseName.toLowerCase()}`;
    
    setConnected(false);
    setConnectionError(null);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      setConnected(true);
      setConnectionError(null);
      console.log(`Connected to Pose WebSocket for ${exerciseName}`);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'command_ack') return;
        setPoseData(prev => ({
          ...prev,
          ...data,
          landmarks: data.landmarks || []
        }));
      } catch (e) {
        console.error('Failed to parse pose response:', e);
      }
    };

    ws.onerror = (err) => {
      if (!isMounted) return;
      console.warn('WebSocket error:', err);
      setConnectionError('Connection to AI Vision server failed. Please ensure backend is running.');
      setConnected(false);
    };

    ws.onclose = () => {
      if (!isMounted) return;
      setConnected(false);
    };

    return () => {
      isMounted = false;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [exerciseName]);

  // Frame sender loop (at ~15 fps)
  useEffect(() => {
    if (!connected) return;

    intervalRef.current = setInterval(() => {
      if (!isRunningRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const frameB64 = captureFrame();
      if (frameB64) {
        try {
          wsRef.current.send(JSON.stringify({ image: frameB64 }));
        } catch (err) {
          console.warn('Failed to send frame to WebSocket:', err);
        }
      }
    }, 70); // ~14-15 FPS

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
