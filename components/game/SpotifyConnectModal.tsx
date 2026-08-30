'use client';

import React, { useState } from 'react';
import { initiateSpotifyLogin } from '../../lib/spotifyAuth';
import { PRESET_TASTE_PROFILES, generateSongsFromProfile, PresetTasteProfile } from '../../lib/mockProfiles';
import { GamePlayer } from '../../lib/types';
import { 
  Headphones, 
  Sparkles, 
  Music, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Radio,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SpotifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: GamePlayer) => void;
  roomCode?: string;
}

export const SpotifyConnectModal: React.FC<SpotifyConnectModalProps> = ({
  isOpen,
  onClose,
  onSelectPlayer,
  roomCode
}) => {
  const [activeTab, setActiveTab] = useState<'spotify' | 'guest'>('spotify');
  const [guestName, setGuestName] = useState('');
  const [selectedGuestProfile, setSelectedGuestProfile] = useState<PresetTasteProfile>(PRESET_TASTE_PROFILES[0]);

  if (!isOpen) return null;

  const handleSpotifyConnect = () => {
    initiateSpotifyLogin(undefined, roomCode);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim() || selectedGuestProfile.name.split(' ')[0];
    const newId = `player_${Math.random().toString(36).substring(2, 9)}`;
    const topSongs = generateSongsFromProfile(selectedGuestProfile, newId);

    const player: GamePlayer = {
      id: newId,
      name: name,
      avatar: selectedGuestProfile.avatar,
      isHost: false,
      isReady: true,
      spotifyConnected: true,
      spotifyUsername: `${selectedGuestProfile.genre} Taste`,
      topSongs: topSongs,
      score: 0,
      currentStreak: 0
    };

    localStorage.setItem('whose_track_active_player', JSON.stringify(player));
    onSelectPlayer(player);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#1DB954]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-[#1DB954]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Connect Your Music
              </h2>
              <p className="text-xs text-neutral-400">
                We'll automatically analyze your top 30 most-played tracks!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800/80 hover:bg-neutral-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Official Spotify vs Quick Guest */}
        <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800">
          <button
            onClick={() => setActiveTab('spotify')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'spotify'
                ? 'bg-[#1DB954] text-black shadow-lg shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Headphones className="w-4 h-4 fill-current" />
            Spotify Account (Automatic)
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'guest'
                ? 'bg-neutral-800 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Quick Guest Profile
          </button>
        </div>

        {/* Tab 1: Official Spotify Connect */}
        {activeTab === 'spotify' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#1DB954]" />
                How It Works:
              </div>
              <ul className="text-xs text-neutral-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#1DB954] font-bold">1.</span>
                  <span>Click below to log in securely with your Spotify account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1DB954] font-bold">2.</span>
                  <span>Icebreakers automatically fetches your <strong>top 30 most-listened tracks</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1DB954] font-bold">3.</span>
                  <span>Your friends will hear snippets and guess if it's from your rotation!</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleSpotifyConnect}
              className="w-full py-4 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-[#1DB954]/25 flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Headphones className="w-5 h-5 fill-black" />
              Log In With Spotify
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 2: Quick Guest Profile Cards */}
        {activeTab === 'guest' && (
          <form onSubmit={handleGuestSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Your Name:
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl px-4 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Select Your Music Vibe (30 Tracks):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_TASTE_PROFILES.map((profile) => {
                  const isSelected = selectedGuestProfile.id === profile.id;
                  return (
                    <div
                      key={profile.id}
                      onClick={() => setSelectedGuestProfile(profile)}
                      className={`cursor-pointer rounded-xl p-3 border transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{profile.genre}</div>
                        <div className="text-[10px] text-neutral-400">30 Curated Hits</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-xl active:scale-95"
            >
              Continue as Guest
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
