import { Search, Gamepad2, Plus, Dice5, Library, Layers3 } from 'lucide-react';
import { CategoryType } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryType;
  setSelectedCategory: (category: CategoryType) => void;
  onAddGameClick: () => void;
  onRandomGameClick: () => void;
  totalGamesCount: number;
  favoritesCount: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onAddGameClick,
  onRandomGameClick,
  totalGamesCount,
  favoritesCount,
}: HeaderProps) {
  const categories: { label: string; value: CategoryType }[] = [
    { label: 'All Games', value: 'All' },
    { label: '🧩 Puzzle', value: 'Puzzle' },
    { label: '🕹️ Arcade', value: 'Arcade' },
    { label: '⚡ Action', value: 'Action' },
    { label: '⏳ Retro', value: 'Retro' },
    { label: '🔧 Custom', value: 'Custom' },
  ];

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-40 px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/10">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ABOVE <span className="text-indigo-400 font-medium">GAMES</span>
            </h1>
            <p className="text-xs text-gray-400 font-mono">CURATED IFRAME PLAYGROUND</p>
          </div>
        </div>

        {/* Dynamic Search Input Bar */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            id="search-input"
            type="text"
            placeholder="Search games, categories, controls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 text-gray-100 placeholder-gray-500 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-sans"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            id="btn-random-game"
            onClick={onRandomGameClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all text-sm font-medium"
            title="Suffle play a random game"
          >
            <Dice5 className="w-4 h-4 text-emerald-400" />
            <span>Surprise Me</span>
          </button>
          
          <button
            id="btn-add-game"
            onClick={onAddGameClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-medium shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Iframe Game</span>
          </button>
        </div>
      </div>

      {/* Categories Toolbar & Minor Counts */}
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-gray-900/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Filter categories tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                id={`cat-btn-${cat.value}`}
                onClick={() => setSelectedCategory(cat.value)}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-medium font-sans border transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-950'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Small metric chips */}
        <div className="flex gap-4 text-xs font-mono text-gray-500 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Catalog: <strong className="text-gray-300">{totalGamesCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers3 className="w-3.5 h-3.5 text-pink-400" />
            <span>Favorites: <strong className="text-gray-300">{favoritesCount}</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
}
