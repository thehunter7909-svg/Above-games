export interface Game {
  id: string;
  title: string;
  description: string;
  iframeUrl: string;
  category: string;
  thumbnail: string; // URL or CSS/Style configuration for preset thumbnails
  plays: number;
  rating: number; // Rating out of 5
  isCustom?: boolean;
  controls?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export type CategoryType = 'All' | 'Arcade' | 'Puzzle' | 'Action' | 'Retro' | 'Custom';

export interface UserReview {
  id: string;
  gameId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PlayStats {
  gameId: string;
  playTimeSeconds: number;
  lastPlayed: string;
  playCount: number;
}
