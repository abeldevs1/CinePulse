  const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
        const BASE = 'https://api.themoviedb.org/3';
        const IMG = 'https://image.tmdb.org/t/p/w500';
        const IMG_HD = 'https://image.tmdb.org/t/p/original';
        const GENRE_MAP = {
            28: [28, 10759],       // Action <-> Action & Adventure
            12: [12, 10759],       // Adventure <-> Action & Adventure
            10759: [10759, 28, 12],
            878: [878, 10765],     // Science Fiction <-> Sci-Fi & Fantasy
            14: [14, 10765],       // Fantasy <-> Sci-Fi & Fantasy
            10765: [10765, 878, 14],
            10752: [10752, 10768], // War <-> War & Politics
            10768: [10768, 10752]
        };
       // --- NETWORK LOADER LOGIC ---
function showLoader() {
    let el = document.getElementById('globalLoader');
    if(!el) {
        el = document.createElement('div');
        el.id = 'globalLoader';
        document.body.appendChild(el);
    }
    el.style.opacity = '1';
    el.style.width = '30%';
    setTimeout(() => { if(el.style.opacity === '1') el.style.width = '70%'; }, 200);
}

function hideLoader() {
    const el = document.getElementById('globalLoader');
    if(el) {
        el.style.width = '100%';
        setTimeout(() => { 
            el.style.opacity = '0'; 
            setTimeout(() => { el.style.width = '0%'; }, 300); 
        }, 250);
    }
}

// Intercept fetchAPI to trigger the loader automatically
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    showLoader();
    try {
        const response = await originalFetch(...args);
        hideLoader();
        return response;
    } catch (error) {
        hideLoader();
        throw error;
    }
};
        let discoverPage = 1;
        let currentPersonCredits = [];
        let personDisplayLimit = 8;
        let notifications = JSON.parse(localStorage.getItem('cp_elite_notifs')) || [];
let archivedNotifs = JSON.parse(localStorage.getItem('cp_elite_notifs_archived')) || [];
let currentNotifTab = 'recent';

let prefs = JSON.parse(localStorage.getItem('cp_elite_prefs')) || {
    listIsGrid: true,
    labIsGrid: true,
    searchLayout: 'grid-cols-4'
};

let currentSearchLayout = prefs.searchLayout;
       let state = {
            hero: [],
            heroIdx: 0,
            db: JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [],
            genres: [],
            isGrid: prefs.listIsGrid,        // Loaded from Prefs
            labIsGrid: prefs.labIsGrid,
            active: null,
            view: 'home',
            searchParams: { q: '', y: '', g: '', s: 'popularity.desc' },
            searchMode: 'trending', // 'trending', 'actor', 'filter', 'search'
            actorCredits: [],
            actorPage: 1,
            filterPage: 1,
            recPage: 1,
            listFilters: { type: 'all', genres: [] },
            labFilters: { type: 'all', genres: [] },
            listExpanded: {},
            listSearchQuery: '', 
            labSearchQuery: '',  
            listSort: 'newest', 
            labSort: 'newest',  
            discoverFilters: { type: 'all', genres: [] },
            discoverDataRaw: [],
            modalHistory: [],
            mpTab: 'crowned',
            mpLimit: 25,
            mpFilter: 'all', 
            
            
        };


// --- CLEANUP ENGINE (Runs on load) ---
function cleanNotifications() {
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // Auto-clear after 7 days
    
    // Filter old ones, then slice to strictly limit to 30 items
    notifications = notifications.filter(n => (now - (n.date || now)) < SEVEN_DAYS_MS).slice(0, 30);
    archivedNotifs = archivedNotifs.filter(n => (now - (n.date || now)) < SEVEN_DAYS_MS).slice(0, 30);
    
    saveNotifs();
}
cleanNotifications(); // Run immediately
        // Initialize App
async function init() {
    
    try {
        // Clear preloader
        setTimeout(() => {
            document.getElementById('preloader').style.opacity = '0';
            setTimeout(() => document.getElementById('preloader').style.display = 'none', 800);
        }, 2000);

        const [trending, tv, anime, kdrama, turkish, mGenres, tGenres] = await Promise.all([
            fetchAPI('/trending/all/week'),
            fetchAPI('/discover/tv?sort_by=popularity.desc&with_original_language=en'),
            fetchAPI('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc'),
            fetchAPI('/discover/tv?with_original_language=ko&sort_by=popularity.desc'),
            fetchAPI('/discover/tv?with_original_language=tr&sort_by=popularity.desc'),
            fetchAPI('/genre/movie/list'), // Movie Genres
            fetchAPI('/genre/tv/list')     // TV Genres
            
        ]);

        state.hero = trending.results.filter(i => i.backdrop_path).slice(0, 5);
        
        // Merge and remove duplicate genres seamlessly
        const allGenres = [...mGenres.genres, ...tGenres.genres];
        state.genres = Array.from(new Map(allGenres.map(g => [g.id, g])).values());
                
                renderHero();
                renderRow('row-movies', trending.results.filter(i => i.media_type === 'movie'), 'movie');
                renderRow('row-tv', tv.results, 'tv');
                renderRow('row-anime', anime.results, 'tv');
                renderRow('row-kdrama', kdrama.results, 'tv');
                renderRow('row-turkish', turkish.results, 'tv');
                
                setupFilters();
                updateCounters();
                startClock();
                setupSearchBehavior();
                setupStarLogic();
                initNeuralEngine();
                renderSources();
                setupLongPressCopy();
                setInterval(nextHero, 10000);
            } catch (e) { console.error("Neural init error", e); 
                
       
            }
        }

        async function fetchAPI(path) {
            const res = await fetch(`${BASE}${path}${path.includes('?')?'&':'?'}api_key=${API_KEY}`);
            return res.json();
        }

        // Navigation
function navigate(view) {
    showLoader(); // Trigger Loader
    state.view = view;
    document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.getElementById('pathLabel').innerText = view.toUpperCase();
    
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.onclick.toString().includes(view));
    if(btn) btn.classList.add('active');

    if(view === 'mylist') renderList();
    if(view === 'rhythmlab') runLab();
    if(view === 'sync') renderSync();
    if(view === 'masterpieces') renderMasterpieces();
    if(view === 'search') {
        const input = document.getElementById('mainSearch');
        const header = document.getElementById('searchHeader');
        if (!input.value && !header.innerText.includes('• Works')) {
            header.innerText = "Discover";
            loadDiscoverContent();
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(hideLoader, 300); // Hide after transition
}
        

        // Search Behavior
// --- UPDATED SEARCH & MODAL LOGIC ---
function setupSearchBehavior() {
    const input = document.getElementById('mainSearch');
    const bar = document.getElementById('searchBar');
    const drop = document.getElementById('searchDrop');
    const clearBtn = document.getElementById('clearSearch');
    
    let searchTimeout; // Neural debounce timer
    let hoverTimeout;  // Mouse leave delay
    let idleTimeout;   // Inactivity auto-clear timer

    // --- Idle Auto-Clear Engine ---
    const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        if (input.value.trim()) {
            idleTimeout = setTimeout(() => {
                input.value = '';
                clearBtn.classList.add('hidden');
                drop.classList.add('hidden');
                bar.classList.remove('active');
                input.blur();
            }, 15000); // Clears if away for 15 seconds
        }
    };

    input.onfocus = () => {
        bar.classList.add('active');
        if (state.view !== 'search' && input.value.trim()) drop.classList.remove('hidden');
        resetIdleTimer();
    };

    // --- Hover In & Out Logic ---
    bar.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            drop.classList.add('hidden');
            bar.classList.remove('active');
        }, 400); // 400ms grace period to move mouse to dropdown
    });

    bar.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        if (input.value.trim() && state.view !== 'search') {
            drop.classList.remove('hidden');
            bar.classList.add('active');
        }
        resetIdleTimer();
    });

    // --- Handle Enter Key (Search & Clear) ---
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = input.value.trim();
            if (q) {
                drop.classList.add('hidden');
                bar.classList.remove('active');
                input.blur(); 
                navigate('search');
                deepSearch(q);
                
                // Instantly auto-clear the input after execution
                input.value = '';
                clearBtn.classList.add('hidden');
                clearTimeout(idleTimeout);
            }
        }
    };

    clearBtn.onclick = (e) => {
        e.stopPropagation();
        input.value = '';
        clearBtn.classList.add('hidden');
        drop.classList.add('hidden');
        
        if (state.view === 'search') {
            document.getElementById('searchHeader').innerText = "Discover";
            loadDiscoverContent();
        }
        input.focus();
        clearTimeout(idleTimeout);
    };

    input.oninput = (e) => {
        const q = e.target.value.trim();
        clearBtn.classList.toggle('hidden', !q);
        
        clearTimeout(searchTimeout); 
        resetIdleTimer();

        if (state.view === 'search') {
            drop.classList.add('hidden');
            searchTimeout = setTimeout(() => {
                deepSearch(q); 
            }, 500); 
        } else {
            if(!q) { drop.classList.add('hidden'); return; }
            searchTimeout = setTimeout(async () => {
                const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false`);
                renderDrop(data.results.slice(0, 8), q); 
            }, 300);
        }
    };
    
    // Close dropdown when clicking strictly outside
    document.addEventListener('click', (e) => {
        if (!bar.contains(e.target) && e.target.id !== 'clearSearch') {
            drop.classList.add('hidden');
            bar.classList.remove('active');
        }
    });
}
 




function resetSearchMode() {
    state.searchMode = 'trending';
    document.getElementById('discoverLoadContainer').classList.remove('hidden');
}


async function openPersonModal(id) {
    document.getElementById('searchDrop').classList.add('hidden');
    const [person, credits] = await Promise.all([
        fetchAPI(`/person/${id}`),
        fetchAPI(`/person/${id}/combined_credits`)
    ]);

    // Reset and Filter Credits
    personDisplayLimit = 8;
    currentPersonCredits = credits.cast
        .filter(c => c.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    document.getElementById('pProfileImg').src = person.profile_path ? IMG_HD + person.profile_path : 'https://via.placeholder.com/500x800';
    document.getElementById('pName').innerText = person.name;
   document.getElementById('pRole').innerHTML = `
        ${person.known_for_department || 'Artist'} 
        <a href="https://www.google.com/search?q=${encodeURIComponent(person.name)}" target="_blank" onclick="event.stopPropagation()"
           class="inline-flex items-center justify-center gap-2 ml-4 px-4 py-2 bg-white/5 hover:bg-pulse border border-white/10 rounded-full text-[9px] text-white transition-all shadow-lg">
            <i class="fab fa-google"></i> Search Web
        </a>
    `;  
    document.getElementById('pBio').innerText = person.biography || "Neural records for this individual are currently encrypted.";
    
    renderPersonWorks();

    document.getElementById('personModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Activate Load More Button
    const lmBtn = document.getElementById('btnPersonLoadMore');
    lmBtn.onclick = () => {
        personDisplayLimit += 8;
        renderPersonWorks();
    };
   
}
 
function renderPersonWorks() {
    const container = document.getElementById('pWorks');
    const loadMoreBox = document.getElementById('pWorksLoadContainer');
    
    const items = currentPersonCredits.slice(0, personDisplayLimit);
    
    container.innerHTML = items.map(w => `
        <div class="group cursor-pointer" onclick="closePersonModal(); openModal(${w.id}, '${w.media_type || 'movie'}')">
            <div class="aspect-[2/3] rounded-2xl overflow-hidden mb-3 border border-white/5 group-hover:border-pulse transition-all">
                <img src="${IMG + w.poster_path}" class="w-full h-full object-cover">
            </div>
            <div class="text-[9px] font-black uppercase line-clamp-1 group-hover:text-pulse">${w.title || w.name}</div>
        </div>
    `).join('');

    // Show button only if there are more items to load
    loadMoreBox.classList.toggle('hidden', personDisplayLimit >= currentPersonCredits.length);
}

function closePersonModal() {
    document.getElementById('personModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}
    
// Add 'query' as the second parameter
function renderDrop(res, query) { 
    const drop = document.getElementById('searchDrop');
    if(!res.length) { drop.classList.add('hidden'); return; }
    drop.classList.remove('hidden');
    
    let html = res.slice(0, 5).map(i => {
        const isPerson = i.media_type === 'person';
        const img = isPerson ? i.profile_path : i.poster_path;
        const call = isPerson ? `openActor(${i.id}, '${i.name.replace(/'/g, "\\'")}')` : `openModal(${i.id}, '${i.media_type}')`;
        
        return `
            <div onmousedown="${call}" 
                 class="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-all active:bg-pulse/20">
                <img src="${img ? IMG+img : 'https://via.placeholder.com/50'}" class="w-10 h-14 rounded-xl object-cover shadow-lg">
                <div>
                    <div class="text-[10px] font-black uppercase text-white">${i.title || i.name}</div>
                    <div class="text-[8px] text-gray-500 font-bold uppercase mt-1">
                        ${isPerson ? 'Artist' : (i.media_type + ' • ' + (i.release_date || i.first_air_date || '').split('-')[0])}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Append the Show More button at the bottom
    html += `
        <div onmousedown="navigate('search'); deepSearch('${query.replace(/'/g, "\\'")}')" 
             class="p-4 text-center bg-pulse/10 hover:bg-pulse text-pulse hover:text-white cursor-pointer transition-all border-t border-white/5 flex items-center justify-center gap-2 group">
            <span class="text-[10px] font-black uppercase tracking-widest">Show all results for "${query}"</span>
            <i class="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
        </div>
    `;
    
    drop.innerHTML = html;
}



// Updated deepSearch to handle "all results" and spelling 
async function deepSearch(q) {
    if (state.view !== 'search') navigate('search');
    
    const grid = document.getElementById('searchGrid');
    const header = document.getElementById('searchHeader');
    const loadBtn = document.getElementById('discoverLoadContainer');
    const actorBanner = document.getElementById('actorProfileBanner');
    
    // Instantly hide actor banner on new search
    actorBanner.classList.add('hidden');
    
    if (!q) {
        loadDiscoverContent();
        return;
    }

    state.searchMode = 'search';
    header.innerText = `Results: ${q}`;
    loadBtn.classList.add('hidden'); // Hide load more for raw search results
    grid.innerHTML = '<div class="page-loader"></div>';
    
    const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false`);
    
    if(!data.results || data.results.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-gray-600 font-black uppercase italic tracking-[0.5em]">No Neural Matches Found</div>`;
        return;
    }
state.discoverDataRaw = data.results;
applyDiscoverLocalFilters();
    renderGrid('searchGrid', data.results, false, true);
    applyLayoutToGrid();
}

