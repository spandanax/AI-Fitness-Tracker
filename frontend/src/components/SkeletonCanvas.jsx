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

const COLOR_MAP = {
  good: { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.7)', joint: '#34D399' },
  warning: { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)', joint: '#FBBF24' },
  bad: { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.8)', joint: '#F87171' },
};

export function SkeletonCanvas({
  landmarks = [],
  status = 'good',
  angles = {},
  connectionColors = {}
}) {
  const canvasRef = useRef(null);

  // Auto-resize canvas to match its rendered display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }
    };

    resize();

    let observer = null;
    if (window.ResizeObserver && canvas.parentElement) {
      observer = new ResizeObserver(resize);
      observer.observe(canvas.parentElement);
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (observer) observer.disconnect();
    };
  }, []);

  // Draw skeleton whenever landmarks or status changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length < 25) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw skeleton connection lines
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [i, j] of POSE_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      if (p1 && p2 && p1.visibility > 0.35 && p2.visibility > 0.35) {
        const key = `${i}_${j}`;
        const connStatus = connectionColors[key] || status || 'good';
        const colors = COLOR_MAP[connStatus] || COLOR_MAP.good;

        ctx.lineWidth = 4.5;
        ctx.strokeStyle = colors.stroke;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw joint landmark dots (shoulders, elbows, wrists, hips, knees, ankles)
    const activeColor = COLOR_MAP[status] || COLOR_MAP.good;

    landmarks.forEach((lm, idx) => {
      // Skip facial landmarks 1-10, keep nose (0) and body points (11-32)
      if (idx > 0 && idx < 11) return;
      if (lm.visibility > 0.35) {
        const x = lm.x * w;
        const y = lm.y * h;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = activeColor.stroke;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = activeColor.joint;
        ctx.stroke();
        ctx.restore();
      }
    });

    // 3. Render joint angle labels if relevant
    ctx.save();
    ctx.font = '700 11px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    const drawAngleTag = (text, x, y) => {
      const padding = 6;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - padding, y - 10, textWidth + padding * 2, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93C5FD';
      ctx.fillText(text, x, y + 4);
    };

    if (angles.knee_angle && landmarks[25] && landmarks[25].visibility > 0.4) {
      drawAngleTag(`${Math.round(angles.knee_angle)}°`, landmarks[25].x * w + 30, landmarks[25].y * h);
    }
    if (angles.elbow_angle && landmarks[13] && landmarks[13].visibility > 0.4) {
      drawAngleTag(`${Math.round(angles.elbow_angle)}°`, landmarks[13].x * w + 30, landmarks[13].y * h);
    }
    if (angles.hip_angle && landmarks[23] && landmarks[23].visibility > 0.4) {
      drawAngleTag(`${Math.round(angles.hip_angle)}°`, landmarks[23].x * w - 30, landmarks[23].y * h);
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
