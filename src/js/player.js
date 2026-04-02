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
        { name: 'AutoEmbed', build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' },
        { name: 'VidSrc TO', build: (t, id, s, e) => `https://vidsrc.to/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' }
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
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' },
        { name: 'VidSrc TO', build: (t, id, s, e) => `https://vidsrc.to/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' }
    ],
    anime: [
        { name: 'VidSrc CC', build: (t, id, s, e, abs, mode) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' },
        { name: 'AutoEmbed', build: (t, id, s, e, abs, mode) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`, type: 'embed' },
        { name: 'MultiEmbed', build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`, type: 'embed' },
        { name: 'VikingEmbed', build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`, type: 'embed' },
        { name: 'VidSrc TO', build: (t, id, s, e) => `https://vidsrc.to/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`, type: 'embed' }
    ]
};

let state = {
    id: null, type: null, category: 'default',
    season: 1, episode: 1, absoluteEp: 1,
    serverIdx: 0, audioMode: 'sub', data: null
};
window.generateCleanUrl = function (title, type, id, s = null, e = null) {
    const cleanTitle = (title || 'watch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const typeChar = type === 'movie' ? 'm' : 't';
    let slug = `${cleanTitle}-${typeChar}${id}`;
    if (type === 'tv' && s && e) slug += `-s${s}e${e}`;
    return slug;
};
window.parseCleanUrl = function (slug) {
    if (!slug) return null;
    const match = slug.match(/-([mt])(\d+)(?:-s(\d+)e(\d+))?$/);
    if (match) {
        return { type: match[1] === 'm' ? 'movie' : 'tv', id: match[2], s: match[3] || null, e: match[4] || null };
    }
    return null;
};
async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const cleanSlug = urlParams.get('v');
    state.id = urlParams.get('id');
    state.type = urlParams.get('type') || 'movie';
    const urlSeason = urlParams.get('season');
    const urlEpisode = urlParams.get('episode');
    if (cleanSlug) {
        const parsed = parseCleanUrl(cleanSlug);
        if (parsed) {
            state.id = parsed.id; state.type = parsed.type;
            state.season = parseInt(parsed.s) || 1; state.episode = parseInt(parsed.e) || 1;
        }
    } else {
        // Fallback for old legacy links + Auto-clean address bar
        state.id = urlParams.get('id'); state.type = urlParams.get('type') || 'movie';
        state.season = parseInt(urlParams.get('season')) || 1; state.episode = parseInt(urlParams.get('episode')) || 1;
        if (state.id) {
            const newUrl = `${window.location.pathname}?v=${generateCleanUrl('watch', state.type, state.id, state.season, state.episode)}`;
            window.history.replaceState({}, '', newUrl);
        }
    }

    if (!state.id) {
        window.location.href = '../index.html';

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

        buildUI(details, credits.cast || [], recs.results || []);
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

    // NEW: Always push to temporary history so it shows in "Continue Watching" without polluting the DB
    if (state.data) trackWatchHistory(state.data, state.season, state.episode);

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

// Auto-finishing logic embedded into your existing trigger Next
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
            playerShowNotification(`Season ${state.season} complete! Initiating Season ${nextSeason}`);
        } else {
            // FINISHED THE ENTIRE SERIES
            markFinishedInPlayer();
            return;
        }
    }

    state.season = nextSeason;
    state.episode = nextEp;
    state.absoluteEp = calculateAbsoluteEpisode(nextSeason, nextEp);

    if (document.getElementById('seasonSelect')) document.getElementById('seasonSelect').value = state.season;
    renderEpisodes(state.season);
    updateStream();
    saveCurrentEpisodeToDb();
    initPlayerLibraryState(); // Update liquid bar
    playerShowNotification(`Playing S${state.season}:E${state.episode}`);
};


// --- PRECISION RATING LOGIC ---
window.showRatingCard = function () {
    const card = document.getElementById('playerRatingCard');
    card.classList.remove('hidden');
    // FIX: Removed the undefined function call and replaced with the direct engine call
    resetStarHover();
};
// =========================================================================
// --- UNIFIED PRECISION RATING ENGINE ---
// =========================================================================
window.getRatingFromEvent = function (e) {
    const targetContainer = e.currentTarget;
    const rect = targetContainer.getBoundingClientRect();
    let clientX = (e.type === 'touchend' || e.type === 'touchmove')
        ? (e.changedTouches ? e.changedTouches[0].clientX : e.touches[0].clientX)
        : e.clientX;

    // Ensure calculation stays strictly within the container bounds
    let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    let rawVal = (x / rect.width) * 5;
    let snappedVal = Math.ceil(rawVal * 2) / 2;

    return parseFloat(Math.max(0.5, Math.min(5.0, snappedVal)).toFixed(1));
};

window.handleStarHover = function (e) {
    window.updateStarVisuals(window.getRatingFromEvent(e));
};

window.resetStarHover = function () {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];

    // Safely determines context across both script.js and player.js without crashing
    let itemId = null;
    if (typeof state !== 'undefined' && state.active) {
        itemId = state.active.id;
    } else if (typeof playerState !== 'undefined' && playerState.tmdbId) {
        itemId = playerState.tmdbId;
    } else if (typeof state !== 'undefined' && state.id) {
        itemId = state.id;
    }

    const item = db.find(i => String(i.id) === String(itemId));
    window.updateStarVisuals(item && item.score ? item.score : 0);
};

