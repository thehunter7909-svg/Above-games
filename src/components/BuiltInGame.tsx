import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Flame } from 'lucide-react';

interface ScoreItem {
  score: number;
  date: string;
}

export default function BuiltInGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<ScoreItem[]>([]);
  const [speedLevel, setSpeedLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isMuted, setIsMuted] = useState(false);

  // Snake grid settings
  const gridSize = 20; // grid unit pixel size
  const tileCount = 20; // 20x20 grid layout (Canvas is 400x400)
  
  // Game loop mechanics stored in refs to prevent closures capturing old values
  const snakeRef = useRef<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const directionRef = useRef<{ x: number; y: number }>({ x: 0, y: -1 });
  const foodRef = useRef<{ x: number; y: number }>({ x: 5, y: 5 });
  const gameIntervalRef = useRef<any>(null);

  // Load high scores
  useEffect(() => {
    const rawScores = localStorage.getItem('above_games_snake_highscores');
    if (rawScores) {
      try {
        setHighScores(JSON.parse(rawScores));
      } catch (e) {
        setHighScores([]);
      }
    } else {
      const demoScores = [
        { score: 320, date: '2026-05-20' },
        { score: 250, date: '2026-05-22' },
        { score: 180, date: '2026-05-24' }
      ];
      setHighScores(demoScores);
      localStorage.setItem('above_games_snake_highscores', JSON.stringify(demoScores));
    }
  }, []);

  // Web Audio synth processor - makes blips and sound bytes
  const playSynthSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      // Nice quick exponential volume decay
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      // Audio context may be restricted by frame policies
    }
  }, [isMuted]);

  // Generate random placement of food on empty spaces
  const respawnFood = useCallback(() => {
    let newX, newY;
    let isOnSnake = true;
    while (isOnSnake) {
      newX = Math.floor(Math.random() * tileCount);
      newY = Math.floor(Math.random() * tileCount);
      isOnSnake = snakeRef.current.some((segment) => segment.x === newX && segment.y === newY);
    }
    foodRef.current = { x: newX ?? 5, y: newY ?? 5 };
  }, []);

  // Draw full arena grid, snake, food, neon light effects
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background grid pattern
    ctx.fillStyle = '#111827'; // slate-900 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle dark matrix background lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;
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

    // Draw Glowing Food target
    const foodX = foodRef.current.x * gridSize;
    const foodY = foodRef.current.y * gridSize;
    
    // Food neon overlay radial gradient glow
    const radialGrad = ctx.createRadialGradient(
      foodX + gridSize/2, foodY + gridSize/2, 2,
      foodX + gridSize/2, foodY + gridSize/2, 12
    );
    radialGrad.addColorStop(0, '#f43f5e'); // rose-500 neon
    radialGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(foodX + gridSize/2, foodY + gridSize/2, 12, 0, Math.PI * 2);
    ctx.fill();

    // Solid core of food
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(foodX + gridSize/2, foodY + gridSize/2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw Neon Snake
    snakeRef.current.forEach((segment, idx) => {
      const isHead = idx === 0;
      const segX = segment.x * gridSize;
      const segY = segment.y * gridSize;

      // Draw segment glow
      ctx.shadowColor = isHead ? '#6366f1' : '#10b981';
      ctx.shadowBlur = isHead ? 8 : 4;

      // Base style
      ctx.fillStyle = isHead ? '#818cf8' : '#10b981';
      
      // Rounded snake corners
      const cornerRadius = 4;
      ctx.beginPath();
      ctx.roundRect(segX + 1, segY + 1, gridSize - 2, gridSize - 2, cornerRadius);
      ctx.fill();

      // Reset shadows
      ctx.shadowBlur = 0;

      // Cute details: little eyes for snake head
      if (isHead) {
        ctx.fillStyle = '#000000';
        // Position eyes depending on movement direction
        const dir = directionRef.current;
        if (dir.x !== 0) { // Horizontal movement
          ctx.fillRect(segX + 10, segY + 4, 3, 3);
          ctx.fillRect(segX + 10, segY + 13, 3, 3);
        } else { // Vertical movement
          ctx.fillRect(segX + 4, segY + 10, 3, 3);
          ctx.fillRect(segX + 13, segY + 10, 3, 3);
        }
      }
    });
  }, []);

  // Main tick game progression handler
  const gameStep = useCallback(() => {
    const head = { ...snakeRef.current[0] };
    const dir = directionRef.current;

    // Next coordinates
    const nextHead = {
      x: head.x + dir.x,
      y: head.y + dir.y,
    };

    // Collision Detection: Boundaries or Self-cannibalization
    const isOut = nextHead.x < 0 || nextHead.x >= tileCount || nextHead.y < 0 || nextHead.y >= tileCount;
    const isSelfCrash = snakeRef.current.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

    if (isOut || isSelfCrash) {
      // Game Over sound effect: lower synth decay chord
      playSynthSound(150, 0.4, 'sawtooth');
      setTimeout(() => playSynthSound(100, 0.6, 'sawtooth'), 150);
      
      setIsGameOver(true);
      setIsPlaying(false);
      clearInterval(gameIntervalRef.current);

      // Save highscore records
      setHighScores((prevScores) => {
        const withNew = [...prevScores, { score, date: new Date().toISOString().split('T')[0] }];
        const sorted = withNew.sort((a,b) => b.score - a.score).slice(0, 5);
        localStorage.setItem('above_games_snake_highscores', JSON.stringify(sorted));
        return sorted;
      });
      return;
    }

    // Add new segment direction movement
    snakeRef.current.unshift(nextHead);

    // Food Consumption Detection
    if (nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y) {
      // Score update
      setScore((prev) => prev + 10);
      // Tasty synth pop pitch up sound!
      playSynthSound(600, 0.08, 'sine');
      setTimeout(() => playSynthSound(900, 0.1, 'sine'), 50);

      respawnFood();
    } else {
      // Keep snake length consistent by sliding/trimming tail
      snakeRef.current.pop();
    }

    renderCanvas();
  }, [score, respawnFood, renderCanvas, playSynthSound]);

  // Core update cycle speeds config
  const getIntervalMs = useCallback(() => {
    switch (speedLevel) {
      case 'easy': return 150;
      case 'hard': return 70;
      case 'medium':
      default:
        return 100;
    }
  }, [speedLevel]);

  // Start standard game loops
  const startGame = () => {
    setIsGameOver(false);
    setScore(0);
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    directionRef.current = { x: 0, y: -1 };
    respawnFood();
    setIsPlaying(true);
    
    // Play quick startup chirp
    playSynthSound(440, 0.1, 'square');
    setTimeout(() => playSynthSound(880, 0.2, 'square'), 100);
  };

  // Keyboard navigation control listener
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      const keysToGaurd = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
      if (keysToGaurd.includes(e.key)) {
        e.preventDefault(); // Stop standard page rolling scroll while active
      }

      const activeDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (activeDir.y === 0) {
            directionRef.current = { x: 0, y: -1 };
            playSynthSound(300, 0.03);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (activeDir.y === 0) {
            directionRef.current = { x: 0, y: 1 };
            playSynthSound(280, 0.03);
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (activeDir.x === 0) {
            directionRef.current = { x: -1, y: 0 };
            playSynthSound(320, 0.03);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (activeDir.x === 0) {
            directionRef.current = { x: 1, y: 0 };
            playSynthSound(340, 0.03);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isPlaying, playSynthSound]);

  // Start tick clocks
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      gameIntervalRef.current = setInterval(gameStep, getIntervalMs());
    }
    return () => clearInterval(gameIntervalRef.current);
  }, [isPlaying, isGameOver, gameStep, getIntervalMs]);

  // Render initial static placeholder screen when component loads
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className="w-full max-w-2xl bg-gray-900/40 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
      
      {/* 2D Canvas Playgrid rendering */}
      <div className="relative border-4 border-gray-950 bg-gray-950 rounded-xl overflow-hidden shadow-indigo-500/5 shadow-2xl shrink-0">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="block max-w-full aspect-square bg-[#111827]"
        />

        {/* Start Game overlay screens */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center select-none">
            {isGameOver ? (
              <div className="animate-fade-in">
                <p className="text-rose-500 font-bold font-mono tracking-widest text-lg uppercase mb-1">CRASH DETECTED</p>
                <p className="text-3xl font-display font-extrabold text-white mb-2">GAME OVER</p>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 mb-6 font-mono">
                  <span className="text-gray-500 text-xs text-center block">FINAL SCORE:</span>
                  <span className="text-emerald-400 font-bold text-2xl">{score}</span>
                </div>
              </div>
            ) : (
              <div>
                <Flame className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-pulse" />
                <h3 className="text-xl font-display font-bold text-gray-100 mb-1">Neon Grid Snake</h3>
                <p className="text-xs text-gray-400 font-sans max-w-[280px] mx-auto mb-6">
                  Experience a smooth, zero-latency builtin HTML5 game with native retro synth audio!
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 w-48">
              <button
                id="btn-snake-start"
                onClick={startGame}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-medium font-sans text-sm transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.03] active:scale-95 text-center cursor-pointer"
              >
                {isGameOver ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isGameOver ? 'Play Again' : 'Power Up Game'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Right Console Sidebar with instructions */}
      <div className="flex-1 w-full flex flex-col justify-between self-stretch gap-5">
        
        {/* Statistics & Settings row */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-gray-900 pb-2.5">
            <span className="text-xs font-mono text-gray-400">CURRENT FEED:</span>
            <div className="flex items-center gap-1 bg-indigo-950 text-indigo-300 font-bold text-xs font-mono px-2 py-0.5 rounded border border-indigo-900">
              Score: {score}
            </div>
          </div>

          {/* Difficulty setting switches */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500 block">Select Engine Speed:</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-900/80 p-1 rounded-lg border border-gray-800">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  id={`btn-speed-${level}`}
                  onClick={() => !isPlaying && setSpeedLevel(level)}
                  disabled={isPlaying}
                  className={`text-[10px] py-1 font-bold font-mono rounded capitalize transition-all ${
                    speedLevel === level
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 hover:text-gray-300 disabled:opacity-50'
                  }`}
                  title={isPlaying ? 'Finish current run to change difficulty' : `Set engine speed to ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Synthesizer toggle */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] font-mono text-gray-400">Retro Synth Audio:</span>
            <button
              id="btn-sound-toggle"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-400'
                  : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* High Scores block */}
        <div className="flex-1 flex flex-col justify-center min-h-[120px]">
          <h4 className="flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider text-gray-400 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Local Hall of Fame:</span>
          </h4>
          <div className="bg-gray-950/40 border border-gray-950 rounded-xl px-4 py-2.5 font-mono text-xs text-gray-400 flex flex-col gap-1.5分">
            {highScores.length === 0 ? (
              <p className="text-gray-650 italic text-[11px] py-1">No scores registered yet. Start playing!</p>
            ) : (
              highScores.map((h, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-900/40 last:border-0 pb-1 last:pb-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-400 w-4 font-bold">#{i + 1}</span>
                    <span className="text-slate-300 font-semibold">{h.score} pts</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{h.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action controllers reminder */}
        <div className="text-[10px] text-gray-500 leading-normal bg-gray-950/20 border border-gray-900 rounded-lg p-3">
          <span className="text-gray-400 font-semibold uppercase block mb-0.5">Physical Keyboard Controls:</span>
          Use the <strong className="text-gray-300">W, A, S, D</strong> keys or <strong className="text-gray-300">Arrows (↑, ↓, ←, →)</strong> directly on your computer deck to control motion steering!
        </div>

      </div>

    </div>
  );
}
