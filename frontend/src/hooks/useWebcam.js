import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebcam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media devices API is not supported in this browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setPermissionGranted(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please enable camera access in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on your device. Please plug in a webcam.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      }
      setError(msg);
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPermissionGranted(false);
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Low resolution capture for high frame rate, low latency transmission
    canvas.width = 480;
    canvas.height = 360;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return JPEG base64 string with 0.6 quality for fast transfer
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    error,
    permissionGranted,
    isLoading,
    startCamera,
    stopCamera,
    captureFrame
  };
}