window.commitPrecisionRating = function (e) {
    const val = window.getRatingFromEvent(e);
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];

    let itemId = null;
    if (typeof state !== 'undefined' && state.active) {
        itemId = state.active.id;
    } else if (typeof playerState !== 'undefined' && playerState.tmdbId) {
        itemId = playerState.tmdbId;
    } else if (typeof state !== 'undefined' && state.id) {
        itemId = state.id;
    }

    const idx = db.findIndex(i => String(i.id) === String(itemId));
    if (idx !== -1) {
        db[idx].score = val;
        db[idx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));

        if (typeof state !== 'undefined' && state.db) {
            state.db = db;
            if (typeof save === 'function') save(true);
        }

        window.updateStarVisuals(val);
        const notifyFunc = typeof showNotification === 'function' ? showNotification : (typeof playerShowNotification === 'function' ? playerShowNotification : alert);
        notifyFunc("Score Saved: ★ " + val);

        const playerCard = document.getElementById('playerRatingCard');
        if (playerCard && !playerCard.classList.contains('hidden')) {
            setTimeout(() => playerCard.classList.add('hidden'), 1500);
        }
    } else {
        const notifyFunc = typeof showNotification === 'function' ? showNotification : (typeof playerShowNotification === 'function' ? playerShowNotification : alert);
        notifyFunc("Please track this entity before rating.", true);
    }
};

window.updateStarVisuals = function (val) {
    const pct = (val / 5) * 100;
    const fill = document.getElementById('precisionStarFill');
    const display = document.getElementById('ratingValueDisplay');

    if (fill) fill.style.width = `${pct}%`;

    const scaleToggle = document.getElementById('mainRatingScaleToggle') || document.getElementById('ratingScaleToggle');
    const scale = scaleToggle ? parseInt(scaleToggle.value) : 5;

    if (display) {
        display.innerText = scale === 10 ? (val * 2).toFixed(1) : val.toFixed(1);
    }
};
// =========================================================================
window.getLiquidHTML = function (item) {
    if (item.type === 'movie' || !item.ep || item.ep <= 0) return '';
    let max = item.max_ep || item.ep || 1;
    let ratio = item.ep / max;
    let percent = Math.max(Math.min(ratio * 100, 100), 4);

    let textClass = ratio > 0.8 ? 'text-[#22c55e]' : ratio > 0.4 ? 'text-[#f59e0b]' : 'text-white';
    let bgClass = ratio > 0.8 ? 'bg-[#22c55e]/10' : ratio > 0.4 ? 'bg-[#f59e0b]/10' : 'bg-white/5';

    return `
    <div class="absolute bottom-0 left-0 w-full z-20 pointer-events-none flex flex-col justify-end transition-all duration-1000" style="height: ${percent}%;">
        <div class="w-full h-3 overflow-hidden relative opacity-80">
            <div class="absolute top-0 left-0 w-[200%] h-full flex animate-wave-slide">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-1/2 h-full fill-current ${textClass} opacity-40"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,121.5,205.8,107.13Z"></path></svg>
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-1/2 h-full fill-current ${textClass} opacity-20"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,121.5,205.8,107.13Z"></path></svg>
            </div>
        </div>
        <div class="w-full ${bgClass} border-t border-white/40 transition-all duration-1000" style="height: calc(100% - 0.5rem); box-shadow: inset 0 4px 10px -2px rgba(255,255,255,0.4), inset 0 -10px 20px -5px rgba(0,0,0,0.3);"></div>
    </div>
    `;
}

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

