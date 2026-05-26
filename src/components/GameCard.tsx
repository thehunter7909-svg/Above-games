import React from 'react';
import { Heart, Play, Trash2, ShieldAlert } from 'lucide-react';
import { Game } from '../types';

interface GameCardProps {
  key?: string;
  game: Game;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: any) => void;
  onDelete?: (e: any) => void;
  isActive: boolean;
}

export default function GameCard({
  game,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onDelete,
  isActive,
}: GameCardProps) {
  // Determine color matching for difficulty tag
  const getDifficultyStyles = (diff?: 'Easy' | 'Medium' | 'Hard') => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20';
      case 'Hard':
        return 'bg-rose-950/40 text-rose-400 border-rose-500/20';
      case 'Medium':
      default:
        return 'bg-amber-950/40 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div
      id={`game-card-${game.id}`}
      onClick={onSelect}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer h-full ${
        isActive
          ? 'bg-gray-900 border-indigo-500/80 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30 translate-y-[-2px]'
          : 'bg-gray-950 hover:bg-gray-900 border-gray-800 hover:border-gray-700 hover:translate-y-[-4px]'
      }`}
    >
      {/* Visual Header / Banner */}
      <div
        className="h-28 w-full p-4 relative flex flex-col justify-between"
        style={{ background: game.thumbnail }}
      >
        {/* Abstract design elements on background to enrich appearance */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-bl-full filter blur-xl opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none" />

        {/* Categories, Difficulty level Badges */}
        <div className="flex justify-between items-start z-10 w-full">
          <span className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md tracking-wider uppercase border border-white/10">
            {game.category}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border backdrop-blur-md font-mono ${getDifficultyStyles(game.difficulty)}`}>
            {game.difficulty || 'Medium'}
          </span>
        </div>

        {/* Hover play prompt */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
          <div className="bg-indigo-600 p-3 rounded-full text-white transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-md shadow-indigo-500/30">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Title & Body Meta */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-base text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
              {game.title}
            </h3>
            {game.isCustom && (
              <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">
                USER
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 font-sans line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Control hint label */}
        {game.controls && (
          <div className="text-[10px] text-gray-400/80 font-sans border-t border-gray-900 pt-2.5 mt-1">
            <span className="font-semibold text-gray-300 block mb-0.5">Controls:</span>
            <span className="line-clamp-1 italic text-gray-400">{game.controls}</span>
          </div>
        )}
      </div>

      {/* Footer Interface with Rating & Favorites Buttons */}
      <div className="px-4 py-3 bg-gray-900/40 border-t border-gray-900 flex items-center justify-between text-xs font-mono">
        {/* Ratings and Plays counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-amber-500 gap-0.5">
            <span className="text-gray-200 font-bold">{game.rating.toFixed(1)}</span>
            <span className="text-amber-500/90 text-sm">★</span>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">{game.plays.toLocaleString()} plays</span>
        </div>

        {/* Quick actions row */}
        <div className="flex items-center gap-1.5">
          {/* Favorite heart selector */}
          <button
            id={`fav-btn-${game.id}`}
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
              isFavorite
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/40 hover:bg-rose-900/50'
                : 'bg-gray-900 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* User added game deletion trash button */}
          {game.isCustom && onDelete && (
            <button
              id={`delete-btn-${game.id}`}
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-gray-900 border border-transparent text-gray-500 hover:text-red-400 hover:bg-red-950/30 hover:border-red-500/20 transition-all hover:scale-105 active:scale-95"
              title="Delete custom game"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
