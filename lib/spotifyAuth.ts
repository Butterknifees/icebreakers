import { GameSong } from './types';
import { resolveItunesAudio } from './itunesResolver';

const SPOTIFY_CLIENT_ID_KEY = 'spotify_custom_client_id';
export const DEFAULT_SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';

export function getStoredSpotifyClientId(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(SPOTIFY_CLIENT_ID_KEY);
    if (custom) return custom;
  }
  return DEFAULT_SPOTIFY_CLIENT_ID;
}

export function setStoredSpotifyClientId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, id.trim());
  }
}

export const SPOTIFY_SCOPES = [
  'user-top-read',
  'user-read-private',
  'user-read-email'
].join(' ');

/**
 * Generate cryptographic random string for PKCE
 */
export function generateRandomString(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      text += possible[values[i] % possible.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
  return text;
}

/**
 * Generate SHA-256 code challenge from verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Initiates Spotify PKCE Login redirect
 */
export async function initiateSpotifyLogin(clientId?: string, returnRoomCode?: string) {
  if (typeof window === 'undefined') return;

  const targetClientId = clientId || getStoredSpotifyClientId();
  if (!targetClientId) {
    console.error('No Spotify Client ID configured');
  }

  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = returnRoomCode || 'direct';

  localStorage.setItem('spotify_pkce_verifier', verifier);
  localStorage.setItem('spotify_auth_state', state);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const redirectUri = `${window.location.origin}${basePath}/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: targetClientId,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true'
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Exchanges auth code for Spotify Access Token
 */
export async function exchangeCodeForToken(code: string, clientId?: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const targetClientId = clientId || getStoredSpotifyClientId();

  const verifier = localStorage.getItem('spotify_pkce_verifier');
  if (!verifier) {
    console.error('No PKCE verifier found in localStorage');
    return null;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const redirectUri = `${window.location.origin}${basePath}/callback`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: targetClientId || '',
    code_verifier: verifier
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error_description || 'Failed to exchange token');
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('spotify_access_token', data.access_token);
      return data.access_token;
    }
  } catch (error) {
    console.error('Spotify token exchange failed:', error);
  }
  return null;
}

/**
 * Fetches user profile from Spotify
 */
export async function fetchSpotifyUserProfile(accessToken: string) {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching Spotify user profile:', e);
  }
  return null;
}

/**
 * Fetches user's Top 30 tracks from Spotify
 */
export async function fetchSpotifyTop30Tracks(accessToken: string, playerId: string): Promise<GameSong[]> {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=30&time_range=medium_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Spotify top tracks request failed: ${res.status}`);
    }

    const data = await res.json();
    const tracks = data.items || [];

    const parsedSongs: GameSong[] = await Promise.all(
      tracks.map(async (track: any, idx: number) => {
        const title = track.name;
        const artist = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
        const coverUrl = track.album?.images?.[0]?.url;
        let audioUrl = track.preview_url;

        // If Spotify preview_url is missing, resolve with iTunes Search API
        if (!audioUrl) {
          const resolved = await resolveItunesAudio(title, artist);
          if (resolved) {
            audioUrl = resolved.audioUrl;
          }
        }

        return {
          id: `sp_${track.id || idx}`,
          title,
          artist,
          album: track.album?.name,
          year: track.album?.release_date ? parseInt(track.album.release_date.substring(0, 4)) : undefined,
          audioUrl: audioUrl || '',
          coverUrl: coverUrl,
          spotifyUri: track.uri,
          spotifyUrl: track.external_urls?.spotify,
          owners: [playerId]
        };
      })
    );

    return parsedSongs;
  } catch (err) {
    console.error('Error fetching Spotify top 30 tracks:', err);
    return [];
  }
}
