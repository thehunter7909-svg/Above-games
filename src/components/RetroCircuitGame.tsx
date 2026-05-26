import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Zap, RefreshCw, Star, Flag } from 'lucide-react';

interface RallyCar {
  id: string;
  name: string;
  avatar: string;
  color: string;
  maxSpeed: number;
  handling: number; // steer rotational coefficient
  acceleration: number;
}

interface CircuitScore {
  lapTimeSeconds: number;
  date: string;
  car: string;
}

const CARS: RallyCar[] = [
  {
    id: 'rally-beetle',
    name: 'Herby Nitro',
    avatar: '🐞',
    color: '#10b981', // emerald
    maxSpeed: 4.8,
    handling: 0.08,
    acceleration: 0.16
  },
  {
    id: 'f1-turbo',
    name: 'Monaco GP',
    avatar: '🏎️',
    color: '#e11d48', // rose-600
    maxSpeed: 5.6,
    handling: 0.065,
    acceleration: 0.18
  },
  {
    id: 'apex-drifter',
    name: 'Hachiroku 86',
    avatar: '🚗',
    color: '#d97706', // amber-600
    maxSpeed: 4.5,
    handling: 0.09,
    acceleration: 0.14
  }
];

interface StarBonus {
  x: number;
  y: number;
  collected: boolean;
}

interface Checkpoint {
  x: number;
  y: number;
  radius: number;
}

