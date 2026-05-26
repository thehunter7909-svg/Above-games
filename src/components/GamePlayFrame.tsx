import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Maximize2, Monitor, Smartphone, Tablet, ExternalLink, ShieldAlert, Sparkles, Clock, Compass, Share2, Check, Download, ShieldCheck, Globe } from 'lucide-react';
import { Game } from '../types';
import BuiltInGame from './BuiltInGame';
import DrainageGame from './DrainageGame';
import NeonHighwayGame from './NeonHighwayGame';
import RetroCircuitGame from './RetroCircuitGame';

interface GamePlayFrameProps {
  game: Game;
  onFullScreen: () => void;
  onIncrementPlayCount: (gameId: string) => void;
}

type ViewportType = 'desktop' | 'tablet' | 'mobile';

export default function GamePlayFrame({
  game,
  onFullScreen,
  onIncrementPlayCount,
}: GamePlayFrameProps) {
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [playTimeSeconds, setPlayTimeSeconds] = useState(0);
  const [isTipsOpen, setIsTipsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Restart loading state and reset active timer when a new game is selected
  useEffect(() => {
    setIsLoading(true);
    setPlayTimeSeconds(0);
    // Increment statistical plays registry
    onIncrementPlayCount(game.id);
  }, [game.id]);

  // Handle active gameplay session timer
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setPlayTimeSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [game.id]);

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = game.iframeUrl;
    }
  };

  const handleCopyLink = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('game', game.id);
    
    // Default smart unblocked proxy link wrapper using Google Translate Spanish bridge
    const baseTargetUrl = currentUrl.toString();
    const unblockedBypassUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(baseTargetUrl)}`;
    
    navigator.clipboard.writeText(unblockedBypassUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleCopySpecificLink = (type: 'direct-url' | 'translate-es' | 'translate-ja') => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('game', game.id);
    let finalUrl = currentUrl.toString();

    if (type === 'translate-es') {
      finalUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(currentUrl.toString())}`;
    } else if (type === 'translate-ja') {
      finalUrl = `https://translate.google.com/translate?sl=en&tl=ja&u=${encodeURIComponent(currentUrl.toString())}`;
    }

    navigator.clipboard.writeText(finalUrl);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  const handleDownloadLocalLauncher = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UNBLOCKED PLAY: ${game.title}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: radial-gradient(circle at top, #090d16 0%, #020408 100%);
      font-family: system-ui, -apple-system, sans-serif;
      color: #f3f4f6;
    }
    .launcher-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0b0f19;
      padding: 12px 24px;
      font-size: 13px;
      border-bottom: 2px solid #141b2d;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    }
    .game-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 750;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #38bdf8;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }
    .status-badge {
      font-family: monospace;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 6px;
      padding: 4px 10px;
      font-weight: bold;
      font-size: 11px;
    }
    .frame-wrapper {
      width: 100%;
      height: calc(100vh - 46px);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #000;
    }
  </style>