window.goBackToModal = function () {
    // 1. Immediately sever video connection to stop audio playing in the background
    const iframe = document.getElementById('neuralIframe');
    if (iframe) iframe.src = "";

    // 2. Intelligent Navigation: Use browser history to preserve SPA state on index.html
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        // Fallback routing if opened in a new tab directly
        window.location.href = `../index.html?open=${state.id}&type=${state.type}`;
    }
};

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

window.markFinishedInPlayer = function () {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const idx = db.findIndex(i => String(i.id) === String(state.id));

    if (idx !== -1) {
        db[idx].status = 'Finished';
        // Safely fallback to 1 if max_ep is missing to prevent undefined corruption
        db[idx].ep = db[idx].max_ep || 1;
        db[idx].updatedAt = Date.now();

        // Synchronize the Player's active season/episode guide so it doesn't desync
        if (state.type === 'tv' && state.data && state.data.seasons) {
            const validSeasons = state.data.seasons.filter(s => s.season_number > 0);
            if (validSeasons.length > 0) {
                const lastSeason = validSeasons[validSeasons.length - 1];
                state.season = lastSeason.season_number;
                state.episode = lastSeason.episode_count || 1;

                // Update UI Dropdown and Grid visually
                const sel = document.getElementById('seasonSelect');
                if (sel) sel.value = state.season;
                renderEpisodes(state.season);
            }
        }

        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
    }

    initPlayerLibraryState();
    showRatingCard();
    playerShowNotification('Archive marked as Finished.');
};

window.updatePlayerStatus = function (status) {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const idx = db.findIndex(i => String(i.id) === String(state.id));

    if (idx !== -1) {
        db[idx].status = status;

        if (status === 'Finished') {
            db[idx].ep = db[idx].max_ep || 1;

            if (state.type === 'tv' && state.data && state.data.seasons) {
                const validSeasons = state.data.seasons.filter(s => s.season_number > 0);
                if (validSeasons.length > 0) {
                    const lastSeason = validSeasons[validSeasons.length - 1];
                    state.season = lastSeason.season_number;
                    state.episode = lastSeason.episode_count || 1;

                    const sel = document.getElementById('seasonSelect');
                    if (sel) sel.value = state.season;
                    renderEpisodes(state.season);
                }
            }
            showRatingCard();
        }

        db[idx].updatedAt = Date.now();
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        initPlayerLibraryState();
        playerShowNotification(`Status updated to ${status}`);
    }
};

