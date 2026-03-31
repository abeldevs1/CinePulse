const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const IMG_HD = 'https://image.tmdb.org/t/p/original';

// They automatically source K-Drama, Turkish, and Anime based on the TMDB ID.
const INTERNAL_PLAYERS = {
    apiEndpoints: [
        {
            name: 'UpCloud API',
            fetch: async (tmdbId, type, season, episode) => {
                try {
                    const res = await fetch(`https://upcloud.to/api/v1/movie/${tmdbId}`);
                    const data = await res.json();
                    if (data?.link) return data.link;
                } catch (e) { return null; }
                return null;
            }
        },
        {
            name: 'StreamBolt',
            fetch: async (tmdbId, type, season, episode) => {
                try {
                    const res = await fetch(`https://api.streambolt.io/v1/stream/${tmdbId}?type=${type}`);
                    const data = await res.json();
                    if (data?.url) return data.url;
                } catch (e) { return null; }
                return null;
            }
        },
        {
            name: 'VidStack API',
            fetch: async (tmdbId, type, season, episode) => {
                try {
                    const res = await fetch(`https://api.vidstack.io/stream/${tmdbId}?s=${season}&e=${episode}`);
                    const data = await res.json();
                    if (data?.sources?.length > 0) {
                        return data.sources[0].url;
                    }
                } catch (e) { return null; }
                return null;
            }
        }
    ]
};

const SERVERS = {
    default: [
        { name: 'VidSrc CC', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' },
        { name: 'VidSrc ME', build: (t, id, s, e) => `https://vidsrc.me/embed/${t}?tmdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' },
        { name: 'MultiEmbed', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`, type: 'embed' },
        { name: 'StreamSB', build: (t, id, s, e) => `https://streamsb.net/embed/${t}?id=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' },
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' },
        { name: 'AutoEmbed', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' }
    ],
    kdrama: [
        { name: 'VidSrc CC', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' },
        { name: 'AutoEmbed', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' },
        { name: 'MultiEmbed', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`, type: 'embed' },
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' }
    ],
    turkish: [
        { name: 'AutoEmbed', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' },
        { name: 'MultiEmbed', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`, type: 'embed' },
        { name: 'VidSrc CC', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' },
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' }
    ],
    anime: [
        { name: 'VidSrc CC', build: (t, id, s, e, abs, mode) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' },
        { name: 'AutoEmbed', build: (t, id, s, e, abs, mode) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' },
        { name: 'MultiEmbed', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`, type: 'embed' },
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' }
    ]
};

let state = {
    id: null, type: null, category: 'default',
    season: 1, episode: 1, absoluteEp: 1,
    serverIdx: 0, audioMode: 'sub', data: null
};
// Start
async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    state.id = urlParams.get('id');
    state.type = urlParams.get('type') || 'movie';
    const urlSeason = urlParams.get('season');
    const urlEpisode = urlParams.get('episode');

    if (!state.id) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const [details, credits, recs] = await Promise.all([
            fetch(`${BASE}/${state.type}/${state.id}?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE}/${state.type}/${state.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE}/${state.type}/${state.id}/recommendations?api_key=${API_KEY}`).then(r => r.json())
        ]);

        state.data = details;
        state.category = detectCategory(details);

        // Simple logic: Use URL params, or saved DB state, or default to S1:E1
        // NO auto-advancing - player starts exactly where tracker says
        if (urlSeason && urlEpisode) {
            state.season = parseInt(urlSeason) || 1;
            state.episode = parseInt(urlEpisode) || 1;
        } else if (savedItem && state.type === 'tv') {
            // Check season progress for this specific season
            const seasonProgressKey = `cp_season_progress_${state.id}`;
            const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');
            const savedSeason = savedItem.season || 1;

            // If we have progress for this season, use it
            if (seasonProgress[savedSeason]) {
                state.season = savedSeason;
                state.episode = seasonProgress[savedSeason];
            } else {
                // Otherwise use saved episode directly
                state.season = savedSeason;
                state.episode = Math.max(1, savedItem.ep || 1);
            }
        } else {
            state.season = 1;
            state.episode = 1;
        }

        buildUI(details, credits.cast, recs.results);
        buildServers();

        if (state.type === 'tv' && details.seasons) {
            buildSeasons();
        }

        updateStream();

        // FIX: Initialize the library state instantly on load
        initPlayerLibraryState();

        // Save starting episode for progress tracking when closing
        const startKey = `cp_player_start_${state.id}`;
        localStorage.setItem(startKey, JSON.stringify({
            season: state.season,
            episode: state.episode,
            savedAt: Date.now()
        }));

        // Start tracking position
        startPositionTracking();

        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 800);

    } catch (err) {
        console.error(err);
        document.getElementById('headerTitle').innerText = "Failed to load data.";
    }
}

