import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Heart, 
  Plus, 
  Download, 
  Trash2, 
  Wand2, 
  Star, 
  MessageSquare, 
  CornerDownRight, 
  Sparkles, 
  DownloadCloud, 
  HardDriveUpload,
  Trophy,
  Activity,
  User,
  HelpCircle,
  X,
  Compass,
  Link2,
  Globe,
  Zap
} from 'lucide-react';

import defaultGamesList from './data/games.json';
import { Game, CategoryType, UserReview } from './types';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GamePlayFrame from './components/GamePlayFrame';
import CustomGameForm from './components/CustomGameForm';
import BuiltInGame from './components/BuiltInGame';
import DrainageGame from './components/DrainageGame';
import NeonHighwayGame from './components/NeonHighwayGame';
import RetroCircuitGame from './components/RetroCircuitGame';

// Built-in offline native game definitions
const nativeSnakeGame: Game = {
  id: 'built-in-arcade-snake',
  title: 'Neon GRID SNAKE (Off-Grid Native)',
  description: 'A lightning-fast, zero-delay retro arcade grid game built right inside the browser canvas with native synth sound chips! Ideal if other remote iframes are restricted.',
  iframeUrl: '',
  category: 'Arcade',
  thumbnail: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
  plays: 871,
  rating: 4.9,
  controls: 'Use WASD or Arrows to steer the snake. Eat shiny rose pills, dodge walls and your own tail!',
  difficulty: 'Medium'
};

const drainageSnakeGame: Game = {
  id: 'drainage',
  title: 'DRAINAGE: Neon Anime Snake',
  description: 'An immersive, premium anime-style custom Snake action clone with rich neon grids, collectable items (Boba, Ramen, Sushi, Taiyaki), visual frenzy combo modes, and interactive sound synthesis custom-built with zero network requests.',
  iframeUrl: '',
  category: 'Action',
  thumbnail: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  plays: 2315,
  rating: 5.0,
  controls: 'Use W,A,S,D or Arrow keys to navigate. Collect Boba, Ramen, Sushi, and Mochi to activate Frenzy Mode and build massive score combos!',
  difficulty: 'Hard'
};

const neonHighwayGame: Game = {
  id: 'neon-highway',
  title: 'Tokyo Horizon Drift',
  description: 'An interactive, top-tier cyberpunk lane-shifting highway action game. Collect energy batteries, speed past obstacles to boost your score, and trigger Hyperdrive shield mode for high scores and synthesized soundscapes!',
  iframeUrl: '',
  category: 'Action',
  thumbnail: 'linear-gradient(135deg, #a21caf 0%, #6366f1 100%)',
  plays: 4012,
  rating: 4.9,
  controls: 'Use Left/Right arrow keys or A/D to switch lanes. Dodge other vehicles and collect green energy battery nodes!',
  difficulty: 'Medium'
};