export default function RetroCircuitGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedCar, setSelectedCar] = useState<RallyCar>(CARS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lapHistory, setLapHistory] = useState<CircuitScore[]>([]);

  // Simulation variables stored in mutable Refs for high frequency 60fps tick rate
  const carStateRef = useRef({
    x: 100,
    y: 80,
    speed: 0,
    angle: 0, // direction vector angle in radians
    steerInput: 0, // -1 (left), 0 (none), 1 (right)
    accelInput: 0 // -1 (brake/reverse), 0 (coast), 1 (accelerate)
  });

  // Track coordinates: Simple polygon circuit representing the racetrack
  // Oval path with winding turns
  const TRACK_CENTER_POINTS = [
    { x: 100, y: 80 },
    { x: 280, y: 80 },
    { x: 340, y: 140 },
    { x: 340, y: 260 },
    { x: 260, y: 320 },
    { x: 140, y: 240 },
    { x: 80, y: 280 },
    { x: 60, y: 200 },
    { x: 60, y: 120 }
  ];

  const trackWidth = 55;

  // Star Bonuses placed on the track paths
  const starsRef = useRef<StarBonus[]>([
    { x: 190, y: 80, collected: false },
    { x: 310, y: 110, collected: false },
    { x: 340, y: 200, collected: false },
    { x: 200, y: 280, collected: false },
    { x: 110, y: 260, collected: false },
    { x: 60, y: 160, collected: false }
  ]);

  // Dynamic gate checkpoints to prevent cutting corners!
  const checkpointsRef: Checkpoint[] = [
    { x: 190, y: 80, radius: 45 },  // Top checkpoint
    { x: 340, y: 200, radius: 45 }, // Right checkpoint
    { x: 200, y: 280, radius: 45 }, // Bottom checkpoint
    { x: 65,  y: 160, radius: 45 }  // Left checkpoint / Start gate
  ];
  const activeCheckpointIdxRef = useRef<number>(1); // expects next index to count valid lap!

  // Skid marks for drifting curves trails
  const skidmarksRef = useRef<{ x: number; y: number; life: number }[]>([]);
  const animationFrameRef = useRef<any>(null);
  const lapStartMsRef = useRef<number>(0);

  // Sound Synth Manager
  const playSoundSynth = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine', sweepSlope?: number) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (sweepSlope) {
        osc.frequency.exponentialRampToValueAtTime(sweepSlope, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored audio context blocks safely
    }
  }, [isMuted]);

  // Load lap history logs
  useEffect(() => {
    const raw = localStorage.getItem('above_games_circuit_scores');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setLapHistory(parsed);
        if (parsed.length > 0) {
          const minimalTime = Math.min(...parsed.map((item: CircuitScore) => item.lapTimeSeconds));
          setBestLapTime(minimalTime);
        }
      } catch (e) {
        setLapHistory([]);
      }
    }
  }, []);

  // Update game timer in seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const currentElapsed = (Date.now() - lapStartMsRef.current) / 1000;
      setTimeElapsed(currentElapsed);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Core distance helper to calculate off-road grass collisions
  const getDistanceToTrackPath = (x: number, y: number): { distance: number; projectionX: number; projectionY: number } => {
    let minDistance = 9999;
    let projX = 0, projY = 0;

    for (let u = 0; u < TRACK_CENTER_POINTS.length; u++) {
      const p1 = TRACK_CENTER_POINTS[u];
      const p2 = TRACK_CENTER_POINTS[(u + 1) % TRACK_CENTER_POINTS.length];

      // Segment projection logic
      const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
      let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));

      const cx = p1.x + t * (p2.x - p1.x);
      const cy = p1.y + t * (p2.y - p1.y);

      const d = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      if (d < minDistance) {
        minDistance = d;
        projX = cx;
        projY = cy;
      }
    }

    return { distance: minDistance, projectionX: projX, projectionY: projY };
  };

  // Car drift trail particle spawning engine
  const runPhysicsTick = useCallback(() => {
    if (!isPlaying) return;

    const car = carStateRef.current;

    // Apply rotation steering input
    const steerFactor = selectedCar.handling * (car.speed > 0 ? Math.min(1.2, car.speed / 2.5) : -Math.min(1.2, Math.abs(car.speed) / 2.5));
    car.angle += car.steerInput * steerFactor;

    // Is car on grass or highway track?
    const trackTest = getDistanceToTrackPath(car.x, car.y);
    const isOnGrass = trackTest.distance > trackWidth;

    // Friction modifiers
    const activeMaxSpeed = isOnGrass ? selectedCar.maxSpeed * 0.45 : selectedCar.maxSpeed;
    const accelRate = selectedCar.acceleration;
    const friction = isOnGrass ? 0.08 : 0.035;

    // Apply acceleration input
    if (car.accelInput === 1) {
      car.speed = Math.min(activeMaxSpeed, car.speed + accelRate);
      if (Math.random() < 0.12 && Math.abs(car.speed) > 1) {
        // Continuous acceleration dynamic pitch sound
        playSoundSynth(160 + car.speed * 42, 0.04, 'sawtooth');
      }
    } else if (car.accelInput === -1) {
      car.speed = Math.max(-1.5, car.speed - accelRate * 1.5); // Fast stop or reverse gears
      if (Math.random() < 0.12) {
        playSoundSynth(180, 0.04, 'triangle');
      }
    } else {
      // Natural rolling drag friction
      if (car.speed > 0) car.speed = Math.max(0, car.speed - friction);
      if (car.speed < 0) car.speed = Math.min(0, car.speed + friction);
    }

    // Slip/Drift skids if steering tightly at fast paces
    const isDrifting = Math.abs(car.steerInput) === 1 && Math.abs(car.speed) > 2.8 && !isOnGrass;
    if (isDrifting) {
      skidmarksRef.current.push({
        x: car.x,
        y: car.y,
        life: 1.0
      });
      if (skidmarksRef.current.length > 150) {
        skidmarksRef.current.shift();
      }
      if (Math.random() < 0.18) {
        playSoundSynth(600 + Math.random() * 200, 0.05, 'triangle'); // tire drift squeak
      }
    }

    // Speed vector equations
    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Canvas boundaries constraint safety wrapping
    const canvas = canvasRef.current;
    if (canvas) {
      if (car.x < 10) { car.x = 10; car.speed = -car.speed * 0.3; }
      if (car.x > canvas.width - 10) { car.x = canvas.width - 10; car.speed = -car.speed * 0.3; }
      if (car.y < 10) { car.y = 10; car.speed = -car.speed * 0.3; }
      if (car.y > canvas.height - 10) { car.y = canvas.height - 10; car.speed = -car.speed * 0.3; }
    }

    // Star collection checks
    starsRef.current = starsRef.current.map((star) => {
      if (!star.collected) {
        const starDistance = Math.hypot(car.x - star.x, car.y - star.y);
        if (starDistance < 18) {
          playSoundSynth(980, 0.15, 'sine', 1400);
          setScore((prev) => prev + 100);
          return { ...star, collected: true };
        }
      }
      return star;
    });

    // Checkpoint gate progression verification
    const currentCheckpoint = checkpointsRef[activeCheckpointIdxRef.current];
    const distToCheckpoint = Math.hypot(car.x - currentCheckpoint.x, car.y - currentCheckpoint.y);

    if (distToCheckpoint < currentCheckpoint.radius) {
      // Advance to next checkpoint sequence
      const nextGateIdx = (activeCheckpointIdxRef.current + 1) % checkpointsRef.length;
      activeCheckpointIdxRef.current = nextGateIdx;

      playSoundSynth(520, 0.08, 'sine', 680); // checkpoint feedback

      // Lap Completed Trigger!
      if (nextGateIdx === 1) {
        const lapDoneMs = Date.now();
        const durationSeconds = (lapDoneMs - lapStartMsRef.current) / 1000;
        lapStartMsRef.current = lapDoneMs;

        playSoundSynth(523, 0.15, 'sine'); // C5
        setTimeout(() => playSoundSynth(659, 0.15, 'sine'), 90); // E5
        setTimeout(() => playSoundSynth(784, 0.25, 'triangle'), 180); // G5 (Victory theme!)

        setCurrentLap((prev) => prev + 1);
        setScore((prev) => prev + 500);

        // Respawn all star bonuses for the new lap excitement
        starsRef.current = starsRef.current.map((s) => ({ ...s, collected: false }));

        // Handle Best Lap Save
        const dateStr = new Date().toISOString().split('T')[0];
        const attemptResult: CircuitScore = {
          lapTimeSeconds:parseFloat(durationSeconds.toFixed(2)),
          date: dateStr,
          car: selectedCar.name
        };

        setBestLapTime((prev) => {
          if (prev === null || durationSeconds < prev) {
            return durationSeconds;
          }
          return prev;
        });

        setLapHistory((prev) => {
          const updated = [attemptResult, ...prev].slice(0, 5);
          localStorage.setItem('above_games_circuit_scores', JSON.stringify(updated));
          return updated;
        });
      }
    }

    // Visual Skid decay
    skidmarksRef.current = skidmarksRef.current.map((skid) => {
      return { ...skid, life: skid.life - 0.012 };
    }).filter((skid) => skid.life > 0);

    // Re-draw context
    renderCircuit();

    animationFrameRef.current = requestAnimationFrame(runPhysicsTick);
  }, [isPlaying, selectedCar, playSoundSynth]);

  // Main Render Loop of track, cars, and stars
  const renderCircuit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grass color layer
    ctx.fillStyle = '#064e3b'; // dark pine green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Track outer gray base road loop
    ctx.strokeStyle = '#374151'; // smooth asphalt gray-700
    ctx.lineWidth = trackWidth * 1.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    TRACK_CENTER_POINTS.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Inner smooth asphalt layer
    ctx.strokeStyle = '#1f2937'; // deep pavement gray-800
    ctx.lineWidth = trackWidth * 1.7;
    ctx.beginPath();
    TRACK_CENTER_POINTS.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Center divider neon white dashes
    ctx.strokeStyle = '#f43f5e'; // red-500 neon curbs
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    TRACK_CENTER_POINTS.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]); // Reset dashboards

    // Draw Starting line grid (placed around Y: 80-160 at X: 65, vertical checkpoint)
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(65 - trackWidth/2, 160);
    ctx.lineTo(65 + trackWidth/2, 160);
    ctx.stroke();

    // Checkered white/black tiles starting overlay grid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(65 - trackWidth/2, 158, trackWidth, 4);
    ctx.restore();

    // Draw active skidmarks tracks
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    skidmarksRef.current.forEach((skid) => {
      ctx.beginPath();
      ctx.arc(skid.x, skid.y, 3 * skid.life, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Checkpoint arrows & indicators helper markers
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1;
    checkpointsRef.forEach((ch, idx) => {
      const isActive = idx === activeCheckpointIdxRef.current;
      ctx.strokeStyle = isActive ? '#a855f7' : 'rgba(99, 102, 241, 0.15)';
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, ch.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Small helper tag icon on active
      if (isActive) {
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ NEXT GATE', ch.x, ch.y);
      }
    });

    // Draw collectible stars
    starsRef.current.forEach((star) => {
      if (!star.collected) {
        ctx.fillStyle = '#fbbf24'; // glowing gold
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', star.x, star.y);
      }
    });

    // Draw Player Rally Sports Car
    const car = carStateRef.current;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Glow highlight decoration
    ctx.shadowColor = selectedCar.color;
    ctx.shadowBlur = 12;

    // Body chassis container box
    ctx.fillStyle = selectedCar.color;
    ctx.beginPath();
    ctx.roundRect(-12, -8, 24, 16, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Windshield cockpit
    ctx.fillStyle = '#111827';
    ctx.fillRect(-2, -6, 6, 12);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(0, -5, 3, 10);

    // Front spoiler headlights indicators
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(8, -7, 4, 2);
    ctx.fillRect(8, 5, 4, 2);

    // Rear wing spoiler bumper decoration
    ctx.fillStyle = '#000000';
    ctx.fillRect(-15, -9, 3, 18);

    ctx.restore();
  };

  const handleStartCircuit = () => {
    // Center at initial start grid position
    carStateRef.current = {
      x: 65,
      y: 190,
      speed: 0,
      angle: -Math.PI / 2, // facing Upwards vertically towards start grid finish line
      steerInput: 0,
      accelInput: 0
    };

    activeCheckpointIdxRef.current = 1; //expects topCheckpoint next
    setCurrentLap(1);
    setTimeElapsed(0);
    setScore(0);
    starsRef.current = starsRef.current.map((s) => ({ ...s, collected: false }));
    skidmarksRef.current = [];

    lapStartMsRef.current = Date.now();
    setIsPlaying(true);

    playSoundSynth(587, 0.12, 'sawtooth'); // D5
    setTimeout(() => playSoundSynth(659, 0.12, 'sawtooth'), 80); // E5
    setTimeout(() => playSoundSynth(698, 0.15, 'sawtooth'), 160); // F5
    setTimeout(() => playSoundSynth(880, 0.3, 'triangle'), 240); // A5 (Deploy revv theme!)
  };

  // Keyboard navigation watchers
  useEffect(() => {
    const handleCircuitKeys = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'A', 's', 'S', 'd', 'D', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
      }

      const cs = carStateRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          cs.accelInput = 1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          cs.accelInput = -1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          cs.steerInput = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          cs.steerInput = 1;
          break;
      }
    };

    const handleCircuitKeyUp = (e: KeyboardEvent) => {
      const cs = carStateRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'ArrowDown':
        case 's':
        case 'S':
          cs.accelInput = 0;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ArrowRight':
        case 'd':
        case 'D':
          cs.steerInput = 0;
          break;
      }
    };

    window.addEventListener('keydown', handleCircuitKeys);
    window.addEventListener('keyup', handleCircuitKeyUp);

    return () => {
      window.removeEventListener('keydown', handleCircuitKeys);
      window.removeEventListener('keyup', handleCircuitKeyUp);
    };
  }, [isPlaying]);

  // Handle high frequency tick rates loops
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(runPhysicsTick);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, runPhysicsTick]);

  // Pre-seed canvas draw elements
  useEffect(() => {
    renderCircuit();
  }, [selectedCar]);

  // Input bindings helpers
  const handleVirtualPress = (type: 'ACCEL' | 'STEER', val: number) => {
    if (!isPlaying) return;
    const cs = carStateRef.current;
    if (type === 'ACCEL') {
      cs.accelInput = val;
    } else {
      cs.steerInput = val;
    }
  };

  return (
    <div className="w-full max-w-4xl bg-gray-950/80 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 p-4 sm:p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-center">
      
      {/* 1. HTML5 Canvas viewport container */}
      <div className="relative shrink-0 border-4 border-gray-900 bg-gray-950 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="block max-w-full aspect-square bg-[#052e16] w-[340px] sm:w-[400px]"
        />

        {/* Dashboard start screen overlays */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 text-center select-none">
            
            <div className="text-center pt-2">
              <div className="flex justify-center gap-1.5 items-center mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold">2D MICRO RALLY ENGINE</span>
              </div>
              <h3 className="text-xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-cyan-400 uppercase tracking-widest leading-none mb-1">
                APEX RETRO RALLY
              </h3>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                Drive your micro sports car with real top-down sliding physics. Avoid off-road dirt zones to sustain max velocities!
              </p>
            </div>

            {/* Pilot selection metrics panels */}
            <div className="space-y-2 my-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block text-left">Deploy Micro Chassis:</span>
              <div className="grid grid-cols-3 gap-2">
                {CARS.map((c) => (
                  <button
                    key={c.id}
                    id={`btn-rally-car-${c.id}`}
                    onClick={() => setSelectedCar(c)}
                    className={`p-2 border rounded-xl flex flex-col items-center justify-center transition-all ${
                      selectedCar.id === c.id
                        ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-500/10 scale-105'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{c.avatar}</span>
                    <span className="text-[9px] font-bold font-mono truncate max-w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>

              {/* Chassis details */}
              <div className="bg-gray-950 border border-emerald-950 rounded-xl px-3 py-1.5 text-left text-[9px] font-mono flex flex-col gap-0.5 text-gray-300">
                <div>
                  <span className="text-emerald-400 font-bold">Power Unit:</span> Top-Down sports specs {selectedCar.avatar}
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Max Speed Limit:</span> {selectedCar.maxSpeed} units / physics calculation frame
                </div>
                <div>
                  <span className="text-cyan-400 font-bold">Rally Grip Factor:</span> Rotates {selectedCar.handling * 100}% curvature index per steering wheel lock
                </div>
              </div>
            </div>

            <button
              id="btn-rally-start-trigger"
              onClick={handleStartCircuit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black font-mono text-xs transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer uppercase tracking-widest"
            >
              <Play className="w-3.5 h-3.5" strokeWidth={3} />
              <span>STATION LAUNCH {selectedCar.name} 🏁</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Side Panel Dashboard Control stats */}
      <div className="flex-grow w-full flex flex-col justify-between self-stretch gap-4">
        
        <div className="bg-gray-900/50 border border-emerald-950 p-4 rounded-2xl flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center border-b border-gray-900 pb-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Gearbox Pilot: <strong>{selectedCar.name}</strong></span>
            </span>
            <div className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Star className="w-3 h-3 text-emerald-400" />
              <span>Stars Score: {score}</span>
            </div>
          </div>

          {/* Current lap metrics and timing records */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-900 pb-2">
            <div className="bg-slate-950/60 p-2 rounded-xl text-center">
              <span className="text-[9px] text-gray-500 block">ACTIVE LAP:</span>
              <span className="text-emerald-400 font-extrabold text-base">LAP #{currentLap}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl text-center">
              <span className="text-[9px] text-gray-500 block">CURRENT TIMER:</span>
              <span className="text-yellow-400 font-extrabold text-base">{timeElapsed.toFixed(2)}s</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 bg-emerald-950/10 p-2 rounded-xl border border-emerald-950/40">
            <span>Circuit Personal Best Time:</span>
            <span className="text-emerald-400 font-bold text-xs">
              {bestLapTime !== null ? `${bestLapTime.toFixed(2)} Seconds` : 'NO TIME FILED'}
            </span>
          </div>

          {/* Synth Audio Toggle */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-400">Rally Engine Synth audio:</span>
            <button
              id="btn-rally-sound-toggle"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-gray-900 border-gray-805 text-gray-500'
                  : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3. Physical Controller Layout buttons for virtual steering support */}
        <div className="bg-gray-900/50 border border-emerald-950 p-4 rounded-2xl flex flex-col gap-2 font-mono">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block text-center">Cockpit Steering & Accelerator:</span>
          
          <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
            {/* Steering layout indicators */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-virt-steer-left"
                onMouseDown={() => handleVirtualPress('STEER', -1)}
                onMouseUp={() => handleVirtualPress('STEER', 0)}
                onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('STEER', -1); }}
                onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('STEER', 0); }}
                disabled={!isPlaying}
                className="py-2 rounded-lg border border-emerald-900/40 bg-gray-950/80 text-emerald-300 hover:text-white hover:bg-emerald-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-xs select-none"
              >
                ◀ STEER LEFT
              </button>
              <button
                id="btn-virt-steer-right"
                onMouseDown={() => handleVirtualPress('STEER', 1)}
                onMouseUp={() => handleVirtualPress('STEER', 0)}
                onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('STEER', 1); }}
                onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('STEER', 0); }}
                disabled={!isPlaying}
                className="py-2 rounded-lg border border-emerald-900/40 bg-gray-950/80 text-emerald-300 hover:text-white hover:bg-emerald-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-xs select-none"
              >
                STEER RIGHT ▶
              </button>
            </div>

            {/* Acceleration & reverse layout indicators */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-virt-accel"
                onMouseDown={() => handleVirtualPress('ACCEL', 1)}
                onMouseUp={() => handleVirtualPress('ACCEL', 0)}
                onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('ACCEL', 1); }}
                onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('ACCEL', 0); }}
                disabled={!isPlaying}
                className="py-3 rounded-lg border border-emerald-600/30 bg-emerald-950/40 text-emerald-200 hover:text-white hover:bg-emerald-900/30 active:scale-95 disabled:opacity-30 flex flex-col items-center justify-center font-bold text-sm select-none"
              >
                <span>🟢 ACCELERATE</span>
              </button>
              <button
                id="btn-virt-brake"
                onMouseDown={() => handleVirtualPress('ACCEL', -1)}
                onMouseUp={() => handleVirtualPress('ACCEL', 0)}
                onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('ACCEL', -1); }}
                onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('ACCEL', 0); }}
                disabled={!isPlaying}
                className="py-3 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-900/40 active:scale-95 disabled:opacity-30 flex flex-col items-center justify-center font-bold text-sm select-none"
              >
                <span>🔴 BRAKE / REV</span>
              </button>
            </div>
            
            <div className="flex gap-2 justify-center mt-1">
              {/* Optional Reset Run indicator */}
              <button
                id="btn-rally-restart"
                onClick={handleStartCircuit}
                className="text-[9px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-align Starting Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Historic Lap Records table database */}
        <div className="bg-gray-950 border border-emerald-900 rounded-xl p-3 flex-grow font-mono">
          <h4 className="flex items-center gap-1 text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lap Leaderboard records:</span>
          </h4>

          <div className="text-[10px] text-gray-400 space-y-1 max-h-[85px] overflow-y-auto">
            {lapHistory.length === 0 ? (
              <p className="text-gray-600 italic">No lap times registered yet!</p>
            ) : (
                lapHistory.map((h, i) => (
                <div key={i} className="flex justify-between items-center border-b border-emerald-950/30 pb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">#0{i + 1}</span>
                    <span className="text-gray-200 font-semibold">{h.lapTimeSeconds}s</span>
                  </div>
                  <span className="text-gray-500">{h.car} • {h.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
