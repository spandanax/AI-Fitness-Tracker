import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebcam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'denied' | 'notfound' | 'inuse' | 'other'
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setPermissionGranted(false);
  }, []);

  const startCamera = useCallback(async () => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support webcam access. Please use Chrome, Edge, or Firefox.');
      setErrorType('other');
      setIsLoading(false);
      return;
    }

    // Check if page is served over HTTPS or localhost (required for camera API)
    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      setError('Camera access requires a secure connection (HTTPS or localhost).');
      setErrorType('other');
      setIsLoading(false);
      return;
    }

    try {
      // Check permission state first (Permissions API, Chrome/Edge)
      if (navigator.permissions) {
        try {
          const permStatus = await navigator.permissions.query({ name: 'camera' });
          if (permStatus.state === 'denied') {
            setError(
              'Camera access has been blocked for this site. Click the camera icon in your browser address bar and allow access, then click "Retry".'
            );
            setErrorType('denied');
            setIsLoading(false);
            return;
          }
        } catch (_) {
          // Some browsers don't support permissions.query for camera; continue anyway
        }
      }

      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video metadata to load before playing
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject(new Error('Video element gone'));
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
          setTimeout(() => resolve(), 3000); // fallback timeout
        });
        try {
          await videoRef.current.play();
        } catch (playErr) {
          // Autoplay might be blocked; not fatal – video should still show
          console.warn('Autoplay blocked, trying muted play:', playErr);
        }
      }

      setStream(mediaStream);
      setPermissionGranted(true);
      setError(null);
      setErrorType(null);
    } catch (err) {
      console.error('Camera access error:', err.name, err.message);

      let msg = 'Failed to access camera.';
      let type = 'other';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg =
          'Camera permission denied. Click the 🔒 or 📷 icon in your browser address bar, set Camera to "Allow", then click "Retry".';
        type = 'denied';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg =
          'No camera found. Please connect a webcam and click "Retry".';
        type = 'notfound';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg =
          'Camera is in use by another app (e.g. Teams, Zoom, OBS). Close that app and click "Retry".';
        type = 'inuse';
      } else if (err.name === 'OverconstrainedError') {
        // Retry with relaxed constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
          }
          setStream(fallbackStream);
          setPermissionGranted(true);
          setError(null);
          setIsLoading(false);
          return;
        } catch (fallbackErr) {
          msg = 'Could not start camera with any configuration. Please try a different browser.';
          type = 'other';
        }
      }

      setError(msg);
      setErrorType(type);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = 480;
    canvas.height = 360;

    const ctx = canvas.getContext('2d', { alpha: false });
    // Mirror the frame so pose landmarks match un-mirrored coordinates
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.65);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    error,
    errorType,
    permissionGranted,
    isLoading,
    startCamera,  // also serves as "retry"
    stopCamera,
    captureFrame,
  };
}