const retroCircuitGame: Game = {
  id: 'retro-circuit',
  title: 'Apex Retro Rally',
  description: 'A top-down classic 2D racing micro-circuit simulator with professional sliding/drifting physics. Collect golden stars, slide around high-friction curbs, and set best lap times on the leaderboard with vintage synth audio sweeps!',
  iframeUrl: '',
  category: 'Sports',
  thumbnail: 'linear-gradient(135deg, #059669 0%, #d97706 100%)',
  plays: 1845,
  rating: 4.8,
  controls: 'Use Arrow Keys or WASD to accelerate, brake, and steer. Collect golden stars and drift across red grid curbs to complete laps!',
  difficulty: 'Hard'
};

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('neon-highway');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  
  // Custom game form visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // High fidelity review section management
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // Full-screen overlay trigger state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Unblocked Strong Link Generator state
  const [proxyUrlInput, setProxyUrlInput] = useState('https://roblox.com');
  const [copiedProxyUrl, setCopiedProxyUrl] = useState(false);
  const [selectedBypassMethod, setSelectedBypassMethod] = useState<'google-translate' | 'clean-frame' | 'raw-url'>('google-translate');

  // Load catalog configs on startup
  useEffect(() => {
    // Determine base catalog list
    const savedCustom = localStorage.getItem('above_games_custom_list');
    let customList: Game[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch (e) {
        customList = [];
      }
    }

    // Merge native, standard default config, and user saved items
    const merged = [neonHighwayGame, retroCircuitGame, drainageSnakeGame, nativeSnakeGame, ...defaultGamesList, ...customList];
    setGames(merged);

    // Dynamic direct URL launcher parameter parser
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam && merged.some((g) => g.id === gameParam)) {
      setSelectedGameId(gameParam);
    }

    // Initial favorites loader
    const savedFavs = localStorage.getItem('above_games_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        setFavorites([]);
      }
    }

    // Load custom reviews context
    const savedReviews = localStorage.getItem('above_games_reviews');
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        setReviews([]);
      }
    } else {
      // Provide fallback generic gamer commentary for retro feel matching our new 2026 unblocked catalog
      const seedReviews: UserReview[] = [
        {
          id: 'seed-1',
          gameId: 'built-in-arcade-snake',
          userName: 'RetroRanger88',
          rating: 5,
          comment: 'The browser synth noise is amazing! Pure nostalgia, runs at continuous 60 FPS easily.',
          date: '2026-05-24'
        },
        {
          id: 'seed-2',
          gameId: 'vaperv2',
          userName: 'CraftGod',
          rating: 5,
          comment: 'VaperV2 is fantastic. Extremely fast block simulation, feels completely unblocked on standard highschool Wi-Fi!',
          date: '2026-05-25'
        },
        {
          id: 'seed-3',
          gameId: 'duckduckgo',
          userName: 'ArcadeQueen',
          rating: 5,
          comment: 'Perfect fallback! Using DDG inside the frame to browse other mirror directories is a genius feature.',
          date: '2026-05-26'
        }
      ];
      setReviews(seedReviews);
      localStorage.setItem('above_games_reviews', JSON.stringify(seedReviews));
    }
  }, []);

  // Sync favorites with local storage
  const handleToggleFavorite = (gameId: string) => {
    let nextFavs: string[];
    if (favorites.includes(gameId)) {
      nextFavs = favorites.filter(id => id !== gameId);
    } else {
      nextFavs = [...favorites, gameId];
    }
    setFavorites(nextFavs);
    localStorage.setItem('above_games_favorites', JSON.stringify(nextFavs));
  };

  // Add a new custom game card
  const handleAddCustomGame = (newGame: Game) => {
    // Fetch current custom list, append, and update
    const savedCustom = localStorage.getItem('above_games_custom_list');
    let customList: Game[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch(e) {}
    }

    const updatedCustom = [...customList, newGame];
    localStorage.setItem('above_games_custom_list', JSON.stringify(updatedCustom));

    // Reload master state list
    setGames([neonHighwayGame, retroCircuitGame, drainageSnakeGame, nativeSnakeGame, ...defaultGamesList, ...updatedCustom]);
    setSelectedGameId(newGame.id); // View newly imported game directly
  };

  // Delete a user custom game
  const handleDeleteCustomGame = (gameId: string) => {
    const confirm = window.confirm('Are you sure you want to remove this custom game from your current cabinet?');
    if (!confirm) return;

    const savedCustom = localStorage.getItem('above_games_custom_list');
    let customList: Game[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch(e) {}
    }

    const updatedCustom = customList.filter(g => g.id !== gameId);
    localStorage.setItem('above_games_custom_list', JSON.stringify(updatedCustom));

    // Remove from favorites as well if relevant
    const updatedFavs = favorites.filter(id => id !== gameId);
    setFavorites(updatedFavs);
    localStorage.setItem('above_games_favorites', JSON.stringify(updatedFavs));

    // If active game is deleted, select native default
    if (selectedGameId === gameId) {
      setSelectedGameId('neon-highway');
    }

    // Refresh state
    setGames([neonHighwayGame, retroCircuitGame, drainageSnakeGame, nativeSnakeGame, ...defaultGamesList, ...updatedCustom]);
  };

  // Increment play statistical tracker on loaded item
  const handleIncrementPlayCount = (gameId: string) => {
    setGames(prevGames => {
      const updated = prevGames.map(game => {
        if (game.id === gameId) {
          return { ...game, plays: game.plays + 1 };
        }
        return game;
      });
      return updated;
    });
  };

  // Trigger Shuffle Play select
  const handleRandomSelect = () => {
    const validGames = games.filter(g => g.id !== selectedGameId);
    if (validGames.length === 0) return;
    const randomIndex = Math.floor(Math.random() * validGames.length);
    setSelectedGameId(validGames[randomIndex].id);
  };

  // Post a user rating review
  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    const newReview: UserReview = {
      id: 'rev-' + Date.now(),
      gameId: selectedGameId,
      userName: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('above_games_reviews', JSON.stringify(updatedReviews));

    // Update the average rating for this specific game
    const currentReviews = updatedReviews.filter(r => r.gameId === selectedGameId);
    const avgRating = currentReviews.reduce((acc, curr) => acc + curr.rating, 0) / currentReviews.length;

    setGames(prevGames => 
      prevGames.map(g => {
        if (g.id === selectedGameId) {
          return { ...g, rating: parseFloat(avgRating.toFixed(1)) };
        }
        return g;
      })
    );

    // Reset fields
    setReviewerName('');
    setReviewComment('');
  };

  // Download entire Games JSON File configuration! Matches prompt specification
  const handleDownloadJSONConfig = () => {
    // Filter to export clean parameters
    const cleanedConfig = games.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      iframeUrl: g.iframeUrl,
      category: g.category,
      plays: g.plays,
      rating: g.rating,
      controls: g.controls,
      difficulty: g.difficulty
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(cleanedConfig, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'above_games_catalog.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filters logic
  const filteredGames = games.filter((game) => {
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.controls && game.controls.toLowerCase().includes(searchQuery.toLowerCase())) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase());

    const isFav = favorites.includes(game.id);

    // If category is 'Custom', prioritize only user custom items
    if (selectedCategory === 'Custom') {
      return matchesSearch && !!game.isCustom;
    }

    if (selectedCategory !== 'All') {
      return matchesSearch && game.category === selectedCategory;
    }

    return matchesSearch;
  });

  const activeGame = games.find(g => g.id === selectedGameId) || nativeSnakeGame;
  const activeGameReviews = reviews.filter(r => r.gameId === selectedGameId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans select-none">
      
      {/* Interactive header containing quicksearch filters */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddGameClick={() => setIsFormOpen(true)}
        onRandomGameClick={handleRandomSelect}
        totalGamesCount={games.length}
        favoritesCount={favorites.length}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Play Station Left Column (Takes up 2/3 of space on desktop grids) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Dynamic Active Game IFrame Console container */}
          <GamePlayFrame
            game={activeGame}
            onFullScreen={() => setIsFullScreen(true)}
            onIncrementPlayCount={handleIncrementPlayCount}
          />

          {/* Directory Title bar */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <h2 className="font-display font-medium text-xl text-gray-100 uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
                <span>Console Deck Gallery</span>
              </h2>
              <p className="text-xs text-gray-400 font-sans mt-0.5">Explore {filteredGames.length} options mapped inside the catalog config file</p>
            </div>

            {/* Config Exporter JSON Trigger */}
            <button
              id="btn-export-catalog"
              onClick={handleDownloadJSONConfig}
              className="px-3.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-xs font-mono text-indigo-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download entire games database as games.json"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Export games.json</span>
            </button>
          </div>

          {/* Grid display of Games */}
          {filteredGames.length === 0 ? (
            <div className="bg-gray-950 border border-gray-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-900 rounded-full text-indigo-400">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white">No game found matching filters</h4>
                <p className="text-gray-500 text-xs max-w-xs mx-auto mt-1">Try resetting search string or category tags, or submit your own custom game iframe link!</p>
              </div>
              <button
                id="btn-clear-search"
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs text-indigo-400 font-mono hover:text-white border border-indigo-900/40 hover:border-indigo-500 px-4 py-2 rounded-xl"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isActive={selectedGameId === game.id}
                  isFavorite={favorites.includes(game.id)}
                  onSelect={() => setSelectedGameId(game.id)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(game.id);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomGame(game.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Space Right Column (Ratings, custom notes, stats details) */}
        <div className="space-y-6 lg:border-l lg:border-gray-900 lg:pl-8">
          
          {/* Active play summary stats */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm text-gray-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-900 pb-3 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Gamer Statistics Feed</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-900">
                <span className="text-[10px] text-gray-500 block uppercase font-mono mb-1">Plays Registered:</span>
                <span className="text-2xl font-mono text-gray-100 font-bold">
                  {games.reduce((acc, curr) => acc + curr.plays, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-900">
                <span className="text-[10px] text-gray-500 block uppercase font-mono mb-1">Cabinet Type:</span>
                <span className="text-sm font-semibold text-indigo-400 block mt-1 leading-tight">
                  {games.filter(g => g.isCustom).length} custom / {games.filter(g => !g.isCustom).length} preset
                </span>
              </div>
            </div>

            {/* Quick overview layout info helper */}
            <div className="text-[11px] text-gray-500 font-sans mt-4 leading-relaxed bg-gray-950/25 p-3.5 rounded-lg border border-gray-900 flex gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>
                Select any game card on the gallery grid to load it in the interactive active iframe. Use the controller buttons to toggle views, and feel free to import new unblocked URLs anytime.
              </span>
            </div>
          </div>

          {/* Strong Unblocked Platform Proxy Link Generator */}
          <div className="bg-gray-900/40 border-2 border-cyan-950 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-bl-xl border-l border-b border-cyan-950 font-bold">
              Bypass Active
            </div>

            <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-cyan-950 pb-3 mb-4">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Strong Link Unblocker</span>
            </h3>

            <p className="text-[11px] text-gray-400 mb-3.5 leading-relaxed">
              Bypass school, corporate, or institutional firewalls instantly. This generator leverages Google's translated cloud proxies to render any external game undetected.
            </p>

            {/* Input URL Box */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-mono uppercase mb-1">Enter Target Game/Site URL:</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    id="proxy-target-input"
                    type="text"
                    value={proxyUrlInput}
                    onChange={(e) => setProxyUrlInput(e.target.value)}
                    placeholder="e.g. now.gg/apps/roblox.html"
                    className="w-full bg-gray-950 text-gray-200 pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-900 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Bypass Engine Option Tabs */}
              <div>
                <span className="block text-[10px] text-gray-500 font-mono uppercase mb-1">Bypass Engine Protocol:</span>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-900">
                  <button
                    type="button"
                    onClick={() => setSelectedBypassMethod('google-translate')}
                    className={`py-1.5 text-[10px] uppercase font-mono font-bold rounded-lg transition-all ${
                      selectedBypassMethod === 'google-translate'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Google Proxy (Strongest)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBypassMethod('clean-frame')}
                    className={`py-1.5 text-[10px] uppercase font-mono font-bold rounded-lg transition-all ${
                      selectedBypassMethod === 'clean-frame'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Direct Sandbox
                  </button>
                </div>
              </div>
            </div>

            {/* Render Output Result Box */}
            {proxyUrlInput.trim() && (
              <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-900 mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Generated Shield Link:</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/30 font-mono font-bold px-1.5 py-0.5 rounded">
                    {selectedBypassMethod === 'google-translate' ? 'Obfuscated' : 'Standard'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-cyan-300 break-all select-all focus:outline-none max-h-[48px] overflow-y-auto mb-2.5 bg-gray-950/40 p-1.5 rounded border border-gray-900">
                  {(() => {
                    let dest = proxyUrlInput.trim();
                    if (!/^https?:\/\//i.test(dest)) {
                      dest = 'https://' + dest;
                    }
                    if (selectedBypassMethod === 'google-translate') {
                      return `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(dest)}`;
                    }
                    return dest;
                  })()}
                </div>

                {/* Interactive triggers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      let dest = proxyUrlInput.trim();
                      if (!/^https?:\/\//i.test(dest)) {
                        dest = 'https://' + dest;
                      }
                      const finalUrl = selectedBypassMethod === 'google-translate'
                        ? `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(dest)}`
                        : dest;

                      navigator.clipboard.writeText(finalUrl);
                      setCopiedProxyUrl(true);
                      setTimeout(() => setCopiedProxyUrl(false), 2000);
                    }}
                    className={`py-2 px-3 text-[10px] font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 border transition-all ${
                      copiedProxyUrl 
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                        : 'bg-cyan-950/50 hover:bg-cyan-950 border-cyan-900 text-cyan-400 hover:text-white'
                    }`}
                  >
                    {copiedProxyUrl ? 'Copied Proxy!' : 'Copy Bypass Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      let dest = proxyUrlInput.trim();
                      if (!/^https?:\/\//i.test(dest)) {
                        dest = 'https://' + dest;
                      }
                      const finalUrl = selectedBypassMethod === 'google-translate'
                        ? `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(dest)}`
                        : dest;

                      // Automatically load into custom playframe by appending to custom cabinet
                      const customGameId = 'quick-bypass-' + Date.now();
                      const unblockedGame: Game = {
                        id: customGameId,
                        title: 'Bypassed PlayLink (' + (proxyUrlInput.replace(/(^\w+:|^)\/\/(www\.)?/, '').substring(0, 12)) + '...)',
                        description: 'Custom proxy generated bypass container wrapper for ' + proxyUrlInput,
                        iframeUrl: finalUrl,
                        category: 'Action',
                        thumbnail: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                        plays: 1,
                        rating: 5.0,
                        controls: 'Standard controls. Double-click within frame to trigger screen focusing.',
                        difficulty: 'Easy',
                        isCustom: true
                      };
                      handleAddCustomGame(unblockedGame);
                    }}
                    className="py-2 px-3 bg-indigo-950/50 hover:bg-indigo-950 border border-indigo-900 text-indigo-400 hover:text-white text-[10px] font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    Deploy to Play Box ↗
                  </button>
                </div>
              </div>
            )}

            {/* Direct Web Mirror Lists */}
            <div className="border-t border-cyan-950/30 pt-3.5 mt-3">
              <span className="block text-[10px] text-gray-500 font-mono uppercase mb-2">Popular Web Mirror Ports:</span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://classroom-6x.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-950/60 hover:bg-cyan-950/20 border border-gray-900 rounded-xl transition-all group text-[11px] font-sans text-gray-300 hover:text-cyan-400"
                >
                  <span className="truncate">Classroom 6x</span>
                  <span className="text-gray-700 group-hover:text-cyan-400">↗</span>
                </a>
                <a
                  href="https://itch.io/games/free/platform-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-950/60 hover:bg-rose-950/20 border border-gray-900 rounded-xl transition-all group text-[11px] font-sans text-gray-300 hover:text-rose-400"
                >
                  <span className="truncate">Itch Indie Hub</span>
                  <span className="text-gray-700 group-hover:text-rose-400">↗</span>
                </a>
                <a
                  href="https://www.crazygames.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-950/60 hover:bg-emerald-950/20 border border-gray-900 rounded-xl transition-all group text-[11px] font-sans text-gray-300 hover:text-emerald-400"
                >
                  <span className="truncate">CrazyGames Portal</span>
                  <span className="text-gray-700 group-hover:text-emerald-400">↗</span>
                </a>
                <a
                  href="https://poki.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-950/60 hover:bg-amber-950/20 border border-gray-900 rounded-xl transition-all group text-[11px] font-sans text-gray-300 hover:text-amber-400"
                >
                  <span className="truncate">Poki Unblocked</span>
                  <span className="text-gray-700 group-hover:text-amber-400">↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick lists container for Favorited Games catalog */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm text-gray-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-900 pb-3 mb-4">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Favorite Short List</span>
            </h3>

            {favorites.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-600 italic">
                No items added to hearts yet. Click stars on any cards to store favorites.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {games
                  .filter((g) => favorites.includes(g.id))
                  .map((favGame) => (
                    <div
                      key={favGame.id}
                      onClick={() => setSelectedGameId(favGame.id)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                        selectedGameId === favGame.id
                          ? 'bg-gray-950 border-indigo-500/50 text-indigo-300'
                          : 'bg-gray-950/40 border-transparent hover:bg-gray-950 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ background: favGame.thumbnail }}
                      >
                        {favGame.category.substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <span className="block text-xs font-semibold truncate text-gray-200">
                          {favGame.title}
                        </span>
                        <span className="block text-[10px] text-gray-500 font-mono uppercase">
                          {favGame.category} • {favGame.difficulty || 'Medium'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Dynamic Interactive Strategy reviews & Notes board per Game */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5">
            <div className="border-b border-gray-900 pb-3 mb-4">
              <h3 className="font-display font-bold text-sm text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Strategy Reviews & Notes</span>
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Logs specifically registered for <strong className="text-gray-300">{activeGame.title}</strong></p>
            </div>

            {/* List of comments registered */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto mb-5 pr-1">
              {activeGameReviews.length === 0 ? (
                <p className="text-center text-xs text-gray-600 italic py-4">No reviews logged yet. Be the first to share details!</p>
              ) : (
                activeGameReviews.map((rev) => (
                  <div key={rev.id} className="bg-gray-950/60 p-3 rounded-xl border border-gray-900 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-gray-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-400" />
                        {rev.userName}
                      </span>
                      <div className="flex items-center text-amber-500 font-mono text-[10px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-gray-700'}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-400 font-sans leading-relaxed text-[11px]">
                      {rev.comment}
                    </p>
                    <span className="text-[9px] text-gray-500 block text-right mt-1 font-mono">{rev.date}</span>
                  </div>
                ))
              )}
            </div>

            {/* Interactive Comment submission form */}
            <form onSubmit={handlePostReview} className="space-y-3 pt-3 border-t border-gray-900">
              <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wide">Write strategy / note:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="comment-author-name"
                  type="text"
                  required
                  placeholder="Your Handle name..."
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="bg-gray-950 border border-gray-900 text-gray-200 placeholder-gray-600 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-indigo-500 w-full"
                />

                <div className="flex items-center justify-between bg-gray-950 border border-gray-900 rounded-lg px-2 py-1 select-none">
                  <span className="text-[10px] text-gray-500 font-mono font-bold">Stars:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        id={`btn-rating-star-${stars}`}
                        type="button"
                        onClick={() => setReviewRating(stars)}
                        className="p-0.5 text-sm transition-all text-amber-500"
                        title={`${stars} star rating`}
                      >
                        <span className={reviewRating >= stars ? 'text-amber-400' : 'text-gray-700'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <textarea
                id="comment-text"
                required
                rows={2}
                placeholder="Log your highscores, tips, or controls warnings here..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="bg-gray-950 border border-gray-900 text-gray-200 placeholder-gray-600 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-indigo-500 resize-none w-full block"
              />

              <button
                id="btn-comment-submit"
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-indigo-100 font-mono py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                Post Review Logs
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* Main Full-immersive console cinema deck overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 animate-fade-in relative">
          
          {/* Top minimal control overlay */}
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2 select-none z-10 bg-black/70 backdrop-blur-md p-3.5 rounded-xl border border-gray-900">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-gray-100">{activeGame.title}</span>
              <span className="text-gray-700">|</span>
              <span className="text-indigo-400">{activeGame.category} mode</span>
            </div>

            <button
              id="btn-fullscreen-exit"
              onClick={() => setIsFullScreen(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-200 font-bold transition-all flex items-center gap-2 border border-gray-800"
              title="Return to normal menu"
            >
              <X className="w-4 h-4" />
              <span>Exit Console Mode</span>
            </button>
          </div>

          {/* Full viewport Frame output */}
          <div className="flex-1 w-full bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-900">
            {activeGame.id === 'built-in-arcade-snake' || activeGame.id === 'drainage' || activeGame.id === 'neon-highway' || activeGame.id === 'retro-circuit' ? (
              <div className="w-full flex justify-center items-center overflow-auto p-4 max-h-full">
                {activeGame.id === 'drainage' ? (
                  <DrainageGame />
                ) : activeGame.id === 'neon-highway' ? (
                  <NeonHighwayGame />
                ) : activeGame.id === 'retro-circuit' ? (
                  <RetroCircuitGame />
                ) : (
                  <BuiltInGame />
                )}
              </div>
            ) : (
              <iframe
                id="fullscreen-game-iframe"
                src={activeGame.iframeUrl}
                title={activeGame.title}
                className="w-full h-full bg-transparent border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          
          <p className="text-[10px] text-gray-600 text-center font-mono py-1.5 select-none mt-2">
            Tip: Press Esc or click Return to configure more settings. Custom keymaps remain active.
          </p>

        </div>
      )}

      {/* Floating Custom Game Add modal form dialog */}
      {isFormOpen && (
        <CustomGameForm
          onClose={() => setIsFormOpen(false)}
          onAddGame={handleAddCustomGame}
        />
      )}

      {/* Humble aesthetic footer */}
      <footer className="bg-gray-950 border-t border-gray-900 text-gray-600 py-6 px-4 md:px-8 text-center text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="flex items-center justify-center gap-1">
            <span>© 2026 ABOVE GAMES CENTER. ALL CODES SECURED.</span>
          </p>
          <div className="flex gap-4">
            <button 
              id="footer-export-config"
              onClick={handleDownloadJSONConfig}
              className="hover:text-indigo-400 transition-colors"
            >
              Export JSON File
            </button>
            <span>•</span>
            <span className="text-gray-500">Local Sandbox Mode</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
