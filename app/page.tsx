'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGameRoom } from '../lib/roomEngine';
import { GamePlayer } from '../lib/types';
import { PRESET_TASTE_PROFILES, generateSongsFromProfile } from '../lib/mockProfiles';
import { CloudSyncModal } from '../components/game/CloudSyncModal';
import { SpotifyConnectModal } from '../components/game/SpotifyConnectModal';
import { 
  Music, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Headphones, 
  ShieldCheck, 
  Globe,
  Radio
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [activePlayer, setActivePlayer] = useState<GamePlayer | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);

  // Initialize or load active player
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('whose_track_active_player');
    if (saved) {
      try {
        setActivePlayer(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Default initial player setup
      const defaultProfile = PRESET_TASTE_PROFILES[0];
      const newId = `player_${Math.random().toString(36).substring(2, 9)}`;
      const songs = generateSongsFromProfile(defaultProfile, newId);

      const initial: GamePlayer = {
        id: newId,
        name: defaultProfile.name.split(' ')[0],
        avatar: defaultProfile.avatar,
        isHost: true,
        isReady: true,
        spotifyConnected: false,
        spotifyUsername: defaultProfile.genre,
        topSongs: songs,
        score: 0,
        currentStreak: 0
      };
      localStorage.setItem('whose_track_active_player', JSON.stringify(initial));
      setActivePlayer(initial);
    }
  }, []);

  const handlePlayerSelected = (player: GamePlayer) => {
    setActivePlayer(player);
    localStorage.setItem('whose_track_active_player', JSON.stringify(player));
  };

  const handleCreateRoom = () => {
    if (!activePlayer) return;
    const host: GamePlayer = {
      ...activePlayer,
      isHost: true,
      isReady: true
    };
    localStorage.setItem('whose_track_active_player', JSON.stringify(host));
    const room = createGameRoom(host);
    
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    router.push(`${basePath}/room/${room.code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !activePlayer) return;

    const player: GamePlayer = {
      ...activePlayer,
      isHost: false,
      isReady: true
    };
    localStorage.setItem('whose_track_active_player', JSON.stringify(player));
    
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    router.push(`${basePath}/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-emerald-500 selection:text-black flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="py-4 px-6 sm:px-12 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl text-black shadow-lg shadow-emerald-500/20">
              <Music className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white font-sans">
                ICEBREAKERS
              </span>
              <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                Spotify Party Game
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition shadow-sm"
              title="Configure Online Play for different networks"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Online Sync (Firebase)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <CloudSyncModal isOpen={isCloudModalOpen} onClose={() => setIsCloudModalOpen(false)} />
      <SpotifyConnectModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onSelectPlayer={handlePlayerSelected}
      />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            The Ultimate Music Mystery Party Game
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Connect your Spotify. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Guess whose Top Song it is!
            </span>
          </h1>

          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto">
            Icebreakers automatically links with your Spotify account and analyzes your top 30 most-played songs. Listen to snippets with friends, score speed points, and discover shared music taste!
          </p>
        </div>

        {/* Prominent Spotify Connect Hero Card */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#1DB954]/10 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1DB954]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={activePlayer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}
                  alt={activePlayer?.name || 'Player'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#1DB954] shadow-xl"
                />
                {activePlayer?.spotifyConnected && (
                  <div className="absolute -bottom-1 -right-1 bg-[#1DB954] text-black p-1 rounded-full shadow">
                    <CheckCircle2 className="w-4 h-4 fill-black text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {activePlayer?.name || 'Your Music Profile'}
                  </h3>
                  <span className="text-xs bg-[#1DB954]/20 text-[#1DB954] font-bold px-2.5 py-0.5 rounded-full border border-[#1DB954]/30">
                    {activePlayer?.spotifyConnected ? 'Spotify Linked ✓' : 'Profile Active'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  {activePlayer?.topSongs?.length || 30} Top Tracks Loaded • Ready for Guessing Rounds
                </p>
              </div>
            </div>

            {/* Modal Trigger Button */}
            <button
              onClick={() => setIsSpotifyModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-[#1DB954]/20 active:scale-95 flex-shrink-0"
            >
              <Headphones className="w-4 h-4 fill-black" />
              {activePlayer?.spotifyConnected ? 'Switch Spotify Account' : 'Connect Your Spotify'}
            </button>
          </div>
        </div>

        {/* Action Grid: Create Room vs Join Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Create a New Room
              </h2>
              <p className="text-neutral-400 text-sm">
                Get a unique 6-character room code. Invite friends to connect their Spotify and play together in real time!
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Host & Create Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Join with Room Code
              </h2>
              <p className="text-neutral-400 text-sm">
                Have a friend's room code? Enter it below to jump straight into the guessing party!
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER 6-CHAR CODE (e.g. PARTY8)"
                maxLength={8}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl px-4 py-3 text-center text-white font-mono font-bold tracking-widest text-lg focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition border border-neutral-700 active:scale-95"
              >
                Join Party
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              Speed-Based Scoring
            </div>
            <p className="text-xs text-neutral-400">
              The quicker you identify the suspect, the more points you earn (up to 1,000 pts per round).
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Flame className="w-4 h-4" />
              2X Shared Track Multiplier
            </div>
            <p className="text-xs text-neutral-400">
              If more than one person has the song in their Top 30, correct points are automatically doubled!
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              100% Guaranteed Audio
            </div>
            <p className="text-xs text-neutral-400">
              Powered by Apple iTunes 30-sec audio snippets fallback for instant zero-fail playback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-800/60 text-center text-xs text-neutral-500">
        Icebreakers 🎵 • Real-Time Multiplayer Spotify Top-30 Guessing Party Game
      </footer>
    </div>
  );
}