function loadSavedWatchState() {
    const db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const item = db.find(i => String(i.id) === String(state.id));
    return item || null;
}

function detectCategory(details) {
    const lang = details.original_language;
    const genres = details.genres ? details.genres.map(g => g.id) : [];

    if (lang === 'ja' && genres.includes(16)) return 'anime';
    if (lang === 'ko') return 'kdrama';
    if (lang === 'tr') return 'turkish';
    return 'default';
}
function calculateAbsoluteEpisode(season, episode) {
    if (!state.data || !state.data.seasons) return episode;
    let abs = 0;
    const validSeasons = state.data.seasons.filter(s => s.season_number > 0 && s.season_number < season);
    for (let s of validSeasons) {
        abs += s.episode_count;
    }
    return abs + episode;
}

// Update DOM Text and Images
function buildUI(details, cast, recs) {
    const title = details.title || details.name;
    const year = (details.release_date || details.first_air_date || '').split('-')[0];

    // Header & Backdrop
    document.title = `Watching: ${title}`;
    document.getElementById('headerTitle').innerText = title;
    document.getElementById('headerSubtitle').innerText = `${state.type === 'tv' ? 'Series' : 'Movie'} • ${year} • ★ ${details.vote_average?.toFixed(1)}`;
    document.getElementById('backdropSection').style.backgroundImage = `url('${IMG_HD + (details.backdrop_path || details.poster_path)}')`;

    // Details Section
    document.getElementById('detailPoster').src = IMG + details.poster_path;
    document.getElementById('detailOverview').innerText = details.overview || "No synopsis available.";

    document.getElementById('detailGenres').innerHTML = (details.genres || []).map(g =>
        `<button onclick="window.location.href='index.html?search=${encodeURIComponent(g.name)}'" class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase text-gray-300 hover:text-white hover:border-pulse hover:bg-pulse/20 transition-all cursor-pointer">${g.name}</button>`
    ).join('');

    let productionText = `Status: <span class="text-white">${details.status}</span><br>`;
    if (details.production_companies?.length > 0) productionText += `Studio: <span class="text-white">${details.production_companies[0].name}</span>`;
    document.getElementById('detailProduction').innerHTML = productionText;

    // Cast Row
    document.getElementById('detailCast').innerHTML = cast.slice(0, 10).map(c => `
    <div onclick="window.location.href='index.html?search=${encodeURIComponent(c.name)}'" class="flex-none w-20 text-center cursor-pointer group">
        <img src="${c.profile_path ? IMG + c.profile_path : 'https://via.placeholder.com/150'}" class="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-white/10 group-hover:border-pulse group-hover:shadow-[0_0_15px_rgba(255,45,85,0.4)] transition-all">
        <div class="text-[9px] font-black uppercase text-white line-clamp-1 group-hover:text-pulse transition-colors">${c.name}</div>
        <div class="text-[7px] text-gray-500 uppercase mt-1 line-clamp-1">${c.character}</div>
    </div>
`).join('');

    // Recommendations Grid
    document.getElementById('detailRecs').innerHTML = recs.slice(0, 4).map(r => `
        <div class="group cursor-pointer" onclick="window.location.href='player.html?id=${r.id}&type=${state.type}'">
            <div class="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-white/5 group-hover:border-pulse transition-all relative">
                <img src="${r.poster_path ? IMG + r.poster_path : 'https://via.placeholder.com/300'}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i class="fas fa-play text-white text-xl"></i>
                </div>
            </div>
            <div class="text-[9px] font-black uppercase line-clamp-1 text-gray-300 group-hover:text-pulse">${r.title || r.name}</div>
        </div>
    `).join('');
}

