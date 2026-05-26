import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Sparkles, Zap, Flame, User, Coffee } from 'lucide-react';

interface AnimeCharacter {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  sparkleColor: string;
  foodPreference: string;
  specialAbility: string;
  speedMultiplier: number;
}

interface ScoreItem {
  score: number;
  date: string;
  character: string;
}

const CHARACTERS: AnimeCharacter[] = [
  {
    id: 'sakura',
    name: 'Sakura-chan',
    title: 'Spring Blossom Pilot',
    avatar: '🌸',
    color: '#f472b6', // soft rose-400
    sparkleColor: '#fbcfe8',
    foodPreference: '🍓 Strawberry Mochi & 🧋 Boba Tea',
    specialAbility: 'Speed Dampening (Eater of Sweet Boba Teas slowdown)',
    speedMultiplier: 0.95
  },
  {
    id: 'shinobi',
    name: 'Ronin-kun',
    title: 'Neon Shade Shinobi',
    avatar: '🥷',
    color: '#22d3ee', // cyans-400
    sparkleColor: '#cffafe',
    foodPreference: '🍜 Spicy Chashu Ramen',
    specialAbility: 'Mega Combo Fuel (Spicy noodle eating grows multiplier 2x fast)',
    speedMultiplier: 1.1
  },
  {
    id: 'cyber',
    name: 'Senpai-V3',
    title: 'Cybernetic AI Synth',
    avatar: '⚡',
    color: '#fbbf24', // golden amber-400
    sparkleColor: '#fef3c7',
    foodPreference: '🍣 Golden Dragon Sushi',
    specialAbility: 'Sushi Invincibility (Avoid self-tail collision for 4 seconds on eating Sushi)',
    speedMultiplier: 1.25
  }
];

interface FoodItem {
  x: number;
  y: number;
  type: 'boba' | 'ramen' | 'sushi' | 'mochi';
  points: number;
  emoji: string;
}

