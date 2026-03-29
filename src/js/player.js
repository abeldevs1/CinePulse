const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; 
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const IMG_HD = 'https://image.tmdb.org/t/p/original';

// They automatically source K-Drama, Turkish, and Anime based on the TMDB ID.
const SERVERS = {
    default: [
        { name: 'Nexus Stream', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}` },
        { name: 'Alpha Relay', build: (t, id, s, e) => `https://vidsrc.me/embed/${t}?tmdb=${id}${t==='tv'?`&season=${s}&episode=${e}`:''}` },
        { name: 'Omega Core', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t==='tv'?`&s=${s}&e=${e}`:''}` }
    ],
    kdrama: [
        // AutoEmbed generally has a much faster update rate for Asian Dramas
        { name: 'Eastern Hub 2', build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}` },
        { name: 'Eastern Hub 1', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}` },
        
    ],
    turkish: [
        { name: 'Eurasia Stream', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}` },
        { name: 'Global Relay', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t==='tv'?`&s=${s}&e=${e}`:''}` }
    ],
anime: [
        // Primary Anime Server (VidSrc)
        { name: 'Anime Primary', build: (t, id, s, e, abs, mode) => `https://vidsrc.cc/v2/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}` },
        // Secondary Anime Server with Sub/Dub capabilities via its own UI
        { name: 'Anime Secondary (Sub/Dub)', build: (t, id, s, e, abs, mode) => {
            // AutoEmbed will read the TMDB ID and usually provides its own internal Sub/Dub switch in the gear icon
            return `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}`;
        }}
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
        
        buildUI(details, credits.cast, recs.results);
        buildServers();
        
        if (state.type === 'tv' && details.seasons) {
            buildSeasons();
        }

        updateStream();
        
        // FIX: Initialize the library state instantly on load
        initPlayerLibraryState(); 

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
    state.episode = parseInt(epNum);
    state.absoluteEp = calculateAbsoluteEpisode(state.season, state.episode);
    renderEpisodes(state.season);
    updateStream();
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
}

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
    // Fix: from pages/player.html, go up one level to reach root index.html
    window.location.href = `../index.html?open=${state.id}&type=${state.type}`;
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
    let existing = db.find(i => String(i.id) === String(state.id));
    
    const textEl = document.getElementById('playerStatusText');
    const iconEl = document.getElementById('playerStatusIcon');
    
    if (existing) {
        textEl.innerText = existing.status;
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