// Server Buttons
function buildServers() {
    const container = document.getElementById('serverList');
    const activeServers = SERVERS[state.category] || SERVERS['default'];

    // Toggle Anime Controls
    const animeControls = document.getElementById('animeControls');
    if (animeControls) {
        animeControls.classList.toggle('hidden', state.category !== 'anime');
    }

    container.innerHTML = activeServers.map((srv, idx) => `
        <button onclick="switchServer(${idx})" class="srv-btn px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${idx === state.serverIdx ? 'bg-pulse text-white border-pulse shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}">
            <i class="fas fa-play-circle mr-2"></i> ${srv.name}
        </button>
    `).join('');
}

function switchServer(idx) {
    state.serverIdx = idx;
    buildServers();
    updateStream();
}



// Episode Grid
function buildSeasons() {
    document.getElementById('episodeSection').classList.remove('hidden');
    document.getElementById('episodeSection').classList.add('flex');

    const validSeasons = state.data.seasons.filter(s => s.season_number > 0);
    const sel = document.getElementById('seasonSelect');
    sel.innerHTML = validSeasons.map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`).join('');

    sel.value = state.season;

    // Add change listener to save season
    sel.onchange = function () {
        const newSeason = parseInt(this.value);

        // Check if user already has a saved episode for this season in the database
        let continueFromEpisode = 1;

        // Get current episode for each season from localStorage tracking
        const seasonProgressKey = `cp_season_progress_${state.id}`;
        const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');

        if (seasonProgress[newSeason]) {
            continueFromEpisode = seasonProgress[newSeason];
        } else if (newSeason === state.season) {
            // Same season, keep current episode
            continueFromEpisode = state.episode;
        } else {
            // If it's a completely new/unwatched season, ALWAYS start at Episode 1
            continueFromEpisode = 1;
        }

        // Update starting point when user manually changes season
        const startKey = `cp_player_start_${state.id}`;
        localStorage.setItem(startKey, JSON.stringify({
            season: newSeason,
            episode: continueFromEpisode,
            savedAt: Date.now()
        }));

        // Save current season/episode progress before switching
        seasonProgress[state.season] = state.episode;
        localStorage.setItem(seasonProgressKey, JSON.stringify(seasonProgress));

        state.season = newSeason;
        state.episode = continueFromEpisode;
        renderEpisodes(state.season);
        updateStream();
        saveCurrentEpisodeToDb();
    };

    renderEpisodes(state.season);
}

function renderEpisodes(seasonNum) {
    state.season = parseInt(seasonNum);
    const validSeasons = state.data.seasons.filter(s => s.season_number > 0);
    const targetSeason = validSeasons.find(s => s.season_number === state.season);

    if (!targetSeason) return;

    let html = '';
    for (let i = 1; i <= targetSeason.episode_count; i++) {
        const isActive = (state.episode === i);
        const btnClass = isActive
            ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            : 'bg-dark border-white/10 text-gray-400 hover:border-white/30 hover:text-white';

        // Removed fixed w-12 h-12 and added aspect-square w-full so it naturally fills the CSS grid beautifully
        html += `<button onclick="switchEpisode(${i})" class="w-full aspect-square rounded-xl border flex items-center justify-center text-xs font-black transition-all shrink-0 ${btnClass}">${i}</button>`;
    }
    document.getElementById('episodeGrid').innerHTML = html;
}

function switchEpisode(epNum) {
    // Save progress for current season before switching episode
    const seasonProgressKey = `cp_season_progress_${state.id}`;
    const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');
    seasonProgress[state.season] = state.episode;
    localStorage.setItem(seasonProgressKey, JSON.stringify(seasonProgress));

    // When user manually switches, update the starting point to current
    // This prevents incorrect "episodes watched" calculations
    const startKey = `cp_player_start_${state.id}`;
    localStorage.setItem(startKey, JSON.stringify({
        season: state.season,
        episode: parseInt(epNum),
        savedAt: Date.now()
    }));

    state.episode = parseInt(epNum);
    state.absoluteEp = calculateAbsoluteEpisode(state.season, state.episode);
    renderEpisodes(state.season);
    updateStream();

    // Update database with new episode
    saveCurrentEpisodeToDb();
    checkAndShowResumePrompt();
}

function saveCurrentEpisodeToDb() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    if (existingIdx !== -1) {
        db[existingIdx].ep = state.episode;
        db[existingIdx].season = state.season;
        db[existingIdx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
    }
}
// --- UPDATED STREAM ROUTING ---
function updateStream() {
    // 1. Get the correct server list based on detected category
    const serverList = SERVERS[state.category] || SERVERS['default'];

    // 2. Failsafe if serverIdx is out of bounds
    if (state.serverIdx >= serverList.length) state.serverIdx = 0;
    const srv = serverList[state.serverIdx];

    // 3. Ensure absolute episode is calculated for anime logic
    state.absoluteEp = calculateAbsoluteEpisode(state.season, state.episode);

    // 4. Build the URL passing the Sub/Dub state
    const url = srv.build(state.type, state.id, state.season, state.episode, state.absoluteEp, state.audioMode);

    // 5. Inject into Iframe
    document.getElementById('neuralIframe').src = url;

    // 6. Check for saved timestamp and show resume prompt
    checkAndShowResumePrompt();
}

function getWatchPositionKey() {
    return `cp_watch_pos_${state.id}_${state.type}_s${state.season}_e${state.episode}`;
}

function saveCurrentPosition(currentTime) {
    if (!state.id || !state.type) return;

    const key = getWatchPositionKey();
    const positionData = {
        id: state.id,
        type: state.type,
        season: state.season,
        episode: state.episode,
        timestamp: currentTime,
        duration: document.getElementById('neuralIframe').duration || 0,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(key, JSON.stringify(positionData));
        updateDbWithTimestamp(currentTime);
    } catch (e) {
        console.warn('Failed to save position:', e);
    }
}

function updateDbWithTimestamp(currentTime) {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    if (existingIdx !== -1) {
        db[existingIdx].timestamp = currentTime;
        db[existingIdx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
    }
}

let positionSaveInterval;
function startPositionTracking() {
    if (positionSaveInterval) clearInterval(positionSaveInterval);

    positionSaveInterval = setInterval(() => {
        try {
            const iframe = document.getElementById('neuralIframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'GET_CURRENT_TIME' }, '*');
            }
        } catch (e) { }
    }, 10000);
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CURRENT_TIME') {
        const currentTime = event.data.currentTime;
        if (currentTime && currentTime > 0) {
            saveCurrentPosition(currentTime);
        }
    }
    if (event.data && event.data.type === 'VIDEO_ENDED') {
        handleVideoEnded();
    }
});

function checkAndShowResumePrompt() {
    if (!state.id) return;

    const key = getWatchPositionKey();
    const savedData = localStorage.getItem(key);

    // First check database for saved timestamp
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const savedItem = db.find(i => String(i.id) === String(state.id));
    const dbTimestamp = savedItem?.timestamp || 0;

    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const effectiveTimestamp = (data.timestamp > dbTimestamp) ? data.timestamp : dbTimestamp;
            if (effectiveTimestamp > 30) {
                setTimeout(() => {
                    showResumePrompt(effectiveTimestamp);
                }, 1500);
                return;
            }
        } catch (e) { }
    } else if (dbTimestamp > 30) {
        setTimeout(() => {
            showResumePrompt(dbTimestamp);
        }, 1500);
    }
}

function showResumePrompt(savedTime) {
    const resumeModal = document.getElementById('resumePromptModal');
    if (resumeModal) resumeModal.remove();

    const modal = document.createElement('div');
    modal.id = 'resumePromptModal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-[#0a0c12] border border-pulse/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-pulse/20">
            <div class="text-center mb-6">
                <i class="fas fa-play-circle text-pulse text-5xl mb-4"></i>
                <h3 class="text-lg font-black uppercase text-white tracking-widest">Resume Watching?</h3>
                <p class="text-gray-400 text-sm mt-2">You left off at <span class="text-pulse font-bold">${formatTime(savedTime)}</span></p>
            </div>
            <div class="flex gap-3 mb-4">
                <button onclick="resumeFromTimestamp(0)" class="flex-1 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white/20 transition-all">
                    Start Over
                </button>
                <button onclick="resumeFromTimestamp(${savedTime})" class="flex-1 py-3 bg-pulse border border-pulse text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-pulse/80 transition-all">
                    Resume
                </button>
            </div>
            <div class="border-t border-white/10 pt-4">
                <p class="text-[10px] text-gray-500 text-center mb-2">Embed players can't detect position. Where did you leave off?</p>
                <div class="flex gap-2">
                    <input type="text" id="manualTimeInput" placeholder="e.g. 1:30:00 or 45:30" 
                        class="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-pulse focus:outline-none">
                    <button onclick="applyManualTimestamp()" class="px-4 py-2 bg-pulse/20 border border-pulse/50 text-pulse rounded-lg text-xs font-bold uppercase hover:bg-pulse hover:text-white transition-all">
                        Go
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close on background click
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function applyManualTimestamp() {
    const input = document.getElementById('manualTimeInput');
    const timeStr = input?.value?.trim();
    if (!timeStr) return;

    const seconds = parseTimeString(timeStr);
    if (seconds > 0) {
        const modal = document.getElementById('resumePromptModal');
        if (modal) modal.remove();
        playerShowNotification('Position saved! Click play to resume from ' + formatTime(seconds));

        // Save the timestamp
        let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
        const idx = db.findIndex(i => String(i.id) === String(state.id));
        if (idx !== -1) {
            db[idx].timestamp = seconds;
            db[idx].updatedAt = Date.now();
            localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        }

        // Also save to position key
        const key = getWatchPositionKey();
        const positionData = {
            id: state.id,
            type: state.type,
            season: state.season,
            episode: state.episode,
            timestamp: seconds,
            savedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(positionData));
    }
}

function parseTimeString(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
}

window.resumeFromTimestamp = function (timestamp) {
    const modal = document.getElementById('resumePromptModal');
    if (modal) modal.remove();

    if (timestamp > 0) {
        const iframe = document.getElementById('neuralIframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'SEEK_TO', seconds: timestamp }, '*');
        }
    }
};

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleVideoEnded() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    if (existingIdx !== -1) {
        const item = db[existingIdx];

        if (state.type === 'tv') {
            const validSeasons = state.data?.seasons?.filter(s => s.season_number > 0) || [];
            const currentSeasonData = validSeasons.find(s => s.season_number === state.season);
            const seasonMaxEp = currentSeasonData?.episode_count || 1;

            let nextSeason = state.season;
            let nextEp = state.episode + 1;

            // Check if we need to move to next season
            if (nextEp > seasonMaxEp) {
                const nextSeasonData = validSeasons.find(s => s.season_number === state.season + 1);
                if (nextSeasonData) {
                    nextSeason = state.season + 1;
                    nextEp = 1;
                    playerShowNotification(`Season ${state.season} complete! Moving to Season ${nextSeason}`);
                } else {
                    // No more seasons - series is finished
                    db[existingIdx].status = 'Finished';
                    db[existingIdx].season = state.season;
                    db[existingIdx].ep = state.episode;
                    db[existingIdx].timestamp = 0;
                    db[existingIdx].updatedAt = Date.now();
                    localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
                    playerShowNotification('Series completed! Marked as Finished.');
                    localStorage.removeItem(getWatchPositionKey());
                    return;
                }
            } else {
                playerShowNotification(`Episode ${state.episode} complete! Next: S${nextSeason}:E${nextEp}`);
            }

            // CRITICAL FIX: Convert next episode to Absolute before saving
            const nextAbs = getAbsoluteEpisode(nextSeason, nextEp);
            db[existingIdx].ep = nextAbs;
            db[existingIdx].season = nextSeason;
            db[existingIdx].timestamp = 0;
            db[existingIdx].updatedAt = Date.now();
            localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));

            // Auto-play next episode after notification
            setTimeout(() => {
                state.season = nextSeason;
                state.episode = nextEp;
                state.absoluteEp = nextAbs; // Keep state in sync
                renderEpisodes(state.season);
                if (document.getElementById('seasonSelect')) {
                    document.getElementById('seasonSelect').value = state.season;
                }
                updateStream();
            }, 2500);
        } else {
            db[existingIdx].status = 'Finished';
            db[existingIdx].timestamp = 0;
            playerShowNotification('Movie completed! Marked as Finished.');
            db[existingIdx].updatedAt = Date.now();
            localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        }

        localStorage.removeItem(getWatchPositionKey());
    }
}

function playerShowNotification(message) {
    const existing = document.querySelector('.player-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'player-notification fixed top-6 left-1/2 -translate-x-1/2 bg-[#22c55e]/90 text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] font-bold text-sm tracking-wider transition-all duration-300 transform -translate-y-4 opacity-0';
    notif.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.remove('-translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
        notif.classList.add('-translate-y-4', 'opacity-0');
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Save position when leaving page
window.addEventListener('beforeunload', () => {
    // Calculate and save episode progress
    calculateAndSaveEpisodeProgress();
    // Try to get time from iframe if possible
    try {
        const iframe = document.getElementById('neuralIframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'GET_CURRENT_TIME_SAVE' }, '*');
        }
    } catch (e) { }
});

// Also save when navigating away
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        calculateAndSaveEpisodeProgress();
        try {
            const iframe = document.getElementById('neuralIframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'GET_CURRENT_TIME_SAVE' }, '*');
            }
        } catch (e) { }
    }
});

function savePositionToDb(timestamp = 0) {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const idx = db.findIndex(i => String(i.id) === String(state.id));
    if (idx !== -1) {
        db[idx].timestamp = timestamp || db[idx].timestamp || 0;
        db[idx].season = state.season;
        db[idx].ep = state.episode;
        db[idx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
    }
}

// Manual position save function - can be called from UI
window.savePositionManually = function () {
    const input = prompt('Enter your current position (e.g., 1:30:00 or 45:30):');
    if (input) {
        const seconds = parseTimeString(input);
        if (seconds > 0) {
            savePositionToDb(seconds);
            playerShowNotification('Position saved at ' + formatTime(seconds));
        }
    }
};

// Ensure the UI buttons actually trigger the update
function setAudioMode(mode) {
    state.audioMode = mode;
    document.getElementById('btnSub').className = mode === 'sub' ? "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all bg-[#a855f7] text-white" : "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all text-gray-500 hover:text-white";
    document.getElementById('btnDub').className = mode === 'dub' ? "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all bg-[#a855f7] text-white" : "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all text-gray-500 hover:text-white";

    // Refresh the iframe when audio mode changes
    updateStream();
}

// Top Nav Actions
function goBackToModal() {
    // Calculate the new episode based on current player state
    calculateAndSaveEpisodeProgress();
    window.location.href = `../index.html?open=${state.id}&type=${state.type}`;
}

function calculateAndSaveEpisodeProgress() {
    // Get saved starting episode from before user opened player
    const startKey = `cp_player_start_${state.id}`;
    const startData = localStorage.getItem(startKey);
    let startSeason = 1;
    let startEpisode = 1;

    if (startData) {
        try {
            const parsed = JSON.parse(startData);
            startSeason = parsed.season || 1;
            startEpisode = parsed.episode || 1;
        } catch (e) { }
    }

    // Current episode in player
    const currentSeason = state.season;
    const currentEpisode = state.episode;

    // Calculate total episodes watched
    // Convert both to absolute episode numbers and calculate difference
    const startAbs = getAbsoluteEpisode(startSeason, startEpisode);
    const currentAbs = getAbsoluteEpisode(currentSeason, currentEpisode);
    const episodesWatched = currentAbs - startAbs + 1; // +1 because current episode counts

    // Get database item
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const idx = db.findIndex(i => String(i.id) === String(state.id));

    if (idx !== -1) {
        const playerCurrentAbs = getAbsoluteEpisode(currentSeason, currentEpisode);

        // Only update if current player episode is >= saved in DB
        if (playerCurrentAbs >= (db[idx].ep || 0)) {
            db[idx].season = currentSeason;
            db[idx].ep = playerCurrentAbs; // CRITICAL FIX: Saved as absolute!
            db[idx].updatedAt = Date.now();
            localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        }
    }

    // Save season-specific progress so we remember where user left off in each season
    const seasonProgressKey = `cp_season_progress_${state.id}`;
    const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');
    seasonProgress[currentSeason] = currentEpisode;
    localStorage.setItem(seasonProgressKey, JSON.stringify(seasonProgress));

    // Clear start data
    localStorage.removeItem(startKey);
}

function getAbsoluteEpisode(season, episode) {
    if (!state.data || !state.data.seasons) return episode;

    let abs = 0;
    const validSeasons = state.data.seasons.filter(s => s.season_number > 0 && s.season_number < season);
    for (let s of validSeasons) {
        abs += s.episode_count || 0;
    }
    return abs + episode;
}

// --- SANDBOX TOGGLE ENGINE ---
let sandboxExtended = false;
function toggleIframeSandbox() {
    sandboxExtended = !sandboxExtended;
    const iframe = document.getElementById('neuralIframe');
    const btn = document.getElementById('sandboxToggleBtn');
    const indicator = document.getElementById('sandboxIndicator');

    if (sandboxExtended) {
        // FULL ACCESS: Remove sandbox attribute completely for max compatibility
        iframe.removeAttribute('sandbox');
        btn.className = 'px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/20';
        btn.innerHTML = '<i class="fas fa-unlock mr-2"></i> Access: Full';
        if (indicator) indicator.classList.remove('hidden');
    } else {
        // RESTRICTED: Standard safe box
        iframe.setAttribute('sandbox', 'allow-scripts allow-presentation allow-forms allow-same-origin');
        btn.className = 'px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10';
        btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Access: Safe';
        if (indicator) indicator.classList.add('hidden');
    }
}

// Search Redirect
// --- LIVE SEARCH DROPDOWN ---
let searchTimeout;
document.getElementById('playerSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    const dropdown = document.getElementById('playerSearchDropdown');

    if (query.length < 2) {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`).then(r => r.json());
            const valid = res.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv').slice(0, 6);

            if (valid.length > 0) {
                dropdown.innerHTML = valid.map(item => `
                    <div onclick="window.location.href='player.html?id=${item.id}&type=${item.media_type}'" class="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors">
                        <img src="${item.poster_path ? IMG + item.poster_path : 'https://via.placeholder.com/50'}" class="w-10 h-14 rounded object-cover shadow-md">
                        <div>
                            <div class="text-[11px] font-black uppercase text-white line-clamp-1">${item.title || item.name}</div>
                            <div class="text-[9px] font-bold tracking-widest text-pulse uppercase mt-1">${item.media_type} • ${(item.release_date || item.first_air_date || '').split('-')[0] || 'N/A'}</div>
                        </div>
                    </div>
                `).join('');
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
            } else {
                dropdown.innerHTML = `<div class="p-4 text-center text-xs text-gray-500 font-bold uppercase tracking-widest">No results found</div>`;
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
            }
        } catch (err) {
            console.error("Search failed:", err);
        }
    }, 400); // Wait 400ms after user stops typing to save API calls
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#playerSearch') && !e.target.closest('#playerSearchDropdown')) {
        document.getElementById('playerSearchDropdown').classList.add('hidden');
    }
});
// --- LIBRARY STATUS ENGINE ---
function initPlayerLibraryState() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    let existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    const textEl = document.getElementById('playerStatusText');
    const iconEl = document.getElementById('playerStatusIcon');

    if (existingIdx !== -1) {
        const existing = db[existingIdx];
        textEl.innerText = existing.status;
        textEl.className = "text-xs font-bold uppercase text-[#22c55e]";
        iconEl.innerHTML = '<i class="fas fa-check text-[#22c55e]"></i>';
        iconEl.className = "w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center";

        // Ensure episode is synced with saved state
        if (state.type === 'tv' && existing.ep > 0) {
            state.season = existing.season || 1;
            state.episode = existing.ep;
            renderEpisodes(state.season);
            updateStream();
        }
    } else {
        // Add to library as watching
        const newItem = {
            id: state.id,
            title: state.data?.title || state.data?.name || '',
            poster: state.data?.poster_path || '',
            type: state.category === 'anime' || state.category === 'kdrama' ? state.category : (state.type === 'tv' ? 'tv' : 'movie'),
            tmdb_type: state.type,
            status: 'Watching',
            ep: state.type === 'tv' ? 1 : 0,
            max_ep: state.data?.number_of_episodes || 1,
            season: state.type === 'tv' ? 1 : 0,
            score: 0,
            crown: 0,
            imdb: state.data?.vote_average || 0,
            year: (state.data?.release_date || state.data?.first_air_date || '').split('-')[0],
            genres: (state.data?.genres || []).map(g => g.id),
            added: Date.now(),
            updatedAt: Date.now(),
            timestamp: 0,
            duration: 0
        };
        db.push(newItem);
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));

        textEl.innerText = 'Watching';
        textEl.className = "text-xs font-bold uppercase text-[#22c55e]";
        iconEl.innerHTML = '<i class="fas fa-check text-[#22c55e]"></i>';
        iconEl.className = "w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center";
    }
}
// (duplicate initPlayer removed — single definition above at line 40)

