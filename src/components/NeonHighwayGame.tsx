import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Zap, Compass, Car, Flame } from 'lucide-react';

interface CarPilot {
  id: string;
  name: string;
  vehicle: string;
  avatar: string;
  color: string;
  speed: number;
  perk: string;
}

interface ScoreItem {
  score: number;
  date: string;
  vehicle: string;
}

const VEHICLES: CarPilot[] = [
  {
    id: 'cyber-delorean',
    name: 'Akira-01',
    vehicle: 'Neo-Delorean V2',
    avatar: '🏎️',
    color: '#ff007f', // hot pink
    speed: 1.0,
    perk: 'Retro Fuel Boost (Boost decays 20% slower)'
  },
  {
    id: 'neon-gtr',
    name: 'Takahashi',
    vehicle: 'Zenith R-34',
    avatar: '🚗',
    color: '#00f3ff', // electric cyan
    speed: 1.15,
    perk: 'Supersonic Glide (15% faster base movement)'
  },
  {
    id: 'midnight-supra',
    name: 'Vapor-Gamer',
    vehicle: 'Supra-Hyperwave',
    avatar: '🏎️',
    color: '#fbbf24', // amber gold
    speed: 0.9,
    perk: 'Energy Synergy (Battery particles grant 25% extra points)'
  }
];

interface OncomingVehicle {
  id: number;
  lane: number;
  y: number;
  speed: number;
  color: string;
  emoji: string;
}

interface BatteryItem {
  id: number;
  lane: number;
  y: number;
  color: string;
}