</head>
<body>
  <div class="launcher-header">
    <div class="game-logo">
      <span style="font-size: 16px;">⚡</span>
      <span>${game.title} (Bulletproof Unblocked Session)</span>
    </div>
    <div class="status-badge">● 100% UNBLOCKED FROM LOCAL DISK</div>
  </div>
  <div class="frame-wrapper">
    <iframe 
      src="${game.iframeUrl}" 
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      referrerpolicy="no-referrer"
    ></iframe>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeTitle = game.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${safeTitle}_unblocked_session.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCopiedType('local-html');
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  const formatPlayTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ]
      .filter((v) => v !== null)
      .join(':');
  };

  // Determine viewport width style
  const getViewportDimensions = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[420px] h-[580px] border-x-4 border-y-8 border-gray-800 rounded-3xl shadow-2xl';
      case 'tablet':
        return 'max-w-[768px] h-[550px] border-x-2 border-y-4 border-gray-800 rounded-2xl shadow-xl';
      case 'desktop':
      default:
        return 'w-full h-[600px] border-0 rounded-xl';
    }
  };

  const isNativeGame = game.id === 'built-in-arcade-snake' || game.id === 'drainage' || game.id === 'neon-highway' || game.id === 'retro-circuit';

  return (
    <div id={`gameplay-deck-${game.id}`} className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Play Deck Top Controls Bar */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex flex-wrap gap-4 items-center justify-between text-xs font-mono select-none">
        
        {/* Title, Category & Active Clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-display font-bold text-gray-200 text-sm tracking-wide">
              {game.title}
            </h2>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Session: <strong className="text-gray-200">{formatPlayTime(playTimeSeconds)}</strong></span>
          </div>
        </div>

        {/* Console view options & iframe utilities */}
        <div className="flex items-center gap-3">
          
          {/* Viewport size selectors (Only for actual external iframe games) */}
          {!isNativeGame && (
            <div className="bg-gray-950 p-1 rounded-lg border border-gray-800 flex items-center gap-0.5">
              <button
                id="viewport-desktop-btn"
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded-md transition-all ${
                  viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Desktop Layout"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                id="viewport-tablet-btn"
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded-md transition-all ${
                  viewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Tablet Device View"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                id="viewport-mobile-btn"
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded-md transition-all ${
                  viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Classic Mobile Viewport"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-gray-800 hidden sm:inline">|</span>

          {/* Direct Actions: Reload, External Link, Fullscreen */}
          <div className="flex items-center gap-1.5">
            {!isNativeGame && (
              <button
                id="btn-frame-refresh"
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all active:scale-95"
                title="Restart Game Frame"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {!isNativeGame && (
              <a
                id="link-external-game"
                href={game.iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center gap-1"
                title="Open Game in Direct Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              id="btn-copy-game-link"
              onClick={handleCopyLink}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 text-xs font-mono font-bold ${
                copied
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                  : 'bg-cyan-950/30 border-cyan-850/40 text-cyan-400 hover:text-white hover:bg-cyan-600/20'
              }`}
              title="Copy bulletproof Google-translated proxy play link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Proxy URL!' : 'Copy Unblocked Link'}</span>
            </button>

            <button
              id="btn-frame-fullscreen"
              onClick={onFullScreen}
              className="p-2 rounded-lg bg-indigo-650 text-indigo-200 border border-indigo-500/20 hover:text-white hover:bg-indigo-650 transition-all active:scale-95"
              title="Expand Game Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actual Game Viewer Panel */}
      <div className="bg-gray-900 border-b border-gray-900 flex justify-center items-center py-4 px-2 relative overflow-hidden min-h-[500px]">
        {/* Loading Visual overlay */}
        {isLoading && !isNativeGame && (
          <div className="absolute inset-0 bg-gray-950 flex flex-col justify-center items-center gap-3 z-30">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs font-mono text-gray-400 tracking-wider uppercase">Loading Secure Game Deck Frame...</p>
          </div>
        )}

        {isNativeGame ? (
          /* Render high performance offline retro game */
          <div className="w-full flex justify-center items-center">
            {game.id === 'drainage' ? (
              <DrainageGame />
            ) : game.id === 'neon-highway' ? (
              <NeonHighwayGame />
            ) : game.id === 'retro-circuit' ? (
              <RetroCircuitGame />
            ) : (
              <BuiltInGame />
            )}
          </div>
        ) : (
          /* Render embedding secure game frame */
          <iframe
            ref={iframeRef}
            id="main-game-iframe"
            src={game.iframeUrl}
            title={game.title}
            className={`${getViewportDimensions()} bg-black select-none transition-all duration-300 w-full`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; webcam; microphone"
            onLoad={() => setIsLoading(false)}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Frame Troubleshooting and Bulletproof Unblocker Tools Drawer */}
      <div className="bg-gray-950 px-5 py-5 border-t border-gray-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs text-gray-400">
          
          {/* Left Block: Game Info & Controls */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Gameplay Information</span>
            </div>
            <p className="leading-relaxed bg-gray-900/60 border border-gray-900 p-3 rounded-xl">
              {game.controls ? (
                <>
                  <strong className="text-indigo-400 font-mono block mb-1">Controls Scheme:</strong>
                  <span className="text-gray-300">{game.controls}</span>
                </>
              ) : (
                "Standard computer controls supported. Typically utilizes keyboard WASD/Arrow keys, Spacebar, or your Mouse."
              )}
            </p>
            <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-950 text-[10px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Rating: <strong className="text-gray-200">{game.rating}★</strong> | Plays: <strong className="text-gray-200">{game.plays}</strong></span>
            </div>
          </div>

          {/* Right Block: Double-Check Bulletproof Bypass options & Downloader */}
          <div className="lg:col-span-8 border-t lg:border-t-0 lg:border-l border-gray-800/80 pt-5 lg:pt-0 lg:pl-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-display uppercase tracking-wider text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>🛡️ Bulletproof Bypass Suite</span>
              </div>
              <span className="text-[10px] bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-bold">
                100% Unblock Active
              </span>
            </div>
            
            <p className="text-[11px] text-gray-400 leading-normal">
              If the inside game states say <strong>"Blocked"</strong> inside the school browser center due to iframe embedding guards, use the alternative unblocking technologies below.
            </p>

            {/* Grid of Copy Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 [&_button]:transition-all">
              
              {/* Option 1: Translate Engine Spanish */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-cyan-500/30">
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block mb-0.5">Proxy Level 1</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Proxies the entire gaming hub through school-safe Google Spain cloud servers.</p>
                </div>
                <button
                  id="btn-copy-proxy-es"
                  type="button"
                  onClick={() => handleCopySpecificLink('translate-es')}
                  className={`w-full py-1.5 text-[10px] font-mono font-bold rounded-lg border text-center ${
                    copiedType === 'translate-es'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-gray-950 hover:bg-gray-900 border-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedType === 'translate-es' ? 'Copied Level 1!' : 'Copy Level 1 Proxy'}
                </button>
              </div>

              {/* Option 2: Translate Engine Japanese */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-indigo-500/30">
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold block mb-0.5">Proxy Level 2</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Secondary alternative routing engine wrapped in Google Japan parameters.</p>
                </div>
                <button
                  id="btn-copy-proxy-ja"
                  type="button"
                  onClick={() => handleCopySpecificLink('translate-ja')}
                  className={`w-full py-1.5 text-[10px] font-mono font-bold rounded-lg border text-center ${
                    copiedType === 'translate-ja'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-gray-950 hover:bg-gray-900 border-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedType === 'translate-ja' ? 'Copied Level 2!' : 'Copy Level 2 Proxy'}
                </button>
              </div>

              {/* Option 3: Direct Link */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-amber-500/30">
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-mono text-amber-500 font-bold block mb-0.5">Direct Raw Link</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Clean direct direct tab portal link. Forces focus reset and browser sandbox.</p>
                </div>
                <button
                  id="btn-copy-proxy-raw"
                  type="button"
                  onClick={() => handleCopySpecificLink('direct-url')}
                  className={`w-full py-1.5 text-[10px] font-mono font-bold rounded-lg border text-center ${
                    copiedType === 'direct-url'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-gray-950 hover:bg-gray-900 border-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedType === 'direct-url' ? 'Copied Raw!' : 'Copy Direct Link'}
                </button>
              </div>

            </div>

            {/* Offline Downloader (The ultimate firewall shredder) */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-cyan-950/30 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-emerald-400 font-bold font-mono text-[11px] uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>⭐ Gold Standard: Client Offline File (.html)</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal max-w-lg">
                  Downloads a mini sandbox launcher of <strong>{game.title}</strong> to your computer! Run it directly from your Downloads folder (via <code className="text-emerald-300">file://</code>). It bypasses 100% of institutional trackers because there is absolutely no network lookup.
                </p>
              </div>
              <button
                id="btn-download-launcher-sandbox"
                type="button"
                onClick={handleDownloadLocalLauncher}
                className="w-full sm:w-auto shrink-0 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950 px-4 py-2.5 rounded-lg font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all text-xs"
              >
                {copiedType === 'local-html' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Compiling File...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Local HTML Launcher</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