function initPlayerLibraryState() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    let existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    const textEl = document.getElementById('playerStatusText');
    const iconEl = document.getElementById('playerStatusIcon');
    const actionContainer = document.getElementById('playerActionContainer');
    const liquidBg = document.getElementById('playerLiquidBg');
    const ratingCard = document.getElementById('playerRatingCard');

    if (existingIdx !== -1) {
        const item = db[existingIdx];

        // Progress Bar Engineering
        let progressHtml = '';
        if (item.type !== 'movie' && item.max_ep > 1) {
            const pct = Math.min(100, Math.round((item.ep / item.max_ep) * 100));
            progressHtml = `
                <div class="w-full max-w-[200px] mt-2">
                    <div class="flex justify-between text-[8px] font-black uppercase text-gray-500 mb-1 tracking-widest">
                        <span>Progress</span>
                        <span class="text-pulse">${item.ep} / ${item.max_ep}</span>
                    </div>
                    <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-pulse shadow-[0_0_10px_rgba(255,45,85,0.8)] transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }

        // Action Buttons: Classic Finish + Modern Dropdown
        actionContainer.innerHTML = `
            <div class="flex items-center gap-2 md:gap-3">
                ${item.status !== 'Finished' ? `
                    <button onclick="markFinishedInPlayer()" class="px-4 py-2 md:px-6 md:py-3 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e] hover:text-white transition-all shadow-lg flex items-center gap-2 shrink-0">
                        <i class="fas fa-check-double"></i> <span class="hidden sm:inline">Finish</span>
                    </button>
                ` : ''}
                <select onchange="updatePlayerStatus(this.value)" class="bg-dark/80 border border-white/10 px-3 py-2 md:px-4 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest outline-none focus:border-pulse cursor-pointer hover:text-white transition-colors">
                    <option value="Watching" ${item.status === 'Watching' ? 'selected' : ''}>Watching</option>
                    <option value="Plan to Watch" ${item.status === 'Plan to Watch' ? 'selected' : ''}>Plan</option>
                    <option value="Ongoing" ${item.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="Finished" ${item.status === 'Finished' ? 'selected' : ''}>Finished</option>
                    <option value="On Hold" ${item.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                    <option value="Dropped" ${item.status === 'Dropped' ? 'selected' : ''}>Dropped</option>
                </select>
            </div>
        `;

        if (item.status === 'Finished') {
            iconEl.innerHTML = '<i class="fas fa-check-double text-[#22c55e]"></i>';
            iconEl.className = "w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)] shrink-0";
            textEl.innerHTML = `<span class="text-[#22c55e]">Finished</span>`;
            showRatingCard();
        } else {
            iconEl.innerHTML = '<i class="fas fa-play text-pulse"></i>';
            iconEl.className = "w-10 h-10 md:w-12 md:h-12 rounded-full bg-pulse/10 border border-pulse/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,45,85,0.3)] shrink-0";
            textEl.innerHTML = `<span class="text-white">${item.status}</span>`;
            ratingCard.classList.add('hidden');
        }

        // Layout the text/progress side
        textEl.parentElement.innerHTML = `
            <div class="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-0.5">Library Status</div>
            <div id="playerStatusText" class="text-xs md:text-sm font-black uppercase tracking-widest">${textEl.innerHTML}</div>
            ${progressHtml}
        `;

        liquidBg.innerHTML = typeof getLiquidHTML === 'function' ? getLiquidHTML(item) : '';

    } else {
        textEl.parentElement.innerHTML = `
            <div class="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-0.5">Library Status</div>
            <div id="playerStatusText" class="text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest">Uncharted</div>
        `;
        iconEl.innerHTML = '<i class="fas fa-bookmark text-gray-500"></i>';
        iconEl.className = "w-10 h-10 md:w-12 md:h-12 rounded-full bg-dark border border-white/10 flex items-center justify-center shadow-inner shrink-0";
        actionContainer.innerHTML = `<button onclick="togglePlayerLibraryStatus()" class="px-6 py-3 bg-pulse/10 text-pulse border border-pulse/30 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-pulse hover:text-white transition-all shadow-lg flex items-center gap-2"><i class="fas fa-plus"></i> Track</button>`;
        liquidBg.innerHTML = '';
        ratingCard.classList.add('hidden');
    }
}

// Ensure the liquid updates when episodes are manually skipped/changed
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
    initPlayerLibraryState(); // <-- FORCES LIQUID UI TO UPDATE IMMEDIATELY
}

function togglePlayerLibraryStatus() {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    let existingIdx = db.findIndex(i => String(i.id) === String(state.id));

    if (existingIdx === -1 && state.data) {
        // BUG FIX: Actually add the item to the library when the button is clicked
        const newItem = {
            id: state.id, title: state.data.title || state.data.name || '',
            poster: state.data.poster_path || '', type: state.category === 'anime' || state.category === 'kdrama' ? state.category : (state.type === 'tv' ? 'tv' : 'movie'),
            tmdb_type: state.type, status: 'Watching',
            ep: state.type === 'tv' ? state.episode : 0, season: state.type === 'tv' ? state.season : 0,
            max_ep: state.data.number_of_episodes || 1, score: 0, crown: 0,
            imdb: state.data.vote_average || 0, year: (state.data.release_date || state.data.first_air_date || '').split('-')[0],
            genres: (state.data.genres || []).map(g => g.id), added: Date.now(), updatedAt: Date.now()
        };
        db.push(newItem);
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        initPlayerLibraryState(); // Refresh UI
        playerShowNotification("Entity Added to Neural Library!");
    } else {
        // If already tracked, send them to the details modal to edit status/score
        goBackToModal();
    }
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
// ==========================================
// PLAYER SHARING ENGINE
// ==========================================

window.shareCurrentMedia = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    let id, type, s, e;
    const cleanSlug = urlParams.get('v');

    if (cleanSlug) {
        const parsedData = parseCleanUrl(cleanSlug);
        if (parsedData) {
            id = parsedData.id;
            type = parsedData.type;
            s = parsedData.s;
            e = parsedData.e;
        }
    } else {
        // 2. Fallback for old legacy links
        id = urlParams.get('id');
        type = urlParams.get('type');
        s = urlParams.get('s');
        e = urlParams.get('e');

        // 3. Auto-clean the address bar if an old link is used
        if (id && type) {
            // We might not have the title immediately, use 'watch' as a placeholder until metadata loads
            const fallbackSlug = generateCleanUrl('watch', type, id, s, e);
            const newUrl = `${window.location.pathname}?v=${fallbackSlug}`;
            window.history.replaceState({}, '', newUrl); // Changes URL without reloading the page
        }
    }
    // Capture precise current viewing state
    const currentSeason = state.season;
    const currentEp = state.episode;
    const title = document.getElementById('playerTitle')?.innerText || 'video';

    // Direct player deep link
    const rootUrl = window.location.href.split('/pages/')[0] + '/';
    const shareUrl = `${rootUrl}pages/player.html?v=${cleanSlug}`; // Clean URL!

    let epContext = "";
    if (type === 'tv') {
        shareUrl += `&season=${currentSeason}&episode=${currentEp}`;
        epContext = `(S${currentSeason}:E${currentEp})`;
    }

    const richText = `🍿 Come watch *${title}* ${epContext} with me on CinePulse!\n\nJoin the stream here ⬇️\n${shareUrl}`;

    // Uses the same custom UI modal injected into player.html
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
            await navigator.share({ title: `Watching ${title}`, text: richText });
        } catch (err) {
            if (typeof openCustomShare === 'function') openCustomShare("Share Stream", "Transmit Direct Link", shareUrl, richText);
            else { prompt("Copy Link:", shareUrl); }
        }
    } else {
        if (typeof openCustomShare === 'function') openCustomShare("Share Stream", "Transmit Direct Link", shareUrl, richText);
        else { prompt("Copy Link:", shareUrl); }
    }
};
// --- CUSTOM UI SHARE ENGINE ---
function openCustomShare(title, desc, url, richText) {
    const modal = document.getElementById('customShareModal');
    document.getElementById('shareModalTitle').innerText = title;
    document.getElementById('shareModalDesc').innerText = desc;
    document.getElementById('shareModalLink').value = url;

    // Setup Social Quick Links
    const encodedText = encodeURIComponent(richText);
    const socialHtml = `
        <a href="https://wa.me/?text=${encodedText}" target="_blank" class="flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all">
            <i class="fab fa-whatsapp text-sm"></i> WhatsApp
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodedText}" target="_blank" class="flex items-center justify-center gap-2 py-3 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1DA1F2] hover:text-white transition-all">
            <i class="fab fa-twitter text-sm"></i> X / Twitter
        </a>
    `;
    document.getElementById('shareSocialButtons').innerHTML = socialHtml;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

window.closeCustomShare = function () {
    const modal = document.getElementById('customShareModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
    // Reset copy icon
    document.getElementById('shareCopyIcon').className = 'fas fa-copy';
}

window.copyCustomShareLink = function () {
    const linkInput = document.getElementById('shareModalLink');
    linkInput.select();
    navigator.clipboard.writeText(linkInput.value).then(() => {
        const icon = document.getElementById('shareCopyIcon');
        icon.className = 'fas fa-check text-white';
        showNotification("Link secured to clipboard!");
        setTimeout(() => { icon.className = 'fas fa-copy'; }, 2000);
    });
}
// --- DEDICATED WATCH HISTORY ENGINE ---
function trackWatchHistory(itemDetails, season = null, episode = null) {
    // 1. Pull the dedicated history array (NOT the main library db)
    let history = JSON.parse(localStorage.getItem('sumi_history') || '[]');

    // 2. Remove the item if it already exists so we can push it to the front
    history = history.filter(i => i.id !== itemDetails.id);

    // 3. Add to the front of the array with timestamp and progress
    history.unshift({
        id: itemDetails.id,
        type: itemDetails.media_type || (itemDetails.name ? 'tv' : 'movie'),
        title: itemDetails.title || itemDetails.name,
        poster_path: itemDetails.poster_path,
        watched_at: Date.now(),
        last_season: season,
        last_episode: episode
    });

    // 4. Cap the history at 30 items so it doesn't bloat local storage
    if (history.length > 30) history.pop();

    // 5. Save it back
    localStorage.setItem('sumi_history', JSON.stringify(history));
}
initPlayer();