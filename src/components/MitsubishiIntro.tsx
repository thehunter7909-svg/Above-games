import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Activity, Cpu } from 'lucide-react';

interface MitsubishiIntroProps {
  onComplete: () => void;
}

export default function MitsubishiIntro({ onComplete }: MitsubishiIntroProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoState, setLogoState] = useState<'hidden' | 'drawing' | 'filled' | 'glowing'>('hidden');

  // Keep a stable mutable ref of isMuted to prevent recreation of audio function dependencies
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Keep stable reference of onComplete callback
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Multi-frequency synthesizer chime for high fidelity arcade startup experience
  const playBootChime = useCallback(() => {
    if (isMutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, startDelay: number, duration: number, type: 'sine' | 'triangle' = 'sine', volume = 0.08) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // 1. Sleek analog turbine startup rev
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(120, ctx.currentTime);
      sweepOsc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
      sweepGain.gain.setValueAtTime(0.03, ctx.currentTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start();
      sweepOsc.stop(ctx.currentTime + 1.2);

      // 2. Pentatonic synth melody representing Japanese tuning lineage
      playTone(392, 0.4, 0.5, 'sine', 0.06);     // G4
      playTone(523, 0.6, 0.6, 'sine', 0.06);     // C5
      playTone(587, 0.8, 0.7, 'triangle', 0.05); // D5
      playTone(659, 1.0, 0.8, 'sine', 0.06);     // E5
      playTone(784, 1.2, 1.0, 'sine', 0.06);     // G5
      playTone(1046, 1.5, 1.8, 'sine', 0.07);    // C6 (The resonant chord apex!)
    } catch (e) {
      // safe fallback for locked browsers
    }
  }, []);

  // Sync playBootChime to a stable ref as well
  const playBootChimeRef = useRef(playBootChime);
  useEffect(() => {
    playBootChimeRef.current = playBootChime;
  }, [playBootChime]);

  // Handle stage progressions exactly once on mount, immune to parent re-renders
  useEffect(() => {
    // Stage 1: Draw lines (0.4s)
    const t1 = setTimeout(() => setLogoState('drawing'), 400);
    
    // Stage 2: Fill red diamonds (1.2s)
    const t2 = setTimeout(() => {
      setLogoState('filled');
      playBootChimeRef.current();
    }, 1200);

    // Stage 3: Glowing pulse (2.2s)
    const t3 = setTimeout(() => setLogoState('glowing'), 2200);

    // Dynamic clean loading percentage scroller
    const progressTimer = setInterval(() => {
      setLoadingPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    // Stage 4: Trigger exit transition (3.3s)
    const t4 = setTimeout(() => setIsFadingOut(true), 3300);

    // Stage 5: Complete cycle (4.0s)
    const t5 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearInterval(progressTimer);
    };
  }, []);

  const handleSkip = () => {
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return (
    <div
      id="mitsubishi-cinematic-intro"
      className={`fixed inset-0 z-[9999] bg-white flex flex-col justify-between items-center px-6 py-12 select-none overflow-hidden transition-all duration-1000 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Sleek minimal top rail status indicators */}
      <div className="w-full max-w-5xl flex justify-between items-center border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
          <Activity className="w-4 h-4 text-red-600 animate-pulse" />
          <span>MITSUBISHI DIGITAL HEAVY-INDUSTRIES CO.</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="hidden sm:inline text-gray-500 uppercase">SYS_REV: v4.26_TOKYO</span>
        </div>

        {/* Audio control buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-intro-audio-toggle"
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-600 transition-colors"
            title="Mute Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            id="btn-intro-skip"
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 font-mono text-[10px] uppercase font-bold transition-all border border-gray-100"
          >
            <span>Skip Cinematic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Symmetrical Mitsubishi logo vector container */}
      <div className="flex flex-col items-center justify-center flex-grow py-8 relative w-full max-w-md">
        
        {/* Subtle radial decorative background vector glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative">
          {/* Animated SVG Diamond Layout */}
          <svg
            className={`w-[190px] h-[190px] md:w-[220px] md:h-[220px] drop-shadow-sm transition-all duration-700 ${
              logoState === 'glowing' ? 'scale-105 filter drop-shadow-[0_4px_20px_rgba(239,68,68,0.25)]' : ''
            }`}
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Symmetrical exact Mitsubishi 3-Rhombus Geometry */}
            <g className="transition-all duration-1000">
              
              {/* 1. Top Diamond */}
              <polygon
                points="150,150 120,98 150,46 180,98"
                stroke="#ef4444"
                strokeWidth={logoState === 'drawing' ? 2 : 0}
                fill={logoState === 'filled' || logoState === 'glowing' ? '#ef4444' : 'transparent'}
                className="transition-all duration-700"
                style={{
                  opacity: logoState === 'hidden' ? 0 : 1,
                  transform: logoState === 'hidden' ? 'scale(0.95)' : 'scale(1)',
                  transformOrigin: '150px 150px',
                  transition: 'all 0.8s ease-out'
                }}
              />

              {/* 2. Bottom-Left Diamond */}
              <polygon
                points="150,150 120,202 60,202 90,150"
                stroke="#ef4444"
                strokeWidth={logoState === 'drawing' ? 2 : 0}
                fill={logoState === 'filled' || logoState === 'glowing' ? '#ef4444' : 'transparent'}
                className="transition-all duration-700"
                style={{
                  opacity: logoState === 'hidden' ? 0 : 1,
                  transform: logoState === 'hidden' ? 'scale(0.95)' : 'scale(1)',
                  transformOrigin: '150px 150px',
                  transition: 'all 0.8s ease-out',
                  transitionDelay: '150ms'
                }}
              />

              {/* 3. Bottom-Right Diamond */}
              <polygon
                points="150,150 180,202 240,202 210,150"
                stroke="#ef4444"
                strokeWidth={logoState === 'drawing' ? 2 : 0}
                fill={logoState === 'filled' || logoState === 'glowing' ? '#ef4444' : 'transparent'}
                className="transition-all duration-700"
                style={{
                  opacity: logoState === 'hidden' ? 0 : 1,
                  transform: logoState === 'hidden' ? 'scale(0.95)' : 'scale(1)',
                  transformOrigin: '150px 150px',
                  transition: 'all 0.8s ease-out',
                  transitionDelay: '300ms'
                }}
              />

            </g>

            {/* Glowing intersection highlight decoration dot */}
            {logoState === 'glowing' && (
              <circle
                cx="150"
                cy="150"
                r="4"
                className="fill-white animate-ping"
              />
            )}
          </svg>
        </div>

        {/* Cinematic Title text layout */}
        <div className="mt-8 text-center space-y-2">
          <h1
            className={`font-sans tracking-[0.45em] text-gray-900 font-extrabold text-base md:text-lg transition-all duration-700 uppercase ${
              logoState === 'filled' || logoState === 'glowing'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            MITSUBISHI
          </h1>
          <p
            className={`font-sans tracking-[0.2em] text-[10px] text-red-600 font-bold tracking-[0.3em] uppercase transition-all duration-1000 delay-300 ${
              logoState === 'glowing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            FALCON ARCADE SERIES
          </p>
          
          <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-gray-400 uppercase tracking-widest pt-2">
            <Cpu className="w-3 h-3 text-red-600" />
            <span>Symmetrical Turbo Performance Engine</span>
          </div>
        </div>

      </div>

      {/* 3. Bottom Progress Bar deck */}
      <div className="w-full max-w-md text-center space-y-3">
        {/* Progress percent text */}
        <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
          <span>LOADING RECON_ENGINE_DEVICES</span>
          <span>{loadingPercent}% Complete</span>
        </div>

        {/* Sleek horizontal loading rail */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${loadingPercent}%` }}
          />
        </div>

        {/* Fine subtext print */}
        <p className="text-[7.5px] font-mono text-gray-300">
          © 2026 MITSUBISHI ALLIANCE SYSTEMS • DESIGN DECK CALIBRATED FOR CRUISE PERFORMANCE
        </p>
      </div>

    </div>
  );
}
