import React, { useRef, useEffect } from 'react';

// Standard MediaPipe Pose connection pairs
const POSE_CONNECTIONS = [
  // Upper body
  [11, 12], // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 23], [12, 24], // Torso
  [23, 24], // Hip to hip
  // Lower body
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31], // Left leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32], // Right leg
];

export function SkeletonCanvas({ landmarks, status = 'good', angles = {}, width = 640, height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) {
      return;
    }

    // Determine skeleton stroke color based on posture status
    let strokeColor = '#10B981'; // Green
    let glowColor = 'rgba(16, 185, 129, 0.6)';
    if (status === 'warning') {
      strokeColor = '#F59E0B'; // Amber
      glowColor = 'rgba(245, 158, 11, 0.6)';
    } else if (status === 'bad') {
      strokeColor = '#EF4444'; // Red
      glowColor = 'rgba(239, 68, 68, 0.6)';
    }

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw connections
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;

    for (const [i, j] of POSE_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw landmark joints
    landmarks.forEach((lm, idx) => {
      if (lm.visibility > 0.4) {
        const x = lm.x * w;
        const y = lm.y * h;

        // Skip non-essential face landmarks to avoid clutter (keep nose 0, shoulders 11/12, etc.)
        if (idx > 0 && idx < 11) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        ctx.restore();
      }
    });

    // 3. Render joint angle labels if relevant landmarks are visible
    ctx.save();
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    // Show primary angle on canvas (e.g. knee or elbow)
    if (angles.knee_angle && landmarks[25] && landmarks[25].visibility > 0.5) {
      const kx = landmarks[25].x * w;
      const ky = landmarks[25].y * h;
      renderAngleBadge(ctx, `${angles.knee_angle}°`, kx + 28, ky);
    } else if (angles.elbow_angle && landmarks[13] && landmarks[13].visibility > 0.5) {
      const ex = landmarks[13].x * w;
      const ey = landmarks[13].y * h;
      renderAngleBadge(ctx, `${angles.elbow_angle}°`, ex + 28, ey);
    }
    ctx.restore();

  }, [landmarks, status, angles]);

  function renderAngleBadge(ctx, text, x, y) {
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(18, 19, 24, 0.85)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2 - 6, y - 10, textWidth + 12, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#60A5FA';
    ctx.fillText(text, x, y + 4);
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