export default function NeonHighwayGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedPilot, setSelectedPilot] = useState<CarPilot>(VEHICLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(120);
  const [boostEnergy, setBoostEnergy] = useState(0); // 0 to 100
  const [isHyperdriveActive, setIsHyperdriveActive] = useState(false);
  const [highScores, setHighScores] = useState<ScoreItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Core highway grid state with refs for fluid animation loop
  const playerLaneRef = useRef<number>(1); // 0 = Left, 1 = Center, 2 = Right
  const backgroundYRef = useRef<number>(0);
  const oncomingVehiclesRef = useRef<OncomingVehicle[]>([]);
  const batteriesRef = useRef<BatteryItem[]>([]);
  const gameIntervalRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);

  // Dynamic sound synthesizer
  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine', sweepEndFreq?: number) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (sweepEndFreq) {
        osc.frequency.exponentialRampToValueAtTime(sweepEndFreq, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored browser context restrictions
    }
  }, [isMuted]);

  // Load high scores
  useEffect(() => {
    const raw = localStorage.getItem('above_games_highway_highscores');
    if (raw) {
      try {
        setHighScores(JSON.parse(raw));
      } catch (e) {
        setHighScores([]);
      }
    } else {
      const fallback = [
        { score: 3200, date: '2026-05-24', vehicle: 'Zenith R-34' },
        { score: 2450, date: '2026-05-25', vehicle: 'Neo-Delorean V2' },
        { score: 1800, date: '2026-05-25', vehicle: 'Supra-Hyperwave' }
      ];
      setHighScores(fallback);
      localStorage.setItem('above_games_highway_highscores', JSON.stringify(fallback));
    }
  }, []);

  // Set decay for Boost meters
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const decayTimer = setInterval(() => {
      setBoostEnergy((prev) => {
        if (isHyperdriveActive) {
          if (prev <= 1.5) {
            setIsHyperdriveActive(false);
            playSound(300, 0.4, 'triangle');
            return 0;
          }
          // Akita-01 gets boost advantage perk
          const decayAmt = selectedPilot.id === 'cyber-delorean' ? 2.0 : 2.5;
          return Math.max(0, prev - decayAmt);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(decayTimer);
  }, [isPlaying, isGameOver, isHyperdriveActive, selectedPilot, playSound]);

  // Initialize/Respawn elements
  const spawnOncoming = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const id = Date.now() + Math.random();
    const trafficColors = ['#f43f5e', '#a855f7', '#6366f1', '#eab308'];
    const emojis = ['🛺', '🚒', '🚓', '🚕', '📦'];
    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    oncomingVehiclesRef.current.push({
      id,
      lane,
      y: -80,
      speed: 4 + Math.random() * 4,
      color: trafficColors[Math.floor(Math.random() * trafficColors.length)],
      emoji: chosenEmoji
    });
  }, []);

  const spawnBattery = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const id = Date.now() + Math.random();
    batteriesRef.current.push({
      id,
      lane,
      y: -60,
      color: '#22c55e' // glowing electric green
    });
  }, []);

  // Animation ticks & Physics calculation
  const runPhysics = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    // Fast-scrolling highway logic
    const scrollerVelocity = isHyperdriveActive ? 18 : 10 * selectedPilot.speed;
    backgroundYRef.current = (backgroundYRef.current + scrollerVelocity) % 400;

    // Update speed MPH dashboard presentation dynamically
    setCurrentSpeedKmh(Math.round((isHyperdriveActive ? 220 : 120) * selectedPilot.speed));

    // Incremental score reward purely for surviving
    setScore((prev) => prev + (isHyperdriveActive ? 4 : 1));

    // Periodic Traffic Spawner
    if (Math.random() < 0.03 && oncomingVehiclesRef.current.length < 5) {
      spawnOncoming();
    }
    // Dynamic Battery Spawner
    if (Math.random() < 0.015 && batteriesRef.current.length < 3) {
      spawnBattery();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const laneWidth = canvas.width / 3;

    // Collision tests & coordinate updates
    // Traffic update
    oncomingVehiclesRef.current = oncomingVehiclesRef.current.map((v) => {
      return { ...v, y: v.y + scrollerVelocity - v.speed };
    }).filter((v) => {
      const laneX = v.lane * laneWidth + laneWidth / 2;
      const playerX = playerLaneRef.current * laneWidth + laneWidth / 2;

      // Inside Collision Box: Width 36, Height 50
      const distanceX = Math.abs(laneX - playerX);
      const distanceY = Math.abs(v.y - 325); // Player rests stationary near base container row

      const collides = distanceX < 36 && distanceY < 42;

      // Invulnerable during super hyperdrive booster run
      if (collides && !isHyperdriveActive) {
        playSound(150, 0.4, 'sawtooth');
        setTimeout(() => playSound(80, 0.6, 'sawtooth'), 150);
        setIsGameOver(true);
        setIsPlaying(false);

        // Update Leaderboards locally
        setHighScores((prev) => {
          const item = { score, date: new Date().toISOString().split('T')[0], vehicle: selectedPilot.vehicle };
          const updated = [...prev, item].sort((a, b) => b.score - a.score).slice(0, 5);
          localStorage.setItem('above_games_highway_highscores', JSON.stringify(updated));
          return updated;
        });
      }

      return v.y < canvas.height && v.y > -100;
    });

    // Battery pickups check
    batteriesRef.current = batteriesRef.current.map((b) => {
      return { ...b, y: b.y + scrollerVelocity };
    }).filter((b) => {
      const laneX = b.lane * laneWidth + laneWidth / 2;
      const playerX = playerLaneRef.current * laneWidth + laneWidth / 2;
      const distanceX = Math.abs(laneX - playerX);
      const distanceY = Math.abs(b.y - 325);

      const pickedUp = distanceX < 30 && distanceY < 35;

      if (pickedUp) {
        playSound(880, 0.12, 'sine', 1320);

        // Score modifiers based on pilot perks
        const batteryPoints = selectedPilot.id === 'midnight-supra' ? 125 : 100;
        setScore((prev) => prev + batteryPoints);

        setBoostEnergy((prev) => {
          const loaded = Math.min(100, prev + 25);
          if (loaded >= 100 && !isHyperdriveActive) {
            setIsHyperdriveActive(true);
            playSound(350, 0.5, 'square', 1100);
          }
          return loaded;
        });

        return false; // delete item
      }

      return b.y < canvas.height;
    });

    // Draw frame graphics
    renderHighway();

    animationFrameRef.current = requestAnimationFrame(runPhysics);
  }, [isPlaying, isGameOver, selectedPilot, score, isHyperdriveActive, spawnOncoming, spawnBattery, playSound]);

  // Render Engine on 2D Context
  const renderHighway = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const laneWidth = canvas.width / 3;

    // 1. Sleek Cyberpunk purple highway backplate
    ctx.fillStyle = '#0f0514';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Perspective horizon shading
    const gridGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gridGrad.addColorStop(0, '#1a0026');
    gridGrad.addColorStop(1, '#000000');
    ctx.fillStyle = gridGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Animated neon road separators
    ctx.strokeStyle = '#a21caf'; // dark rose-700
    ctx.lineWidth = 4;
    for (let c = 1; c < 3; c++) {
      ctx.beginPath();
      ctx.moveTo(c * laneWidth, 0);
      ctx.lineTo(c * laneWidth, canvas.height);
      ctx.stroke();

      // Dashed scrolling white dashes overlay
      ctx.strokeStyle = '#e879f9'; // neon violet-400
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      ctx.lineDashOffset = -backgroundYRef.current;
      ctx.beginPath();
      ctx.moveTo(c * laneWidth, 0);
      ctx.lineTo(c * laneWidth, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dashed matrix
    }

    // Lane side safety barriers with flashing red neon bulbs
    ctx.fillStyle = '#db2777';
    ctx.fillRect(0, 0, 8, canvas.height);
    ctx.fillRect(canvas.width - 8, 0, 8, canvas.height);

    // Sideline dot flashes
    ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0) ? '#ff0055' : '#4a001a';
    for (let l = 0; l < canvas.height; l += 50) {
      const layoutScroll = (l + backgroundYRef.current) % canvas.height;
      ctx.beginPath();
      ctx.arc(4, layoutScroll, 3, 0, Math.PI * 2);
      ctx.arc(canvas.width - 4, layoutScroll, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Battery collectibles
    batteriesRef.current.forEach((b) => {
      const batX = b.lane * laneWidth + laneWidth / 2;
      const batY = b.y;

      // Glow pulse
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(batX, batY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Battery label design
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', batX, batY);
      ctx.restore();
    });

    // 4. Draw Traffic cars with emojis + high glow
    oncomingVehiclesRef.current.forEach((v) => {
      const trafX = v.lane * laneWidth + laneWidth / 2;
      const trafY = v.y;

      ctx.save();
      // Glow shadow styling
      ctx.shadowColor = v.color;
      ctx.shadowBlur = 10;

      // Glowing body frame
      ctx.fillStyle = `${v.color}aa`;
      ctx.beginPath();
      ctx.roundRect(trafX - 18, trafY - 26, 36, 52, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Superimpose clean vehicular emoji
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.emoji, trafX, trafY);

      // Flashing taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(trafX - 12, trafY - 24, 4, 2);
      ctx.fillRect(trafX + 8, trafY - 24, 4, 2);
      ctx.restore();
    });

    // 5. Draw Player cyber-car (stationary vertically at Y: 325)
    const pX = playerLaneRef.current * laneWidth + laneWidth / 2;
    const pY = 325;

    ctx.save();
    // Heavy back glowing glow
    ctx.shadowColor = selectedPilot.color;
    ctx.shadowBlur = isHyperdriveActive ? 25 : 12;

    // Invincible shield bubble during hyperdrive mode
    if (isHyperdriveActive) {
      const activePulse = 28 + Math.sin(Date.now() / 60) * 4;
      ctx.strokeStyle = `hsla(${(Date.now() / 10) % 360}, 100%, 50%, 0.9)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pX, pY, activePulse, 0, Math.PI * 2);
      ctx.stroke();

      // Visual particles inside bubble
      ctx.fillStyle = `${selectedPilot.color}15`;
      ctx.beginPath();
      ctx.arc(pX, pY, activePulse - 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw sports car sleek retrowave chassis
    ctx.fillStyle = selectedPilot.color;
    ctx.beginPath();
    ctx.roundRect(pX - 18, pY - 26, 36, 52, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing cyan windshield
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.roundRect(pX - 12, pY + 4, 24, 10, 3);
    ctx.fill();

    // Wheel hubs design
    ctx.fillStyle = '#000000';
    ctx.fillRect(pX - 22, pY - 20, 4, 10);
    ctx.fillRect(pX + 18, pY - 20, 4, 10);
    ctx.fillRect(pX - 22, pY + 12, 4, 10);
    ctx.fillRect(pX + 18, pY + 12, 4, 10);

    // Glowing front golden headlight LEDs
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(pX - 12, pY + 23, 5, 2);
    ctx.fillRect(pX + 7, pY + 23, 5, 2);

    ctx.restore();

    // Horizontal warning tag indicators
    oncomingVehiclesRef.current.forEach((v) => {
      if (v.y < 0) {
        const warnX = v.lane * laneWidth + laneWidth / 2;
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼ TRAFFIC ONCOMING', warnX, 14);
      }
    });
  };

  // Steer left-to-right
  const steer = (dir: 'LEFT' | 'RIGHT') => {
    if (!isPlaying) return;
    const currentLane = playerLaneRef.current;
    if (dir === 'LEFT' && currentLane > 0) {
      playerLaneRef.current = currentLane - 1;
      playSound(550, 0.08, 'sine', 700);
    } else if (dir === 'RIGHT' && currentLane < 2) {
      playerLaneRef.current = currentLane + 1;
      playSound(550, 0.08, 'sine', 700);
    }
  };

  const handleStartGame = () => {
    setIsGameOver(false);
    setScore(0);
    setBoostEnergy(0);
    setIsHyperdriveActive(false);
    playerLaneRef.current = 1;

    oncomingVehiclesRef.current = [];
    batteriesRef.current = [];

    setIsPlaying(true);

    // Classic arcade power chime
    playSound(440, 0.1, 'sine');
    setTimeout(() => playSound(554, 0.1, 'sine'), 80);
    setTimeout(() => playSound(659, 0.12, 'sine'), 160);
    setTimeout(() => playSound(880, 0.25, 'triangle'), 240);
  };

  // Main game ticks control loop
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      animationFrameRef.current = requestAnimationFrame(runPhysics);
    }
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isGameOver, runPhysics]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyMovement = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        steer('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        steer('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyMovement);
    return () => window.removeEventListener('keydown', handleKeyMovement);
  }, [isPlaying]);

  // Component setup pre-render
  useEffect(() => {
    renderHighway();
  }, [selectedPilot]);

  return (
    <div className="w-full max-w-4xl bg-gray-950/80 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 p-4 sm:p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-center">
      
      {/* 1. Visual canvas arena viewport */}
      <div className="relative shrink-0 border-4 border-gray-900 bg-gray-950 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="block max-w-full aspect-square bg-[#0a030d] w-[340px] sm:w-[400px]"
        />

        {/* Console overlays */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 text-center select-none">
            {isGameOver ? (
              <div className="w-full max-w-xs animate-fade-in text-center">
                <p className="text-pink-500 font-mono font-bold tracking-widest text-xs uppercase mb-1">SYSTEM WARNING COLLISION</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6 text-pink-500 animate-pulse" />
                  <span>CRASHED OUT</span>
                </h3>

                <div className="bg-gray-900 border border-pink-500/20 rounded-xl py-3 px-4 mb-4 font-mono">
                  <span className="text-[10px] text-gray-500 block">TOTAL SCORE SAVED</span>
                  <span className="text-3xl font-extrabold text-pink-400 block">{score}</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Vehicle: {selectedPilot.vehicle}</span>
                </div>

                <button
                  id="btn-highway-retry"
                  onClick={handleStartGame}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold font-mono text-xs transition-all shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>HIGHWAY DECK REBOOT</span>
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm flex flex-col justify-between h-full py-4 px-2">
                <div className="text-center">
                  <div className="flex justify-center gap-1.5 items-center mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-bold">NATIVE HIGHWAY DRIVER</span>
                  </div>
                  <h3 className="text-xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-400 uppercase tracking-widest leading-none mb-1">
                    TOKYO HORIZON DRIFT
                  </h3>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    Dodge scrolling commuter units, grab battery cells to active full-bubble Hyperdrive invincibility speed perks!
                  </p>
                </div>

                {/* Pilot selectors */}
                <div className="space-y-2.5 my-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block text-left">Deploy Speed Chassis:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLES.map((v) => (
                      <button
                        key={v.id}
                        id={`btn-vehicle-select-${v.id}`}
                        onClick={() => setSelectedPilot(v)}
                        className={`p-2 border rounded-xl flex flex-col items-center justify-center transition-all ${
                          selectedPilot.id === v.id
                            ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-105'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span className="text-2xl mb-1">{v.avatar}</span>
                        <span className="text-[9px] font-bold font-mono truncate max-w-full text-center">{v.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Vehicle specs and traits */}
                  <div className="bg-gray-950 border border-indigo-950 rounded-xl px-3 py-2 text-left text-[10px] font-mono flex flex-col gap-1 text-gray-300">
                    <div>
                      <span className="text-pink-400 font-bold">Chassis:</span> {selectedPilot.vehicle}
                    </div>
                    <div>
                      <span className="text-pink-400 font-bold">Speed Coeff:</span> {selectedPilot.speed}x (Base Velocity rating)
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold">Injected Perk:</span> {selectedPilot.perk}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-highway-start"
                  onClick={handleStartGame}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-black font-mono text-xs transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer uppercase tracking-widest"
                >
                  <Play className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>Launch {selectedPilot.name} 🏎️</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Controls Dashboard Metadata */}
      <div className="flex-grow w-full flex flex-col justify-between self-stretch gap-4">
        
        <div className="bg-gray-900/50 border border-indigo-950 p-4 rounded-2xl flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center border-b border-gray-900 pb-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pilot: <strong>{selectedPilot.name}</strong></span>
            </span>
            <div className="text-xs font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Pts: {score}</span>
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="flex justify-between items-center text-[11px] text-gray-400 border-b border-gray-900 pb-2">
            <span>Turbines Velocity Speed:</span>
            <span className={`text-sm font-bold ${isHyperdriveActive ? 'text-pink-400' : 'text-indigo-400'}`}>
              {currentSpeedKmh} KM/H {isHyperdriveActive ? '(BURNING)' : ''}
            </span>
          </div>

          {/* Hyperdrive battery boost meter */}
          <div className="space-y-1 my-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-indigo-300 font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-pink-500 animate-pulse" />
                <span>Battery Boost Core:</span>
              </span>
              <span className="text-indigo-400">{boostEnergy}% charged</span>
            </div>
            
            <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden border border-indigo-950/40 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isHyperdriveActive
                    ? 'bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-400 animate-pulse'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${boostEnergy}%` }}
              />
            </div>
          </div>

          {/* Buff warnings */}
          {isHyperdriveActive && (
            <div className="animate-pulse bg-pink-950/30 border border-pink-500/20 rounded-xl px-2.5 py-1.5 text-center text-[10px] text-pink-400 font-bold flex justify-center items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-pink-500 animate-spin" />
              <span>HYPERDRIVE BOOST BURNT: COMPLETE COLLISION PROTECTION</span>
            </div>
          )}

          {/* Sounds chip settings */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-400">Horizon Audio Synth:</span>
            <button
              id="btn-highway-sound-toggle"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-gray-900 border-gray-805 text-gray-500'
                  : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Touch button controller layout */}
        <div className="bg-gray-900/50 border border-indigo-950 p-4 rounded-2xl flex flex-col gap-3 font-mono">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block text-center">Steer Deck Panel:</span>
          
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto w-full">
            <button
              id="btn-highway-left"
              onClick={() => steer('LEFT')}
              disabled={!isPlaying}
              className="py-3 rounded-xl border border-indigo-900/40 bg-gray-950/80 text-indigo-300 hover:text-white hover:bg-indigo-900/30 focus:outline-none active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-sm select-none"
            >
              ◀ SWAP LEFT
            </button>
            <button
              id="btn-highway-right"
              onClick={() => steer('RIGHT')}
              disabled={!isPlaying}
              className="py-3 rounded-xl border border-indigo-900/40 bg-gray-950/80 text-indigo-300 hover:text-white hover:bg-indigo-900/30 focus:outline-none active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-sm select-none"
            >
              SWAP RIGHT ▶
            </button>
          </div>
          <span className="text-[8px] text-gray-500 text-center block">You can also steer with A / D or ArrowLeft / ArrowRight!</span>
        </div>

        {/* Local highway scores table */}
        <div className="bg-gray-950 border border-indigo-900 rounded-xl p-3 flex-grow font-mono">
          <h4 className="flex items-center gap-1 text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Highway Scoreboard:</span>
          </h4>

          <div className="text-[10px] text-gray-400 space-y-1 max-h-[85px] overflow-y-auto">
            {highScores.length === 0 ? (
              <p className="text-gray-600 italic">No pilots saved highway runs!</p>
            ) : (
                highScores.map((h, i) => (
                <div key={i} className="flex justify-between items-center border-b border-indigo-950/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-pink-400 font-bold">#0{i + 1}</span>
                    <span className="text-gray-200 font-semibold">{h.score} score</span>
                  </div>
                  <span className="text-gray-500">{h.vehicle} • {h.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