export default function DrainageGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states
  const [selectedChar, setSelectedChar] = useState<AnimeCharacter>(CHARACTERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [frenzyEnergy, setFrenzyEnergy] = useState(0); // 0 to 100
  const [isFrenzyActive, setIsFrenzyActive] = useState(false);
  const [activeBuff, setActiveBuff] = useState<{ type: string; secondsLeft: number } | null>(null);
  const [highScores, setHighScores] = useState<ScoreItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Snake coordinates & movement refs
  const snakeRef = useRef<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const directionRef = useRef<{ x: number; y: number }>({ x: 0, y: -1 });
  const foodRef = useRef<FoodItem>({
    x: 5,
    y: 5,
    type: 'boba',
    points: 10,
    emoji: '🧋'
  });
  const gameIntervalRef = useRef<any>(null);

  // Background Particles list for aesthetic anime falling blossoms / cyber grid metrics backdrops
  const particlesRef = useRef<{ x: number; y: number; vy: number; vx: number; size: number; alpha: number; angle: number; rotSpeed: number }[]>([]);

  // Sound chip manager using Web Audio API
  const playSynthSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine', sweepEndFreq?: number) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Pitch sweeps
      if (sweepEndFreq) {
        osc.frequency.exponentialRampToValueAtTime(sweepEndFreq, ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio forbidden by current user environment safely ignored
    }
  }, [isMuted]);

  // Load High Scores from local persistence
  useEffect(() => {
    const raw = localStorage.getItem('above_games_drainage_highscores');
    if (raw) {
      try {
        setHighScores(JSON.parse(raw));
      } catch (e) {
        setHighScores([]);
      }
    } else {
      const fallback = [
        { score: 1540, date: '2026-05-22', character: 'Senpai-V3' },
        { score: 980, date: '2026-05-24', character: 'Ronin-kun' },
        { score: 720, date: '2026-05-25', character: 'Sakura-chan' }
      ];
      setHighScores(fallback);
      localStorage.setItem('above_games_drainage_highscores', JSON.stringify(fallback));
    }
  }, []);

  // Set active buffs timers
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    if (!activeBuff) return;

    const timer = setInterval(() => {
      setActiveBuff((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          playSynthSound(400, 0.2, 'triangle'); // buff expiry chip tune
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBuff, isPlaying, isGameOver, playSynthSound]);

  // Decline combo energy over time to force fast rhythmic actions!
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const comboDecay = setInterval(() => {
      setFrenzyEnergy((prev) => {
        if (isFrenzyActive) {
          // Drain frenzy mode
          if (prev <= 1.5) {
            setIsFrenzyActive(false);
            playSynthSound(300, 0.4, 'sawtooth');
            return 0;
          }
          return prev - 2.5; 
        } else {
          // Slow passive decay
          return Math.max(0, prev - 1.2);
        }
      });
    }, 150);

    return () => clearInterval(comboDecay);
  }, [isPlaying, isGameOver, isFrenzyActive, playSynthSound]);

  // Respawn a random anime food treat
  const respawnFood = useCallback(() => {
    const tileCount = 20;
    let newX = 5, newY = 5;
    let isOnSnake = true;
    while (isOnSnake) {
      newX = Math.floor(Math.random() * tileCount);
      newY = Math.floor(Math.random() * tileCount);
      isOnSnake = snakeRef.current.some((segment) => segment.x === newX && segment.y === newY);
    }

    const types: ('boba' | 'ramen' | 'sushi' | 'mochi')[] = ['boba', 'ramen', 'sushi', 'mochi'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    let points = 10;
    let emoji = '🧋';

    switch (chosenType) {
      case 'ramen':
        points = 25;
        emoji = '🍜';
        break;
      case 'sushi':
        points = 20;
        emoji = '🍣';
        break;
      case 'mochi':
        points = 15;
        emoji = '🍓';
        break;
      case 'boba':
      default:
        points = 10;
        emoji = '🧋';
        break;
    }

    foodRef.current = {
      x: newX,
      y: newY,
      type: chosenType,
      points,
      emoji
    };
  }, []);

  // Pre-seed background particles
  const initParticles = useCallback(() => {
    const list = [];
    for (let i = 0; i < 25; i++) {
      list.push({
        x: Math.random() * 400,
        y: Math.random() * 400,
        vy: 0.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.6,
        size: 2 + Math.random() * 6,
        alpha: 0.15 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }
    particlesRef.current = list;
  }, []);

  // Draw Arena Graphics with custom visual highlights
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = 20;

    // 1. Draw solid dark anime backdrop
    ctx.fillStyle = '#0f111a'; // rich deep cosmic anime black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw falling theme particles first (e.g. Cherry blossoms for Sakura, neon code lines for Cyber)
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      
      if (selectedChar.id === 'sakura') {
        // Cherry blossoms layout (little pink heart petals)
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI, true);
        ctx.lineTo(0, p.size * 1.5);
        ctx.closePath();
        ctx.fill();
      } else if (selectedChar.id === 'shinobi') {
        // Cyan shuriken/stars sparks
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.lineTo(0, -p.size);
          ctx.lineTo(p.size * 0.3, -p.size * 0.3);
          ctx.rotate(Math.PI / 2);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Cyber neon matrix code fragments
        ctx.fillStyle = '#fbbf24';
        ctx.font = `${p.size + 4}px monospace`;
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', 0, 0);
      }
      ctx.restore();

      // Update particle physics positions
      p.y += p.vy;
      p.x += p.vx;
      p.angle += p.rotSpeed;

      // Wrap boundary
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10 || p.x > canvas.width + 10) {
        p.x = Math.random() * canvas.width;
      }
    });

    // 3. Subtle background Cyber GRID Lines with gradient glow
    ctx.strokeStyle = isFrenzyActive ? 'rgba(236, 72, 153, 0.08)' : 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }

    // 4. Draw Glow aura around entire canvas borders in frenzy mode
    if (isFrenzyActive) {
      ctx.strokeStyle = `hsla(${(Date.now() / 15) % 360}, 90%, 60%, 0.8)`;
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // 5. Draw Anime Food collectible item
    const food = foodRef.current;
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;

    // Draw sweet custom neon background pulse behind food
    const pulseRadius = 10 + Math.sin(Date.now() / 100) * 4;
    ctx.shadowColor = selectedChar.color;
    ctx.shadowBlur = isFrenzyActive ? 16 : 8;
    ctx.fillStyle = `${selectedChar.color}20`; // Hex transparency
    ctx.beginPath();
    ctx.arc(foodX + gridSize/2, foodY + gridSize/2, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Superimpose high fidelity emoji food centered perfectly
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.emoji, foodX + gridSize/2, foodY + gridSize/2 + 0.5);

    // 6. Draw Glowing Tapering Anime Neon Snake
    snakeRef.current.forEach((segment, idx) => {
      const isHead = idx === 0;
      const segX = segment.x * gridSize;
      const segY = segment.y * gridSize;

      ctx.save();
      // Snake shadow styling
      ctx.shadowColor = isHead ? selectedChar.color : `${selectedChar.color}aa`;
      ctx.shadowBlur = isHead ? 15 : 6;

      // Draw custom tapering circle logic for a beautiful fluid dragon/lizard look!
      const progress = idx / snakeRef.current.length;
      const sizeMultiplier = Math.max(0.4, 1 - progress * 0.55); // smooth gradient shrinking
      const circleRadius = (gridSize / 2) * sizeMultiplier;

      ctx.fillStyle = isHead ? '#ffffff' : selectedChar.color;
      ctx.beginPath();
      ctx.arc(segX + gridSize/2, segY + gridSize/2, circleRadius - 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Stop neon shadow blurring
      ctx.shadowBlur = 0;

      // Draw cute blushing anime eyes on the Head segment
      if (isHead) {
        // Cute blush circles
        ctx.fillStyle = '#f43f5e99'; // pastel pink blush
        ctx.beginPath();
        ctx.arc(segX + 5, segY + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(segX + 15, segY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Big shining anime eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(segX + 6, segY + 8, 3, 0, Math.PI * 2);
        ctx.arc(segX + 14, segY + 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shiny sparkles (white highlights in eyes)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(segX + 5, segY + 7, 0.8, 0, Math.PI * 2);
        ctx.arc(segX + 13, segY + 7, 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Ninja mask detail for shinobi
        if (selectedChar.id === 'shinobi') {
          ctx.strokeStyle = '#0891b2';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(segX + 2, segY + 13);
          ctx.lineTo(segX + 18, segY + 13);
          ctx.stroke();
        }
      }
      ctx.restore();
    });

    // 7. Active Buff notice on canvas bottom row
    if (activeBuff) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`⚡ ACTIVE: ${activeBuff.type.toUpperCase()} (${activeBuff.secondsLeft}s)`, 8, 14);
    }
  }, [selectedChar, isFrenzyActive, activeBuff]);

  // Handle active gameplay step
  const gameStep = useCallback(() => {
    const tileCount = 20;
    const head = { ...snakeRef.current[0] };
    const dir = directionRef.current;

    // Compute coordinates
    const nextHead = {
      x: head.x + dir.x,
      y: head.y + dir.y
    };

    // Obstacle rules (wrap-around option for walls, or hard barriers! Let's make walls wrap around to encourage ultra high speed play!)
    if (nextHead.x < 0) nextHead.x = tileCount - 1;
    if (nextHead.x >= tileCount) nextHead.x = 0;
    if (nextHead.y < 0) nextHead.y = tileCount - 1;
    if (nextHead.y >= tileCount) nextHead.y = 0;

    // Self tail crash detection (invulnerable bypass if sushi shield mode active)
    const formsSelfCrash = snakeRef.current.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
    const hasShield = activeBuff?.type === 'Sushi Shield';

    if (formsSelfCrash && !hasShield) {
      // Game Over! Play synth crash theme
      playSynthSound(180, 0.5, 'sawtooth');
      setTimeout(() => playSynthSound(90, 0.7, 'sawtooth'), 200);

      setIsGameOver(true);
      setIsPlaying(false);
      clearInterval(gameIntervalRef.current);

      // Save highscores
      setHighScores((prev) => {
        const item = { score, date: new Date().toISOString().split('T')[0], character: selectedChar.name };
        const updated = [...prev, item].sort((a,b) => b.score - a.score).slice(0, 5);
        localStorage.setItem('above_games_drainage_highscores', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // Unshift new movement head forward
    snakeRef.current.unshift(nextHead);

    // Food Consumption validation
    const food = foodRef.current;
    if (nextHead.x === food.x && nextHead.y === food.y) {
      
      // Calculate Combo stats
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      const mult = Math.min(5, 1 + Math.floor(nextCombo / 3) * (selectedChar.id === 'shinobi' ? 2 : 1));
      setComboMultiplier(mult);

      // Add energy
      const addEnergy = food.type === 'ramen' ? 35 : 20;
      setFrenzyEnergy((prev) => {
        const next = Math.min(100, prev + addEnergy);
        if (next >= 100 && !isFrenzyActive) {
          setIsFrenzyActive(true);
          // Play Frenzy Super Sound Sweep!
          playSynthSound(300, 0.4, 'square', 1200);
          setTimeout(() => playSynthSound(800, 0.5, 'triangle', 1800), 100);
        }
        return next;
      });

      // Character buffs activation trigger
      if (food.type === 'boba') {
        // Slow down active play
        setActiveBuff({ type: 'Boba Slownet', secondsLeft: 5 });
        playSynthSound(500, 0.15, 'sine', 300); // slurpy suction pop down
      } else if (food.type === 'sushi' && selectedChar.id === 'cyber') {
        setActiveBuff({ type: 'Sushi Shield', secondsLeft: 5 });
        playSynthSound(700, 0.25, 'triangle', 950);
      } else if (food.type === 'ramen') {
        playSynthSound(600, 0.3, 'sine', 990); // delicious noodle slide sound
      } else {
        playSynthSound(880, 0.1, 'sine');
      }

      // Add actual points (multiplied by current Combo + Frenzy factor)
      const multiplierFactor = mult * (isFrenzyActive ? 2 : 1);
      setScore((prev) => prev + food.points * multiplierFactor);

      // Generate tasty particles splash vectors!
      respawnFood();
    } else {
      // Normal moving steps (cut tail segment off to keep steady grid sizes)
      snakeRef.current.pop();
    }

    renderCanvas();
  }, [score, comboCount, comboMultiplier, isFrenzyActive, selectedChar, activeBuff, respawnFood, renderCanvas, playSynthSound]);

  // Determine active dynamic game interval clock speeds
  const getSpeedMs = useCallback(() => {
    let base = 100; // standard medium
    
    // adjust baseline speed for specific pilot specs
    base = Math.round(base * selectedChar.speedMultiplier);

    // applyactive buffs slowdown
    if (activeBuff?.type === 'Boba Slownet') {
      base = Math.round(base * 1.6); // 60% slower
    }

    // frenzy mode increases velocity for high danger and points returns!
    if (isFrenzyActive) {
      base = Math.round(base * 0.75); 
    }

    return Math.max(45, base);
  }, [selectedChar, activeBuff, isFrenzyActive]);

  // Restart trigger
  const handlePowerUpGame = () => {
    setIsGameOver(false);
    setScore(0);
    setComboCount(0);
    setComboMultiplier(1);
    setFrenzyEnergy(0);
    setIsFrenzyActive(false);
    setActiveBuff(null);

    // Initial position
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    directionRef.current = { x: 0, y: -1 };

    respawnFood();
    initParticles();
    setIsPlaying(true);

    // Anime game on-button chime
    playSynthSound(523, 0.1, 'square'); // C5
    setTimeout(() => playSynthSound(659, 0.12, 'square'), 80); // E5
    setTimeout(() => playSynthSound(784, 0.15, 'square'), 160); // G5
    setTimeout(() => playSynthSound(1046, 0.25, 'triangle'), 240); // C6
  };

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const watchKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (watchKeys.includes(e.key)) {
        e.preventDefault();
      }

      const activeDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (activeDir.y === 0) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (activeDir.y === 0) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (activeDir.x === 0) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (activeDir.x === 0) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isPlaying]);

  // Touch triggers / Screen joysticks helpers
  const handleVirtualDir = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (!isPlaying) return;
    const activeDir = directionRef.current;
    switch (dir) {
      case 'UP':
        if (activeDir.y === 0) {
          directionRef.current = { x: 0, y: -1 };
          playSynthSound(440, 0.04);
        }
        break;
      case 'DOWN':
        if (activeDir.y === 0) {
          directionRef.current = { x: 0, y: 1 };
          playSynthSound(400, 0.04);
        }
        break;
      case 'LEFT':
        if (activeDir.x === 0) {
          directionRef.current = { x: -1, y: 0 };
          playSynthSound(420, 0.04);
        }
        break;
      case 'RIGHT':
        if (activeDir.x === 0) {
          directionRef.current = { x: 460, y: 0 }; // wait typo prevention check
          directionRef.current = { x: 1, y: 0 };
          playSynthSound(480, 0.04);
        }
        break;
    }
  };

  // Clock dynamic Tick speeds
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      gameIntervalRef.current = setInterval(gameStep, getSpeedMs());
    }
    return () => clearInterval(gameIntervalRef.current);
  }, [isPlaying, isGameOver, gameStep, getSpeedMs]);

  // Pre-seed canvas rendering
  useEffect(() => {
    initParticles();
    renderCanvas();
  }, [selectedChar, initParticles, renderCanvas]);

  return (
    <div className="w-full max-w-4xl bg-gray-950/80 border border-purple-500/20 shadow-lg shadow-purple-500/5 p-4 sm:p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-center">
      
      {/* 1. Character Pre-Selection / Game Over Cover Screens */}
      <div className="relative shrink-0 border-4 border-gray-900 bg-gray-950 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="block max-w-full aspect-square bg-[#0c0d14] w-[340px] sm:w-[400px]"
        />

        {/* Dashboard Panels */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 text-center select-none">
            
            {isGameOver ? (
              <div className="w-full max-w-xs animate-fade-in text-center">
                <p className="text-pink-500 font-mono font-bold tracking-widest text-xs uppercase mb-1">SYSTEM DRAINAGE OVER</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6 text-pink-500 animate-pulse" />
                  <span>GAME OVER</span>
                </h3>
                
                <div className="bg-gray-900 border border-pink-500/20 rounded-xl py-3 px-4 mb-4 font-mono">
                  <span className="text-[10px] text-gray-500 block">FINAL SCORE ACHIEVED</span>
                  <span className="text-3xl font-extrabold text-pink-400 block">{score}</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Combo Peak: {comboCount} Hits</span>
                </div>

                <button
                  id="btn-drainage-retry"
                  onClick={handlePowerUpGame}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold font-mono text-xs transition-all shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>DECK REBOOT RUN</span>
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm flex flex-col justify-between h-full py-4 px-2">
                <div className="text-center">
                  <div className="flex justify-center gap-1.5 items-center mb-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-pink-400 font-bold">ARCADE NATIVE ENGINE</span>
                  </div>
                  <h3 className="text-xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 uppercase tracking-widest leading-none mb-1">
                    DRAINAGE: Neon ANIME
                  </h3>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    Select your anime core pilot avatar and collect local treats (🍜/🧋) with real synthesized sound waves!
                  </p>
                </div>

                {/* Cyber cockpit pilots list selector */}
                <div className="space-y-2.5 my-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block text-left">Deploy Core Pilot:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {CHARACTERS.map((char) => (
                      <button
                        key={char.id}
                        id={`btn-char-select-${char.id}`}
                        onClick={() => setSelectedChar(char)}
                        className={`p-2 border rounded-xl flex flex-col items-center justify-center transition-all ${
                          selectedChar.id === char.id
                            ? 'bg-purple-950/50 border-pink-500 text-white shadow-md shadow-pink-500/10 scale-105'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span className="text-2xl mb-1">{char.avatar}</span>
                        <span className="text-[10px] font-bold font-mono truncate max-w-full text-center">{char.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected trait box details */}
                  <div className="bg-gray-950 border border-purple-950 rounded-xl px-3 py-2 text-left text-[10px] font-mono flex flex-col gap-1 text-gray-300">
                    <div>
                      <span className="text-pink-400 font-bold">Class:</span> {selectedChar.title}
                    </div>
                    <div>
                      <span className="text-pink-400 font-bold">Prefers:</span> {selectedChar.foodPreference}
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold">Speciality:</span> {selectedChar.specialAbility}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-drainage-start"
                  onClick={handlePowerUpGame}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black font-mono text-xs transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer uppercase tracking-widest"
                >
                  <Play className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>Deploy {selectedChar.name} 🚀</span>
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 2. Side Panel Dashboard Info */}
      <div className="flex-grow w-full flex flex-col justify-between self-stretch gap-4">
        
        {/* Controls, Scoring, Buffs */}
        <div className="bg-gray-900/50 border border-purple-950 p-4 rounded-2xl flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center border-b border-gray-900 pb-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Pilot: <strong>{selectedChar.name}</strong></span>
            </span>
            <div className="text-xs font-bold text-pink-300 bg-pink-950/40 border border-pink-900/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Zap className="w-3 h-3 text-pink-400" />
              <span>Score: {score}</span>
            </div>
          </div>

          {/* Energy Bar & Combo Multipliers */}
          <div className="space-y-1 my-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-purple-300 font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-pink-500 animate-pulse" />
                <span>Frenzy Core Combo:</span>
              </span>
              <span className="text-pink-400">Combo X{comboMultiplier} ({comboCount} Hits)</span>
            </div>
            
            <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden border border-purple-950/40 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isFrenzyActive
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 animate-pulse'
                    : 'bg-purple-600'
                }`}
                style={{ width: `${frenzyEnergy}%` }}
              />
            </div>
          </div>

          {/* Buff Info Displays */}
          {activeBuff && (
            <div className="animate-pulse bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 flex justify-between items-center text-[10px]">
              <div className="text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buff Active: <strong>{activeBuff.type}</strong></span>
              </div>
              <span className="text-emerald-300 font-semibold">{activeBuff.secondsLeft} Seconds</span>
            </div>
          )}

          {/* Audio sound settings */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-400">Synth Sound Chip:</span>
            <button
              id="btn-drainage-sound-toggle"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-gray-900 border-gray-805 text-gray-500'
                  : 'bg-pink-950/30 border-pink-500/20 text-pink-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3. Physical Sound Board Keyboard/Touch Simulator (Saves local keyboard issue) */}
        <div className="bg-gray-900/50 border border-purple-950 p-4 rounded-2xl flex flex-col gap-3 font-mono">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">D-Pad Steering Deck (Touch / Cursor):</span>
          
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            {/* UP button */}
            <button
              id="vjoy-up"
              onClick={() => handleVirtualDir('UP')}
              disabled={!isPlaying}
              className="w-10 h-10 rounded-xl border border-purple-900/40 bg-gray-950/80 text-purple-300 hover:text-white hover:bg-purple-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-center select-none"
            >
              ▲
            </button>
            <div className="flex gap-1.5">
              {/* LEFT button */}
              <button
                id="vjoy-left"
                onClick={() => handleVirtualDir('LEFT')}
                disabled={!isPlaying}
                className="w-10 h-10 rounded-xl border border-purple-900/40 bg-gray-950/80 text-purple-300 hover:text-white hover:bg-purple-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-center select-none"
              >
                ◀
              </button>
              {/* DOWN button */}
              <button
                id="vjoy-down"
                onClick={() => handleVirtualDir('DOWN')}
                disabled={!isPlaying}
                className="w-10 h-10 rounded-xl border border-purple-900/40 bg-gray-950/80 text-purple-300 hover:text-white hover:bg-purple-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-center select-none"
              >
                ▼
              </button>
              {/* RIGHT button */}
              <button
                id="vjoy-right"
                onClick={() => handleVirtualDir('RIGHT')}
                disabled={!isPlaying}
                className="w-10 h-10 rounded-xl border border-purple-900/40 bg-gray-950/80 text-purple-300 hover:text-white hover:bg-purple-900/30 active:scale-95 disabled:opacity-30 flex items-center justify-center font-bold text-center select-none"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* 4. Highscore logs database */}
        <div className="bg-gray-950 border border-purple-900 rounded-xl p-3 flex-grow font-mono">
          <h4 className="flex items-center gap-1 text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5 text-pink-400" />
            <span>Pilot Leaderboard:</span>
          </h4>

          <div className="text-[10px] text-gray-400 space-y-1 max-h-[85px] overflow-y-auto">
            {highScores.length === 0 ? (
              <p className="text-gray-600 italic">No pilots completed runs yet!</p>
            ) : (
              highScores.map((h, i) => (
                <div key={i} className="flex justify-between items-center border-b border-purple-950/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-pink-400 font-bold">#0{i + 1}</span>
                    <span className="text-gray-200 font-semibold">{h.score} pts</span>
                  </div>
                  <span className="text-gray-500">{h.character} • {h.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
