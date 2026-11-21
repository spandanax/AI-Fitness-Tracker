import React, { useState } from 'react';
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';

export function PostureAnalysis({ onStartExercise }) {
  const [activeTab, setActiveTab] = useState('squat');

  const exerciseGuides = {
    squat: {
      title: 'Squat Biomechanics & Fault Detection',
      primaryJoints: 'Hip (23/24), Knee (25/26), Ankle (27/28), Shoulder (11/12)',
      rules: [
        {
          name: 'Squat Depth (Knee Flexion)',
          optimal: '85° - 95° (Thighs parallel to floor)',
          fault: 'Knee angle > 105° (Partial repetition)',
          impact: 'Underdevelops glutes and quadriceps; partial rep rejected by counter.',
          status: 'critical'
        },
        {
          name: 'Spine & Torso Inclination',
          optimal: 'Torso angle >= 60° relative to femur',
          fault: 'Torso angle < 55° (Excessive forward collapse / good-morning squat)',
          impact: 'Shifts excessive shear forces onto the lumbar spine.',
          status: 'warning'
        },
        {
          name: 'Knee-Ankle Horizontal Offset',
          optimal: 'Knees tracking over toes (< 0.20 normalized offset)',
          fault: 'Knees collapsing inward (valgus) or shifting excessively forward',
          impact: 'Increases patellofemoral and ACL joint stress.',
          status: 'warning'
        }
      ]
    },
    pushup: {
      title: 'Push-up Posture & Spine Alignment',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24), Ankle (27/28)',
      rules: [
        {
          name: 'Elbow Depth & Lockout',
          optimal: 'Elbow angle <= 90° at bottom, > 155° at top',
          fault: 'Elbow angle > 95° (Shallow chest descent)',
          impact: 'Reduces pectoral muscle activation and range-of-motion.',
          status: 'critical'
        },
        {
          name: 'Plank Line Alignment',
          optimal: 'Shoulder-Hip-Ankle angle 160° - 180°',
          fault: 'Hip angle < 150° (Sagging hips or pike)',
          impact: 'Exposes lower back to hyperextension; core loses engagement.',
          status: 'warning'
        }
      ]
    },
    pullup: {
      title: 'Pull-up Mechanics & Scapular Control',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16)',
      rules: [
        {
          name: 'Chin Over Bar Clearance',
          optimal: 'Elbow flexion <= 75° at peak contraction',
          fault: 'Elbow angle > 85° (Incomplete top contraction)',
          impact: 'Reduces latissimus dorsi and rhomboid recruitment.',
          status: 'critical'
        },
        {
          name: 'Deadhang Extension',
          optimal: 'Elbow extension > 150° at baseline deadhang',
          fault: 'Bouncing or kipping before reaching full extension',
          impact: 'Eliminates full stretch reflex and scapular stability.',
          status: 'warning'
        }
      ]
    },
    dip: {
      title: 'Dips Lockout & Shoulder Safety',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16)',
      rules: [
        {
          name: 'Elbow Parallel Descent',
          optimal: 'Elbow angle 80° - 90° at lowest descent',
          fault: 'Elbow angle < 70° (Dangerous hyper-depression)',
          impact: 'Overstretches the anterior shoulder capsule and rotator cuff.',
          status: 'critical'
        },
        {
          name: 'Triceps Press Lockout',
          optimal: 'Full extension > 155° at support finish',
          fault: 'Incomplete lockout; resting between reps',
          impact: 'Reduces peak triceps contraction and lockout strength.',
          status: 'warning'
        }
      ]
    },
    lunge: {
      title: 'Lunge Unilateral Knee & Torso Mechanics',
      primaryJoints: 'Hip (23/24), Knee (25/26), Ankle (27/28), Shoulder (11/12)',
      rules: [
        {
          name: 'Front Knee Flexion Depth',
          optimal: 'Front knee angle <= 100° with shin near vertical',
          fault: 'Shallow step with knee > 110° or knee overshooting toes',
          impact: 'Reduces gluteus maximus loading and strains patellar tendon.',
          status: 'critical'
        },
        {
          name: 'Torso Vertical Alignment',
          optimal: 'Torso angle >= 70° relative to ground',
          fault: 'Excessive forward chest lean onto the front quad',
          impact: 'Decreases hip stabilization demand and strains lower back.',
          status: 'warning'
        }
      ]
    },
    jumping_jacks: {
      title: 'Jumping Jacks Dynamic Cadence & Extension',
      primaryJoints: 'Ankle (27/28), Hip (23/24), Shoulder (11/12), Wrist (15/16)',
      rules: [
        {
          name: 'Overhead Arm Clapping',
          optimal: 'Wrists reach above eye level at peak extension',
          fault: 'Arms flapping below shoulder level',
          impact: 'Diminishes deltoid and upper-back mobility work.',
          status: 'warning'
        },
        {
          name: 'Stance Width Spread',
          optimal: 'Ankles spread >= 1.3x shoulder width',
          fault: 'Narrow leg hop without lateral stance expansion',
          impact: 'Reduces hip adductor/abductor loading and cardiovascular output.',
          status: 'warning'
        }
      ]
    },
    plank: {
      title: 'Plank Core Stabilization Mechanics',
      primaryJoints: 'Shoulder (11/12), Hip (23/24), Ankle (27/28)',
      rules: [
        {
          name: 'Spine Neutrality (Rigid Line)',
          optimal: 'Body angle 160° - 180° with horizontal alignment',
          fault: 'Angle < 155° (Sagging belly or peaked hips)',
          impact: 'Transfers tension off core onto the lumbar vertebrae; pauses timer.',
          status: 'critical'
        }
      ]
    },
    bicep_curls: {
      title: 'Bicep Curl Isolation Biomechanics',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24)',
      rules: [
        {
          name: 'Peak Flexion & Extension',
          optimal: 'Elbow angle <= 45° at peak, > 150° at baseline',
          fault: 'Elbow angle > 50° at top (Incomplete contraction)',
          impact: 'Misses peak tension at the short head of the biceps.',
          status: 'critical'
        },
        {
          name: 'Elbow Translation & Body Swing',
          optimal: 'Elbow stays pinned within 0.12 of shoulder line',
          fault: 'Elbow flaring forward or torso rocking back and forth',
          impact: 'Momentum cheating reduces bicep hypertrophy stimulus.',
          status: 'warning'
        }
      ]
    },
    shoulder_press: {
      title: 'Shoulder Press Overhead Lockout & Spine Mechanics',
      primaryJoints: 'Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24)',
      rules: [
        {
          name: 'Full Overhead Extension',
          optimal: 'Elbow lockout >= 155° overhead',
          fault: 'Press terminates early without full deltoid lockout',
          impact: 'Leaves upper fibers of anterior deltoids and triceps under-activated.',
          status: 'critical'
        },
        {
          name: 'Lumbar Spine Stability',
          optimal: 'Torso remains strictly vertical without backward arch',
          fault: 'Excessive lumbar hyperextension to turn press into incline chest press',
          impact: 'High spinal shear forces on vertebrae under vertical load.',
          status: 'warning'
        }
      ]
    },
    mountain_climbers: {
      title: 'Mountain Climbers Dynamic Core & Hip Rhythm',
      primaryJoints: 'Shoulder (11/12), Hip (23/24), Knee (25/26), Ankle (27/28)',
      rules: [
        {
          name: 'Knee Drive Depth',
          optimal: 'Driving knee angle <= 80° towards chest',
          fault: 'Shallow foot shuffle without hip flexion',
          impact: 'Reduces rectus abdominis and psoas contraction.',
          status: 'critical'
        },
        {
          name: 'Plank Elevation Control',
          optimal: 'Hips maintain level height with shoulders',
          fault: 'Hips piking high into the air',
          impact: 'Relieves core tension and turns movement into shoulder rest.',
          status: 'warning'
        }
      ]
    },
    crunches: {
      title: 'Crunches Abdominal Flexion Biomechanics',
      primaryJoints: 'Shoulder (11/12), Hip (23/24), Knee (25/26)',
      rules: [
        {
          name: 'Torso Contraction Arc',
          optimal: 'Torso-Femur angle <= 90° with shoulder blades clearing ground',
          fault: 'Head-bobbing or neck-pulling without thoracic flexion',
          impact: 'Strains cervical neck muscles while abdominal muscles remain flaccid.',
          status: 'critical'
        },
        {
          name: 'Eccentric Reset',
          optimal: 'Return flat to baseline angle > 125°',
          fault: 'Rushing reps without abdominal muscle elongation',
          impact: 'Cuts eccentric hypertrophy signaling in half.',
          status: 'warning'
        }
      ]
    },
    burpees: {
      title: 'Burpees Full-Kinetic Multi-Plane Mechanics',
      primaryJoints: 'Shoulder (11/12), Hip (23/24), Knee (25/26), Wrist (15/16)',
      rules: [
        {
          name: 'Horizontal Plank Drop',
          optimal: 'Body forms complete horizontal plank on ground',
          fault: 'Incomplete descent or collapsing uncontrolled onto floor',
          impact: 'Risks wrist sprain or lower back hyperextension.',
          status: 'critical'
        },
        {
          name: 'Vertical Jump & Overhead Clap',
          optimal: 'Hips extend and wrists reach above head during vertical leap',
          fault: 'Standing up slowly without vertical plyometric explosion',
          impact: 'Eliminates fast-twitch power training from the movement.',
          status: 'warning'
        }
      ]
    },
    calf_raises: {
      title: 'Calf Raises Plantarflexion & Ankle Alignment',
      primaryJoints: 'Knee (25/26), Ankle (27/28), Toe (31/32)',
      rules: [
        {
          name: 'Plantarflexion Peak Elevation',
          optimal: 'Ankle angle >= 138° with heel elevated high off floor',
          fault: 'Minimal heel lift (ankle angle < 130°)',
          impact: 'Fails to reach gastrocnemius peak contraction.',
          status: 'critical'
        },
        {
          name: 'Knee Extension Stability',
          optimal: 'Knees remain locked straight (> 150°)',
          fault: 'Bending knees to bounce or spring upwards',
          impact: 'Shifts load off gastrocnemius onto quadriceps.',
          status: 'warning'
        }
      ]
    }
  };

  const currentGuide = exerciseGuides[activeTab] || exerciseGuides.squat;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Posture Correction Engine</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Explainable, rule-based biomechanical analysis evaluating real-time joints, angles, and postural faults across all 13 exercises
        </p>
      </div>

      {/* Exercise Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 border-b border-neutral-800 scrollbar-none">
        {Object.keys(exerciseGuides).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize shrink-0 ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Active Guide Card */}
      <div className="bg-[#141418] border border-neutral-800/80 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{currentGuide.title}</h2>
            <p className="text-xs text-neutral-400 mt-1">
              <strong>Tracked Landmarks:</strong> {currentGuide.primaryJoints}
            </p>
          </div>
          <button
            onClick={() => onStartExercise(activeTab)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition self-start md:self-auto"
          >
            Train This Form Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {currentGuide.rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <ScanEye className="w-4 h-4 text-blue-400" />
                  {rule.name}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  rule.status === 'critical'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {rule.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Target Form Criteria</span>
                  </div>
                  <p>{rule.optimal}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Detected Fault Condition</span>
                  </div>
                  <p>{rule.fault}</p>
                </div>
              </div>

              <div className="text-xs text-neutral-400 pt-1">
                <strong className="text-neutral-300">Biomechanical Impact:</strong> {rule.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
