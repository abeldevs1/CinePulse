const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const IMG_HD = 'https://image.tmdb.org/t/p/original';

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
        const savedItem = loadSavedWatchState();

        if (urlSeason && urlEpisode) {
            // Direct launch from user changing the slider in the modal
            state.season = parseInt(urlSeason) || 1;
            state.episode = parseInt(urlEpisode) || 1;
        } else if (savedItem && state.type === 'tv') {
            // Launch from Quick Watch or Continue Watching - Calculate precisely from DB
            let targetAbsolute = savedItem.ep || 0;
            let targetAbsoluteToPlay = Math.max(1, targetAbsolute); // Never play ep 0

            if (details.seasons) {
                const validSeasons = details.seasons.filter(s => s.season_number > 0);
                let accumulated = 0;
                let foundSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
                let foundRelativeEp = 1;

                for (let s of validSeasons) {
                    if (targetAbsoluteToPlay <= accumulated + s.episode_count) {
                        foundSeason = s.season_number;
                        foundRelativeEp = targetAbsoluteToPlay - accumulated;
                        break;
                    }
                    accumulated += s.episode_count;
                }

                state.season = foundSeason;
                state.episode = foundRelativeEp;
            } else {
                // Failsafe for missing API data
                state.season = Math.max(1, savedItem.season || 1);
                state.episode = 1;
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
        initPlayerLibraryState();
        initSmartNextButton();

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
    return db.find(i => String(i.id) === String(state.id)) || null;
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

function buildUI(details, cast, recs) {
    const title = details.title || details.name;
    const year = (details.release_date || details.first_air_date || '').split('-')[0];

    document.title = `Watching: ${title}`;
    document.getElementById('headerTitle').innerText = title;
    document.getElementById('headerSubtitle').innerText = `${state.type === 'tv' ? 'Series' : 'Movie'} • ${year} • ★ ${details.vote_average?.toFixed(1)}`;
    document.getElementById('backdropSection').style.backgroundImage = `url('${IMG_HD + (details.backdrop_path || details.poster_path)}')`;

    document.getElementById('detailPoster').src = IMG + details.poster_path;
    document.getElementById('detailOverview').innerText = details.overview || "No synopsis available.";

    document.getElementById('detailGenres').innerHTML = (details.genres || []).map(g =>
        `<button onclick="window.location.href='../index.html?search=${encodeURIComponent(g.name)}'" class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase text-gray-300 hover:text-white hover:border-pulse hover:bg-pulse/20 transition-all cursor-pointer">${g.name}</button>`
    ).join('');

    let productionText = `Status: <span class="text-white">${details.status}</span><br>`;
    if (details.production_companies?.length > 0) productionText += `Studio: <span class="text-white">${details.production_companies[0].name}</span>`;
    document.getElementById('detailProduction').innerHTML = productionText;

    document.getElementById('detailCast').innerHTML = cast.slice(0, 10).map(c => `
    <div onclick="window.location.href='../index.html?search=${encodeURIComponent(c.name)}'" class="flex-none w-20 text-center cursor-pointer group" title="Search for ${c.name}">
        <img src="${c.profile_path ? IMG + c.profile_path : 'https://via.placeholder.com/150'}" class="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-white/10 group-hover:border-pulse group-hover:shadow-[0_0_15px_rgba(255,45,85,0.4)] transition-all">
        <div class="text-[9px] font-black uppercase text-white line-clamp-1 group-hover:text-pulse transition-colors">${c.name}</div>
        <div class="text-[7px] text-gray-500 uppercase mt-1 line-clamp-1">${c.character}</div>
    </div>
    `).join('');

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

function buildServers() {
    const container = document.getElementById('serverList');
    const activeServers = SERVERS[state.category] || SERVERS['default'];

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

function buildSeasons() {
    document.getElementById('episodeSection').classList.remove('hidden');
    document.getElementById('episodeSection').classList.add('flex');

    const validSeasons = state.data.seasons.filter(s => s.season_number > 0);
    const sel = document.getElementById('seasonSelect');
    sel.innerHTML = validSeasons.map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`).join('');

    sel.value = state.season;

    sel.onchange = function () {
        const newSeason = parseInt(this.value);
        let continueFromEpisode = 1;
        const seasonProgressKey = `cp_season_progress_${state.id}`;
        const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');

        if (seasonProgress[newSeason]) {
            continueFromEpisode = seasonProgress[newSeason];
        } else if (newSeason === state.season) {
            continueFromEpisode = state.episode;
        } else {
            continueFromEpisode = 1;
        }

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

        html += `<button onclick="switchEpisode(${i})" class="w-full aspect-square rounded-xl border flex items-center justify-center text-xs font-black transition-all shrink-0 ${btnClass}">${i}</button>`;
    }
    document.getElementById('episodeGrid').innerHTML = html;
}

function switchEpisode(epNum) {
    const seasonProgressKey = `cp_season_progress_${state.id}`;
    const seasonProgress = JSON.parse(localStorage.getItem(seasonProgressKey) || '{}');
    seasonProgress[state.season] = state.episode;
    localStorage.setItem(seasonProgressKey, JSON.stringify(seasonProgress));

    state.episode = parseInt(epNum);
    state.absoluteEp = calculateAbsoluteEpisode(state.season, state.episode);
    renderEpisodes(state.season);
    updateStream();
    saveCurrentEpisodeToDb();
}

function saveCurrentEpisodeToDb() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    if (existingIdx !== -1) {
        db[existingIdx].ep = calculateAbsoluteEpisode(state.season, state.episode);
        db[existingIdx].season = state.season;
        db[existingIdx].status = 'Watching';
        db[existingIdx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
    }
}

function updateStream() {
    const serverList = SERVERS[state.category] || SERVERS['default'];
    if (state.serverIdx >= serverList.length) state.serverIdx = 0;
    const srv = serverList[state.serverIdx];

    state.absoluteEp = calculateAbsoluteEpisode(state.season, state.episode);
    const url = srv.build(state.type, state.id, state.season, state.episode, state.absoluteEp, state.audioMode);

    document.getElementById('neuralIframe').src = url;

    const nextBtn = document.getElementById('smartNextBtn');
    if (nextBtn) {
        nextBtn.innerHTML = '<span>Next Ep</span> <i class="fas fa-step-forward"></i>';
        nextBtn.classList.remove('bg-pulse', 'border-pulse');
    }

    initSmartNextButton();
}

window.toggleNeuralFullscreen = function () {
    const container = document.getElementById('iframeContainer');
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

window.playNextEpisode = function () {
    if (state.type !== 'tv') return;

    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    const validSeasons = state.data?.seasons?.filter(s => s.season_number > 0) || [];
    const currentSeasonData = validSeasons.find(s => s.season_number === state.season);
    const seasonMaxEp = currentSeasonData?.episode_count || 1;

    let nextSeason = state.season;
    let nextEp = state.episode + 1;

    if (nextEp > seasonMaxEp) {
        const nextSeasonData = validSeasons.find(s => s.season_number === state.season + 1);
        if (nextSeasonData) {
            nextSeason = state.season + 1;
            nextEp = 1;
            playerShowNotification(`Season ${state.season} complete! Moving to Season ${nextSeason}`);
        } else {
            if (existingIdx !== -1) {
                db[existingIdx].status = 'Finished';
                db[existingIdx].updatedAt = Date.now();
                localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
            }
            playerShowNotification('Series completed! Marked as Finished.');
            return;
        }
    }

    state.season = nextSeason;
    state.episode = nextEp;
    state.absoluteEp = calculateAbsoluteEpisode(nextSeason, nextEp);

    if (document.getElementById('seasonSelect')) {
        document.getElementById('seasonSelect').value = state.season;
    }

    renderEpisodes(state.season);
    updateStream();
    saveCurrentEpisodeToDb();
    playerShowNotification(`Playing S${state.season}:E${state.episode}`);
};

function playerShowNotification(message) {
    const existing = document.querySelector('.player-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'player-notification fixed top-6 left-1/2 -translate-x-1/2 bg-[#22c55e]/90 text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] font-bold text-sm tracking-wider transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none';
    notif.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.remove('-translate-y-4', 'opacity-0'), 10);
    setTimeout(() => {
        notif.classList.add('-translate-y-4', 'opacity-0');
        setTimeout(() => notif.remove(), 300);
    }, 4000);
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

function setAudioMode(mode) {
    state.audioMode = mode;
    document.getElementById('btnSub').className = mode === 'sub' ? "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all bg-[#a855f7] text-white" : "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all text-gray-500 hover:text-white";
    document.getElementById('btnDub').className = mode === 'dub' ? "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all bg-[#a855f7] text-white" : "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all text-gray-500 hover:text-white";
    updateStream();
}

function goBackToModal() {
    window.location.href = `../index.html?open=${state.id}&type=${state.type}`;
}

let sandboxExtended = false;
function toggleIframeSandbox() {
    sandboxExtended = !sandboxExtended;
    const iframe = document.getElementById('neuralIframe');
    const btn = document.getElementById('sandboxToggleBtn');
    const indicator = document.getElementById('sandboxIndicator');

    if (sandboxExtended) {
        iframe.removeAttribute('sandbox');
        btn.className = 'px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/20';
        btn.innerHTML = '<i class="fas fa-unlock mr-2"></i> Access: Full';
        if (indicator) indicator.classList.remove('hidden');
    } else {
        iframe.setAttribute('sandbox', 'allow-scripts allow-presentation allow-forms allow-same-origin');
        btn.className = 'px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10';
        btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Access: Safe';
        if (indicator) indicator.classList.add('hidden');
    }
}

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
    }, 400);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#playerSearch') && !e.target.closest('#playerSearchDropdown')) {
        document.getElementById('playerSearchDropdown').classList.add('hidden');
    }
});

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
    } else {
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
            updatedAt: Date.now()
        };
        db.push(newItem);
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));

        textEl.innerText = 'Watching';
        textEl.className = "text-xs font-bold uppercase text-[#22c55e]";
        iconEl.innerHTML = '<i class="fas fa-check text-[#22c55e]"></i>';
        iconEl.className = "w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center";
    }
}

function togglePlayerLibraryStatus() {
    goBackToModal();
}

function openPlayerMiniModal(id, type, title, poster) {
    document.getElementById('miniModalImg').src = IMG + poster;
    document.getElementById('miniModalTitle').innerText = title;
    document.getElementById('btnMiniWatch').onclick = () => window.location.href = `player.html?id=${id}&type=${type}`;
    document.getElementById('btnMiniDetails').onclick = () => window.location.href = `../index.html?open=${id}&type=${type}`;
    document.getElementById('playerMiniModal').classList.remove('hidden');
}

let playerIdleTimeout;
function initSmartNextButton() {
    const btn = document.getElementById('playerOverlayControls');
    const nextBtn = document.getElementById('smartNextBtn');
    const container = document.getElementById('iframeContainer');

    if (!btn || !container) return;

    if (state.type !== 'tv') {
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        const validSeasons = state.data?.seasons?.filter(s => s.season_number > 0) || [];
        const currentSeasonData = validSeasons.find(s => s.season_number === state.season);
        const seasonMaxEp = currentSeasonData?.episode_count || 1;

        let hasNext = false;
        if (state.episode < seasonMaxEp) hasNext = true;
        else if (validSeasons.find(s => s.season_number === state.season + 1)) hasNext = true;

        if (nextBtn) {
            if (!hasNext) nextBtn.style.display = 'none';
            else nextBtn.style.display = 'flex';
        }
    }

    const showButton = () => {
        btn.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        btn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');

        clearTimeout(playerIdleTimeout);
        playerIdleTimeout = setTimeout(() => {
            // REFINEMENT: Don't hide the controls if the user is actively hovering over them
            if (!btn.matches(':hover')) {
                btn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
                btn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
            }
        }, 3500); // Increased timeout to 3.5s for better usability
    };

    container.addEventListener('mousemove', showButton);
    container.addEventListener('touchstart', showButton, { passive: true });
    container.addEventListener('mouseleave', () => {
        clearTimeout(playerIdleTimeout);
        btn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        btn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    });
}

window.triggerNextEpisode = function () {
    const btn = document.getElementById('smartNextBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Loading...</span>';
    btn.classList.add('bg-pulse', 'border-pulse');
    playNextEpisode();
};

initPlayer();