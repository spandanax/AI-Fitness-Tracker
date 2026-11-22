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
// Yellow: Posture Attention / Warning (Default body line)
// Red: Critical Form Fault / Unsafe Movement
const COLOR_MAP = {
  good: { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.75)', joint: '#34D399' },
  warning: { stroke: '#EAB308', glow: 'rgba(234, 179, 8, 0.85)', joint: '#FDE047' },
  bad: { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.85)', joint: '#F87171' },
};

// Default high-visibility yellow line theme when posture condition is standard/tracking
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

  // Synchronize canvas coordinate dimensions with actual rendered video container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const targetElem = videoRef?.current || canvas.parentElement || canvas;
      const rect = targetElem.getBoundingClientRect();
      const targetWidth = Math.round(rect.width);
      const targetHeight = Math.round(rect.height);

      if (targetWidth > 0 && targetHeight > 0) {
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
      }
    };

    resize();

    let observer = null;
    const observeTarget = canvas.parentElement || videoRef?.current;
    if (window.ResizeObserver && observeTarget) {
      observer = new ResizeObserver(resize);
      observer.observe(observeTarget);
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (observer) observer.disconnect();
    };
  }, [videoRef]);

  // Real-time canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Require valid MediaPipe pose landmarks (minimum shoulders/hips detected)
    if (!landmarks || landmarks.length < 17) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Skeleton Connection Lines (Yellow body lines with dynamic posture color support)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [i, j] of POSE_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      // Verify both joint endpoints meet confidence threshold
      const v1 = typeof p1?.visibility === 'number' ? p1.visibility : 1.0;
      const v2 = typeof p2?.visibility === 'number' ? p2.visibility : 1.0;

      if (p1 && p2 && v1 > 0.25 && v2 > 0.25) {
        const key = `${i}_${j}`;
        const connStatus = connectionColors[key];

        // If a joint connection has a specific posture fault status, use good/warning/bad;
        // Otherwise default to high-visibility yellow lines as required
        let colors = DEFAULT_YELLOW_THEME;
        if (connStatus && COLOR_MAP[connStatus]) {
          colors = COLOR_MAP[connStatus];
        } else if (status === 'bad') {
          colors = COLOR_MAP.bad;
        } else if (status === 'warning') {
          colors = COLOR_MAP.warning;
        }

        ctx.lineWidth = 4.5;
        ctx.strokeStyle = colors.stroke;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw Visible Circles at Detected Joints (shoulders, elbows, wrists, hips, knees, ankles)
    const activePostureColor = COLOR_MAP[status] || DEFAULT_YELLOW_THEME;

    landmarks.forEach((lm, idx) => {
      // Keep key body joints: nose (0) and body joints (11 to 32)
      if (idx > 0 && idx < 11) return;
      const v = typeof lm?.visibility === 'number' ? lm.visibility : 1.0;

      if (v > 0.25) {
        const x = lm.x * w;
        const y = lm.y * h;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        // Bright yellow joint center fill with posture-coded glow
        ctx.fillStyle = '#FEF08A';
        ctx.shadowColor = activePostureColor.glow;
        ctx.shadowBlur = 12;
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = activePostureColor.stroke;
        ctx.stroke();
        ctx.restore();
      }
    });

    // 3. Render Real-time Anatomical Joint Angle Callouts
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

    if (angles.knee_angle && landmarks[25] && (landmarks[25].visibility ?? 1) > 0.3) {
      drawAngleTag(`${Math.round(angles.knee_angle)}°`, landmarks[25].x * w + 35, landmarks[25].y * h);
    }
    if (angles.elbow_angle && landmarks[13] && (landmarks[13].visibility ?? 1) > 0.3) {
      drawAngleTag(`${Math.round(angles.elbow_angle)}°`, landmarks[13].x * w + 35, landmarks[13].y * h);
    }
    if (angles.hip_angle && landmarks[23] && (landmarks[23].visibility ?? 1) > 0.3) {
      drawAngleTag(`${Math.round(angles.hip_angle)}°`, landmarks[23].x * w - 35, landmarks[23].y * h);
    }

    ctx.restore();
  }, [landmarks, status, angles, connectionColors]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