async function applySearchFilters(append = false) {
    const actorBanner = document.getElementById('actorProfileBanner');
    const loadBtn = document.getElementById('discoverLoadContainer');
    
    if (!append) {
        state.searchMode = 'filter';
        state.filterPage = 1;
        actorBanner.classList.add('hidden'); // Hide banner
        document.getElementById('searchGrid').innerHTML = '<div class="page-loader"></div>';
        document.getElementById('searchHeader').innerText = "Filtered Results";
    }
    
    const year = document.getElementById('searchYear').value;
    const genre = document.getElementById('searchGenre').value;
    const sort = document.getElementById('searchSort').value;
    
    let path = `/discover/movie?sort_by=${sort}&page=${state.filterPage}`;
    if(year) path += `&primary_release_year=${year}`;
    if(genre) path += `&with_genres=${genre}`;
    
    const data = await fetchAPI(path);
    renderGrid('searchGrid', data.results, 'movie', !append);
    applyLayoutToGrid();
    
    if (data.page < data.total_pages) loadBtn.classList.remove('hidden');
    else loadBtn.classList.add('hidden');
}

        // Hero Slider
        function renderHero() {
            const slider = document.getElementById('heroSlider');
            slider.innerHTML = state.hero.map((item, i) => `
                <div class="hero-item absolute inset-0 transition-opacity duration-1000 ${i === 0 ? 'opacity-100' : 'opacity-0'}">
                    <img src="${IMG_HD + item.backdrop_path}" class="w-full h-full object-cover ">
                </div>
            `).join('');
            updateHeroContent();
        }

        function updateHeroContent() {
            const item = state.hero[state.heroIdx];
            const title = item.title || item.name;
            const hTitle = document.getElementById('heroTitle');
            
            // Liquid Glass Resizing Logic
            hTitle.innerText = title;
            const length = title.length;
            let size = 5; // Default 5rem
            if (length > 25) size = 3;
            else if (length > 15) size = 4;
            else if (length < 8) size = 7;
            
            // Adjust for mobile viewports
            if (window.innerWidth < 768) size = size * 0.6;
            
            hTitle.style.setProperty('--title-size', `${size}rem`);
            
            document.getElementById('heroInfoBtn').onclick = () => openModal(item.id, item.media_type);
            
            // Fetch trailer for hero
            fetchAPI(`/${item.media_type}/${item.id}/videos`).then(v => {
                const tr = v.results.find(x => x.type === 'Trailer');
                document.getElementById('heroTrailerBtn').onclick = () => tr ? window.open(`https://youtube.com/watch?v=${tr.key}`) : null;
            });
        }

        function nextHero() {
            const items = document.querySelectorAll('.hero-item');
            items[state.heroIdx].classList.replace('opacity-100', 'opacity-0');
            state.heroIdx = (state.heroIdx + 1) % state.hero.length;
            items[state.heroIdx].classList.replace('opacity-0', 'opacity-100');
            updateHeroContent();
        }

        // Modal Logic
      async function openModal(id, type, isBack = false) {
    // History Tracking
    if (!isBack && state.active) {
        state.modalHistory.push({ id: state.active.id, type: state.active.media_type });
    }
    document.getElementById('mBackBtn').classList.toggle('hidden', state.modalHistory.length === 0);

    const [details, credits, vids] = await Promise.all([
        fetchAPI(`/${type}/${id}`),
        fetchAPI(`/${type}/${id}/credits`),
        fetchAPI(`/${type}/${id}/videos`)
    ]);

    state.active = { ...details, media_type: type };
    const local = state.db.find(i => i.id === id);

    document.getElementById('mBackdrop').src = IMG_HD + (details.backdrop_path || details.poster_path);
    document.getElementById('mTitle').innerText = (details.title || details.name);
    document.getElementById('mOverview').innerText = details.overview || "Narrative archive encrypted.";
    document.getElementById('mYear').innerText = (details.release_date || details.first_air_date || '----').split('-')[0];
    document.getElementById('mRating').innerHTML = `<i class="fas fa-star text-pulse"></i> ${details.vote_average?.toFixed(1) || '0.0'}`;
    
    document.getElementById('mGenres').innerHTML = (details.genres || []).map(g => `
        <span class="text-[9px] font-black uppercase border border-white/10 px-4 py-2 rounded-full text-gray-400">${g.name}</span>
    `).join('');

    document.getElementById('mCast').innerHTML = (credits.cast || []).slice(0, 10).map(c => `
        <div class="flex-none w-24 text-center group cursor-pointer" onclick="openActor(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
            <img src="${c.profile_path ? IMG + c.profile_path : 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-transparent group-hover:border-pulse transition-all">
            <div class="text-[9px] font-black uppercase line-clamp-1">${c.name}</div>
            <div class="text-[7px] text-gray-500 font-bold mt-1 line-clamp-1">${c.character}</div>
        </div>
    `).join('');

    const tr = vids.results.find(v => v.type === 'Trailer');
    document.getElementById('mTrailerBtn').onclick = () => tr ? window.open(`https://youtube.com/watch?v=${tr.key}`) : null;

    document.getElementById('mStatus').value = local ? local.status : '';
    document.getElementById('mProgressBox').classList.toggle('hidden', type !== 'tv' || !local);
    
    if(type === 'tv' && local) {
        const total = details.number_of_episodes || 1;
        document.getElementById('mEpRange').max = total;
        document.getElementById('mEpRange').value = local.ep || 0;
        updateEpUI(local.ep || 0, total);
    }
    if(type === 'tv' && local) {
    const total = details.number_of_episodes || 1;
    document.getElementById('mEpRange').max = total;
    document.getElementById('mEpRange').value = local.ep || 0;
    
    // Process Seasons
    state.activeSeasons = (details.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
    let cumulative = 0;
    state.activeSeasons.forEach(s => {
        s.startEp = cumulative;
        cumulative += s.episode_count;
        s.endEp = cumulative;
    });
    
    updateEpUI(local.ep || 0, total);
    renderSeasonsUI(); // Initialize season bubbles
}

    updateRatingCard(local);

    document.getElementById('mRemoveBtn').classList.toggle('hidden', !local);
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    state.recPage = 1;
    loadModalRecommendations(id, type, state.recPage, false);
}

        function updateRatingCard(local) {
            const card = document.getElementById('mRatingCard');
            if(local && local.status === 'Finished') {
                card.classList.remove('hidden');
                setStars(local.score || 0);
                document.getElementById('mCrownSelect').value = local.crown || 0;
            } else {
                card.classList.add('hidden');
            }
        }

        function setupStarLogic() {
            const stars = document.querySelectorAll('#starRating i');
            stars.forEach(s => {
                s.onclick = () => {
                    const val = parseInt(s.dataset.val);
                    const idx = state.db.findIndex(i => i.id === state.active.id);
                    if(idx !== -1) {
                        state.db[idx].score = val;
                        save();
                        setStars(val);
                    }
                };
            });
        }

        function setStars(n) {
            document.querySelectorAll('#starRating i').forEach((s, i) => {
                s.className = i < n ? 'fas fa-star active' : 'far fa-star';
            });
        }

function updateStatus() {
    const status = document.getElementById('mStatus').value;
    if(!status) return;
    
    const item = state.active;
    let existing = state.db.find(i => i.id === item.id);

    if(existing) {
        existing.status = status;
    } else {
        let cat = determineCategory(item);
        existing = {
            id: item.id,
            title: item.title || item.name,
            poster: item.poster_path,
            type: cat,
            status: status,
            ep: 0,
            max_ep: item.number_of_episodes || 1,
            score: 0,
            crown: 0,
            imdb: item.vote_average,
            year: (item.release_date || item.first_air_date || '').split('-')[0],
            genres: (item.genres || []).map(g => g.id),
            added: Date.now()
        };
        state.db.push(existing);
    }
    
    save(); // Persists to localStorage
    updateRatingCard(existing); // Instantly shows the rating/crown card if "Finished"
    
    // NEW: Dynamically reveal the Episode Tracker and Remove Button instantly
    document.getElementById('mRemoveBtn').classList.remove('hidden');
    
    if (existing.type !== 'movie') {
        document.getElementById('mProgressBox').classList.remove('hidden');
        const total = item.number_of_episodes || 1;
        document.getElementById('mEpRange').max = total;
        document.getElementById('mEpRange').value = existing.ep || 0;
        updateEpUI(existing.ep || 0, total);
    } else {
        document.getElementById('mProgressBox').classList.add('hidden');
    }
}
        // List Rendering with Hierarchy
        function toggleListView() {
            state.isGrid = !state.isGrid;
            document.getElementById('viewToggle').innerHTML = state.isGrid ? '<i class="fas fa-list"></i>' : '<i class="fas fa-th-large"></i>';
            renderList();
            savePrefs();
        }
function toggleSectionExpand(status) {
    state.listExpanded[status] = !state.listExpanded[status];
    renderList();
}

function renderList() {
    const container = document.getElementById('listContainer');
    const order = ['Watching', 'Ongoing', 'Plan to Watch', 'On Hold', 'Finished', 'Dropped'];
    const limit = window.innerWidth < 768 ? 4 : (window.innerWidth < 1280 ? 5 : 6); 

    const html = order.map(status => {
        let items = state.db.filter(i => i.status === status);
        if (state.listSearchQuery) items = items.filter(i => isSmartMatch(i.title, state.listSearchQuery));
        if (state.listFilters.type !== 'all') items = items.filter(i => i.type === state.listFilters.type);
        if (state.listFilters.genres.length > 0) items = items.filter(i => state.listFilters.genres.every(g => (GENRE_MAP[g] || [g]).some(id => i.genres.includes(id))));
        
        if(!items.length) return '';
        items.sort((a, b) => state.listSort === 'newest' ? b.added - a.added : a.added - b.added);
        const isExpanded = state.listExpanded[status];
        const displayItems = isExpanded ? items : items.slice(0, limit);

        return `
            <section class="animate-in fade-in duration-500">
                <div class="lib-section-title">
                    ${status} <span class="text-white bg-pulse px-4 py-1.5 rounded-full text-[11px] shadow-lg shadow-pulse/40 ml-2">${items.length}</span>
                </div>
                <div class="${state.isGrid ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : 'flex flex-col gap-4'}">
                    ${displayItems.map(i => state.isGrid ? `
                        <div class="group cursor-pointer" onclick="openModal(${i.id}, '${i.type === 'movie' ? 'movie' : 'tv'}')">
                        <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                            <img src="${IMG+i.poster}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                            
                            ${getPlayHoverHTML(i)}
                            ${getLiquidHTML(i)}
                        </div>
                        <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
                        <div class="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-widest">${i.type} • ★ ${parseFloat(i.imdb).toFixed(1)}</div>
                    </div>
                    ` : `
                       <div class="lib-card-row cursor-pointer group" onclick="openModal(${i.id}, '${i.type === 'movie' ? 'movie' : 'tv'}')">
                        <div class="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-pulse/50 transition-all">
                            <img src="${IMG+i.poster}" class="w-full h-full object-cover">
                            
                            ${getPlayHoverHTML(i)}
                            ${getLiquidHTML(i)}
                        </div>
                            <div class="flex-1 ml-4">
                                <div class="text-[14px] md:text-[16px] font-black uppercase italic group-hover:text-pulse transition-colors">${i.title}</div>
                                <div class="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-3">
                                    <span class="bg-white/5 px-2 py-1 rounded-md">${i.type}</span> 
                                    <span>${i.year}</span>
                                </div>
                            </div>
                            <div class="stats text-right shrink-0">
                                <div class="text-[12px] font-black text-pulse">★ ${parseFloat(i.imdb).toFixed(1)}</div>
                                <div class="text-[9px] font-bold text-gray-600 mt-2 uppercase">My Score: ${i.score ? i.score + '/5' : '-'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${items.length > limit ? `
                <div class="mt-10 flex justify-center">
                    <button onclick="toggleSectionExpand('${status}')" class="px-10 py-4 bg-pulse/10 border border-pulse/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-pulse hover:bg-pulse hover:text-white transition-all shadow-xl hover:shadow-pulse/40">
                        ${isExpanded ? 'Collapse Neural Data <i class="fas fa-chevron-up ml-2"></i>' : `Show All Records (${items.length}) <i class="fas fa-chevron-down ml-2"></i>`}
                    </button>
                </div>
                ` : ''}
            </section>
        `;
    }).join('');

    container.innerHTML = html || `
        <div class="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <i class="fas fa-filter text-6xl mb-6 text-gray-700"></i>
            <h3 class="text-xl font-black uppercase tracking-widest text-white mb-2 italic">No Records Found</h3>
            <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Adjust your neural filters.</p>
        </div>
    `;
}

// Make sure the limits recalculate beautifully when users rotate their phone or resize the browser
window.addEventListener('resize', () => {
    if (state.view === 'mylist') renderList();
});
        function backdropClose(e) {
            if (e.target.id === "pickerModal") {
             closePicker();
                }
        }
        // Lab Engine
// Lab Engine
function runLab() {
    const status = document.getElementById('labStatus').value;
    const year = document.getElementById('labYear').value;
    const imdb = document.getElementById('labImdb').value;
    const pers = document.getElementById('labPersonal').value;

    let filtered = state.db.filter(i => {
        let sMatch = status === 'all' || i.status === status;
        let yMatch = year === 'all' || i.year === year;
        let iMatch = imdb === 'all' || i.imdb >= parseFloat(imdb);
        let pMatch = pers === 'all' || (i.score >= parseInt(pers));
        let typeMatch = state.labFilters.type === 'all' || i.type === state.labFilters.type;
        let genreMatch = state.labFilters.genres.length === 0 || state.labFilters.genres.every(g => (GENRE_MAP[g] || [g]).some(id => i.genres.includes(id)));
        let qMatch = !state.labSearchQuery || isSmartMatch(i.title, state.labSearchQuery);
        return sMatch && yMatch && iMatch && pMatch && typeMatch && genreMatch && qMatch;
    });

    const labGrid = document.getElementById('labGrid');
    labGrid.className = state.labIsGrid ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6' : 'flex flex-col gap-4';
    filtered.sort((a, b) => state.labSort === 'newest' ? b.added - a.added : a.added - b.added);
    document.getElementById('labCount').innerText = filtered.length;

    labGrid.innerHTML = filtered.map(item => state.labIsGrid ? `
        <div class="group cursor-pointer relative" onclick="openModal(${item.id}, '${item.type === 'movie' ? 'movie' : 'tv'}')">
        <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-3 border-t-4 border-${item.type} group-hover:scale-105 transition-all shadow-xl relative">
            <img src="${IMG+item.poster}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10"></div>
            
            <div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-${item.type} border border-white/10 z-30">
                ${item.type}
            </div>
            
            <div class="absolute bottom-3 left-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-white border border-white/10 z-30">
                ${item.status}
            </div>

            ${getPlayHoverHTML(item)}

            ${getLiquidHTML(item)}
        </div>
        <div class="text-[9px] font-black uppercase line-clamp-1">${item.title}</div>
    </div>
        ` : `
        <div class="lib-card-row cursor-pointer group" onclick="openModal(${item.id}, '${item.type === 'movie' ? 'movie' : 'tv'}')">
            <div class="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-pulse/50 transition-all">
                <img src="${IMG+item.poster}" class="w-full h-full object-cover">
                ${getLiquidHTML(item)}
            </div>
            <div class="flex-1 ml-4">
                <div class="text-[14px] md:text-[16px] font-black uppercase italic group-hover:text-pulse transition-colors">${item.title}</div>
                <div class="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-3">
                    <span class="bg-white/5 px-2 py-1 rounded-md">${item.type}</span> 
                    <span>${item.year}</span>
                </div>
            </div>
            <div class="stats text-right shrink-0">
                <div class="text-[12px] font-black text-pulse">★ ${parseFloat(item.imdb).toFixed(1)}</div>
                <div class="text-[9px] font-bold text-gray-600 mt-2 uppercase">My Score: ${item.score ? item.score + '/5' : '-'}</div>
            </div>
        </div>
    `).join('');
    
    updateCounters();
}

        // Sync Engine Logic
        async function renderSync() {
    const container = document.getElementById('syncContainer');
    container.innerHTML = '<div class="col-span-full py-20 text-center text-pulse text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing Neural Sync...</div>';

    const types = ['movie', 'tv', 'anime', 'kdrama', 'turkish'];
    let sectionsHTML = [];
    
    // FEATURE 1: Neural Exclusion (Get a Set of IDs the user already has)
    let dbIds = new Set(state.db.map(i => i.id)); 

    // Calculate Neural Match % based on user's highest rated genres
    const calculateMatch = (itemGenres) => {
        if (!itemGenres || !itemGenres.length) return Math.floor(Math.random() * 20) + 70; // fallback
        const userGenres = state.db.filter(i => i.score >= 4).flatMap(i => i.genres);
        if (!userGenres.length) return Math.floor(Math.random() * 20) + 70;
        
        let matches = itemGenres.filter(g => userGenres.includes(g)).length;
        let pct = Math.min(99, 60 + (matches * 15) + Math.floor(Math.random() * 10));
        return pct;
    };

    for (let type of types) {
        // FEATURE 2: Elite Seeding (Only seed from items scored 4+ or currently watching)
        const anchors = state.db.filter(i => i.type === type && (i.score >= 4 || i.status === 'Watching'));
        if(!anchors.length) continue;
        
        const seed = anchors[Math.floor(Math.random() * anchors.length)];
        const apiType = (type === 'movie' ? 'movie' : 'tv');
        const data = await fetchAPI(`/${apiType}/${seed.id}/recommendations`);
        
        // Apply Neural Exclusion
        let recommendations = data.results.filter(i => !dbIds.has(i.id));
        if (recommendations.length === 0) continue; 

        // FEATURE 3: Context UI Text
        let contextText = seed.crown > 0 ? `Because you crowned 👑 ${seed.title}` :
                          seed.score >= 4 ? `Because you rated ${seed.title} ★ ${seed.score}/5` :
                          `Since you are watching ${seed.title}`;

        let rowHtml = `
            <section class="animate-in fade-in duration-500">
                <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 italic flex items-center gap-4">
                    <span class="w-2 h-2 bg-pulse rounded-full shadow-[0_0_10px_#ff2d55]"></span>
                    ${contextText} <div class="h-px flex-1 bg-white/5"></div>
                </h3>
                <div class="flex gap-8 overflow-x-auto hide-scroll pb-6">
                    ${recommendations.slice(0, 10).map(i => {
                        // FEATURE 4: Neural Match Percentages
                        let matchPct = calculateMatch(i.genre_ids);
                        let matchColor = matchPct >= 90 ? 'text-[#22c55e]' : matchPct >= 80 ? 'text-[#f59e0b]' : 'text-pulse';
                        
                        return `
                        <div class="flex-none w-44 group cursor-pointer relative" onclick="openModal(${i.id}, '${apiType}')">
                            <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                                <img src="${IMG+i.poster_path}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10 opacity-80"></div>
                                
                                <div class="absolute top-3 left-3 bg-dark/80 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black uppercase border border-white/10 z-30 flex items-center gap-1 ${matchColor}">
                                    <i class="fas fa-brain"></i> ${matchPct}% Match
                                </div>
                                
                                ${getPlayHoverHTML({...i, type: type})}
                            </div>
                            <div class="text-[9px] font-black uppercase line-clamp-1">${i.title || i.name}</div>
                        </div>
                    `}).join('')}
                </div>
            </section>
        `;
        sectionsHTML.push(rowHtml);
    }

    // FEATURE 5: The "Sync Engine Mix" (Advanced Intersection)
    if (state.db.length > 5) {
        let allGenres = state.db.filter(i => i.score >= 4).flatMap(i => i.genres);
        let counts = {};
        allGenres.forEach(g => counts[g] = (counts[g] || 0) + 1);
        let topGenres = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0, 3);
        
        if (topGenres.length >= 2) {
            const mixData = await fetchAPI(`/discover/movie?with_genres=${topGenres.join(',')}&sort_by=vote_average.desc&vote_count.gte=500`);
            let mixRecs = mixData.results.filter(i => !dbIds.has(i.id)).slice(0, 10);
            
            if (mixRecs.length > 0) {
                sectionsHTML.push(`
                    <section class="animate-in fade-in duration-500">
                        <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-pulse mb-8 italic flex items-center gap-4">
                            <i class="fas fa-dna"></i> Neural Intersection Mix <div class="h-px flex-1 bg-white/5 shadow-[0_0_10px_#ff2d55]"></div>
                        </h3>
                        <div class="flex gap-8 overflow-x-auto hide-scroll pb-6">
                            ${mixRecs.map(i => `
                                <div class="flex-none w-44 group cursor-pointer relative" onclick="openModal(${i.id}, 'movie')">
                                    <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-4 border border-pulse/30 shadow-[0_0_20px_rgba(255,45,85,0.15)] group-hover:border-pulse transition-all relative">
                                        <img src="${IMG+i.poster_path}" class="w-full h-full object-cover">
                                        <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10"></div>
                                        <div class="absolute top-3 left-3 bg-pulse/20 text-pulse px-2 py-1 rounded-md text-[8px] font-black uppercase border border-pulse/30 z-30">
                                            99% Match
                                        </div>
                                        ${getPlayHoverHTML({...i, type: 'movie'})}
                                    </div>
                                    <div class="text-[9px] font-black uppercase line-clamp-1">${i.title || i.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `);
            }
        }
    }

    container.innerHTML = sectionsHTML.join('') || `<div class="text-center py-20 text-gray-700 font-black uppercase tracking-widest italic">Insufficient elite data for synchronization. Add highly rated shows to seed the engine.</div>`;
}

        // Global Helpers
        // --- COUNTER INTERACTIVITY & CATEGORY ENGINE ---

        let clickTimer = null; // Used to distinguish single vs double clicks

        function updateCounters() {
            const types = ['all', 'movie', 'tv', 'anime', 'kdrama', 'turkish'];
            const html = types.map(t => {
                const count = t === 'all' ? state.db.length : state.db.filter(i => i.type === t).length;
                const label = t === 'all' ? 'All Data' : t;
                const border = t === 'all' ? 'pulse' : t;
                
                return `
                    <div class="bg-white/5 border border-white/10 p-6 rounded-3xl border-t-4 border-${border} shadow-xl cursor-pointer hover:bg-white/10 hover:-translate-y-1 transition-all select-none" 
                         onclick="handleCounterClick(event, '${t}')">
                        <div class="text-[9px] font-black text-gray-500 uppercase mb-2 tracking-widest">${label}</div>
                        <div class="text-3xl font-black italic text-white">${count}</div>
                    </div>
                `;
            }).join('');
            
            const hc = document.getElementById('homeCounters');
            const lc = document.getElementById('labCounters');
            if (hc) hc.innerHTML = html;
            if (lc) lc.innerHTML = html;
        }

        function handleCounterClick(e, type) {
            // e.detail tells us how many times it was clicked (1 = single, 2 = double)
            if (e.detail === 1) {
                clickTimer = setTimeout(() => {
                    if (type === 'all') navigate('rhythmlab');
                    else openCategoryPage(type);
                }, 250); // Wait 250ms to ensure it's not a double-click
            } else if (e.detail === 2) {
                clearTimeout(clickTimer); // Cancel single click action
                if (type === 'all') navigate('rhythmlab');
                else openRandomSuggestion(type);
            }
        }

        async function openCategoryPage(type) {
            state.catType = type;
            state.catSort = 'trending';
            state.catPage = 1;
            
            // UI Setup
            const titleMap = { 'movie': 'Movies', 'tv': 'TV Series', 'anime': 'Anime', 'kdrama': 'K-Drama', 'turkish': 'Turkish' };
            document.getElementById('catTitle').innerText = titleMap[type] || type;
            
            document.getElementById('btnTrending').className = "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-pulse text-white shadow-lg shadow-pulse/20";
            document.getElementById('btnTopRated').className = "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white";
            
            document.getElementById('categoryGrid').innerHTML = '<div class="page-loader"></div>';
            document.getElementById('catLoadMore').classList.remove('hidden');

            navigate('category'); 
            await fetchAndRenderCategory(true);
        }

        function setCategorySort(sort) {
            if (state.catSort === sort) return;
            state.catSort = sort;
            state.catPage = 1;
            
            const isTr = sort === 'trending';
            document.getElementById('btnTrending').className = isTr ? "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-pulse text-white shadow-lg shadow-pulse/20" : "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white";
            document.getElementById('btnTopRated').className = !isTr ? "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-pulse text-white shadow-lg shadow-pulse/20" : "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white";
            
            document.getElementById('categoryGrid').innerHTML = '<div class="page-loader"></div>';
            document.getElementById('catLoadMore').classList.remove('hidden');
            fetchAndRenderCategory(true);
        }

      function getCategoryApiPath(type, sort, page) {
            if (type === 'movie') {
                return sort === 'trending' ? `/trending/movie/week?page=${page}` : `/movie/top_rated?page=${page}`;
            } else {
                let base = `/discover/tv?page=${page}`;
                let sortParam = sort === 'trending' ? 'popularity.desc' : 'vote_average.desc&vote_count.gte=300'; 
                
                if (type === 'tv') return `${base}&sort_by=${sortParam}&with_original_language=en`;
                // Enforce JA language for Anime category fetching
                if (type === 'anime') return `${base}&sort_by=${sortParam}&with_genres=16&with_original_language=ja`;
                if (type === 'kdrama') return `${base}&sort_by=${sortParam}&with_original_language=ko`;
                if (type === 'turkish') return `${base}&sort_by=${sortParam}&with_original_language=tr`;
            }
        }

        async function fetchAndRenderCategory(clear = false) {
            const btn = document.getElementById('catLoadMore');
            const grid = document.getElementById('categoryGrid');
            if (!clear) btn.innerText = "Processing...";

            try {
                const path = getCategoryApiPath(state.catType, state.catSort, state.catPage);
                const data = await fetchAPI(path);
                const apiType = state.catType === 'movie' ? 'movie' : 'tv';
                
                const html = data.results.map(i => `
                    <div class="group cursor-pointer" onclick="openModal(${i.id}, '${apiType}')">
                        <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse group-hover:-translate-y-2 transition-all shadow-xl relative">
                            <img src="${i.poster_path ? IMG+i.poster_path : 'https://via.placeholder.com/300'}" class="w-full h-full object-cover bg-dark">
                            <div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-pulse border border-white/10">
                                ★ ${i.vote_average?.toFixed(1) || 'N/A'}
                            </div>
                        </div>
                        <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title || i.name}</div>
                        <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase">${(i.release_date || i.first_air_date || '').split('-')[0]}</div>
                    </div>
                `).join('');

                if (clear) grid.innerHTML = html;
                else grid.insertAdjacentHTML('beforeend', html);

                if (data.page >= data.total_pages || state.catPage >= 10) btn.classList.add('hidden'); // Limit to 10 pages for sanity
                else btn.innerHTML = `Load More <i class="fas fa-chevron-down ml-3"></i>`;

            } catch (error) {
                console.error("Neural fetch error", error);
                if (clear) grid.innerHTML = '<div class="col-span-full text-white text-center w-full py-10 font-black italic uppercase tracking-widest text-gray-600">Neural link severed. Failed to load data.</div>';
                btn.innerText = "Retry Link";
            }
        }

        async function loadMoreCategory() {
            state.catPage++;
            await fetchAndRenderCategory(false);
        }

        async function openRandomSuggestion(type) {
            // Fetch top-rated from a random page (1 to 3) to guarantee a "good" suggestion
            const randomPage = Math.floor(Math.random() * 3) + 1; 
            const path = getCategoryApiPath(type, 'top', randomPage);
            
            try {
                const data = await fetchAPI(path);
                if (data.results && data.results.length > 0) {
                    // Filter for 7.5+ rating for high quality, fallback to raw list if none found
                    const pool = data.results.filter(i => i.vote_average >= 7.5); 
                    const targetPool = pool.length > 0 ? pool : data.results; 
                    
                    const randomItem = targetPool[Math.floor(Math.random() * targetPool.length)];
                    const apiType = type === 'movie' ? 'movie' : 'tv';
                    openModal(randomItem.id, apiType);
                }
            } catch (e) {
                console.error("Failed to fetch random suggestion", e);
            }
        }

       function renderRow(id, items, type) {
    const container = document.getElementById(id);
    container.innerHTML = items.map(item => `
        <div class="flex-none w-[240px] group cursor-pointer" onclick="openModal(${item.id}, '${type}')">
            <div class="relative aspect-[2/3] rounded-[40px] overflow-hidden mb-5 border border-white/5 group-hover:scale-105 transition-all duration-700">
                <img src="${IMG+item.poster_path}" class="w-full h-full object-cover">
                ${getPlayHoverHTML({...item, type: type})}
            </div>
            <h3 class="font-black text-[11px] uppercase line-clamp-1 px-2">${item.title || item.name}</h3>
            <div class="text-[8px] font-bold text-gray-600 mt-2 uppercase px-2 tracking-widest">${(item.release_date || item.first_air_date || '').split('-')[0]} • ★ ${item.vote_average.toFixed(1)}</div>
        </div>
    `).join('');
}

   function renderGrid(id, items, forced, clear = true) {
    const container = document.getElementById(id);
    const html = items.map(i => {
        const type = forced || i.media_type || (i.title ? 'movie' : 'tv');
        return `
        <div class="group cursor-pointer relative" onclick="${i.media_type === 'person' ? `openPersonModal(${i.id})` : `openModal(${i.id}, '${type}')`}">
            <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                <img src="${i.poster_path || i.profile_path ? IMG + (i.poster_path || i.profile_path) : 'https://via.placeholder.com/300'}" class="w-full h-full object-cover bg-dark">
                ${i.vote_average ? `<div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-pulse border border-white/10 z-30">★ ${i.vote_average.toFixed(1)}</div>` : ''}
                
                ${i.media_type !== 'person' ? getPlayHoverHTML({...i, type: type}) : ''}
            </div>
            <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title || i.name}</div>
            <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase">${(i.release_date || i.first_air_date || '').split('-')[0] || 'N/A'}</div>
        </div>
    `}).join('');
    
    if (clear) container.innerHTML = html;
    else container.insertAdjacentHTML('beforeend', html);
}

        function setupFilters() {
            const yearSels = [document.getElementById('searchYear'), document.getElementById('labYear')];
            const years = Array.from({length: 50}, (_, i) => 2026 - i);
            yearSels.forEach(sel => {
                sel.innerHTML = `<option value="${sel.id.includes('lab') ? 'all' : ''}">Year</option>` + years.map(y => `<option value="${y}">${y}</option>`).join('');
            });

            const genreSels = [document.getElementById('searchGenre'), document.getElementById('pGenre')];
            genreSels.forEach(sel => {
                sel.innerHTML = `<option value="">Genre</option>` + state.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
            });

            document.getElementById('homeGenres').innerHTML = state.genres.slice(0, 15).map(g => `
                <button onclick="deepSearch('${g.name}')" class="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-pulse transition-all">#${g.name}</button>
            `).join('');
        }

        function openPicker() {
            document.getElementById('pickerModal').classList.remove('hidden');
            document.getElementById('pickerResult').classList.add('hidden');
        }
        function closePicker() { document.getElementById('pickerModal').classList.add('hidden'); }

        function runPulsePicker() {
            const w = document.getElementById('pWatching').checked;
            const p = document.getElementById('pPlan').checked;
            const t = document.getElementById('pType').value;
            const g = parseInt(document.getElementById('pGenre').value);

            let pool = state.db.filter(i => {
                let sMatch = (w && i.status === 'Watching') || (p && i.status === 'Plan to Watch');
                let tMatch = t === 'all' || i.type === t;
                let gMatch = !g || i.genres.includes(g);
                return sMatch && tMatch && gMatch;
            });

            if(!pool.length) return alert("Database empty for selected criteria.");

            const btn = document.getElementById('pRunBtn');
            btn.innerText = "Processing...";
            
            setTimeout(() => {
                const win = pool[Math.floor(Math.random() * pool.length)];
                document.getElementById('pickerResult').classList.remove('hidden');
                document.getElementById('pResImg').src = IMG + win.poster;
                document.getElementById('pResTitle').innerText = win.title;
                
                // Expose the Pick Again button
                document.getElementById('pPickAgainBtn').classList.remove('hidden');
                
                btn.innerText = "Synchronize Now";
                btn.onclick = () => { 
                    closePicker(); 
                    openModal(win.id, win.type === 'movie' ? 'movie' : 'tv'); 
                    btn.onclick = runPulsePicker; 
                    btn.innerText = "Begin Sync"; 
                    document.getElementById('pPickAgainBtn').classList.add('hidden'); // Reset for next time
                };
            }, 1000);
        }

        function updateEpUI(curr, tot) {
            document.getElementById('mEpLabel').innerText = `${curr}/${tot}`;
            document.getElementById('mProgressBar').style.width = `${(curr/tot)*100}%`;
        }
// --- NEW SYNC & SEASON LOGIC ---
function renderSeasonsUI() {
    const container = document.getElementById('mSeasonsList');
    if (!state.activeSeasons || !state.activeSeasons.length) { 
        container.innerHTML = ''; return; 
    }
    
    const currentEp = parseInt(document.getElementById('mEpRange').value) || 0;

    container.innerHTML = state.activeSeasons.map(s => {
        let isChecked = currentEp >= s.endEp; // Passed the season
        let isGlowing = currentEp > s.startEp && currentEp < s.endEp; // Inside the season
        
        let styleClasses = "px-4 py-1.5 rounded-full text-[9px] font-black uppercase cursor-pointer transition-all border shrink-0 ";
        
        if (isChecked) {
            styleClasses += "bg-[#22c55e] text-white border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        } else if (isGlowing) {
            styleClasses += "bg-pulse/20 text-pulse border-pulse shadow-[0_0_15px_rgba(255,45,85,0.6)] animate-pulse";
        } else {
            styleClasses += "bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white";
        }

        return `<button onclick="syncProgress(${s.endEp})" class="${styleClasses}">S${s.season_number}</button>`;
    }).join('');
}

function syncProgress(v) {
    const max = parseInt(document.getElementById('mEpRange').max);
    v = Math.max(0, Math.min(parseInt(v), max)); // Prevent going below 0 or above max
    
    document.getElementById('mEpRange').value = v;
    const idx = state.db.findIndex(i => i.id === state.active.id);
    
    if(idx !== -1) {
        state.db[idx].ep = v;
        updateEpUI(v, max);
        renderSeasonsUI(); // Update glowing/checked states instantly
        save();
        
        // Auto-mark finished if max is reached
        if (v === max && state.db[idx].status !== 'Finished') {
            document.getElementById('mStatus').value = 'Finished';
            updateStatus(); 
        }
    }
}
function adjustProgress(dir) {
    const curr = parseInt(document.getElementById('mEpRange').value) || 0;
    syncProgress(curr + dir);
}
 async function openActor(id, name) {
    closeModal();
    navigate('search');
    state.searchMode = 'actor'; 
    
    const header = document.getElementById('searchHeader');
    const loadBtn = document.getElementById('discoverLoadContainer');
    const actorBanner = document.getElementById('actorProfileBanner');
    
    header.innerText = `Works: ${name}`;
    actorBanner.classList.remove('hidden');
    
    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '<div class="page-loader"></div>';

    try {
        const [person, data] = await Promise.all([
            fetchAPI(`/person/${id}`),
            fetchAPI(`/person/${id}/combined_credits`)
        ]);
        
        // Mobile-friendly clickable wrapper
        actorBanner.innerHTML = `
            <div onclick="openPersonModal(${id})" class="cursor-pointer flex flex-col md:flex-row items-center gap-6 p-6 bg-[#0a0c12] border border-white/10 rounded-[30px] shadow-2xl relative overflow-hidden group hover:border-pulse/50 transition-all">
                <div class="absolute inset-0 bg-gradient-to-r from-pulse/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img src="${person.profile_path ? IMG + person.profile_path : 'https://via.placeholder.com/150'}" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border border-pulse/30 shadow-lg relative z-10">
                <div class="flex-1 relative z-10 text-center md:text-left">
                    <h3 class="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tight">${person.name}</h3>
                    <p class="text-[10px] font-bold text-pulse uppercase tracking-widest mt-1 mb-2">${person.known_for_department || 'Artist'}</p>
                    <p class="text-xs text-gray-400 line-clamp-2 md:line-clamp-3 max-w-3xl leading-relaxed hidden md:block">${person.biography || 'Neural records for this individual are currently encrypted.'}</p>
                </div>
                <button class="relative z-10 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-pulse transition-all shrink-0">
                    View Profile
                </button>
            </div>
        `;

        // Sort by highest rating (penalize items with < 10 votes so obscure 10/10s don't dominate)
        const getScore = (item) => item.vote_count > 10 ? item.vote_average : (item.vote_average || 0) - 5;
        
        state.actorCredits = data.cast
            .filter(item => item.poster_path)
            .sort((a, b) => getScore(b) - getScore(a));
        
        state.actorPage = 1;
        const slice = state.actorCredits.slice(0, 20); // Show top 20 first
        
        renderGrid('searchGrid', slice, false, true);
        applyLayoutToGrid();
        
        // Show Load More if there are more than 20 works
        if (state.actorCredits.length > 20) {
            loadBtn.classList.remove('hidden');
        } else {
            loadBtn.classList.add('hidden');
        }
        
    } catch (err) {
        actorBanner.classList.add('hidden');
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500 uppercase font-black italic">Neural link to ${name} failed.</div>`;
    }
}
        function startClock() { setInterval(() => { 
            const d = new Date();
            document.getElementById('clock').innerText = d.toLocaleTimeString('en-US', { hour12: false });
        }, 1000); }

        function save() { 
            localStorage.setItem('cp_elite_db_v3', JSON.stringify(state.db)); 
                 updateCounters(); 
    
        // Instantly re-render the active view if data changes
              if (state.view === 'mylist') renderList();
              if (state.view === 'rhythmlab') runLab();
}
        function closeModal() { 
                state.modalHistory = []; // Wipe history on full close
                document.getElementById('mBackBtn').classList.add('hidden');
                document.getElementById('modal').classList.add('hidden'); 
                document.body.style.overflow = 'auto'; 
            }
        function removeItem() { state.db = state.db.filter(i => i.id !== state.active.id); save(); closeModal(); }
        function modalGoBack() {
            if (state.modalHistory.length > 0) {
                const prev = state.modalHistory.pop();
                openModal(prev.id, prev.type, true); // true = isBack
            }
}
// --- DATA SYNC: IMPORT & EXPORT ---

   // --- Beautiful UI Notification System ---
function showNotification(msg, isError = false) {
    const t = document.createElement('div');
    const color = isError ? 'bg-pulse' : 'bg-[#22c55e]';
    t.className = `fixed top-10 right-10 ${color} text-white px-8 py-4 rounded-2xl shadow-2xl z-[9999] font-black uppercase text-[10px] tracking-widest transition-all duration-500 transform translate-y-[-20px] opacity-0 flex items-center gap-3`;
    t.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-lg"></i> ${msg}`;
    document.body.appendChild(t);
    
    // Animate In
    setTimeout(() => { t.classList.remove('translate-y-[-20px]', 'opacity-0'); }, 10);
    // Animate Out
    setTimeout(() => { 
        t.classList.add('opacity-0', 'translate-y-[-20px]'); 
        setTimeout(() => t.remove(), 500); 
    }, 3000);
}

// --- Smart Export ---
function exportData() {
    if (state.db.length === 0 && Object.keys(sourcesDb).every(k => sourcesDb[k].length === 0)) {
        showNotification("Library and Source Engine are empty.", true);
        return;
    }

    showNotification("Packaging Neural Data...");

    const backupPackage = {
        version: "2.0",
        db: state.db,
        sources: sourcesDb
    };

    setTimeout(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPackage));
        const node = document.createElement('a');
        node.setAttribute("href", dataStr);
        node.setAttribute("download", "cinepulse_elite_backup.json");
        document.body.appendChild(node);
        node.click();
        node.remove();
        showNotification("Export Complete!");
    }, 500);
}

