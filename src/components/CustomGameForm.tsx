import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import { Game } from '../types';

interface CustomGameFormProps {
  onClose: () => void;
  onAddGame: (game: Game) => void;
}

export default function CustomGameForm({ onClose, onAddGame }: CustomGameFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const [category, setCategory] = useState('Arcade');
  const [controls, setControls] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [thumbnailGradient, setThumbnailGradient] = useState('linear-gradient(135deg, #6366f1 0%, #4338ca 100%)');
  const [errorWord, setErrorWord] = useState('');

  // Builtin gradient presets to choose from
  const gradients = [
    { name: 'Indigo Aura', val: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' },
    { name: 'Amber Heat', val: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { name: 'Cherry Pulse', val: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
    { name: 'Emerald Moss', val: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
    { name: 'Cyan Shock', val: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
    { name: 'Cosmic Violet', val: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWord('');

    // Validations
    if (!title.trim() || !description.trim() || !iframeUrl.trim()) {
      setErrorWord('Please fill in all core fields (Title, Description, and Web URL).');
      return;
    }

    // Basic URL check
    if (!iframeUrl.startsWith('http://') && !iframeUrl.startsWith('https://')) {
      setErrorWord('Invalid Target Web URL. Placeholders should begin with http:// or https://');
      return;
    }

    const uniqueId = 'custom-' + Date.now();
    const newGame: Game = {
      id: uniqueId,
      title: title.trim(),
      description: description.trim(),
      iframeUrl: iframeUrl.trim(),
      category,
      thumbnail: thumbnailGradient,
      plays: 0,
      rating: 5.0,
      isCustom: true,
      controls: controls.trim() || 'Mouse or keyboard triggers supported.',
      difficulty,
    };

    onAddGame(newGame);
    onClose();
  };

  // Fun helper to autofill or test custom inputs
  const handleAutofillDemo = () => {
    setTitle('Hextris Retro clone');
    setDescription('Speed-click hexes and clear geometric patterns before the canvas overflows.');
    setIframeUrl('https://hextris.github.io/hextris/');
    setCategory('Arcade');
    setControls('Rotate using keyboard arrows A/D or Left/Right.');
    setDifficulty('Hard');
    setThumbnailGradient('linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="custom-game-dialog"
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-fade-in"
      >
        {/* Form header */}
        <div className="bg-gray-900/60 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Import Iframe Game</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans">Add any embeddable web page to your personalized cabinet</p>
          </div>
          
          <button
            id="btn-close-form"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
            title="Clos form dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action input areas */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs font-sans">
          
          {errorWord && (
            <div className="bg-rose-950/40 border border-rose-500/20 text-rose-350 px-4 py-2.5 rounded-lg flex items-center gap-2 text-[11px] font-mono leading-tight">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorWord}</span>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">
              Game Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-game-title"
              type="text"
              required
              placeholder="e.g. Space Odyssey, retro Tetris clone..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans text-xs"
            />
          </div>

          {/* Tagline description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">
              Brief Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input-game-desc"
              required
              rows={2}
              placeholder="Provide a quick synopsis detailing the main rules and fun factors..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans text-xs resize-none"
            />
          </div>

          {/* Iframe target link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">
              Iframe Source Website URL <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-game-url"
              type="url"
              required
              placeholder="https://example.com/game/"
              value={iframeUrl}
              onChange={(e) => setIframeUrl(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500 italic mt-0.5">
              Warning: Some sites restrict embedding via security policies. Verify it can be embedded cleanly!
            </p>
          </div>

          {/* Categories & Difficulty row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">Category Category</label>
              <select
                id="select-game-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all text-xs font-sans appearance-none select-none cursor-pointer"
              >
                <option value="Arcade">🕹️ Arcade</option>
                <option value="Puzzle">🧩 Puzzle</option>
                <option value="Action">⚡ Action</option>
                <option value="Retro">⏳ Retro</option>
                <option value="Custom">🔧 Custom</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">Difficulty Level</label>
              <select
                id="select-game-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all text-xs font-sans appearance-none select-none cursor-pointer"
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>
          </div>

          {/* Controls instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">Keypad Controls scheme (Optional)</label>
            <input
              id="input-game-controls"
              type="text"
              placeholder="e.g. WASD keys to guide, click to trigger blasters..."
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans text-xs"
            />
          </div>

          {/* Thumbnail color block switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 font-semibold font-mono uppercase tracking-wide">Thumbnail Color Block Style</label>
            <div className="grid grid-cols-6 gap-2">
              {gradients.map((grad, i) => (
                <button
                  key={i}
                  id={`gradient-selector-${i}`}
                  type="button"
                  onClick={() => setThumbnailGradient(grad.val)}
                  className={`h-10 rounded-lg relative overflow-hidden ring-offset-2 ring-offset-black transition-all border ${
                    thumbnailGradient === grad.val ? 'ring-2 ring-indigo-500 border-white' : 'border-transparent'
                  }`}
                  style={{ background: grad.val }}
                  title={grad.name}
                >
                  {thumbnailGradient === grad.val && (
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center font-bold text-white text-[10px]">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Controls footer buttons */}
          <div className="flex gap-3 justify-between items-center mt-4 border-t border-gray-900 pt-4 font-mono">
            <button
              id="btn-demo-autofill"
              type="button"
              onClick={handleAutofillDemo}
              className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Autofill Sandbox Demo</span>
            </button>

            <div className="flex gap-2">
              <button
                id="btn-form-cancel"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-gray-900 transition-all font-medium"
              >
                Cancel
              </button>
              
              <button
                id="btn-form-submit"
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-semibold font-sans hover:scale-[1.02] active:scale-95 shadow-md shadow-indigo-600/10"
              >
                Assemble Cabinet
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
