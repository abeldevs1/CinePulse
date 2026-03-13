const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; // Keep your key here
const BASE = 'https://api.themoviedb.org/3';

const EMBED_SERVERS = [
    { id: 'vidsrccc', name: 'Neural Alpha (VidSrc)', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}`, ping: '12ms' },
    { id: 'autoembed', name: 'Eastern Relay (AutoEmbed)', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}`, ping: '24ms' },
    { id: 'multiembed', name: 'Nexus Stream', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t==='tv'?`&s=${s}&e=${e}`:''}`, ping: '18ms' },
    { id: 'embedsu', name: 'Global Node (Embed.su)', build: (t, id, s, e) => `https://embed.su/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}`, ping: '20ms' },
    { id: 'anime_sub', name: 'Anime Node (SUB)', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}&player=sub`, ping: '22ms' },
    { id: 'anime_dub', name: 'Anime Node (DUB)', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}&player=dub`, ping: '28ms' },
    { id: 'asian', name: 'K-Drama / Turkish Node', build: (t, id, s, e) => `https://vidsrc.pm/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}`, ping: '35ms' },
    { id: 'vidsrcme', name: 'Neural Beta', build: (t, id, s, e) => `https://vidsrc.me/embed/${t}?tmdb=${id}${t==='tv'?`&season=${s}&episode=${e}`:''}`, ping: '45ms' }
];

let playerState = {
    tmdbId: null, tmdbType: null, title: '',
    season: 1, episode: 1, serverIdx: 0,
    apiData: null,
    db: JSON.parse(localStorage.getItem('cp_elite_db_v3')) || []
};

// --- INIT APP ---
async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    playerState.tmdbId = urlParams.get('id');
    playerState.tmdbType = urlParams.get('type') || 'movie';
    playerState.title = decodeURIComponent(urlParams.get('title') || 'Unknown Source');
    
    document.getElementById('playerTitle').innerText = playerState.title;

    if (playerState.tmdbType === 'tv') {
        // Fetch detailed TV data to build the episode matrix
        const res = await fetch(`${BASE}/tv/${playerState.tmdbId}?api_key=${API_KEY}`);
        playerState.apiData = await res.json();
        
        // Auto-resume logic
        const localData = playerState.db.find(i => i.id == playerState.tmdbId);
        if (localData && localData.ep > 0) {
            calculateResumePoint(localData.ep);
        }
    }

    buildUI();
    updateStream();
}