// --- Smart Merge Import ---
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    showNotification("Analyzing Backup Data...");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 1. Merge Database (Update existing, add new)
            const importedDB = Array.isArray(data) ? data : (data.db || []);
            let updatedCount = 0;
            let newCount = 0;

           importedDB.forEach(importedItem => {
                const existingIdx = state.db.findIndex(existing => existing.id === importedItem.id);
                if (existingIdx !== -1) {
                    // SMART MERGE: Keep the highest Masterpiece ratings and progress
                    const ex = state.db[existingIdx];
                    ex.score = Math.max(ex.score || 0, importedItem.score || 0);
                    ex.crown = Math.max(ex.crown || 0, importedItem.crown || 0);
                    ex.ep = Math.max(ex.ep || 0, importedItem.ep || 0);
                    ex.status = importedItem.status || ex.status;
                    updatedCount++;
                } else {
                    state.db.push(importedItem); // Add new
                    newCount++;
                }
            });

            // 2. Merge Sources
            if (data.sources) {
                Object.keys(data.sources).forEach(cat => {
                    if(!sourcesDb[cat]) sourcesDb[cat] = [];
                    data.sources[cat].forEach(src => {
                        // Prevent exact duplicate URLs
                        if (!sourcesDb[cat].some(existing => existing.url === src.url)) {
                            sourcesDb[cat].push(src);
                        }
                    });
                });
                localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
                if(typeof renderSources === 'function') renderSources();
            }

            save();
            renderList();
            updateCounters();
            
            showNotification(`Imported: ${newCount} New, ${updatedCount} Updated`);
            document.getElementById('importFile').value = ''; 
        } catch (err) {
            showNotification("Invalid backup file format.", true);
        }
    };
    reader.readAsText(file);
}

        // --- NEW: Grid Layout Engine ---


