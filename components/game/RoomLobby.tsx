'use client';

import React, { useState } from 'react';
import { GameRoom, GamePlayer } from '../../lib/types';
import { PRESET_TASTE_PROFILES, generateSongsFromProfile } from '../../lib/mockProfiles';
import { initiateSpotifyLogin } from '../../lib/spotifyAuth';
import { updatePlayer, startPreviewPhase } from '../../lib/roomEngine';
import { SpotifyConnectModal } from './SpotifyConnectModal';
import { 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  Music, 
  Radio, 
  Settings2, 
  Crown, 
  UserPlus, 
  Play, 
  Share2, 
  Headphones, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface RoomLobbyProps {
  room: GameRoom;
  currentPlayer: GamePlayer;
  onUpdatePlayer: (updates: Partial<GamePlayer>) => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  currentPlayer,
  onUpdatePlayer
}) => {
  const [copied, setCopied] = useState(false);
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const isHost = room.hostId === currentPlayer.id;
  const playersList = Object.values(room.players);
  const totalPooledSongs = playersList.reduce((acc, p) => acc + (p.topSongs?.length || 0), 0);
  const canStart = playersList.length >= 1 && playersList.every(p => (p.topSongs?.length || 0) > 0);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const url = `${window.location.origin}${basePath}/room?code=${room.code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectPresetProfile = (profileId: string) => {
    const profile = PRESET_TASTE_PROFILES.find(p => p.id === profileId);
    if (!profile) return;

    setSelectedProfileId(profileId);
    const generatedSongs = generateSongsFromProfile(profile, currentPlayer.id);

    onUpdatePlayer({
      name: currentPlayer.name || profile.name.split(' ')[0],
      avatar: profile.avatar,
      spotifyConnected: true,
      spotifyUsername: `${profile.genre} Taste`,
      topSongs: generatedSongs,
      isReady: true
    });
  };

  const handleAddMockPlayer = () => {
    // Add one of the preset profiles as a mock player into the room
    const unusedProfiles = PRESET_TASTE_PROFILES.filter(
      p => !playersList.some(player => player.id === `bot_${p.id}`)
    );
    if (unusedProfiles.length === 0) return;

    const chosen = unusedProfiles[0];
    const botId = `bot_${chosen.id}`;
    const botSongs = generateSongsFromProfile(chosen, botId);

    const botPlayer: GamePlayer = {
      id: botId,
      name: chosen.name,
      avatar: chosen.avatar,
      isHost: false,
      isReady: true,
      spotifyConnected: true,
      spotifyUsername: chosen.genre,
      topSongs: botSongs,
      score: 0,
      currentStreak: 0
    };

    updatePlayer(room.code, botId, botPlayer);
  };

  const handleStartGame = async () => {
    if (!canStart) return;
    await startPreviewPhase(room.code);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Banner with Room Code */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Party Lobby
              </span>
              <span className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-full text-xs font-semibold">
                {playersList.length} {playersList.length === 1 ? 'Player' : 'Players'} Joined
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Icebreakers: Whose Track?
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Link your Spotify account or pick a taste profile. Guess who listens to each track!
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex flex-col items-center bg-neutral-950/80 border border-neutral-700/80 rounded-2xl p-4 sm:p-5 shadow-xl w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
              Room Code
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-widest mb-3">
              {room.code}
            </div>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition border border-neutral-700 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Spotify Connection / Taste Selector */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Music className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Music Profile</h2>
              <p className="text-xs text-neutral-400">
                {currentPlayer.topSongs?.length > 0 
                  ? `✅ 30 Top Songs Loaded (${currentPlayer.spotifyUsername || 'Custom Profile'})`
                  : 'Connect your Spotify or choose a ready-made taste profile below'}
              </p>
            </div>
          </div>

          {/* Spotify Direct Connect Button */}
          <button
            onClick={() => setIsSpotifyModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs sm:text-sm rounded-2xl transition shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          >
            <Headphones className="w-4 h-4 fill-black" />
            Connect Spotify / Pick Vibe
          </button>
        </div>

        <SpotifyConnectModal
          isOpen={isSpotifyModalOpen}
          onClose={() => setIsSpotifyModalOpen(false)}
          onSelectPlayer={(p) => onUpdatePlayer(p)}
          roomCode={room.code}
        />

        {/* Preset Taste Profiles Grid */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Or Select a 30-Song Taste Profile (No Spotify Login Required):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_TASTE_PROFILES.map((profile) => {
              const isSelected = selectedProfileId === profile.id || currentPlayer.spotifyUsername === `${profile.genre} Taste`;
              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectPresetProfile(profile.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm truncate">
                          {profile.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-emerald-400/90 mt-0.5">
                        {profile.genre}
                      </span>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                        {profile.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>30 Curated Hits</span>
                    <span className="text-emerald-400 font-semibold">
                      {isSelected ? 'Selected ✓' : 'Click to Pick'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Players in Room Grid & Host Controls */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Party Members ({playersList.length})</h2>
              <p className="text-xs text-neutral-400">
                {totalPooledSongs} total songs in collective pool
              </p>
            </div>
          </div>

          {/* Add simulated friend button for fast testing */}
          <button
            onClick={handleAddMockPlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl border border-neutral-700 transition active:scale-95"
            title="Add a simulated friend to test multiplayer instantly"
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-400" />
            + Add Friend / Bot
          </button>
        </div>

        {/* Players List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {playersList.map((player) => (
            <div
              key={player.id}
              className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="relative">
                <img
                  src={player.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}
                  alt={player.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-neutral-700"
                />
                {player.isHost && (
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black p-1 rounded-full shadow-md" title="Host">
                    <Crown className="w-3 h-3 fill-black" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm truncate">
                    {player.name}
                  </span>
                  {player.id === currentPlayer.id && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  {player.topSongs && player.topSongs.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <Check className="w-3 h-3" />
                      {player.topSongs.length} Songs Loaded
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-medium">
                      Choosing songs...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start Game Action for Host */}
        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Before guessing begins, players will review their confirmed 30-song rosters.</span>
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/25 active:scale-95'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              Preview Top 30 Songs & Start Game
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-neutral-400 bg-neutral-950 px-4 py-3 rounded-xl border border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for Host ({playersList.find(p => p.isHost)?.name || 'Admin'}) to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
