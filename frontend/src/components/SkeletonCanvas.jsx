import React, { useRef, useEffect } from 'react';

// Standard MediaPipe Pose connection pairs:
// Torso, Arms, Lower Body
const POSE_CONNECTIONS = [
  // Upper body & Arms
  [11, 12], // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm: shoulder -> elbow -> wrist
  [12, 14], [14, 16], // Right arm: shoulder -> elbow -> wrist
  [11, 23], [12, 24], // Torso: shoulder -> hip
  [23, 24], // Hip to hip
  // Lower body & Legs
  [23, 25], [25, 27], // Left leg: hip -> knee -> ankle
  [27, 29], [27, 31], [29, 31], // Left foot
  [24, 26], [26, 28], // Right leg: hip -> knee -> ankle
  [28, 30], [28, 32], [30, 32], // Right foot
];

// Color mapping for posture feedback:
// Green: Correct / Optimal Form
// Yellow: Posture Attention / Active Tracking (Default body lines)
// Red: Critical Form Fault / Unsafe Movement
const COLOR_MAP = {
  good: { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.8)', joint: '#34D399' },
  warning: { stroke: '#FACC15', glow: 'rgba(250, 204, 21, 0.85)', joint: '#FEF08A' },
  bad: { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.85)', joint: '#F87171' },
};

// Default high-visibility yellow line theme for detected body skeleton
const DEFAULT_YELLOW_THEME = {
  stroke: '#FACC15',
  glow: 'rgba(250, 204, 21, 0.85)',
  joint: '#FEF08A'
};

export function SkeletonCanvas({
  landmarks = [],
  status = 'good',
  angles = {},
  connectionColors = {},
  videoRef = null
}) {
  const canvasRef = useRef(null);
  const latestStateRef = useRef({ landmarks, status, angles, connectionColors });

  // Always keep latest props in ref for instantaneous redrawing on resize
  useEffect(() => {
    latestStateRef.current = { landmarks, status, angles, connectionColors };
  }, [landmarks, status, angles, connectionColors]);

  // Main drawing engine function
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Synchronize canvas internal bitmap buffer with actual rendered display dimensions
    const rect = canvas.getBoundingClientRect();
    const displayWidth = Math.round(rect.width) || canvas.clientWidth || 640;
    const displayHeight = Math.round(rect.height) || canvas.clientHeight || 480;

    if (displayWidth > 0 && displayHeight > 0) {
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear prior frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { landmarks: lms, status: st, angles: angs, connectionColors: conns } = latestStateRef.current;

    // Require valid MediaPipe landmarks array
    if (!lms || !Array.isArray(lms) || lms.length < 17) return;

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // 2. Compute object-cover coordinate mapping so skeleton aligns with video aspect-ratio
    const videoElem = videoRef?.current;
    let renderW = canvasW;
    let renderH = canvasH;
    let offsetX = 0;
    let offsetY = 0;

    if (videoElem && videoElem.videoWidth > 0 && videoElem.videoHeight > 0) {
      const vW = videoElem.videoWidth;
      const vH = videoElem.videoHeight;
      const scale = Math.max(canvasW / vW, canvasH / vH);
      renderW = vW * scale;
      renderH = vH * scale;
      offsetX = (canvasW - renderW) / 2;
      offsetY = (canvasH - renderH) / 2;
    }

    // Helper to transform normalized landmark coordinates to exact screen pixels
    const toScreen = (lm) => {
      if (!lm || typeof lm.x !== 'number' || typeof lm.y !== 'number' || isNaN(lm.x) || isNaN(lm.y)) {
        return null;
      }
      return {
        x: offsetX + lm.x * renderW,
        y: offsetY + lm.y * renderH,
        visibility: typeof lm.visibility === 'number' ? lm.visibility : 1.0
      };
    };

    // 3. Draw Skeleton Connection Lines (Vibrant Yellow with Posture Coloring)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [i, j] of POSE_CONNECTIONS) {
      const p1Raw = lms[i];
      const p2Raw = lms[j];
      const p1 = toScreen(p1Raw);
      const p2 = toScreen(p2Raw);

      // Only draw when both joint endpoints are within confidence limits
      if (p1 && p2 && p1.visibility >= 0.15 && p2.visibility >= 0.15) {
        // Check bidirectional keys for custom connection status
        const key1 = `${i}_${j}`;
        const key2 = `${j}_${i}`;
        const connStatus = conns?.[key1] || conns?.[key2];

        let colors = DEFAULT_YELLOW_THEME;
        if (connStatus && COLOR_MAP[connStatus]) {
          colors = COLOR_MAP[connStatus];
        } else if (st === 'bad') {
          colors = COLOR_MAP.bad;
        } else if (st === 'good') {
          colors = COLOR_MAP.good;
        }

        ctx.lineWidth = 4.5;
        ctx.strokeStyle = colors.stroke;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 4. Draw Visible Circles at Detected Joints (shoulders, elbows, wrists, hips, knees, ankles)
    const activeColor = COLOR_MAP[st] || DEFAULT_YELLOW_THEME;

    lms.forEach((lmRaw, idx) => {
      // Exclude facial landmark cluster (1-10); keep nose (0) and body joints (11-32)
      if (idx > 0 && idx < 11) return;
      const pt = toScreen(lmRaw);
      if (!pt || pt.visibility < 0.15) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);

      // Bright yellow joint center fill with posture-coded glow
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = activeColor.glow;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = activeColor.stroke;
      ctx.stroke();
      ctx.restore();
    });

    // 5. Render Real-time Anatomical Joint Angle Callouts
    ctx.save();
    ctx.font = '700 12px monospace';
    ctx.textAlign = 'center';

    const drawAngleTag = (text, x, y) => {
      const padding = 6;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - padding, y - 11, textWidth + padding * 2, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.fillText(text, x, y + 4);
    };

    if (angs?.knee_angle && lms[25]) {
      const pt = toScreen(lms[25]);
      if (pt && pt.visibility >= 0.2) {
        drawAngleTag(`${Math.round(angs.knee_angle)}°`, pt.x + 35, pt.y);
      }
    }
    if (angs?.elbow_angle && lms[13]) {
      const pt = toScreen(lms[13]);
      if (pt && pt.visibility >= 0.2) {
        drawAngleTag(`${Math.round(angs.elbow_angle)}°`, pt.x + 35, pt.y);
      }
    }
    if (angs?.hip_angle && lms[23]) {
      const pt = toScreen(lms[23]);
      if (pt && pt.visibility >= 0.2) {
        drawAngleTag(`${Math.round(angs.hip_angle)}°`, pt.x - 35, pt.y);
      }
    }

    ctx.restore();
  };

  // Render on every incoming landmark frame
  useEffect(() => {
    renderFrame();
  }, [landmarks, status, angles, connectionColors]);

  // Synchronize on container / video resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      renderFrame();
    };

    let observer = null;
    const target = canvas.parentElement || videoRef?.current;
    if (window.ResizeObserver && target) {
      observer = new ResizeObserver(handleResize);
      observer.observe(target);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