function setSearchLayout(layout) {
    currentSearchLayout = layout;
    
    // Update active button UI
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-pulse', 'text-white', 'shadow-lg', 'shadow-pulse/20');
        btn.classList.add('text-gray-500');
        if (btn.getAttribute('onclick').includes(layout)) {
            btn.classList.add('active', 'bg-pulse', 'text-white', 'shadow-lg', 'shadow-pulse/20');
            btn.classList.remove('text-gray-500');
        }
    });
    
    applyLayoutToGrid();
    savePrefs();
}

function applyLayoutToGrid() {
    const grid = document.getElementById('searchGrid');
    
    // Reset classes
    grid.className = 'gap-8 relative min-h-[400px]';
    
    if (currentSearchLayout === 'list') {
        grid.classList.add('list-view'); // Applies custom CSS list logic
    } else {
        grid.classList.add('grid', 'grid-cols-2', 'md:' + currentSearchLayout);
    }
}

function toggleLabView() {
    state.labIsGrid = !state.labIsGrid;
    document.getElementById('labViewToggle').innerHTML = state.labIsGrid 
        ? '<i class="fas fa-list text-white"></i>' 
        : '<i class="fas fa-th-large text-white"></i>';
    runLab();
    savePrefs();
}


// recomendation logic for the info modal 
async function loadModalRecommendations(id, type, page, append = false) {
    const container = document.getElementById('mRecGrid');
    const btnBox = document.getElementById('mRecLoadBtnBox');
    const btn = document.getElementById('mRecLoadBtn');

    if (!append) container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-[10px] uppercase font-black tracking-widest py-10">Syncing Recommendations...</div>';

    try {
        const data = await fetchAPI(`/${type}/${id}/recommendations?page=${page}`);
        const results = data.results || [];


        // NEW: Fallback to Similar if Recommendations are empty
        if (results.length === 0) {
            const fallbackData = await fetchAPI(`/${type}/${id}/similar?page=${page}`);
            results = fallbackData.results || [];
        }

        if (!append && results.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-600 font-black uppercase tracking-widest text-[10px] italic py-10">No Neural Matches Found.</div>';
            btnBox.classList.add('hidden');
            return;
        }

        if (!append && results.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-600 font-black uppercase tracking-widest text-[10px] italic py-10">No Neural Matches Found.</div>';
            btnBox.classList.add('hidden');
            return;
        }

        const html = results.map(i => `
            <div class="group cursor-pointer" onclick="openModal(${i.id}, '${type}')">
                <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-3 border border-white/5 group-hover:border-pulse transition-all shadow-xl">
                    <img src="${i.poster_path ? IMG + i.poster_path : 'https://via.placeholder.com/300'}" class="w-full h-full object-cover">
                </div>
                <div class="text-[9px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title || i.name}</div>
            </div>
        `).join('');

        if (append) {
            container.insertAdjacentHTML('beforeend', html);
        } else {
            container.innerHTML = html;
        }

        // Handle Load More visibility (limit to 5 pages maximum to prevent infinite scrolling)
        if (page < data.total_pages && page < 5) {
            btnBox.classList.remove('hidden');
            btn.onclick = () => {
                btn.innerText = "Syncing...";
                state.recPage++;
                loadModalRecommendations(id, type, state.recPage, true).then(() => {
                    btn.innerText = "Load More Data";
                });
            };
        } else {
            btnBox.classList.add('hidden');
        }

    } catch (e) {
        console.error("Failed to load recommendations", e);
        if (!append) container.innerHTML = '<div class="col-span-full text-center text-pulse text-[10px] uppercase font-black py-10">Link Severed.</div>';
    }
}