// --- CORE UI BUILDER ---
function buildUI() {
    // 1. Build Servers with "Ping" aesthetics
    const srvList = document.getElementById('playerServerList');
    srvList.innerHTML = EMBED_SERVERS.map((srv, idx) => `
        <button onclick="switchServer(${idx})" class="player-srv-btn w-full flex flex-col p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left group">
            <div class="flex items-center justify-between w-full">
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white srv-name">${srv.name}</span>
                <i class="fas fa-signal text-[10px] text-[#22c55e]"></i>
            </div>
            <span class="text-[8px] text-gray-600 mt-1 uppercase font-bold srv-ping">Latency: ${srv.ping}</span>
        </button>
    `).join('');
    
    highlightServer();

    // 2. Build TV Controls
    const epSec = document.getElementById('playerEpSection');
    if (playerState.tmdbType === 'tv' && playerState.apiData && playerState.apiData.seasons) {
        epSec.classList.remove('hidden');
        epSec.classList.add('flex');
        
        const validSeasons = playerState.apiData.seasons.filter(s => s.season_number > 0);
        const sel = document.getElementById('playerSeasonSelect');
        sel.innerHTML = validSeasons.map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`).join('');
        sel.value = playerState.season;
        
        renderEpisodes(playerState.season);
    }
}

// --- STREAM LOGIC ---
function switchServer(idx) {
    playerState.serverIdx = idx;
    highlightServer();
    updateStream();
}

function highlightServer() {
    document.querySelectorAll('.player-srv-btn').forEach((btn, idx) => {
        if (idx === playerState.serverIdx) {
            btn.classList.add('bg-pulse/20', 'border-pulse/50');
            btn.querySelector('.srv-name').classList.add('text-pulse');
            btn.querySelector('.srv-name').classList.remove('text-gray-400');
            btn.querySelector('.srv-ping').classList.add('text-pulse');
        } else {
            btn.classList.remove('bg-pulse/20', 'border-pulse/50');
            btn.querySelector('.srv-name').classList.remove('text-pulse');
            btn.querySelector('.srv-name').classList.add('text-gray-400');
            btn.querySelector('.srv-ping').classList.remove('text-pulse');
        }
    });
}

function updateStream() {
    const srv = EMBED_SERVERS[playerState.serverIdx];
    const url = srv.build(playerState.tmdbType, playerState.tmdbId, playerState.season, playerState.episode);
    
    document.getElementById('neuralIframe').src = url;
    
    const sub = document.getElementById('playerSubtitle');
    if (playerState.tmdbType === 'tv') {
        sub.innerHTML = `<span class="text-[#3b82f6]">S${playerState.season} : E${playerState.episode}</span> <span class="text-gray-600 mx-2">|</span> Relay: ${srv.name}`;
    } else {
        sub.innerHTML = `Feature Film <span class="text-gray-600 mx-2">|</span> Relay: ${srv.name}`;
    }
}

// --- EPISODE MATRIX & PROGRESS ---
function renderEpisodes(seasonNum) {
    playerState.season = parseInt(seasonNum);
    const validSeasons = playerState.apiData.seasons.filter(s => s.season_number > 0);
    const targetSeason = validSeasons.find(s => s.season_number === playerState.season);
    
    const grid = document.getElementById('playerEpGrid');
    if (!targetSeason) return grid.innerHTML = '';

    let html = '';
    for (let i = 1; i <= targetSeason.episode_count; i++) {
        const isActive = (playerState.episode === i);
        const btnClass = isActive 
            ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
            : 'bg-dark text-gray-400 border-white/10 hover:border-[#3b82f6]/50 hover:text-white';
            
        html += `<button onclick="switchEpisode(${i})" class="w-full aspect-square rounded-xl border flex items-center justify-center text-[10px] font-black transition-all ${btnClass}">${i}</button>`;
    }
    grid.innerHTML = html;
}

function switchEpisode(epNum) {
    playerState.episode = parseInt(epNum);
    renderEpisodes(playerState.season);
    updateStream();
    saveProgressToLibrary();
}

// Translates local absolute episode number to Season/Episode format
function calculateResumePoint(absoluteEp) {
    const validSeasons = playerState.apiData.seasons.filter(s => s.season_number > 0);
    let remaining = absoluteEp + 1; // Start on the NEXT unwatched episode
    
    for (let s of validSeasons) {
        if (remaining <= s.episode_count) {
            playerState.season = s.season_number;
            playerState.episode = remaining;
            break;
        }
        remaining -= s.episode_count;
    }
}

function saveProgressToLibrary() {
    if (playerState.tmdbType !== 'tv') return;
    
    let absoluteEp = 0;
    const validSeasons = playerState.apiData.seasons.filter(s => s.season_number > 0);
    
    for (let s of validSeasons) {
        if (s.season_number < playerState.season) {
            absoluteEp += s.episode_count;
        } else if (s.season_number === playerState.season) {
            absoluteEp += playerState.episode;
            break;
        }
    }

    const idx = playerState.db.findIndex(i => i.id == playerState.tmdbId);
    if (idx !== -1) {
        playerState.db[idx].ep = absoluteEp;
        playerState.db[idx].status = 'Watching';
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(playerState.db));
    }
}

// --- UNIQUE FEATURE: DEEP FOCUS THEATER MODE ---
function toggleTheaterMode() {
    document.body.classList.toggle('theater-mode');
    const exitBtn = document.getElementById('exitTheaterBtn');
    
    if (document.body.classList.contains('theater-mode')) {
        exitBtn.classList.remove('hidden');
    } else {
        exitBtn.classList.add('hidden');
    }
}

function goBack() {
    window.location.href = 'index.html';
}

// Start
initPlayer();