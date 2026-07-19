export type Plan = "free" | "premium";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  region: string;
  language: string;
  genre: string;
  mood: string[];
  activity: string[];
  energy: number;
  audioUrl: string;
  cover: string;
  premiumOnly?: boolean;
};

export type VibeRequest = {
  activity: string;
  mood: string;
  energy: number;
  language: string;
  region: string;
  prompt?: string;
};