// --- SMART SEARCH & UI TOGGLES LOGIC ---

// 1. Toggle Genre Containers
function toggleGenreVisibility(containerId, btnElement) {
    const container = document.getElementById(containerId);
    container.classList.toggle('hidden');
    
    if (container.classList.contains('hidden')) {
        btnElement.classList.remove('bg-pulse', 'text-white', 'border-pulse');
        btnElement.classList.add('border-white/10', 'text-gray-500');
    } else {
        btnElement.classList.add('bg-pulse', 'text-white', 'border-pulse');
        btnElement.classList.remove('border-white/10', 'text-gray-500');
    }
}

// 2. Handle Search Input
function handleLocalSearch(view, value) {
    if (view === 'list') {
        state.listSearchQuery = value;
        renderList();
    } else if (view === 'lab') {
        state.labSearchQuery = value;
        runLab();
    }
}

// 3. Forgiving Fuzzy Match Algorithm (Handles spelling errors)
function calculateLevenshteinDistance(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i][j - 1] + 1, // deletion
                matrix[i - 1][j] + 1, // insertion
                matrix[i - 1][j - 1] + indicator // substitution
            );
        }
    }
    return matrix[a.length][b.length];
}

function isSmartMatch(text, query) {
    if (!query) return true;
    
    text = text.toLowerCase();
    query = query.toLowerCase().trim();
    
    // Exact substring match (fastest)
    if (text.includes(query)) return true;

    // Check individual words for typos (max 2 typos allowed for longer words)
    const titleWords = text.split(/[\s\-:]+/);
    const queryWords = query.split(/[\s\-:]+/);

    return queryWords.every(qw => 
        titleWords.some(tw => {
            if (tw.includes(qw)) return true;
            // Allow 1 typo for 4 letter words, 2 typos for 5+ letter words
            const maxTypos = qw.length > 4 ? 2 : (qw.length > 3 ? 1 : 0);
            return qw.length > 3 && calculateLevenshteinDistance(tw, qw) <= maxTypos;
        })
    );
}

// Initialize Sources DB
let sourcesDb = JSON.parse(localStorage.getItem('cp_elite_sources')) || {
    movie: [], tv: [], anime: [], kdrama: [], turkish: []
};