function togglePlayerLibraryStatus() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    let existing = db.find(i => String(i.id) === String(state.id));

    if (!existing) {
        db.push({
            id: state.id, title: state.data.title || state.data.name, poster: state.data.poster_path,
            type: state.category === 'anime' || state.category === 'kdrama' ? state.category : state.type,
            tmdb_type: state.type, status: 'Watching', ep: 1, max_ep: state.data.number_of_episodes || 1,
            score: 0, crown: 0, imdb: state.data.vote_average,
            year: (state.data.release_date || state.data.first_air_date || '').split('-')[0], genres: [], added: Date.now()
        });
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        initPlayerLibraryState();

        // FIX: Modern UI Toast instead of native alert()
        const t = document.createElement('div');
        t.className = `fixed top-10 right-10 bg-[#22c55e] text-white px-8 py-4 rounded-2xl shadow-2xl z-[9999] font-black uppercase text-[10px] tracking-widest transition-all duration-500 transform translate-y-[-20px] opacity-0 flex items-center gap-3`;
        t.innerHTML = `<i class="fas fa-check-circle text-lg"></i> Record initialized. Status set to WATCHING.`;
        document.body.appendChild(t);
        setTimeout(() => { t.classList.remove('translate-y-[-20px]', 'opacity-0'); }, 10);
        setTimeout(() => {
            t.classList.add('opacity-0', 'translate-y-[-20px]');
            setTimeout(() => t.remove(), 500);
        }, 3000);

    } else {
        goBackToModal();
    }
}
// --- MINI MODAL ENGINE ---
function openPlayerMiniModal(id, type, title, poster) {
    document.getElementById('miniModalImg').src = IMG + poster;
    document.getElementById('miniModalTitle').innerText = title;

    document.getElementById('btnMiniWatch').onclick = () => {
        window.location.href = `player.html?id=${id}&type=${type}`;
    };

    document.getElementById('btnMiniDetails').onclick = () => {
        window.location.href = `index.html?open=${id}&type=${type}`;
    };

    document.getElementById('playerMiniModal').classList.remove('hidden');
}

// Update your buildUI recommendations mapping to use the modal:
// Replace the onclick in detailRecs generation with:
// onclick="openPlayerMiniModal(${r.id}, '${state.type}', '${(r.title || r.name).replace(/'/g, "\\'")}', '${r.poster_path}')"

initPlayer();