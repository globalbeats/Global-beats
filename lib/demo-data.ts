import { Track } from "./types";

export const tracks: Track[] = [
  {
    id: "night-drive",
    title: "Midnight Highway",
    artist: "Neon North",
    album: "After Dark",
    region: "Canada",
    language: "English",
    genre: "Synthwave",
    mood: ["confident", "focused", "night"],
    activity: ["driving", "gaming"],
    energy: 78,
    audioUrl: "/audio/night-drive.wav",
    cover: "linear-gradient(135deg,#6928ff,#ff3d8d)"
  },
  {
    id: "punjabi-cruise",
    title: "Punjab Cruise",
    artist: "Azaad Beats",
    album: "Open Roads",
    region: "Punjab",
    language: "Punjabi",
    genre: "Punjabi Pop",
    mood: ["happy", "confident", "party"],
    activity: ["driving", "workout", "party"],
    energy: 90,
    audioUrl: "/audio/punjabi-cruise.wav",
    cover: "linear-gradient(135deg,#ff8a00,#ffcf3f)"
  },
  {
    id: "rain-window",
    title: "Rain on the Window",
    artist: "Luna Grey",
    album: "Soft Hours",
    region: "Global",
    language: "Instrumental",
    genre: "Lo-fi",
    mood: ["calm", "sad", "focused"],
    activity: ["study", "relax", "sleep"],
    energy: 28,
    audioUrl: "/audio/rain-window.wav",
    cover: "linear-gradient(135deg,#103d64,#55a6d9)"
  },
  {
    id: "gym-fire",
    title: "No Days Off",
    artist: "Kinetic Club",
    album: "Momentum",
    region: "USA",
    language: "English",
    genre: "Hip-Hop",
    mood: ["motivated", "confident", "intense"],
    activity: ["workout", "running"],
    energy: 96,
    audioUrl: "/audio/gym-fire.wav",
    cover: "linear-gradient(135deg,#ff3030,#300000)",
    premiumOnly: true
  },
  {
    id: "sunset-latin",
    title: "Sol en la Costa",
    artist: "Mar Azul",
    album: "Costa",
    region: "Latin America",
    language: "Spanish",
    genre: "Latin Pop",
    mood: ["romantic", "happy", "summer"],
    activity: ["driving", "party", "relax"],
    energy: 72,
    audioUrl: "/audio/sunset-latin.wav",
    cover: "linear-gradient(135deg,#ff3d71,#ffb12a)"
  },
  {
    id: "afro-rise",
    title: "Golden Morning",
    artist: "Kofi Lane",
    album: "Rise",
    region: "West Africa",
    language: "English",
    genre: "Afrobeats",
    mood: ["happy", "uplifting", "social"],
    activity: ["morning", "driving", "party"],
    energy: 83,
    audioUrl: "/audio/afro-rise.wav",
    cover: "linear-gradient(135deg,#00a878,#f4d35e)",
    premiumOnly: true
  }
];

export const vibePresets = [
  { id: "driving", label: "Driving", icon: "◢", description: "Road-ready momentum" },
  { id: "workout", label: "Workout", icon: "⚡", description: "High-energy push" },
  { id: "study", label: "Study", icon: "◎", description: "Calm concentration" },
  { id: "party", label: "Party", icon: "✦", description: "Crowd energy" },
  { id: "relax", label: "Relax", icon: "☾", description: "Slow everything down" },
  { id: "morning", label: "Morning", icon: "☀", description: "Start bright" }
];