function renderSources() {
    const container = document.getElementById('sourceListContainer');
    if (!container) return;
    
    const categories = Object.keys(sourcesDb);
    container.innerHTML = categories.map(cat => {
        if (!sourcesDb[cat].length) return '';
        return `
            <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 class="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-4 border-b border-white/5 pb-2">${cat} Sources</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${sourcesDb[cat].map((src, idx) => {
                        const domain = new URL(src.url.replace(/{.*?}/g, '')).hostname;
                        return `
                            <div class="flex items-center justify-between bg-dark border border-white/10 p-3 rounded-xl hover:border-pulse/50 transition-colors">
                                <div class="flex items-center gap-3 overflow-hidden">
                                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-6 h-6 rounded-md bg-white/10 p-0.5 shrink-0">
                                    <div class="truncate">
                                        <div class="text-[11px] font-black uppercase text-white truncate">${src.name}</div>
                                        <div class="text-[8px] text-gray-500 truncate">${domain}</div>
                                    </div>
                                </div>
                                <button onclick="removeSource('${cat}', ${idx})" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/10 shrink-0 transition-all"><i class="fas fa-trash text-[10px]"></i></button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('') || `<div class="text-center py-10 text-[10px] uppercase font-black text-gray-600 tracking-widest">No Sources Configured</div>`;
}

function addSource() {
    const cat = document.getElementById('srcCategory').value;
    const name = document.getElementById('srcName').value.trim();
    const url = document.getElementById('srcUrl').value.trim();

    if (!name || !url) return alert("Please provide both a name and a URL template.");
    if (!url.startsWith('http')) return alert("URL must start with http:// or https://");

    sourcesDb[cat].push({ name, url });
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    
    document.getElementById('srcName').value = '';
    document.getElementById('srcUrl').value = '';
    renderSources();
}

function removeSource(cat, idx) {
    sourcesDb[cat].splice(idx, 1);
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    renderSources();
}


function getPlayHoverHTML(item) {
    // Rely on local DB type if available to guarantee anime/kdrama/turkish routing
    const local = state.db.find(i => i.id === item.id);
    const cat = local ? local.type : determineCategory(item);
    
    const available = sourcesDb[cat] || [];
    if (available.length === 0) return ''; 

    // If 1 source, direct link. If multiple, open modal.
    let action = `openModal(${item.id}, '${item.media_type || (cat === 'movie' ? 'movie' : 'tv')}'); setTimeout(openWatchMenu, 100);`;
    if (available.length === 1) {
        const title = encodeURIComponent(item.title || item.name);
        const url = available[0].url.replace(/{title}/g, title).replace(/{tmdb_id}/g, item.id);
        action = `window.open('${url}', '_blank')`;
    }
    
    return `
    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 pointer-events-none flex items-center justify-center">
        <button onclick="event.stopPropagation(); ${action}" class="w-14 h-14 rounded-full bg-white/5 border border-white/40 flex items-center justify-center text-white text-xl hover:bg-white/20 hover:border-pulse hover:scale-110 transition-all pointer-events-auto shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_5px_15px_rgba(0,0,0,0.4)]">
            <i class="fas fa-play ml-1"></i>
        </button>
    </div>`;
}
function openWatchMenu() {
    if (!state.active) return;
    
    // Explicitly determine type
    const type = determineCategory(state.active);
    const availableSources = sourcesDb[type] || [];

    const title = encodeURIComponent(state.active.title || state.active.name);
    const tmdbId = state.active.id;
    const year = (state.active.release_date || state.active.first_air_date || '').split('-')[0];

    // IF NO SOURCES: Show Explicit "Add Source" Redirect
    if (availableSources.length === 0) {
        document.getElementById('watchSourceList').innerHTML = `
            <div class="text-center py-8 space-y-4">
                <div class="w-16 h-16 bg-${type}/10 text-${type} rounded-full flex items-center justify-center mx-auto mb-4 border border-${type}/20">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <p class="text-[12px] text-white uppercase font-black tracking-widest">No ${type} Sources Found</p>
                <p class="text-[9px] text-gray-500 uppercase font-bold px-6 leading-relaxed">
                    You haven't added any sources for the <span class="text-${type}">${type}</span> category yet.
                </p>
                <button onclick="document.getElementById('watchModal').classList.add('hidden'); navigate('sources');" 
                        class="mt-4 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] uppercase font-black hover:bg-white/10 transition-all w-full">
                    Configure ${type} Sources
                </button>
            </div>`;
        document.getElementById('watchModal').classList.remove('hidden');
        return;
    }

    // IF 1 SOURCE: Launch Explicitly
    if (availableSources.length === 1) {
        const url = availableSources[0].url.replace(/{title}/g, title).replace(/{tmdb_id}/g, tmdbId).replace(/{year}/g, year);
        window.open(url, '_blank');
        return;
    }

    // IF MULTIPLE: Show Selection List
    document.getElementById('watchSourceList').innerHTML = `
        <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 ml-1">Select ${type} Source</div>
        ${availableSources.map(src => {
            const finalUrl = src.url.replace(/{title}/g, title).replace(/{tmdb_id}/g, tmdbId).replace(/{year}/g, year);
            const domain = new URL(src.url.replace(/{.*?}/g, '')).hostname;
            return `
                <a href="${finalUrl}" target="_blank" onclick="document.getElementById('watchModal').classList.add('hidden')" 
                   class="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-${type} hover:bg-${type}/10 transition-all group mb-3">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-8 h-8 rounded-lg grayscale group-hover:grayscale-0 transition-all">
                    <div class="flex-1">
                        <div class="text-[11px] font-black uppercase text-white group-hover:text-${type}">${src.name}</div>
                        <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-1">${domain}</div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-700 group-hover:text-${type} transition-all"></i>
                </a>
            `;
        }).join('')}
    `;
    
    document.getElementById('watchModal').classList.remove('hidden');
}
// --- DYNAMIC FILTERS ---
function renderGenrePills() {
    const buildPills = (targetId, currentList, clickHandler) => {
        const container = document.getElementById(targetId);
        if (!container) return;
        container.innerHTML = state.genres.map(g => {
            const isActive = currentList.includes(g.id);
            const baseClass = isActive 
                ? "bg-pulse text-white border-pulse shadow-lg shadow-pulse/30" 
                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white";
            return `<button onclick="${clickHandler}('${targetId}', ${g.id})" class="px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 transition-all snap-start ${baseClass}">${g.name}</button>`;
        }).join('');
    };
    buildPills('listGenreContainer', state.listFilters.genres, 'toggleFilterGenre');
    buildPills('labGenreContainer', state.labFilters.genres, 'toggleFilterGenre');
    buildPills('discoverGenreContainer', state.discoverFilters.genres, 'toggleDiscoverGenre'); // New line
}

function toggleFilterGenre(target, genreId) {
    const filterObj = target === 'listGenreContainer' ? state.listFilters : state.labFilters;
    const idx = filterObj.genres.indexOf(genreId);
    if (idx > -1) filterObj.genres.splice(idx, 1);
    else filterObj.genres.push(genreId);
    
    renderGenrePills();
    target === 'listGenreContainer' ? renderList() : runLab();
}

function toggleListFilter(type, val) {
    state.listFilters[type] = val;
    document.querySelectorAll('.l-type-btn').forEach(b => b.className = "l-type-btn px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase text-gray-500 hover:text-white shrink-0 transition-all");
    document.getElementById(`lType-${val}`).className = "l-type-btn px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pulse text-white shadow-lg shadow-pulse/20 shrink-0 transition-all";
    state.listExpanded = {}; // Reset expansion
    renderList();
}

function toggleLabFilter(type, val) {
    state.labFilters[type] = val;
    document.querySelectorAll('.lab-type-btn').forEach(b => b.className = "lab-type-btn px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase text-gray-500 hover:text-white shrink-0 transition-all");
    document.getElementById(`labType-${val}`).className = "lab-type-btn px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pulse text-white shadow-lg shadow-pulse/20 shrink-0 transition-all";
    runLab();
}

// Ensure genres render on initial load
const originalSetupFilters = setupFilters;
setupFilters = function() {
    originalSetupFilters();
    renderGenrePills();
};
function toggleAdvancedLabFilters() {
    const filterBox = document.getElementById('labAdvancedFilters');
    filterBox.classList.toggle('hidden');
}


let currentToastItem = null;

function initNeuralEngine() {
    // Run every 2 minutes (120000 ms)
    setInterval(generateSmartNotification, 120000);
    // Fire one off 10 seconds after load to show the user it works
    setTimeout(generateSmartNotification, 10000); 
}
// notfication generation 

async function generateSmartNotification() {
    if (state.db.length === 0) return;

    // 1. Fetch real-time TMDB data for a random "Ongoing" show
    const ongoing = state.db.filter(i => i.status === 'Ongoing' && i.type !== 'movie');
    if (ongoing.length > 0) {
        const checkItem = ongoing[Math.floor(Math.random() * ongoing.length)];
        try {
            const tmdbData = await fetchAPI(`/tv/${checkItem.id}`);
            const lastEp = tmdbData.last_episode_to_air;
            
            // If TMDB says an episode exists that is higher than our local max_ep or current ep
            if (lastEp && (lastEp.episode_number > checkItem.ep)) {
                // FIXED: Now correctly dispatches and saves to the Hub
                dispatchNotification(
                    checkItem, 
                    'NEW EPISODE DETECTED', 
                    `Season ${lastEp.season_number}, Episode ${lastEp.episode_number} is available!`
                );
                return; // Stop here, we found a real update!
            }
        } catch (e) { console.warn("Failed to ping TMDB for smart update."); }
    }

    // 2. If no real updates, fallback to our smart psychological triggers
    const rules = [
        { type: 'Watching', badge: 'Continue Sync', msg: 'Pick up where you left off.', weight: 5, filter: i => i.status === 'Watching' },
        { type: 'Plan', badge: 'Awaiting Initiation', msg: 'Ready to start a new journey?', weight: 3, filter: i => i.status === 'Plan to Watch' },
        { type: 'Finished', badge: 'Memory Log', msg: 'Time for a rewatch?', weight: 1, filter: i => i.status === 'Finished' && i.score >= 4 }
    ];

    const weightedRules = rules.flatMap(r => Array(r.weight).fill(r));
    const rule = weightedRules[Math.floor(Math.random() * weightedRules.length)];
    const pool = state.db.filter(rule.filter);
    
    if (pool.length > 0) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        // FIXED: Now correctly dispatches and saves to the Hub
        dispatchNotification(item, rule.badge, rule.msg);
    }
}

function showToast(notif) {
    currentToastItem = notif.item;
    document.getElementById('toastImg').src = IMG + notif.item.poster;
    document.getElementById('toastBadge').innerText = notif.badge;
    document.getElementById('toastTitle').innerText = notif.item.title;
    document.getElementById('toastMsg').innerText = notif.msg;
    
    const toast = document.getElementById('neuralToast');
    toast.classList.remove('hidden');
    
    // Auto hide after 8 seconds
    setTimeout(() => { toast.classList.add('hidden'); }, 8000);
}

function closeToast(e) {
    e.stopPropagation();
    document.getElementById('neuralToast').classList.add('hidden');
}

function handleToastClick() {
    if (currentToastItem) {
        document.getElementById('neuralToast').classList.add('hidden');
        openModal(currentToastItem.id, currentToastItem.type === 'movie' ? 'movie' : 'tv');
    }
}

function toggleNotifHub() {
    const hub = document.getElementById('notifHub');
    hub.classList.toggle('translate-x-full');
    
    // Mark all as read when opened
    notifications.forEach(n => n.read = true);
    updateHubUI();
    date: Date.now()
}

function updateHubUI() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    
    if (unreadCount > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    const list = document.getElementById('notifList');
    if (notifications.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-600 text-[10px] font-black uppercase mt-10">No Neural Alerts</div>';
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div onclick="openModal(${n.item.id}, '${n.item.type === 'movie' ? 'movie' : 'tv'}'); toggleNotifHub()" class="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 cursor-pointer hover:border-pulse hover:bg-white/10 transition-all ${!n.read ? 'border-l-4 border-l-pulse' : ''}">
            <img src="${IMG + n.item.poster}" class="w-10 h-14 object-cover rounded shadow-lg">
            <div class="flex-1">
                <div class="text-[8px] text-pulse font-black uppercase tracking-widest">${n.badge}</div>
                <div class="text-xs font-bold text-white line-clamp-1 italic">${n.item.title}</div>
                <div class="text-[9px] text-gray-500 uppercase mt-1">${n.msg}</div>
            </div>
        </div>
    `).join('');
}

const searchInput = document.getElementById("mainSearch");
const clearBtn = document.getElementById("clearSearch");

searchInput.addEventListener("input", () => {
    if (searchInput.value.length > 0) {
        clearBtn.classList.remove("hidden");
    } else {
        clearBtn.classList.add("hidden");
    }
});

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.add("hidden");
    searchInput.focus();
});

// toggleDiscoverFilter :
async function fetchDiscoverData(append = false) {
    let val = state.discoverFilters.type;
    let path = `/trending/all/day?page=${discoverPage}`;
    
    if (val === 'movie') path = `/discover/movie?sort_by=popularity.desc&page=${discoverPage}`;
    if (val === 'tv') path = `/discover/tv?sort_by=popularity.desc&with_original_language=en&page=${discoverPage}`;
    if (val === 'anime') path = `/discover/tv?with_genres=16&sort_by=popularity.desc&with_original_language=ja&page=${discoverPage}`;
    if (val === 'kdrama') path = `/discover/tv?with_original_language=ko&sort_by=popularity.desc&page=${discoverPage}`;
    if (val === 'turkish') path = `/discover/tv?with_original_language=tr&sort_by=popularity.desc&page=${discoverPage}`;

    const data = await fetchAPI(path);
    
    if (append) {
        state.discoverDataRaw = state.discoverDataRaw.concat(data.results);
    } else {
        state.discoverDataRaw = data.results;
    }
    applyDiscoverLocalFilters();
}

async function toggleDiscoverFilter(type, val) {
    state.discoverFilters.type = val;
    discoverPage = 1; // RESET PAGE BATCHING
    
    document.querySelectorAll('.d-type-btn').forEach(b => b.className = "d-type-btn px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase text-gray-500 hover:text-white shrink-0 transition-all");
    document.getElementById(`dType-${val}`).className = "d-type-btn px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pulse text-white shadow-lg shadow-pulse/20 shrink-0 transition-all";
    
    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '<div class="page-loader"></div>';
    
    await fetchDiscoverData(false);
}

async function loadDiscoverContent(append = false) {
    if (state.searchMode === 'actor') return; // Prevent overwriting actor mode
    state.searchMode = 'trending'; 
    document.getElementById('discoverLoadContainer').classList.remove('hidden');
    document.getElementById('searchHeader').innerText = "Discover";
    await fetchDiscoverData(append);
}

async function loadMoreDiscover() {
    const btn = document.getElementById('btnDiscoverLoadMore');
    btn.innerText = "Syncing...";
    
    if (state.searchMode === 'actor') {
        state.actorPage++;
        const start = (state.actorPage - 1) * 20;
        const slice = state.actorCredits.slice(start, start + 20);
        
        renderGrid('searchGrid', slice, false, false); // append = false clear
        applyLayoutToGrid();
        
        if (start + 20 >= state.actorCredits.length) {
            document.getElementById('discoverLoadContainer').classList.add('hidden');
        }
    } else if (state.searchMode === 'filter') {
        state.filterPage++;
        await applySearchFilters(true);
    } else if (state.searchMode === 'trending') {
        discoverPage++; // INCREMENT BATCH
        await fetchDiscoverData(true); // FETCH NEW BATCH INSTEAD OF GENERIC TRENDING
    }
    
    btn.innerText = "Load More Discovery";
}


function getPlayHoverHTML(item) {
    const available = sourcesDb[item.type] || [];
    if (available.length === 0) return ''; // No sources, no button

    if (available.length === 1) {
        // Direct link generation
        const src = available[0];
        const title = encodeURIComponent(item.title);
        const url = src.url.replace(/{title}/g, title).replace(/{tmdb_id}/g, item.id);
        return `<button onclick="event.stopPropagation(); window.open('${url}', '_blank')" class="absolute inset-0 bg-black/70 hidden group-hover:flex items-center justify-center text-white text-4xl z-[35] backdrop-blur-sm transition-all"><i class="fas fa-play shadow-lg shadow-pulse"></i></button>`;
    }
    
    // Multiple sources = open modal
    return `<button onclick="event.stopPropagation(); openModal(${item.id}, '${item.type === 'movie' ? 'movie' : 'tv'}'); setTimeout(openWatchMenu, 100);" class="absolute inset-0 bg-black/70 hidden group-hover:flex items-center justify-center text-white text-4xl z-[35] backdrop-blur-sm transition-all"><i class="fas fa-list shadow-lg shadow-pulse"></i></button>`;
}

// Add this function to reset Discovery
function resetDiscoverFilters() {
    state.discoverFilters.genres = [];
    renderGenrePills();
    toggleDiscoverFilter('type', 'all');
}

function toggleDiscoverGenre(target, genreId) {
    const idx = state.discoverFilters.genres.indexOf(genreId);
    if (idx > -1) state.discoverFilters.genres.splice(idx, 1);
    else state.discoverFilters.genres.push(genreId);
    renderGenrePills();
    applyDiscoverLocalFilters();
}

function applyDiscoverLocalFilters() {
    if (!state.discoverDataRaw || state.discoverDataRaw.length === 0) return;

    let filtered = state.discoverDataRaw.filter(i => {
        let type = i.media_type || (i.title ? 'movie' : 'tv');
        if (type === 'tv') {
            if (i.original_language === 'ko') type = 'kdrama';
            else if (i.original_language === 'tr') type = 'turkish';
            // STRICT ANIME RULE APPLIED HERE: MUST BE JAPANESE ('ja') + ANIMATED (16)
            else if (i.original_language === 'ja' && i.genre_ids && i.genre_ids.includes(16)) type = 'anime';
        }

        let tMatch = state.discoverFilters.type === 'all' || type === state.discoverFilters.type;
        let gMatch = state.discoverFilters.genres.length === 0 || state.discoverFilters.genres.every(g => {
            const equivalents = GENRE_MAP[g] || [g];
            return i.genre_ids && i.genre_ids.some(id => equivalents.includes(id));
        });

        return tMatch && gMatch;
    });

    renderGrid('searchGrid', filtered, false, true); 
    applyLayoutToGrid();
}

      // water progress feature 
function getLiquidHTML(item) {
    // Failsafe: No water for movies or 0 episodes watched
    if (item.type === 'movie' || !item.ep || item.ep <= 0) return '';
    
    // Use max_ep, or temporarily use 'ep' if Auto-Heal is still processing
    let max = item.max_ep || item.ep || 1; 
    let ratio = item.ep / max;
    
    // Force a minimum of 4% visibility so it NEVER disappears
    let percent = Math.max(Math.min(ratio * 100, 100), 4); 
    
    let textClass = ratio > 0.8 ? 'text-[#22c55e]' : ratio > 0.4 ? 'text-[#f59e0b]' : 'text-pulse';
    let bgClass = ratio > 0.8 ? 'bg-[#22c55e]' : ratio > 0.4 ? 'bg-[#f59e0b]' : 'bg-pulse';

    return `
    <div class="absolute bottom-0 left-0 w-full z-10 pointer-events-none flex flex-col justify-end transition-all duration-1000" style="height: ${percent}%;">
        <div class="w-full h-3 overflow-hidden relative opacity-90">
            <div class="absolute top-0 left-0 w-[200%] h-full flex animate-wave-slide">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-1/2 h-full fill-current ${textClass}"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,121.5,205.8,107.13Z"></path></svg>
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-1/2 h-full fill-current ${textClass}"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,121.5,205.8,107.13Z"></path></svg>
            </div>
        </div>
        <div class="w-full ${bgClass} opacity-40 backdrop-blur-[3px] transition-all duration-1000" style="height: calc(100% - 0.5rem);"></div>
    </div>
    `;
}

async function autoHealDatabase() {
    let healedCount = 0;
    
    for (let i of state.db) {
        // If it's a TV show, has watched episodes, but is missing max_ep
        if (i.type !== 'movie' && i.ep > 0 && (!i.max_ep || i.max_ep === 0)) {
            try {
                // Fetch the exact TV data from your existing fetchAPI
                const data = await fetchAPI(`/tv/${i.id}`);
                if (data && data.number_of_episodes) {
                    i.max_ep = data.number_of_episodes;
                    healedCount++;
                } else {
                    // Fallback so the math at least works
                    i.max_ep = i.ep; 
                    healedCount++;
                }
            } catch (err) {
                console.warn(`Could not heal max_ep for ${i.title}`);
            }
        }
    }
    
    // If we fixed anything, save the database and refresh the visuals instantly
    if (healedCount > 0) {
        save();
        if (state.view === 'mylist') renderList();
        if (state.view === 'lab') runLab();
        console.log(`Neural Auto-Heal Complete: Fixed ${healedCount} older archives.`);
    }
}

function clearAllSources() {
    if(confirm("Are you sure you want to delete all configured sources?")) {
        sourcesDb = { movie: [], tv: [], anime: [], kdrama: [], turkish: [] };
        localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
        renderSources();
        showNotification("All sources purged.");
    }
}

function savePrefs() {
    localStorage.setItem('cp_elite_prefs', JSON.stringify({
        listIsGrid: state.isGrid,
        labIsGrid: state.labIsGrid,
        searchLayout: currentSearchLayout
    }));
}

function saveNotifs() {
    localStorage.setItem('cp_elite_notifs', JSON.stringify(notifications));
    localStorage.setItem('cp_elite_notifs_archived', JSON.stringify(archivedNotifs));
}
// --- SMART CATEGORY PARSER ---
function determineCategory(item) {
    // 1. Check if we already have this item in our DB with a set type
    const local = state.db.find(i => i.id === item.id);
    if (local && local.type) return local.type;

    // 2. Language & Genre Overrides (The "Explicit" Logic)
    const lang = item.original_language;
    const genres = item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []);

    if (lang === 'ja' && genres.includes(16)) return 'anime'; // Japanese + Animation = Anime
    if (lang === 'ko') return 'kdrama';                        // Korean = K-Drama
    if (lang === 'tr') return 'turkish';                      // Turkish = Turkish

    // 3. Fallback to standard TMDB types
    return item.title ? 'movie' : 'tv';
}
// --- NON-BLOCKING HOVER PLAY ---
function getPlayHoverHTML(item) {
    const local = state.db.find(i => i.id === item.id);
    const cat = local ? local.type : determineCategory(item);
    const available = sourcesDb[cat] || [];
    
    // Determine base TMDB type for info modal fetch (must be 'movie' or 'tv')
    const baseType = item.media_type || (item.title ? 'movie' : 'tv');
    
    // Default action: Open modal then trigger watch menu (Handles 0 sources and Multiple sources)
    let action = `event.stopPropagation(); openModal(${item.id}, '${baseType}'); setTimeout(openWatchMenu, 100);`;
    
    // If exactly 1 source exists, bypass modal and go straight to the link
    if (available.length === 1) {
        const title = encodeURIComponent(item.title || item.name);
        const url = available[0].url.replace(/{title}/g, title).replace(/{tmdb_id}/g, item.id);
        action = `event.stopPropagation(); window.open('${url}', '_blank');`;
    }
    
    return `
    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 pointer-events-none flex items-center justify-center">
        <button onclick="${action}" class="w-14 h-14 rounded-full bg-white/5 border border-white/40 flex items-center justify-center text-white text-xl hover:bg-white/20 hover:border-pulse hover:scale-110 transition-all pointer-events-auto shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_5px_15px_rgba(0,0,0,0.4)]">
            <i class="fas fa-play ml-1"></i>
        </button>
    </div>`;
}

// --- CRYSTAL CLEAR LIQUID WATER ---
function getLiquidHTML(item) {
    if (item.type === 'movie' || !item.ep || item.ep <= 0) return '';
    let max = item.max_ep || item.ep || 1; 
    let ratio = item.ep / max;
    let percent = Math.max(Math.min(ratio * 100, 100), 4); 
    
    // Clear Water Tints: Dropped the background opacity slightly to ensure the poster is the star
    let textClass = ratio > 0.8 ? 'text-[#22c55e]' : ratio > 0.4 ? 'text-[#f59e0b]' : 'text-white';
    let bgClass = ratio > 0.8 ? 'bg-[#22c55e]/10' : ratio > 0.4 ? 'bg-[#f59e0b]/10' : 'bg-white/5';

    // Updated: Removed backdrop-blur completely. Strengthened the top border line to act as the water's surface.
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
function dispatchNotification(item, badge, msg) {
    // 1. DEDUPLICATION: Remove any existing notification for this EXACT item and badge to avoid spam
    notifications = notifications.filter(n => !(n.item.id === item.id && n.badge === badge));
    
    // 2. Add timestamp for auto-clearing
    const newNotif = { id: Date.now(), item, badge, msg, read: false, date: Date.now() };
    notifications.unshift(newNotif); 
    
    // 3. HARD LIMIT: Never exceed 30 active notifications
    if(notifications.length > 30) notifications.length = 30;
    
    saveNotifs();
    showToast(newNotif);
    updateHubUI();
}


function setNotifTab(tab) {
    currentNotifTab = tab;
    document.getElementById('tabRecent').className = tab === 'recent' ? "flex-1 py-4 text-[10px] font-black uppercase text-pulse border-b-2 border-pulse bg-pulse/5 transition-all" : "flex-1 py-4 text-[10px] font-black uppercase text-gray-500 border-b-2 border-transparent hover:text-white transition-all";
    document.getElementById('tabArchive').className = tab === 'archived' ? "flex-1 py-4 text-[10px] font-black uppercase text-pulse border-b-2 border-pulse bg-pulse/5 transition-all" : "flex-1 py-4 text-[10px] font-black uppercase text-gray-500 border-b-2 border-transparent hover:text-white transition-all";
    updateHubUI();
}

function archiveNotif(e, id) {
    e.stopPropagation();
    const idx = notifications.findIndex(n => n.id === id);
    if(idx > -1) {
        archivedNotifs.unshift(notifications[idx]);
        notifications.splice(idx, 1);
        saveNotifs();
    }
}

function deleteNotif(e, id) {
    e.stopPropagation();
    archivedNotifs = archivedNotifs.filter(n => n.id !== id);
    saveNotifs();
}

function updateHubUI() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    badge.classList.toggle('hidden', unreadCount === 0);

    const list = document.getElementById('notifList');
    const data = currentNotifTab === 'recent' ? notifications : archivedNotifs;

    if (data.length === 0) {
        list.innerHTML = `<div class="text-center text-gray-600 text-[10px] font-black uppercase mt-10">No ${currentNotifTab} Alerts</div>`;
        return;
    }

    list.innerHTML = data.map(n => `
        <div class="relative group flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 cursor-pointer hover:border-pulse hover:bg-white/10 transition-all ${!n.read && currentNotifTab === 'recent' ? 'border-l-4 border-l-pulse' : ''}" onclick="openModal(${n.item.id}, '${n.item.type === 'movie' ? 'movie' : 'tv'}'); toggleNotifHub()">
            <img src="${IMG + n.item.poster}" class="w-10 h-14 object-cover rounded shadow-lg">
            <div class="flex-1 pr-8">
                <div class="text-[8px] text-pulse font-black uppercase tracking-widest">${n.badge}</div>
                <div class="text-xs font-bold text-white line-clamp-1 italic">${n.item.title}</div>
                <div class="text-[9px] text-gray-500 uppercase mt-1">${n.msg}</div>
            </div>
            ${currentNotifTab === 'recent' 
                ? `<button onclick="archiveNotif(event, ${n.id})" class="absolute right-4 text-gray-500 hover:text-white transition-all"><i class="fas fa-archive"></i></button>`
                : `<button onclick="deleteNotif(event, ${n.id})" class="absolute right-4 text-gray-500 hover:text-pulse transition-all"><i class="fas fa-trash"></i></button>`
            }
        </div>
    `).join('');
}
function handleCrownSelect(val) {
    const item = state.db.find(i => i.id === state.active.id);
    if (!item) return;
    
    const crownLevel = parseInt(val);
    
    // If crowning, dethrone the previous owner of this crown for this category
    if (crownLevel > 0) {
        state.db.forEach(i => {
            if (i.type === item.type && i.crown === crownLevel) {
                i.crown = 0; // Strip the crown
            }
        });
    }
    
    item.crown = crownLevel;
    save();
    if (state.view === 'masterpieces') renderMasterpieces();
}

function setMpTab(tab) {
    state.mpTab = tab;
    ['crowned', 'perfect', 'ranked'].forEach(t => {
        document.getElementById(`mpTab-${t}`).className = t === tab 
            ? "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-pulse text-white shadow-lg shadow-pulse/20 whitespace-nowrap"
            : "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white whitespace-nowrap";
    });
    renderMasterpieces();
}

function renderMasterpieces() {
    const container = document.getElementById('mpContainer');
    const types = ['movie', 'tv', 'anime', 'kdrama', 'turkish'];
    const typeNames = { movie: 'Movies', tv: 'Series', anime: 'Anime', kdrama: 'K-Drama', turkish: 'Turkish' };

    // 1. Render the new Type Toggle Strip
    let html = `
        <div class="flex gap-4 mb-8 overflow-x-auto hide-scroll pb-2">
            <button onclick="state.mpFilter='all'; renderMasterpieces()" class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpFilter === 'all' ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">All Types</button>
            ${types.map(t => `
                <button onclick="state.mpFilter='${t}'; renderMasterpieces()" class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpFilter === t ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">${typeNames[t]}</button>
            `).join('')}
        </div>
    `;

    let displayTypes = state.mpFilter === 'all' ? types : [state.mpFilter];

    if (state.mpTab === 'crowned') {
        html += displayTypes.map(type => {
            const crowned = state.db.filter(i => i.type === type && i.crown > 0).sort((a,b) => a.crown - b.crown);
            if(!crowned.length) return '';
            return `
                <div class="mb-16 animate-in fade-in duration-500">
                    <h3 class="text-2xl font-black italic uppercase text-yellow-500/80 tracking-widest mb-8 border-b border-white/5 pb-4 flex items-center gap-4">
                        <i class="fas fa-crown"></i> ${typeNames[type]} Royal Court
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        ${crowned.map(i => getRankedCard(i, i.crown, true)).join('')}
                    </div>
                </div>
            `;
        }).join('') || '<div class="text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em] w-full">No crowned items in this category.</div>';
        container.innerHTML = html;
    } 
    else if (state.mpTab === 'perfect') {
        html += displayTypes.map(type => {
            const perfect = state.db.filter(i => i.type === type && i.score === 5).sort((a,b) => b.imdb - a.imdb);
            if(!perfect.length) return '';
            return `
                <div class="mb-16 animate-in fade-in duration-500">
                    <h3 class="text-xl font-black italic uppercase text-white tracking-widest mb-6 border-b border-white/5 pb-2">${typeNames[type]} Masterpieces</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        ${perfect.map(i => getRankedCard(i, null, false)).join('')}
                    </div>
                </div>
            `;
        }).join('') || '<div class="text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em] w-full">Achieve a 5★ rating to see perfect records.</div>';
        container.innerHTML = html;
    } 
    else if (state.mpTab === 'ranked') {
        const limit = state.mpLimit || 25;
        const ranked = [...state.db]
            .filter(i => i.score > 0 && (state.mpFilter === 'all' || i.type === state.mpFilter))
            .sort((a,b) => b.score - a.score || b.imdb - a.imdb)
            .slice(0, limit);

        html += `
            <div class="flex gap-4 mb-12 overflow-x-auto hide-scroll pb-2">
                ${[3, 10, 25, 100].map(l => `
                    <button onclick="state.mpLimit=${l}; renderMasterpieces()" class="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpLimit === l ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">Top ${l} Records</button>
                `).join('')}
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 animate-in fade-in duration-500">
                ${ranked.map((i, idx) => getRankedCard(i, idx + 1, false)).join('')}
            </div>
            ${ranked.length === 0 ? '<div class="col-span-full text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em]">No ranked data found.</div>' : ''}
        `;
        container.innerHTML = html;
    }
}

function getRankedCard(i, rank, isCrownCard = false) {
    let badgeHtml = '';
    let borderShadow = 'border-white/5 shadow-xl';
    
    if (rank) {
        const color = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-pulse';
        if (isCrownCard && rank <= 3) {
            borderShadow = `border-yellow-500/30 shadow-[0_10px_40px_rgba(255,215,0,0.15)]`;
        }
        
        badgeHtml = `
            <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between z-30 pointer-events-none">
                <div class="text-6xl font-black italic tracking-tighter ${color} drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] opacity-90 group-hover:scale-110 transition-transform origin-bottom-left">
                    #${rank}
                </div>
                <div class="text-[10px] font-black uppercase text-white text-right drop-shadow-md bg-dark/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                    ★ ${i.score}/5<br><span class="text-[8px] text-gray-400">${i.type}</span>
                </div>
            </div>
        `;
    } else {
        // Just the normal score for Perfect 5s
         badgeHtml = `
            <div class="absolute top-3 right-3 z-30 pointer-events-none">
                 <div class="text-[10px] font-black uppercase text-pulse bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    ★ ${i.score}/5
                </div>
            </div>
        `;
    }

    return `
    <div class="group cursor-pointer relative" onclick="openModal(${i.id}, '${i.type === 'movie' ? 'movie' : 'tv'}')">
        <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border ${borderShadow} group-hover:border-pulse transition-all relative">
            <img src="${IMG+i.poster}" class="w-full h-full object-cover bg-dark">
            <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            ${badgeHtml}
            ${getPlayHoverHTML(i)}
        </div>
        <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
        <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-widest">${i.year || 'N/A'} • IMDB: ${i.imdb?.toFixed(1) || '0.0'}</div>
    </div>
    `;
}

// --- TITLE COPY ENGINE ---
function copyModalTitle() {
    const titleText = document.getElementById('mTitle').innerText;
    if (!titleText) return;

    navigator.clipboard.writeText(titleText).then(() => {
        const btn = document.getElementById('copyTitleBtn');
        const icon = btn.querySelector('i');
        
        // Visual Success Feedback
        icon.className = 'fas fa-check text-[#22c55e]';
        btn.classList.add('border-[#22c55e]', 'bg-[#22c55e]/10');
        
        // Trigger your existing beautiful notification
        showNotification(`Copied "${titleText}" to Neural Clipboard!`);
        
        // Reset after 2 seconds
        setTimeout(() => {
            icon.className = 'fas fa-copy text-xs lg:text-base';
            btn.classList.remove('border-[#22c55e]', 'bg-[#22c55e]/10');
        }, 2000);
    }).catch(err => {
        showNotification("Neural link severed. Failed to copy.", true);
    });
}

// --- MOBILE LONG PRESS LISTENER ---
function setupLongPressCopy() {
    const titleEl = document.getElementById('mTitle');
    let pressTimer;

    const startPress = (e) => {
        // Only allow left clicks or touches
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        pressTimer = setTimeout(() => {
            copyModalTitle();
            // Optional: Trigger a tiny haptic vibration on mobile if supported
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms trigger for long press
    };

    const cancelPress = () => {
        clearTimeout(pressTimer);
    };

    titleEl.addEventListener('touchstart', startPress, { passive: true });
    titleEl.addEventListener('touchend', cancelPress);
    titleEl.addEventListener('touchcancel', cancelPress);
    titleEl.addEventListener('touchmove', cancelPress); // Cancel if they drag their finger
    titleEl.addEventListener('mousedown', startPress); // Works for desktop click-and-hold too
    titleEl.addEventListener('mouseup', cancelPress);
    titleEl.addEventListener('mouseleave', cancelPress);
}

// --- DATA DESTRUCTION: CUSTOM PURGE UI ---

        function clearLibrary() {
            if (state.db.length === 0) {
                alert("Your neural library is already empty.");
                return;
            }
            // Open the custom modal
            document.getElementById('purgeModal').classList.remove('hidden');
        }

        function closePurgeModal() {
            document.getElementById('purgeModal').classList.add('hidden');
        }

        function backdropClosePurge(e) {
            if (e.target.id === "purgeModal") {
                closePurgeModal();
            }
        }

        function executePurge() {
            // 1. Wipe the data
            state.db = []; 
            
            // 2. Save the empty state
            save();        
            
            // 3. Clear the UI if we are on the My List page
            if (state.view === 'mylist') {
                document.getElementById('listContainer').innerHTML = `
                    <div class="text-center py-20 text-gray-600 font-black uppercase tracking-widest italic">
                        Library Successfully Purged.
                    </div>
                `; 
            }
            
            // 4. Close the modal
            closePurgeModal();
        }
  // --- NOTIFICATION CLEANUP ROUTINE ---
    if (state.notifications && state.notifications.length > 0) {
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        
        // 1. Keep only notifications from the last 3 days
        state.notifications = state.notifications.filter(notif => {
            return (now - notif.date) < THREE_DAYS_MS; // Assuming notif.date is a timestamp
        });
        
        // 2. Hard cap at 30 items to prevent hoarding
        state.notifications = state.notifications.slice(0, 30);
        
        // Save the cleaned-up state back to local storage
        save();
    }

        init();