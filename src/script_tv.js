// For now: only fully released full length albums replacements

// How do I handle songs that aren't there? If for instance treacherous OG demo, do I replace it?
// Erase all; create another version with options depending on what people want to keep in regards to that

// Fix commentary and international versions because they are checked too many times

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
    //const accessToken_two = await getAccessToken(clientId, code_three);
    const profile = await fetchProfile(accessToken);
    const userId = profile.id;
    // repeat for all playlists, because you only get 20 at a time
    let offset = 0
    let playlists = await fetchPlaylists(accessToken, userId, offset); // USED SAME ACCESS TOKEN
    console.log(playlists.total);
    for (let a = 0; a <= Math.floor(playlists.total/20); a++) {
        console.log(a);
        let playlists = await fetchPlaylists(accessToken, userId, offset); // USED SAME ACCESS TOKEN
        console.log(playlists);
        let playlistsIds = getPlaylistsIds(playlists, userId);
        filterPlaylists(playlistsIds, accessToken, playlistsIds.length);
        offset += 20;
    }
    populateUI(profile, playlistsIds); //, playlists);
}

export async function redirectToAuthCodeFlowProfile(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5174/callback");
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
    params.append("redirect_uri", "http://localhost:5174/callback");
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
    params.append("redirect_uri", "http://localhost:5174/callback");
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
// GET MORE THAN TWENTY PLAYLISTS
function getPlaylistsIds(playlists_full_info, userId) {
    const playlistsIdsArray = []
    for (let i = 0; i < playlists_full_info.items.length; i++) {
        if (playlists_full_info.items[i].owner.id == userId) {
            playlistsIdsArray.push(playlists_full_info.items[i].id);
        }
    }

    return playlistsIdsArray;
}

// NOT SURE IT WORKS YET!!!

// checks if there is a non TV track, if so: it's name, album, and in which position of playlist it is
// make for EVERY playlist
async function filterPlaylists(playlistsIds, token, playlistNumber=20) {
    // repeat 20 times or less -> can only get 20 playlists batches
    for(let l = 0; l < playlistNumber; l++) {
        // 1. get all tracks
        const tracks = await getPlaylistTracks(token, playlistsIds[l], 0);
        const total_tracks = tracks.total;
        console.log(total_tracks);
        let offset = 0;  // only can access 100 songs of a playlist at a time
        
        // Make for loop that will go through every 100 songs
        for(let a = 0; a <= Math.floor(total_tracks/100); a++) {
            const tracksInPlaylist = await getPlaylistTracks(token, playlistsIds[l], offset);
            //2. check if any belong to following albums: RED, Speak Now, Fearless, 1989

            for (let i = 0; i < 100; i++) {

                if (i + offset == total_tracks) {
                    break;
                }
                // console.log(`position: ${i + offset} `);
                const song = tracksInPlaylist.items[i];
                // console.log(`song: ${song.track.name} `);
                // if (typeof song == TrackObject)    ADD LATER SO THAT IT SKIPS PODCASTS EPISODES
                if (song.track.album.id == "1KVKqWeRuXsJDLTW0VuD29" || song.track.album.id == "4jTYApZPMapg56gRycOn0D"){
                    // RED URI: 1KVKqWeRuXsJDLTW0VuD29, 4jTYApZPMapg56gRycOn0D (Big Red Machine Version)
                    await handleRed(song, i + offset, token, playlistsIds[l]);
                }
                else if (song.track.album.id == "2gP2LMVcIFgVczSJqn340t" || song.track.album.id == "08CWGiv27MVQhYpuTtvx83" || song.track.album.id == "3EzFY9Rg0PpbADMth746zi") {
                    // Platinum Edition, International Version, Big Machine version, 
                    await handleFearless(song, i + offset, token, playlistsIds[l]);
                } else if (song.track.album.id == "6Ar2o9KCqcyYF9J0aQP3au" || song.track.album.id == "6S6JQWzUrJVcJLK4fi74Fw" || song.track.album.id == "75N0Z60SNMQbAPYZuxKgWd") {
                    // Speak Now URI: 6Ar2o9KCqcyYF9J0aQP3au, 6S6JQWzUrJVcJLK4fi74Fw (deluxe), 75N0Z60SNMQbAPYZuxKgWd (BRM Version)
                    await handleSpeakNow(song, i + offset, token, playlistsIds[l]);
                } else if (song.track.album.id == "5fy0X0JmZRZnVa2UEicIOl" || song.track.album.id == "1yGbNOtRIgdIiGHOEBaZWf" || song.track.album.id == "6EsTJnpahwW6xX20zvqQgZ") {
                    // 1989, 1989 deluxe, BRM
                    await handle1989(song, i + offset, token, playlistsIds[l]);
                }
            }

            offset += 100;

        }
    }
}

// Make own Flow Func?
async function getPlaylistTracks(token, playlistId, offset) {
    // needed permission: playlist-read-private
    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

// Replace Tracks

async function handleRed(song, position, token, playlistId) {
    const redTV = await getTVAlbum(token, "6kZ42qRrzov54LcAk4onW9");
    for (let i = 0; i < redTV.total; i++) { // maybe like 5 less songs bc of vault tracks
        
        // All TV have 18 + space characters for TV text -> so str until str.length
        const tvName = redTV.items[i].name.substring(0, redTV.items[i].name.length - 19); // get song name without the "(Taylor's Version)" at the end
        
        // Song name exceptions (slightly different names in TV)
        if (song.track.name == "I Knew You Were Trouble.") {
            // New song title doesn't have a "."
            song.track.name =  "I Knew You Were Trouble";
        } else if (song.track.name == "Everything Has Changed") {
            song.track.name = "Everything Has Changed (feat. Ed Sheeran)"
        } else if (song.track.name == "State Of Grace - Acoustic") {
            song.track.name = "State Of Grace (Acoustic Version)";
            console.log(song.track.name);
        } else if (song.track.name == "The Last Time") {
            song.track.name = "The Last Time (feat. Gary Lightbody of Snow Patrol)";
        }

        // Replace
        if (song.track.name == tvName) {
            await deleteTrack(token, playlistId, song.track.id);
            await addTrack(token, playlistId, redTV.items[i].id, position);
            break;
        }

        // Exception: Treacherous and Red OG demo not in TV, just delete
        if (song.track.name == "Treacherous - Original Demo Recording" || song.track.name == "Red - Original Demo Recording") {
            await deleteTrack(token, playlistId, song.track.id);
            break;
        }

    }

    return true;
}

async function handleFearless(song, position, token, playlistId) {
    const fearTV = await getTVAlbum(token, "4hDok0OAJd57SGIT8xuWJH");
    for (let i = 0; i < fearTV.total; i++) { // maybe like 5 less songs bc of vault tracks
        // All TV have 18 + space characters for TV text -> so str until str.length
        const tvName = fearTV.items[i].name.substring(0, fearTV.items[i].name.length - 19); // get song name without the "(Taylor's Version)" at the end
        
        if (song.track.name.includes("International") || song.track.name.includes("Commentary")) {
            break;
        }


        // Song name exceptions (slightly different names in TV)
        if (song.track.name == "Forever & Always - Piano Version") {
            song.track.name =  "Forever & Always (Piano Version)";
        } else if (song.track.name == "SuperStar") {
            song.track.name =  "Superstar";
        } else if (song.track.name == "Breathe") {
            song.track.name =  "Breathe (feat. Colbie Caillat)";
        } else if (song.track.name == "You're Not Sorry") {
            song.track.name = "You’re Not Sorry";
        }
        
        // Don't handle international mix songs because they are from Debut

        // Replace
        if (song.track.name == tvName) {
            await deleteTrack(token, playlistId, song.track.id);
            await addTrack(token, playlistId, fearTV.items[i].id, position);
            break;
        }

    }

    return true;
}

async function handleSpeakNow(song, position, token, playlistId) {
    const speakNowTV = await getTVAlbum(token, "5AEDGbliTTfjOB8TSm1sxt");
    for (let i = 0; i < speakNowTV.total; i++) { // maybe like 5 less songs bc of vault tracks
        // All TV have 18 + space characters for TV text -> so str until str.length
        const tvName = speakNowTV.items[i].name.substring(0, speakNowTV.items[i].name.length - 19); // get song name without the "(Taylor's Version)" at the end

        // Song name exceptions (slightly different names in TV)
        if (song.track.name == "Mine - POP Mix") {
            song.track.name = "Mine";
        }

        // handle "If This Was a Movie" in non-album category and don't erase acoustic versions bc. they don't have replacement
        if ((song.track.name == "If This Was A Movie") || song.track.name.includes("Acoustic")) {
            break;
        }

        // Replace
        if (song.track.name == tvName) {
            await deleteTrack(token, playlistId, song.track.id);
            await addTrack(token, playlistId, speakNowTV.items[i].id, position);
            break;
        }
        

    }
    return true;
}

async function handle1989(song, position, token, playlistId) {
    const NineteenTV = await getTVAlbum(token, "1o59UpKw81iHR0HPiSkJR0"); // get 1989 TV (deluxe)
    for (let i = 0; i < NineteenTV.total; i++) { // maybe like 5 less songs bc of vault tracks
        // All TV have 18 + space characters for TV text -> so str until str.length
        const tvName = NineteenTV.items[i].name.substring(0, NineteenTV.items[i].name.length - 19); // get song name without the "(Taylor's Version)" at the end
        
        // ignore voice memos from deluxe
        if (song.track.name.includes("Voice Memo")) {
            break;
        }

        // Replace
        if (song.track.name == tvName) {
            console.log(song.track.name);
            await deleteTrack(token, playlistId, song.track.id);
            await addTrack(token, playlistId, NineteenTV.items[i].id, position);
            break;
        }

    }
    return true;
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


async function getTVAlbum(token, albumId) {
    // no permissions required
    const result = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}



// UI

function populateUI(profile, playlistsIds) {  //, playlists) {
    //document.getElementById("playlists_html").innerText = String(playlists_info[0])
    //document.getElementById("playlists_total").innerText = playlists.total
    document.getElementById("user_id").innerText = profile.id;
    document.getElementById("playlists_html").innerText = playlistsIds;
}