'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom, GamePlayer } from '../../lib/types';
import { subscribeToRoom, joinRoom, updatePlayer } from '../../lib/roomEngine';
import { AudioEngine } from '../../lib/audioEngine';
import { RoomLobby } from './RoomLobby';
import { TopSongsPreview } from './TopSongsPreview';
import { RoundPlayer } from './RoundPlayer';
import { RoundReveal } from './RoundReveal';
import { GamePodium } from './GamePodium';
import { PRESET_TASTE_PROFILES, generateSongsFromProfile } from '../../lib/mockProfiles';
import { CloudSyncModal } from './CloudSyncModal';
import { 
  Music, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Radio,
  Globe
} from 'lucide-react';

interface RoomClientProps {
  roomCode: string;
}

export const RoomClient: React.FC<RoomClientProps> = ({ roomCode }) => {
  const router = useRouter();
  const [code, setCode] = useState<string>(roomCode ? roomCode.toUpperCase() : '');

  useEffect(() => {
    if (roomCode) {
      setCode(roomCode.toUpperCase());
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCode = urlParams.get('code');
      if (queryCode) {
        setCode(queryCode.toUpperCase());
      }
    }
  }, [roomCode]);

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<GamePlayer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  const audioEngine = useMemo(() => new AudioEngine(), []);

  // Initialize or load active player
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlayer = localStorage.getItem('whose_track_active_player');
      if (savedPlayer) {
        try {
          const parsed: GamePlayer = JSON.parse(savedPlayer);
          setCurrentPlayer(parsed);
        } catch (e) {
          // ignore
        }
      } else {
        // Default player with first profile
        const defaultProfile = PRESET_TASTE_PROFILES[0];
        const newId = `player_${Math.random().toString(36).substring(2, 9)}`;
        const defaultSongs = generateSongsFromProfile(defaultProfile, newId);

        const initialPlayer: GamePlayer = {
          id: newId,
          name: defaultProfile.name.split(' ')[0],
          avatar: defaultProfile.avatar,
          isHost: false,
          isReady: false,
          spotifyConnected: true,
          spotifyUsername: `${defaultProfile.genre} Taste`,
          topSongs: defaultSongs,
          score: 0,
          currentStreak: 0
        };

        localStorage.setItem('whose_track_active_player', JSON.stringify(initialPlayer));
        setCurrentPlayer(initialPlayer);
      }
    }
  }, []);

  // Subscribe to room updates
  useEffect(() => {
    if (!code || !currentPlayer) return;

    // Join room with current player
    joinRoom(code, currentPlayer);

    const unsubscribe = subscribeToRoom(code, (updatedRoom) => {
      setRoom(updatedRoom);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      audioEngine.stop();
    };
  }, [code, currentPlayer?.id]);

  const handleUpdateCurrentPlayer = (updates: Partial<GamePlayer>) => {
    if (!currentPlayer || !room) return;
    const updated = { ...currentPlayer, ...updates };
    setCurrentPlayer(updated);
    localStorage.setItem('whose_track_active_player', JSON.stringify(updated));
    updatePlayer(room.code, currentPlayer.id, updates);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    audioEngine.setVolume(isMuted ? 1.0 : 0.0);
  };

  if (isLoading || !room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-semibold text-neutral-300">
            Connecting to room <span className="font-mono text-emerald-400 font-bold">{code}</span>...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-emerald-500 selection:text-black flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-black shadow-lg shadow-emerald-500/20">
                <Music className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:inline">
                ICEBREAKERS
              </span>
            </div>
          </div>

          {/* Center phase badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-mono font-bold text-emerald-400">
              Room: {room.code}
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3 h-3 animate-pulse" />
              {room.phase}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-purple-400 transition"
              title="Online Cross-Network Setup"
            >
              <Globe className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={handleToggleMute}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Current Player Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <img
                src={currentPlayer.avatar}
                alt={currentPlayer.name}
                className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              />
              <span className="text-xs font-bold text-white hidden sm:inline">
                {currentPlayer.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <CloudSyncModal isOpen={isCloudModalOpen} onClose={() => setIsCloudModalOpen(false)} />

      {/* Main Game Screen depending on phase */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        {room.phase === 'LOBBY' && (
          <RoomLobby
            room={room}
            currentPlayer={currentPlayer}
            onUpdatePlayer={handleUpdateCurrentPlayer}
          />
        )}

        {room.phase === 'PREVIEW' && (
          <TopSongsPreview
            room={room}
            currentPlayer={currentPlayer}
            audioEngine={audioEngine}
          />
        )}

        {room.phase === 'GUESSING' && (
          <RoundPlayer
            room={room}
            currentPlayer={currentPlayer}
            audioEngine={audioEngine}
          />
        )}

        {room.phase === 'REVEAL' && (
          <RoundReveal
            room={room}
            currentPlayer={currentPlayer}
          />
        )}

        {room.phase === 'PODIUM' && (
          <GamePodium
            room={room}
            currentPlayer={currentPlayer}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-neutral-800/60 text-center text-xs text-neutral-500">
        Icebreakers 🎵 • Powered by Spotify API & Apple iTunes Audio Engine
      </footer>
    </div>
  );
};
