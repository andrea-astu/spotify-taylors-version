// Alternate version of script

import { song_table } from './song_dictionary.js';

export async function runSpotifyWorkflow() {
    // your entire existing code here
    const clientId = "d28c3a7a90114d6e8b3052a40dddcfbb"; // client ID from app
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const code_two = params.get("code");  // TWO
    const code_three = params.get("code");  // THREE

    if (!code && !code_two && !code_three) {
        redirectToAuthCodeFlowProfile(clientId);
        redirectToAuthCodeFlowPlaylistIds(clientId);
        redirectToAuthCodeFlowReplaceSong(clientId);
    } else {
        const accessToken = await getAccessToken(clientId, code);
        const profile = await fetchProfile(accessToken);
        const userId = profile.id;

        let offset = 0;
        let allPlaylistIds = [];
        let total = null;

        do {
            const playlists = await fetchPlaylists(accessToken, userId, offset);
            if (total === null) total = playlists.total;

            const batchIds = getPlaylistsIds(playlists, userId);
            allPlaylistIds = allPlaylistIds.concat(batchIds);
            offset += playlists.items.length;
        } while (offset < total);

        await filterPlaylists(allPlaylistIds, accessToken); // call once with full list
    }
}

export async function redirectToAuthCodeFlowProfile(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Same verification but for playlists Ids
export async function redirectToAuthCodeFlowPlaylistIds(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "playlist-read-private playlist-read-collaborative");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Same verification but for replacing items in playlist
export async function redirectToAuthCodeFlowReplaceSong(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// function for redirectToAuthCodeFlow
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchPlaylists(token, userId, offset) {
    const result = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?offset=${offset}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

// Playlists Ids (created by user)
function getPlaylistsIds(playlists_full_info, userId) {
    const playlistsIdsArray = []
    for (let i = 0; i < playlists_full_info.items.length; i++) {
        if (playlists_full_info.items[i].owner.id == userId) {
            playlistsIdsArray.push(playlists_full_info.items[i].id);
        }
    }

    return playlistsIdsArray;
}

// trial
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllPlaylistTracks(token, playlistId) {
    const limit = 50;
    let offset = 0;
    let allTracks = [];
  
    while (true) {
      const page = await getPlaylistTracks(token, playlistId, offset);
      allTracks = allTracks.concat(page.items);
  
      if (page.items.length < limit) break; // no more pages
      offset += limit;
    }
  
    return allTracks;
}

// checks if there is a non TV track, if so: it's name, album, and in which position of playlist it is
// make for EVERY playlist
async function filterPlaylists(playlistsIds, token) {
    for (const playlistId of playlistsIds) {
        console.log("analyzing playlist: " + playlistId)
        const allTracks = await getAllPlaylistTracks(token, playlistId);
    
        for (let i = 0; i < allTracks.length; i++) {
          const item = allTracks[i];
          if (!item || !item.track) continue;
          const trackId = item.track.id;
    
          if (trackId in song_table) {
            console.log("replacing:")
            console.log(trackId)
            await sleep(200);
            await deleteTrack(token, playlistId, trackId);
            await sleep(200);
            await addTrack(token, playlistId, song_table[trackId], i);
          }
        }
    }
}


async function getPlaylistTracks(token, playlistId, offset) {
    // needed permission: playlist-read-private
    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=50`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

async function deleteTrack(token, playlistId, trackOut) {

    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "delete",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            "tracks": [{ "uri": `spotify:track:${trackOut}`}], // first item to change
        })
    });

    return await result.json();
}

async function addTrack(token, playlistId, trackIn, pos) {

    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "post",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            "uris": [ `spotify:track:${trackIn}`], // first item to change
            "position": pos,
        })
    });

    return await result.json();
}