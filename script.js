  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}
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
// Smart Mobile Scroll Observer
const navEl = document.getElementById('sidebarNav');
if (navEl) {
    navEl.addEventListener('scroll', () => {
        // Check if user reached the right side (within 10px)
        const isAtEnd = navEl.scrollLeft + navEl.clientWidth >= navEl.scrollWidth - 10;
        if (isAtEnd) {
            navEl.parentElement.classList.add('nav-at-end');
        } else {
            navEl.parentElement.classList.remove('nav-at-end');
        }
    }, { passive: true });
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
        let isSelectMode = false;
        let selectedItems = new Set();
        let notifications = JSON.parse(localStorage.getItem('cp_elite_notifs')) || [];
        let archivedNotifs = JSON.parse(localStorage.getItem('cp_elite_notifs_archived')) || [];
        let currentNotifTab = 'recent';

        let prefs = JSON.parse(localStorage.getItem('cp_elite_prefs')) || {
            listIsGrid: true,
            labIsGrid: true,
            searchLayout: 'grid-cols-4',
            safeMode: true
        };
// Failsafe for existing users
if (typeof prefs.safeMode === 'undefined') prefs.safeMode = true;

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
            reminders: JSON.parse(localStorage.getItem('cp_elite_reminders')) || [],
            catMode: 'trending', // Tracks if category page is looking at trending or upcoming
            catRawData: [], // For local searching
            
            
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
let customSagas = JSON.parse(localStorage.getItem('cp_elite_custom_sagas')) || [];    
    try {
        // Clear preloader
        setTimeout(() => {
            document.getElementById('preloader').style.opacity = '0';
            setTimeout(() => document.getElementById('preloader').style.display = 'none', 800);
        }, 2000);

       const today = getTodayAPI();
const [
        trending, tv, anime, kdrama, turkish, asian, 
        upMovie, upTv, upAnime, upKdrama, upTurkish, upAsian,
        mGenres, tGenres
    ]= await Promise.all([
    fetchAPI('/trending/all/week'),
    fetchAPI('/discover/tv?sort_by=popularity.desc&with_original_language=en'),
    fetchAPI('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc'),
    fetchAPI('/discover/tv?with_original_language=ko&sort_by=popularity.desc'),
    fetchAPI('/discover/tv?with_original_language=tr&sort_by=popularity.desc'),
    fetchAPI('/discover/tv?with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc'),
    
    fetchAPI('/movie/upcoming?region=US'),
    fetchAPI(`/discover/tv?first_air_date.gte=${today}&sort_by=popularity.desc&with_original_language=en`),
    fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`),
    fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_original_language=ko&sort_by=popularity.desc`),
    fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_original_language=tr&sort_by=popularity.desc`),
    fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc`),

    fetchAPI('/genre/movie/list'), fetchAPI('/genre/tv/list')
]);

state.hero = trending.results.filter(i => i.backdrop_path).slice(0, 5);
const allGenres = [...mGenres.genres, ...tGenres.genres];
state.genres = Array.from(new Map(allGenres.map(g => [g.id, g])).values());

renderHero();
// Render Trending
renderRow('row-movies', trending.results.filter(i => i.media_type === 'movie'), 'movie');
renderRow('row-tv', tv.results, 'tv');
renderRow('row-anime', anime.results, 'tv');
renderRow('row-kdrama', kdrama.results, 'tv');
renderRow('row-turkish', turkish.results, 'tv');
renderRow('row-asian', asian.results, 'tv');

// Render Upcoming
renderRow('row-up-movies', upMovie.results, 'movie');
renderRow('row-up-tv', upTv.results, 'tv');
renderRow('row-up-anime', upAnime.results, 'tv');
renderRow('row-up-kdrama', upKdrama.results, 'tv');
renderRow('row-up-turkish', upTurkish.results, 'tv');
renderRow('row-up-asian', upAsian.results, 'tv');

checkReminders(); // Fire reminder check on load
                
                setupFilters();
                updateCounters();
                startClock();
                setupSearchBehavior();
                setupStarLogic();
                initNeuralEngine();
                renderSources();
                setupLongPressCopy();
                setInterval(nextHero, 10000);
                setupModalSearch();
                loadCountries();
                updateSafeModeUI();
                setupLongPressSelection();
                
            } catch (e) { console.error("Neural init error", e); 
                
       
            }
        }

        async function fetchAPI(path) {
            const res = await fetch(`${BASE}${path}${path.includes('?')?'&':'?'}api_key=${API_KEY}`);
            return res.json();
        }
        // api helper 
function getTodayAPI() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
        // Navigation
function navigate(view) {
    showLoader(); 
    state.view = view;
    
    // Temporarily disable hover pointer events to force sidebar collapse
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar) {
        sidebar.classList.add('pointer-events-none');
        setTimeout(() => sidebar.classList.remove('pointer-events-none'), 600);
    }

    // Handle Page Transitions
    document.querySelectorAll('.page-view').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('page-transition-enter');
    });

    const targetView = document.getElementById(`view-${view}`);
    targetView.classList.remove('hidden');
    
    
    // Force DOM reflow to restart CSS animation
    void targetView.offsetWidth; 
    targetView.classList.add('page-transition-enter');

    document.getElementById('pathLabel').innerText = view.toUpperCase();
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick').includes(`'${view}'`));
    if(btn) btn.classList.add('active');

    // Run view specific logic
    if(view === 'mylist') renderList();
    if(view === 'upcoming') loadUpcomingPage(); 
    if(view === 'rhythmlab') runLab();
    if(view === 'sync') renderSync();
    if(view === 'masterpieces') renderMasterpieces();
    if(view === 'sagamatrix') renderSagaMatrix();

    if(view === 'search') {
        const input = document.getElementById('mainSearch');
        const header = document.getElementById('searchHeader');
        if (!input.value && !header.innerText.includes('• Works')) {
            header.innerText = "Discover";
            loadDiscoverContent();
        }
    }
    if(view === 'radar') renderRadar();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(hideLoader, 300); 
}  

        // Search Behavior
// --- UPDATED SEARCH & MODAL LOGIC ---
function setupSearchBehavior() {
    const input = document.getElementById('mainSearch');
    const bar = document.getElementById('searchBar');
    const drop = document.getElementById('searchDrop');
    const clearBtn = document.getElementById('clearSearch');
    
    let searchTimeout; 
    let hoverTimeout;  
    let idleTimeout;   

    const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        if (input.value.trim()) {
            idleTimeout = setTimeout(() => {
                input.value = '';
                clearBtn.classList.add('hidden');
                drop.classList.add('hidden');
                bar.classList.remove('active');
                document.body.classList.remove('search-active-mobile');
                input.blur();
            }, 15000); 
        }
    };

    input.onfocus = () => {
        bar.classList.add('active');
        document.body.classList.add('search-active-mobile'); // Hides notifs on mobile
        
        if (state.view !== 'search' && input.value.trim()) drop.classList.remove('hidden');
        else drop.classList.add('hidden'); 
        resetIdleTimer();
    };

    bar.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            drop.classList.add('hidden');
            bar.classList.remove('active');
            if (!input.matches(':focus')) document.body.classList.remove('search-active-mobile');
        }, 400); 
    });

    bar.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        if (input.value.trim() && state.view !== 'search') {
            drop.classList.remove('hidden');
            bar.classList.add('active');
            document.body.classList.add('search-active-mobile');
        }
        resetIdleTimer();
    });

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = input.value.trim();
            if (q) {
                drop.classList.add('hidden');
                bar.classList.remove('active');
                document.body.classList.remove('search-active-mobile');
                input.blur(); 
                navigate('search');
                deepSearch(q);
                
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
        document.body.classList.remove('search-active-mobile');
        
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
            searchTimeout = setTimeout(() => { deepSearch(q); }, 500); 
        } else {
            if(!q) { drop.classList.add('hidden'); return; }
            searchTimeout = setTimeout(async () => {
                const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(q)}&include_adult=${!prefs.safeMode}`);
                if (state.view !== 'search') renderDrop(data.results.slice(0, 8), q); 
            }, 300);
        }
    };

    document.addEventListener('click', (e) => {
        if (!bar.contains(e.target) && e.target.id !== 'clearSearch') {
            drop.classList.add('hidden');
            bar.classList.remove('active');
            document.body.classList.remove('search-active-mobile');
        }
    });

  //modal 
const modalSearch = document.getElementById('modalSearch');
if (modalSearch) {
    modalSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const query = e.target.value.trim();
            closeModal(); // Eject from modal view
            document.getElementById('mainSearch').value = ''; // Don't crowd the top bar
            deepSearch(query); // Trigger the cinematic search
            e.target.value = ''; // Clear the input for next time
        }
    });
}

}
 
// Add this new function
function setupModalSearch() {
    const wrapper = document.getElementById('modalSearchWrapper');
    const container = document.getElementById('modalSearchContainer');
    const input = document.getElementById('modalSearch');
    const drop = document.getElementById('modalSearchDrop');
    const closeBtn = document.getElementById('closeModalSearch');
    let mSearchTimeout;

    // 1. Expand on Mobile Click
    container.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
            wrapper.classList.add('expanded');
            input.focus();
            closeBtn.classList.remove('hidden');
        }
    });

    // 2. Logic to "Disappear" or Collapse after search
    const finishSearch = () => {
        wrapper.classList.remove('expanded');
        input.value = '';
        drop.classList.add('hidden');
        closeBtn.classList.add('hidden');
        input.blur();
    };

    // 3. Handle Searching
    input.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        clearTimeout(mSearchTimeout);
        if (!q) { drop.classList.add('hidden'); return; }

        mSearchTimeout = setTimeout(async () => {
            const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false`);
            renderModalDrop(data.results.slice(0, 5), q);
        }, 300);
    });

    // 4. Hit Enter -> Go to search page and collapse search bar
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const query = input.value.trim();
            closeModal(); // Close the info modal
            finishSearch(); // Collapse the bar
            deepSearch(query);
        }
    });

    // Close button for mobile
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        finishSearch();
    });

    // Collapse if clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            finishSearch();
        }
    });
}
function renderModalDrop(res, query) {
    const drop = document.getElementById('modalSearchDrop');
    if(!res.length) { drop.classList.add('hidden'); return; }
    drop.classList.remove('hidden');
    
    let html = res.map(i => {
        const isPerson = i.media_type === 'person';
        const img = isPerson ? i.profile_path : i.poster_path;
        const type = i.media_type || 'movie'; // Defaulting for the quickAdd call
        
        // Routing logic
        const call = isPerson 
            ? `closeModal(); openActor(${i.id}, '${i.name.replace(/'/g, "\\'")}')` 
            : `openModal(${i.id}, '${type}')`; 
        
        return `
            <div onmousedown="${call}" 
                 class="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 transition-all group relative">
                
                ${!isPerson ? `
                    <button onmousedown="event.stopPropagation(); quickAdd(${i.id}, '${type}')" 
                            class="w-8 h-8 flex items-center justify-center bg-dark/80 backdrop-blur-md border border-white/10 rounded-lg text-pulse hover:bg-pulse hover:text-white transition-all z-50">
                        <i class="fas fa-plus text-[10px]"></i>
                    </button>
                ` : '<div class="w-8"></div>'}

                <img src="${img ? IMG+img : 'https://via.placeholder.com/50'}" class="w-8 h-12 rounded-lg object-cover shadow-lg">
                <div class="flex-1 min-w-0">
                    <div class="text-[9px] font-black uppercase text-white line-clamp-1">${i.title || i.name}</div>
                    <div class="text-[7px] text-gray-400 font-bold uppercase mt-1">
                        ${isPerson ? 'Artist' : (type + ' • ' + (i.release_date || i.first_air_date || '').split('-')[0])}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    html += `
        <div onmousedown="closeModal(); deepSearch('${query.replace(/'/g, "\\'")}')" 
             class="p-3 text-center bg-pulse/20 hover:bg-pulse text-pulse hover:text-white cursor-pointer transition-all flex items-center justify-center gap-2">
            <span class="text-[9px] font-black uppercase tracking-widest">See all results</span>
        </div>
    `;
    
    drop.innerHTML = html;
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

//filters and credits 
const talkShowKeywords = ['self', 'talk-show', 'host', 'guest'];

currentPersonCredits = credits.cast
    .filter(c => {
        // 1. Must have a poster
        if (!c.poster_path) return false;
        
        // 2. Filter out Talk Shows / "Self" appearances
        const role = (c.character || '').toLowerCase();
        const isSelf = talkShowKeywords.some(keyword => role.includes(keyword));
        return !isSelf;
    })
    .sort((a, b) => {
        // 3. Sort: Best works first (Popularity + Vote Count weighting)
        const scoreA = (a.popularity || 0) * (a.vote_count || 1);
        const scoreB = (b.popularity || 0) * (b.vote_count || 1);
        return scoreB - scoreA;
    });

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
    
function renderDrop(items, query) {
    const drop = document.getElementById('searchDrop');
    if (!items || items.length === 0) {
        drop.innerHTML = `<div class="p-4 text-[10px] font-bold text-gray-500 uppercase italic">No signals found for "${query}"</div>`;
    } else {
        drop.innerHTML = items.map(i => {
            const title = i.title || i.name;
            const year = (i.release_date || i.first_air_date || '').split('-')[0];
            const type = determineCategory(i);
            const tmdbType = i.media_type || (i.title ? 'movie' : 'tv');
            const label = formatTypeLabel(type, tmdbType);

            return `
                <div class="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 group relative" 
                     onclick="openModal(${i.id}, '${tmdbType}')">
                    <img src="${i.poster_path ? IMG + i.poster_path : 'https://via.placeholder.com/45x68?text=?'}" 
                         class="w-10 h-14 object-cover rounded shadow-md">
                    <div class="flex-1 min-w-0">
                        <div class="text-[11px] font-black uppercase truncate group-hover:text-pulse transition-colors">${title}</div>
                        <div class="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest">
                            ${label} • ${year || 'TBA'}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); quickAdd(${i.id}, '${tmdbType}')" 
                            class="p-2 px-3 bg-pulse/10 hover:bg-pulse text-pulse hover:text-white rounded-lg transition-all border border-pulse/20">
                        <i class="fas fa-plus text-[10px]"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    drop.classList.remove('hidden');
}

// Logic for the Quick Add Button
function quickWatch(event, id, cat, title, year) {
    event.preventDefault();
    event.stopPropagation();

    const availableSources = sourcesDb[cat] || [];
    const safeTitle = encodeURIComponent(title);
    const safeYear = year;
    const tmdbType = (cat === 'tv' || cat === 'anime' || cat === 'kdrama' || cat === 'turkish' || cat === 'asian') ? 'tv' : 'movie';

    // 1. BUILT-IN PLAYER SECTION
    let html = `
        <div class="mb-6 border-b border-white/10 pb-6">
            <h4 class="text-[10px] font-black uppercase text-[#22c55e] tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-play"></i> Neural Stream (Built-in)
            </h4>
            <button onclick="launchInternalPlayer(${id}, '${tmdbType}', '${safeTitle}')"
                    class="w-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">
                <i class="fas fa-broadcast-tower"></i> Launch Secure Stream
            </button>
        </div>
        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
            <i class="fas fa-external-link-alt"></i> External Sources
        </h4>
    `;

    // 2. EXTERNAL SOURCES SECTION
    if (availableSources.length === 0) {
        html += `
            <div class="text-center py-4 space-y-3 bg-dark/50 rounded-xl border border-white/5">
                <p class="text-[9px] text-gray-500 uppercase font-bold px-4 leading-relaxed">
                    No custom external links configured for <span class="text-${cat}">${cat}</span>.
                </p>
                <button onclick="document.getElementById('watchModal').classList.add('hidden'); navigate('sources');" 
                        class="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] uppercase font-black hover:bg-white/10 transition-all w-full">
                    Configure Sources
                </button>
            </div>
        `;
    } else {
        html += `<div class="space-y-2 max-h-[30vh] overflow-y-auto hide-scroll pr-1">`;
        html += availableSources.map(src => {
            const finalUrl = src.url.replace(/{title}/g, safeTitle).replace(/{tmdb_id}/g, id).replace(/{year}/g, safeYear);
            let domain = 'Link';
            try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch(e){}
            
            return `
                <a href="${finalUrl}" target="_blank" onclick="document.getElementById('watchModal').classList.add('hidden')" 
                   class="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-${cat} hover:bg-${cat}/10 transition-all group">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-6 h-6 rounded-md grayscale group-hover:grayscale-0 transition-all">
                    <div class="flex-1">
                        <div class="text-[10px] font-black uppercase text-white group-hover:text-${cat} line-clamp-1">${src.name}</div>
                        <div class="text-[7px] text-gray-500 uppercase tracking-widest mt-1">${domain}</div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-700 group-hover:text-${cat} transition-all text-[10px]"></i>
                </a>
            `;
        }).join('');
        html += `</div>`;
    }
    
    document.getElementById('watchSourceList').innerHTML = html;
    document.getElementById('watchModal').classList.remove('hidden');
}

// Updated deepSearch to handle "all results" and spelling 
async function deepSearch(q) {
    if (state.view !== 'search') navigate('search');
    
    const grid = document.getElementById('searchGrid');
    const header = document.getElementById('searchHeader');
    const loadBtn = document.getElementById('discoverLoadContainer');
    const actorBanner = document.getElementById('actorProfileBanner');
    
    actorBanner.classList.add('hidden');
    
    if (!q) {
        loadDiscoverContent();
        return;
    }

    state.searchMode = 'search';
    header.innerText = `Results: ${q}`;
    loadBtn.classList.add('hidden'); 
    grid.innerHTML = '<div class="page-loader"></div>';
    
    // 1. Dynamic API Query based on Safe Mode
    const adultParam = prefs.safeMode ? 'false' : 'true';
    const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(q)}&include_adult=${adultParam}`);
    
    if(!data.results || data.results.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-gray-600 font-black uppercase italic tracking-[0.5em]">No Neural Matches Found</div>`;
        return;
    }
    
    // 2. Strict Local Failsafe (Double-checks TMDB's work)
    let safeResults = data.results;
    if (prefs.safeMode) {
        // Physically strip out anything with an adult flag
        safeResults = safeResults.filter(item => item.adult !== true);
    }
    
    // 3. UI Reaction if all results were blocked
    if(safeResults.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-pulse font-black uppercase italic tracking-[0.2em]"><i class="fas fa-shield-alt text-2xl mb-4 block"></i>Content Blocked by Neural Safe Mode</div>`;
        return;
    }

    state.discoverDataRaw = safeResults;
    applyDiscoverLocalFilters();
}


// Replace your existing applySearchFilters() with this
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
    const country = document.getElementById('searchCountry').value; // Now capturing the Country
    const sort = document.getElementById('searchSort').value;
    
    // Check which category pill is active so we search the right TMDB database
    const activeType = state.discoverFilters.type;
    const apiType = (activeType === 'tv' || activeType === 'anime' || activeType === 'kdrama' || activeType === 'turkish' || activeType === 'asian') ? 'tv' : 'movie';
    
   let path = `/discover/${apiType}?sort_by=${sort}&page=${state.filterPage}`;
    
    // THE ASIAN FILTER OVERRIDE FIX
    if (activeType === 'asian') {
        path += `&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16`;
    } else if (activeType === 'anime') {
        path += `&with_genres=16&with_original_language=ja`;
    } else if (activeType === 'kdrama') {
        path += `&with_original_language=ko`;
    } else if (activeType === 'turkish') {
        path += `&with_original_language=tr`;
    }
    
    // Apply Year (TMDB uses different parameters for Movies vs TV)
    if(year) {
        if (apiType === 'movie') path += `&primary_release_year=${year}`;
        else path += `&first_air_date_year=${year}`;
    }
    
    // Apply Country
    if(country) {
        path += `&with_origin_country=${country}`;
    }

    // Capture genres from the new pill system if any are active
    if (state.discoverFilters.genres && state.discoverFilters.genres.length > 0) {
        path += `&with_genres=${state.discoverFilters.genres.join(',')}`;
    }
    
    try {
        const data = await fetchAPI(path);
        renderGrid('searchGrid', data.results, apiType, !append);
        applyLayoutToGrid();
        
        if (data.page < data.total_pages) loadBtn.classList.remove('hidden');
        else loadBtn.classList.add('hidden');
    } catch (err) {
        console.error("Neural filter error:", err);
        document.getElementById('searchGrid').innerHTML = `<div class="col-span-full py-20 text-center text-pulse font-black uppercase tracking-widest">Filter Link Severed</div>`;
    }
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
    let modalCountdownInterval;
    if (!isBack && state.active) {
        state.modalHistory.push({ id: state.active.id, type: state.active.media_type });
    }
    document.getElementById('mBackBtn').classList.toggle('hidden', state.modalHistory.length === 0);

    let details, credits, vids;
    
    // Smart API Retry System (Prevents Asian Movies failing when assumed as TV)
    try {
        [details, credits, vids] = await Promise.all([
            fetchAPI(`/${type}/${id}`),
            fetchAPI(`/${type}/${id}/credits`),
            fetchAPI(`/${type}/${id}/videos`)
        ]);
    } catch (error) {
        console.warn(`Neural fetch failed as ${type}, attempting sub-type extraction...`);
        const retryType = type === 'movie' ? 'tv' : 'movie';
        try {
            [details, credits, vids] = await Promise.all([
                fetchAPI(`/${retryType}/${id}`),
                fetchAPI(`/${retryType}/${id}/credits`),
                fetchAPI(`/${retryType}/${id}/videos`)
            ]);
            type = retryType; // Successfully corrected the type
        } catch (fatalError) {
            console.error("Neural Fetch failed entirely.", fatalError);
            showNotification("Data Archive Corrupted. Failed to fetch entity.", true);
            return;
        }
    }

    state.active = { ...details, media_type: type };
    const local = state.db.find(i => i.id === id);
const originalRenderMasterpieces = renderMasterpieces;
renderMasterpieces = function() {
    // Call the original, but intercept the 'crowned' tab HTML generation
    if (state.mpTab !== 'crowned') {
        originalRenderMasterpieces();
        return;
    }
    
    const container = document.getElementById('mpContainer');
    const types = ['movie', 'tv', 'anime', 'kdrama', 'turkish', 'asian'];
    const typeNames = { movie: 'Movies', tv: 'Series', anime: 'Anime', kdrama: 'K-Drama', turkish: 'Turkish', asian: 'Asian Drama' };
    
    let html = `
        <div class="flex gap-4 mb-8 overflow-x-auto hide-scroll pb-2">
            <button onclick="state.mpFilter='all'; renderMasterpieces()" class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpFilter === 'all' ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">All Types</button>
            ${types.map(t => `
                <button onclick="state.mpFilter='${t}'; renderMasterpieces()" class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpFilter === t ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">${typeNames[t]}</button>
            `).join('')}
        </div>
    `;

    let displayTypes = state.mpFilter === 'all' ? types : [state.mpFilter];

    html += displayTypes.map(type => {
        const crowned = state.db.filter(i => i.type === type && i.crown > 0 && i.crown < 4).sort((a,b) => a.crown - b.crown);
        const sovereigns = state.db.filter(i => i.type === type && i.crown === 4);
        
        if(!crowned.length && !sovereigns.length) return '';
        
        let sectionHtml = `
            <div class="mb-16 animate-in fade-in duration-500">
                <h3 class="text-xl md:text-2xl font-black italic uppercase text-yellow-500/80 tracking-widest mb-6 md:mb-8 border-b border-white/5 pb-4 flex items-center gap-4">
                    <i class="fas fa-crown"></i> ${typeNames[type]} Royal Court
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"> 
                    ${crowned.map(i => getRankedCard(i, i.crown, true)).join('')}
                </div>
        `;
        
        // Group Sovereigns by Realm
        if (sovereigns.length > 0) {
             const realms = {};
             sovereigns.forEach(s => {
                 const rName = s.realm || 'Cinematic';
                 if (!realms[rName]) realms[rName] = [];
                 realms[rName].push(s);
             });
             
             Object.keys(realms).sort().forEach(realmName => {
                 sectionHtml += `
                    <h4 class="text-sm font-black italic uppercase text-pulse tracking-widest mt-12 mb-6 flex items-center gap-3">
                        <i class="fas fa-gem"></i> ${realmName} Sovereigns
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"> 
                        ${realms[realmName].map(i => getRankedCard(i, 4, true, realmName)).join('')}
                    </div>
                 `;
             });
        }
        sectionHtml += `</div>`;
        return sectionHtml;
    }).join('') || '<div class="text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em] w-full">No crowned items in this category.</div>';
    
    container.innerHTML = html;
};
    document.getElementById('mBackdrop').src = IMG_HD + (details.backdrop_path || details.poster_path);
    document.getElementById('mTitle').innerText = (details.title || details.name);
    document.getElementById('mOverview').innerText = details.overview || "Narrative archive encrypted.";
    document.getElementById('mYear').innerText = (details.release_date || details.first_air_date || '----').split('-')[0];
    document.getElementById('mRating').innerHTML = `<i class="fas fa-star text-pulse"></i> ${details.vote_average?.toFixed(1) || '0.0'}`;
    // Country Tag Logic
    const countryArr = details.origin_country || (details.production_countries ? details.production_countries.map(c => c.iso_3166_1) : []);
    const cTag = document.getElementById('mCountry');
    if (countryArr && countryArr.length > 0) {
        cTag.innerText = countryArr[0];
        cTag.classList.remove('hidden');
    } else {
        cTag.classList.add('hidden');
    }
    //type override 
    const calculatedType = local ? local.type : determineCategory(details);
    document.getElementById('mTypeOverride').value = calculatedType;

    // --- STATUS & COUNTDOWN ENGINE ---
    clearInterval(modalCountdownInterval);
    const mAirStatus = document.getElementById('mAirStatus');
    const cBox = document.getElementById('mCountdownBox');
    const cTimer = document.getElementById('mCountdownTimer');
    const cLabel = document.getElementById('mCountdownLabel');
    
    mAirStatus.classList.add('hidden');
    cBox.classList.add('hidden');

    // Handle Episodic Status
    if (type !== 'movie' && details.status) {
        mAirStatus.classList.remove('hidden');
        if (details.status === 'Returning Series' || details.in_production) {
            mAirStatus.innerText = 'Airing';
            mAirStatus.className = "hidden absolute top-4 right-4 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase border z-30 text-[#22c55e] border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        } else if (details.status === 'Ended') {
            mAirStatus.innerText = 'Finished Airing';
            mAirStatus.className = "hidden absolute top-4 right-4 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase border z-30 text-gray-400 border-gray-600";
        } else if (details.status === 'Canceled') {
            mAirStatus.innerText = 'Canceled';
            mAirStatus.className = "hidden absolute top-4 right-4 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase border z-30 text-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
        }
        mAirStatus.classList.remove('hidden');
    }

    // Handle Countdown
    let targetDateStr = null;
    let labelText = '';

    if (type === 'movie' && details.release_date && new Date(details.release_date) > new Date()) {
        targetDateStr = details.release_date;
        labelText = "Theatrical Release In";
    } else if (type !== 'movie' && details.next_episode_to_air) {
        targetDateStr = details.next_episode_to_air.air_date;
        labelText = `Season ${details.next_episode_to_air.season_number} Episode ${details.next_episode_to_air.episode_number} Airs In`;
    }

    if (targetDateStr) {
        cBox.classList.remove('hidden');
        cLabel.innerText = labelText;
        
        // Setup Remind Button State
        const isReminded = state.reminders.some(r => r.id === id);
        updateRemindBtnUI(isReminded);

        // Manually split the string to force local timezone calculation
        const [cYear, cMonth, cDay] = targetDateStr.split('-');
        const target = new Date(cYear, cMonth - 1, cDay).getTime();
        const updateTimer = () => {
            const diff = target - new Date().getTime();
            if (diff < 0) {
                cTimer.innerHTML = '<span class="text-[#22c55e] animate-pulse">AVAILABLE NOW</span>';
                clearInterval(modalCountdownInterval);
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            
           cTimer.innerHTML = `
                <div class="flex flex-col items-center w-12 md:w-16"><span class="text-pulse tabular-nums">${d}</span><span class="text-[8px] text-gray-500 uppercase">Days</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${h.toString().padStart(2,'0')}</span><span class="text-[8px] text-gray-500 uppercase">Hrs</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${m.toString().padStart(2,'0')}</span><span class="text-[8px] text-gray-500 uppercase">Min</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${s.toString().padStart(2,'0')}</span><span class="text-[8px] text-gray-500 uppercase">Sec</span></div>
            `;
        };
        updateTimer();
        modalCountdownInterval = setInterval(updateTimer, 1000);
    }
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
    populateSagaDropdown(local ? local.sagaId : null);
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
        
        // Extract exact TMDB type and Origin Country
        let tmdb_type = item.media_type || (item.title ? 'movie' : 'tv');
        let country = (item.origin_country && item.origin_country.length > 0) 
            ? item.origin_country[0] 
            : ((item.production_countries && item.production_countries.length > 0) ? item.production_countries[0].iso_3166_1 : '');

        existing = {
            id: item.id,
            title: item.title || item.name,
            poster: item.poster_path,
            type: cat,
            tmdb_type: tmdb_type,
            country: country,
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
    
    save(); 
    updateRatingCard(existing); 
    
    document.getElementById('mRemoveBtn').classList.remove('hidden');
    
    const total = item.number_of_episodes || 1;
    // Utilize tmdb_type to accurately show the episode tracker
    if (existing.tmdb_type !== 'movie' && total > 1) {
        document.getElementById('mProgressBox').classList.remove('hidden');
        document.getElementById('mEpRange').max = total;
        document.getElementById('mEpRange').value = existing.ep || 0;
        updateEpUI(existing.ep || 0, total);
    } else {
        document.getElementById('mProgressBox').classList.add('hidden');
    }
}

// --- QUICK ADD ENGINE ---
async function quickAdd(id, type) {
    showLoader();
    try {
        // 1. Check if it already exists to prevent duplicates
        let existing = state.db.find(i => i.id === id);
        if (existing) {
            showNotification("Entity already exists in your library.", true);
            hideLoader();
            return;
        }

        // 2. Fetch full details to build a complete record
        const details = await fetchAPI(`/${type}/${id}`);

        // 3. Parse categories and origin data exactly like the main status updater
        let cat = determineCategory(details);
        let tmdb_type = details.media_type || type;
        let country = (details.origin_country && details.origin_country.length > 0) 
            ? details.origin_country[0] 
            : ((details.production_countries && details.production_countries.length > 0) ? details.production_countries[0].iso_3166_1 : '');

        // 4. Construct the Neural Record
        const newItem = {
            id: details.id,
            title: details.title || details.name,
            poster: details.poster_path,
            type: cat,
            tmdb_type: tmdb_type,
            country: country,
            status: 'Plan to Watch', // Default quick-add status
            ep: 0,
            max_ep: details.number_of_episodes || 1,
            score: 0,
            crown: 0,
            imdb: details.vote_average,
            year: (details.release_date || details.first_air_date || '').split('-')[0],
            genres: (details.genres || []).map(g => g.id),
            added: Date.now()
        };

        // 5. Save and refresh the UI silently
        state.db.push(newItem);
        save(); // Triggers UI counter updates and list re-renders automatically
        
        showNotification(`Added "${newItem.title}" to Plan to Watch!`);

    } catch (error) {
        console.error("Quick Add failed:", error);
        showNotification("Neural link severed. Failed to add entity.", true);
    }
    hideLoader();
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
            ${displayItems.map(i => {
                const actualType = i.tmdb_type || (i.type === 'movie' ? 'movie' : 'tv');
                const displayLabel = formatTypeLabel(i.type, actualType);
                const countryStr = i.country ? ` • ${i.country}` : '';
                
                return state.isGrid ? `
              <div class="lib-card-wrapper relative group cursor-pointer selectable-card ${isSelectMode ? 'select-mode-pulse' : ''} ${selectedItems.has(i.id) ? 'card-selected' : ''}" data-id="${i.id}" onclick="handleCardClick(event, ${i.id}, '${actualType}')">
                    
                    <div class="card-checkbox ${selectedItems.has(i.id) ? 'selected' : ''} ${!isSelectMode ? 'hidden' : ''}">
                        <i class="fas fa-check"></i>
                    </div>

                    <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                        <img src="${IMG+i.poster}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                        
                        ${getPlayHoverHTML(i)}
                        ${getLiquidHTML(i)}
                    </div>
                    <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
                    <div class="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-widest">${displayLabel}${countryStr} • ★ ${parseFloat(i.imdb).toFixed(1)}</div>
                </div>

            ` : `

               <div class="lib-card-wrapper lib-card-row relative cursor-pointer group selectable-card ${isSelectMode ? 'select-mode-pulse' : ''} ${selectedItems.has(i.id) ? 'card-selected' : ''}" data-id="${i.id}" onclick="handleCardClick(event, ${i.id}, '${actualType}')">
                    
                    <div class="card-checkbox ${selectedItems.has(i.id) ? 'selected' : ''} ${!isSelectMode ? 'hidden' : ''}">
                        <i class="fas fa-check"></i>
                    </div>

                    <div class="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-pulse/50 transition-all">
                        <img src="${IMG+i.poster}" class="w-full h-full object-cover">
                        ${getPlayHoverHTML(i)}
                        ${getLiquidHTML(i)}
                    </div>
                    <div class="flex-1 ml-4 md:ml-6">
                        <div class="text-[14px] md:text-[16px] font-black uppercase italic group-hover:text-pulse transition-colors">${i.title}</div>
                        <div class="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-3">
                            <span class="bg-white/5 px-2 py-1 rounded-md">${displayLabel}</span> 
                            ${i.country ? `<span class="text-pulse border border-pulse/30 px-2 py-1 rounded-md bg-pulse/10">${i.country}</span>` : ''}
                            <span>${i.year}</span>
                        </div>
                    </div>
                    <div class="stats text-right shrink-0">
                        <div class="text-[12px] font-black text-pulse">★ ${parseFloat(i.imdb).toFixed(1)}</div>
                        <div class="text-[9px] font-bold text-gray-600 mt-2 uppercase">My Score: ${i.score ? i.score + '/5' : '-'}</div>
                    </div>
                </div>

            `}).join('')}
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
function updateRemindBtnUI(isReminded) {
    const btn = document.getElementById('mRemindBtn');
    if (isReminded) {
        btn.className = "w-full lg:w-auto px-8 py-4 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0";
        document.getElementById('mRemindText').innerText = "Tracking on Radar";
        btn.querySelector('i').className = "fas fa-check";
    } else {
        btn.className = "w-full lg:w-auto px-8 py-4 bg-pulse text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-pulse/30 flex items-center justify-center gap-3 shrink-0";
        document.getElementById('mRemindText').innerText = "Remind Me";
        btn.querySelector('i').className = "fas fa-bell";
    }
}

function toggleReminder() {
    const item = state.active;
    if (!item) return;

    const idx = state.reminders.findIndex(r => r.id === item.id);
    if (idx > -1) {
        state.reminders.splice(idx, 1);
        updateRemindBtnUI(false);
        showNotification(`Removed ${item.title || item.name} from Radar.`);
    } else {
        let releaseDate = item.release_date;
        if (item.media_type !== 'movie' && item.next_episode_to_air) {
            releaseDate = item.next_episode_to_air.air_date;
        }
        
        state.reminders.push({
            id: item.id,
            title: item.title || item.name,
            poster: item.poster_path,
            type: item.media_type,
            date: releaseDate,
            added: Date.now()
        });
        updateRemindBtnUI(true);
        showNotification(`Tracking ${item.title || item.name} on Neural Radar!`);
    }
    localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));
    if (state.view === 'radar') renderRadar();
    if (state.view === 'upcoming') renderUpcomingRadar(); 
}

function renderRadar() {
    const grid = document.getElementById('radarGrid');
    const empty = document.getElementById('radarEmptyState');
    
    
    // Automatically prune items that have been added to the main library
    const dbIds = new Set(state.db.map(i => i.id));
    state.reminders = state.reminders.filter(r => !dbIds.has(r.id));
    localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));

    if (state.reminders.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        
        // Auto-navigate away if it becomes empty while viewing, as requested
        if (state.view === 'radar' && state.modalHistory.length === 0) {
            // setTimeout(() => navigate('home'), 2000); // Optional auto-redirect
        }
        return;
    }

    empty.classList.add('hidden');
    
    grid.innerHTML = state.reminders.map(r => {
        const diff = new Date(r.date).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const urgency = days <= 1 ? 'text-[#22c55e] animate-pulse' : (days <= 7 ? 'text-[#f59e0b]' : 'text-pulse');
        const dayText = days < 0 ? 'AVAILABLE NOW' : (days === 0 ? 'TODAY' : `IN ${days} DAYS`);

        return `
        <div class="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[24px] hover:border-pulse/50 transition-all cursor-pointer group" onclick="openModal(${r.id}, '${r.type}')">
            <img src="${IMG + r.poster}" class="w-16 h-24 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform">
            <div class="flex-1">
                <div class="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1 border border-white/10 inline-block px-2 py-0.5 rounded">${r.type}</div>
                <h4 class="text-sm md:text-base font-black italic uppercase text-white line-clamp-1 group-hover:text-pulse transition-colors">${r.title}</h4>
                <div class="text-[10px] font-black uppercase tracking-widest mt-2 ${urgency}">${dayText}</div>
            </div>
            <button onclick="event.stopPropagation(); state.active = {id: ${r.id}}; toggleReminder();" class="w-10 h-10 rounded-full bg-dark/50 border border-white/10 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/10 transition-all shrink-0">
                <i class="fas fa-trash-alt text-[10px]"></i>
            </button>
        </div>
        `;
    }).join('');
}

function checkReminders() {
    const today = new Date().getTime();
    state.reminders.forEach(r => {
        const target = new Date(r.date).getTime();
        const diff = target - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        // Alert if it releases today or yesterday (grace period)
        if (days <= 0 && days >= -1) {
            dispatchNotification(r, 'RADAR ALERT', `${r.title} has officially released!`);
        }
    });
}


// Lab Engine
function runLab() {
    // 1. Grab filter values from the UI
    const status = document.getElementById('labStatus').value;
    const year = document.getElementById('labYear').value;
    const imdb = document.getElementById('labImdb').value;
    const pers = document.getElementById('labPersonal').value;

    // 2. Filter the database based on UI state
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

    // 3. Apply sorting and update count
    filtered.sort((a, b) => state.labSort === 'newest' ? b.added - a.added : a.added - b.added);
    document.getElementById('labCount').innerText = filtered.length;

    const labGrid = document.getElementById('labGrid');
    labGrid.className = state.labIsGrid ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6' : 'flex flex-col gap-4';

    // 4. Render the HTML
        labGrid.innerHTML = filtered.map(item => {
        const actualType = item.tmdb_type || (item.type === 'movie' ? 'movie' : 'tv');
        const displayLabel = formatTypeLabel(item.type, actualType);
        const countryStr = item.country ? ` • ${item.country}` : '';
        
        const isSelected = typeof selectedItems !== 'undefined' && selectedItems.has(item.id);
        const activeSelectClass = isSelectMode ? 'select-mode-pulse' : '';
        const checkboxHiddenClass = !isSelectMode ? 'hidden' : '';
        const checkboxSelectedClass = isSelected ? 'selected' : '';

        if (state.labIsGrid) {
            return `
           <div class="group cursor-pointer relative selectable-card ${activeSelectClass} ${isSelected ? 'card-selected' : ''}" 
                 data-id="${item.id}" 
                 data-type="${item.type}" 
                 onclick="handleCardClick(event, ${item.id}, '${actualType}')">
                
                <div class="card-checkbox ${checkboxSelectedClass} ${checkboxHiddenClass}">
                    <i class="fas fa-check"></i>
                </div>

                <div class="aspect-[2/3] rounded-[24px] overflow-hidden mb-3 border-t-4 border-${item.type} group-hover:scale-105 transition-all shadow-xl relative">
                    <img src="${IMG + item.poster}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10"></div>
                    
                    <div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-${item.type} border border-white/10 z-30">
                        ${displayLabel}
                    </div>
                    
                    <div class="absolute bottom-3 left-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-white border border-white/10 z-30 flex gap-2">
                        ${item.country ? `<span class="text-gray-400">${item.country}</span>` : ''} <span>${item.status}</span>
                    </div>

                    ${getPlayHoverHTML(item)}
                    ${getLiquidHTML(item)}
                </div>
                <div class="text-[9px] font-black uppercase line-clamp-1">${item.title}</div>
            </div>`;
        } else {
            return `
            <div class="lib-card-row cursor-pointer group selectable-card ${activeSelectClass} ${isSelected ? 'card-selected' : ''}" 
                 data-id="${item.id}" 
                 data-type="${item.type}" 
                 onclick="handleCardClick(event, ${item.id}, '${actualType}')">
                
                <div class="card-checkbox ${checkboxSelectedClass} ${checkboxHiddenClass}">
                    <i class="fas fa-check"></i>
                </div>

                <div class="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-pulse/50 transition-all">
                    <img src="${IMG + item.poster}" class="w-full h-full object-cover">
                    ${getLiquidHTML(item)}
                </div>
                <div class="flex-1 ml-4 md:ml-6">
                    <div class="text-[14px] md:text-[16px] font-black uppercase italic group-hover:text-pulse transition-colors">${item.title}</div>
                    <div class="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-3">
                        <span class="bg-white/5 px-2 py-1 rounded-md">${displayLabel}</span> 
                        ${item.country ? `<span class="text-pulse border border-pulse/30 px-2 py-1 rounded-md bg-pulse/10">${item.country}</span>` : ''}
                        <span>${item.year}</span>
                    </div>
                </div>
                <div class="stats text-right shrink-0">
                    <div class="text-[12px] font-black text-pulse">★ ${parseFloat(item.imdb).toFixed(1)}</div>
                    <div class="text-[9px] font-bold text-gray-600 mt-2 uppercase">My Score: ${item.score ? item.score + '/5' : '-'}</div>
                </div>
            </div>`;
        }
    }).join('');
    
    updateCounters();
}
        // Sync Engine Logic
        async function renderSync() {
    const container = document.getElementById('syncContainer');
    container.innerHTML = '<div class="col-span-full py-20 text-center text-pulse text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing Neural Sync...</div>';

    const types = ['movie', 'tv', 'anime', 'kdrama', 'turkish', 'asian'];
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
            const types = ['all', 'movie', 'tv', 'anime', 'kdrama', 'turkish', 'asian'];
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
                        else openCategoryPage('trending', type); // Fixed: Added 'trending' argument
                    }, 250); // Wait 250ms to ensure it's not a double-click
                } else if (e.detail === 2) {
                    clearTimeout(clickTimer); // Cancel single click action
                    if (type === 'all') navigate('rhythmlab');
                    else openRandomSuggestion(type);
                }
            }

        async function openCategoryPage(mode, type) {
                state.catMode = mode; // 'trending' or 'upcoming'
                state.catType = type;
                state.catSort = 'trending'; // Default
                state.catPage = 1;
                document.getElementById('catSearchInput').value = '';
                
                const titleMap = { 'movie': 'Movies', 'tv': 'Series', 'anime': 'Anime', 'kdrama': 'K-Drama', 'turkish': 'Turkish', 'asian': 'Asian Drama' };
                document.getElementById('catTitle').innerHTML = `${mode === 'upcoming' ? 'Upcoming ' : 'Trending '}<span class="text-pulse">${titleMap[type]}</span>`;
                
                // Hide Top Rated sort button if we are looking at upcoming
                document.getElementById('btnTopRated').classList.toggle('hidden', mode === 'upcoming');
                
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

     function getCategoryApiPath(mode, type, sort, page) {
                const today = getTodayAPI();
                if (mode === 'upcoming') {
                    if (type === 'movie') return `/movie/upcoming?page=${page}&region=US`;
                    let base = `/discover/tv?first_air_date.gte=${today}&sort_by=popularity.desc&page=${page}`;
                    if (type === 'tv') return `${base}&with_original_language=en`;
                    if (type === 'anime') return `${base}&with_genres=16&with_original_language=ja`;
                    if (type === 'kdrama') return `${base}&with_original_language=ko`;
                    if (type === 'turkish') return `${base}&with_original_language=tr`;
                    if (type === 'asian') return `${base}&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc`;
                } else {
                // Your existing trending logic
                if (type === 'movie') return sort === 'trending' ? `/trending/movie/week?page=${page}` : `/movie/top_rated?page=${page}`;

                let base = `/discover/tv?page=${page}`;
                let sortParam = sort === 'trending' ? 'popularity.desc' : 'vote_average.desc&vote_count.gte=300'; 

                if (type === 'tv') return `${base}&sort_by=${sortParam}&with_original_language=en`;
                if (type === 'anime') return `${base}&sort_by=${sortParam}&with_genres=16&with_original_language=ja`;
                if (type === 'kdrama') return `${base}&sort_by=${sortParam}&with_original_language=ko`;
                if (type === 'turkish') return `${base}&sort_by=${sortParam}&with_original_language=tr`;
                if (type === 'asian') return `${base}&sort_by=${sortParam}&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16`;
                }
            }

          function filterCategoryGrid(query) {
                    if (!query) { renderGrid('categoryGrid', state.catRawData, state.catType, true); return; }
                    // ADDED || '' TO PREVENT CRASHES
                    const filtered = state.catRawData.filter(i => isSmartMatch(i.title || i.name || '', query));
                    renderGrid('categoryGrid', filtered, state.catType, true);
                }

       async function fetchAndRenderCategory(clear = false) {
                    const btn = document.getElementById('catLoadMore');
                    const grid = document.getElementById('categoryGrid');
                    if (!clear) btn.innerText = "Processing...";

                    try {
                        const path = getCategoryApiPath(state.catMode, state.catType, state.catSort, state.catPage);
                        const data = await fetchAPI(path);
                        const apiType = state.catType === 'movie' ? 'movie' : 'tv';
                        
                        // REPLACED CUSTOM HTML MAP WITH OUR UNIFIED GRID RENDERER
                        renderGrid('categoryGrid', data.results, apiType, clear);

                        if (data.page >= data.total_pages || state.catPage >= 10) btn.classList.add('hidden');
                        else btn.innerHTML = `Load More <i class="fas fa-chevron-down ml-3"></i>`;

                        if (clear) state.catRawData = data.results; 
                        else state.catRawData = state.catRawData.concat(data.results);

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
            // FIXED: Added 'trending' as the first argument
            const path = getCategoryApiPath('trending', type, 'top', randomPage);
            
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
        const actualType = i.media_type || (i.title ? 'movie' : 'tv');
        const category = determineCategory(i);
        const displayLabel = formatTypeLabel(category, actualType);
        const isPerson = i.media_type === 'person';

        return `
        <div class="group cursor-pointer relative" onclick="${isPerson ? `openPersonModal(${i.id})` : `openModal(${i.id}, '${type}')`}">
            
            ${!isPerson ? `
                <button onclick="event.stopPropagation(); quickAdd(${i.id}, '${type}')" 
                        class="absolute top-10 left-3 w-11 h-11 bg-dark/90 backdrop-blur-xl border border-white/20 rounded-2xl text-pulse flex items-center justify-center z-40 opacity-0 group-hover:opacity-100 transition-all hover:bg-pulse hover:text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-90">
                    <i class="fas fa-plus text-sm"></i>
                </button>
            ` : ''}

            <div class="text-[8px] font-black uppercase text-pulse mb-1">${displayLabel}</div>
            
            <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                <img src="${i.poster_path || i.profile_path ? IMG + (i.poster_path || i.profile_path) : 'https://via.placeholder.com/300'}" 
                     class="w-full h-full object-cover bg-dark">
                
                ${i.vote_average ? `
                    <div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-pulse border border-white/10 z-30">
                        ★ ${i.vote_average.toFixed(1)}
                    </div>
                ` : ''}
                
                ${!isPerson ? getPlayHoverHTML({...i, type: type}) : ''}
            </div>
            
            <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title || i.name}</div>
            <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase">
                ${(i.release_date || i.first_air_date || '').split('-')[0] || 'N/A'}
            </div>
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

                // UPDATED: Removed 'searchGenre' to prevent null reference errors
                const genreSels = [document.getElementById('pGenre')];
                genreSels.forEach(sel => {
                    if(sel) sel.innerHTML = `<option value="">Genre</option>` + state.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
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
        
        <button onclick="closeActorMode(event)" class="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-pulse rounded-full flex items-center justify-center transition-all z-30">
            <i class="fas fa-times text-white text-xs"></i>
        </button>

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
        
        // UPDATED: Funnel data into the filter engine instead of direct rendering
        applyDiscoverLocalFilters();
        
        
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

function closeActorMode(e) {
    e.stopPropagation(); // Prevents clicking the banner itself
    document.getElementById('actorProfileBanner').classList.add('hidden');
    document.getElementById('searchHeader').innerText = "Discover";
    
    // Reset state to standard discovery and reload
    state.searchMode = 'trending';
    discoverPage = 1; 
    
    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '<div class="page-loader"></div>';
    
    // Fetch raw discovery data again
    fetchDiscoverData(false);
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
// Add this logic to your save routine
async function saveWithSagaContext(item, type) {
    // If it's a movie, fetch full details to see if it has a collection/saga ID
    if (type === 'movie') {
        const details = await fetchAPI(`/movie/${item.id}`);
        if (details.belongs_to_collection) {
            item.sagaId = details.belongs_to_collection.id;
            item.sagaName = details.belongs_to_collection.name;
        }
    }
    
    // Standard save logic follows...
    state.myList.push(item);
    saveToLocalStorage();
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
   
    if (state.db.length === 0 && Object.keys(sourcesDb).every(k => sourcesDb[k].length === 0) && customSagas.length === 0) {
        showNotification("Library, Source Engine, and Forge are empty.", true);
        return;
    }

    showNotification("Packaging Neural Data...");

   // 2. V3.1 Includes Neural Radar, Standard Sagas, AND Custom Forge Sagas
    const backupPackage = {
        version: "3.1",
        db: state.db,
        sources: sourcesDb,
        reminders: state.reminders,
        customSagas: customSagas // <--- Safely attached to the payload
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
}// --- UPCOMING / RADAR LOGIC ---
let upcomingSearchTimer;

async function loadUpcomingPage() {
    // 1. Render Tracked Radar immediately
    renderUpcomingRadar();

    const today = new Date().toISOString().split('T')[0];
    let future = new Date();
    future.setMonth(future.getMonth() + 6);
    const futureDate = future.toISOString().split('T')[0];

    document.getElementById('upcomingRecommendationsGrid').innerHTML = '<div class="page-loader"></div>';
    document.getElementById('upcomingMainGrid').innerHTML = '<div class="page-loader"></div>';

    try {
        const anticipatedRes = await fetch(`${BASE}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${today}&primary_release_date.lte=${futureDate}&sort_by=popularity.desc`);
        const anticipatedData = await anticipatedRes.json();
        
        renderGrid('upcomingRecommendationsGrid', anticipatedData.results.slice(0, 10), 'movie', true);

        const mainRes = await fetch(`${BASE}/movie/upcoming?api_key=${API_KEY}`);
        const mainData = await mainRes.json();
        
        const topIds = anticipatedData.results.slice(0, 10).map(m => m.id);
        const filteredMain = mainData.results.filter(m => !topIds.includes(m.id));
        
        renderGrid('upcomingMainGrid', filteredMain.slice(0, 18), 'movie', true);
    } catch (err) {
        console.error("Neural fetch failed for Upcoming page.", err);
    }
}

// 2. Render Tracked Radar directly on the Upcoming page
function renderUpcomingRadar() {
    const section = document.getElementById('upcomingRadarSection');
    const grid = document.getElementById('upcomingRadarGrid');
    
    // Auto-clean: remove items that are already tracked in the main DB
    const dbIds = new Set(state.db.map(i => i.id));
    state.reminders = state.reminders.filter(r => !dbIds.has(r.id));
    localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));

    if (!state.reminders || state.reminders.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');

    grid.innerHTML = state.reminders.map(r => {
        const diff = new Date(r.date).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const isOut = days <= 0;
        
        const urgencyColor = isOut ? 'text-[#22c55e]' : (days <= 7 ? 'text-[#f59e0b]' : 'text-pulse');
        const urgencyBorder = isOut ? 'border-[#22c55e]/50' : (days <= 7 ? 'border-[#f59e0b]/50' : 'border-pulse/50');
        const urgencyShadow = isOut ? 'shadow-[#22c55e]/10' : (days <= 7 ? 'shadow-[#f59e0b]/10' : 'shadow-pulse/10');
        const dayText = isOut ? 'AVAILABLE NOW' : (days === 1 ? 'TOMORROW' : `${days} DAYS LEFT`);

        return `
        <div class="flex items-center gap-4 bg-[#0a0c12]/90 backdrop-blur-md p-4 rounded-3xl border ${urgencyBorder} hover:border-pulse transition-all cursor-pointer group shadow-xl ${urgencyShadow}" onclick="openModal(${r.id}, '${r.type}')">
            <div class="w-20 h-28 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/5 relative">
                <img src="${r.poster ? IMG + r.poster : 'https://via.placeholder.com/150'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                ${getPlayHoverHTML({...r, type: r.type})}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[8px] font-black uppercase tracking-widest text-white bg-white/10 px-2 py-0.5 rounded border border-white/5">${r.type}</span>
                    <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest">${(r.date || '').split('-')[0] || 'TBA'}</span>
                </div>
                <h4 class="text-xs md:text-sm font-black italic uppercase text-white truncate group-hover:text-pulse transition-colors mb-3">${r.title}</h4>
                <div class="inline-block border border-white/10 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md">
                    <span class="text-[9px] font-black uppercase tracking-widest ${urgencyColor} flex items-center gap-2">
                        <i class="fas fa-stopwatch"></i> ${dayText}
                    </span>
                </div>
            </div>
            <button onclick="event.stopPropagation(); state.active = {id: ${r.id}}; toggleReminder();" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/20 transition-all shrink-0">
                <i class="fas fa-trash-alt text-[10px]"></i>
            </button>
        </div>
        `;
    }).join('');
}

// 3. Dynamic Search Execution
// 3. Dynamic Search Execution
async function handleUpcomingSearch(query) {
    const clearBtn = document.getElementById('clearUpcomingSearch');
    const searchSection = document.getElementById('upcomingSearchResultsSection');
    const defaultContent = document.getElementById('upcomingDefaultContent');
    const searchGrid = document.getElementById('upcomingSearchGrid');

    if (!query.trim()) {
        clearBtn.classList.add('hidden');
        searchSection.classList.add('hidden');
        defaultContent.classList.remove('hidden');
        return;
    }

    clearBtn.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    defaultContent.classList.add('hidden');
    searchGrid.innerHTML = '<div class="col-span-full py-10 page-loader"></div>';

    clearTimeout(upcomingSearchTimer);
    upcomingSearchTimer = setTimeout(async () => {
        try {
            const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(query)}&include_adult=${!prefs.safeMode}`);
            
            // Get today's date in YYYY-MM-DD format for strict comparison
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Filter: Must be a movie/tv AND release date must be in the future
            let results = data.results.filter(i => {
                if (i.media_type !== 'movie' && i.media_type !== 'tv') return false;
                const dateStr = i.release_date || i.first_air_date;
                if (!dateStr) return false; // Remove items with missing dates
                return dateStr > todayStr;  // Keep ONLY future releases
            });
            
            if (results.length === 0) {
                searchGrid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 font-black uppercase tracking-widest text-[10px] italic">No future releases found for this query.</div>';
                return;
            }
            
            renderGrid('upcomingSearchGrid', results, false, true);
        } catch (err) {
            searchGrid.innerHTML = '<div class="col-span-full text-center py-20 text-pulse font-black uppercase tracking-widest text-[10px]">Neural Link Severed</div>';
        }
    }, 500);
}

function clearUpcomingSearch() {
    document.getElementById('upcomingSearchInput').value = '';
    handleUpcomingSearch('');
}
// ADVANCED I/O MODAL LOGIC
function openAdvancedIO(mode) {
    const modal = document.getElementById('advancedIOModal');
    const expConfig = document.getElementById('exportConfig');
    const impConfig = document.getElementById('importConfig');
    const title = document.getElementById('ioModalTitle');

    if (mode === 'export') {
        title.innerHTML = 'Advanced <span class="text-pulse">Export</span>';
        expConfig.classList.remove('hidden');
        impConfig.classList.add('hidden');
    } else {
        title.innerHTML = 'Advanced <span class="text-[#22c55e]">Import</span>';
        impConfig.classList.remove('hidden');
        expConfig.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function executeAdvancedExport() {
    const includeLib = document.getElementById('expLibrary').checked;
    const includeSagas = document.getElementById('expSagas').checked;
    const includeSources = document.getElementById('expSources').checked;
    const includeRadar = document.getElementById('expRadar').checked;
    const includePrefs = document.getElementById('expPrefs').checked;

    if (!includeLib && !includeSagas && !includeSources && !includeRadar && !includePrefs) {
        return showNotification("Must select at least one dataset to export.", true);
    }

    const backupPackage = { version: "3.2" };
    if (includeLib) backupPackage.db = state.db;
    if (includeSagas) backupPackage.customSagas = customSagas;
    if (includeSources) backupPackage.sources = sourcesDb;
    if (includeRadar) backupPackage.reminders = state.reminders;
    if (includePrefs) backupPackage.prefs = prefs;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPackage));
    const node = document.createElement('a');
    node.setAttribute("href", dataStr);
    node.setAttribute("download", `cinepulse_elite_custom_${Date.now()}.json`);
    document.body.appendChild(node);
    node.click();
    node.remove();
    
    document.getElementById('advancedIOModal').classList.add('hidden');
    showNotification("Custom Backup Generated!");
}

function executeAdvancedImport(event) {
    // FIX: Grab the actual file object at index 0, not the FileList object
    const file = event.target.files[0];
    if (!file) return;

    const strategy = document.querySelector('input[name="importStrat"]:checked').value;
    
    // Feature Selections
    const impLib = document.getElementById('impLibrary').checked;
    const impSagas = document.getElementById('impSagas').checked;
    const impSources = document.getElementById('impSources').checked;
    const impRadar = document.getElementById('impRadar').checked;
    const impPrefs = document.getElementById('impPrefs').checked;

    showNotification("Analyzing Neural Data via " + strategy.toUpperCase() + " Protocol...");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            let importedCount = 0; let updatedCount = 0; let skippedCount = 0;

            // 1. Database Processing
            if (impLib && (data.db || Array.isArray(data))) {
                const importedDB = Array.isArray(data) ? data : data.db;
                importedDB.forEach(importedItem => {
                    const existingIdx = state.db.findIndex(ex => ex.id === importedItem.id);
                    if (existingIdx !== -1) {
                        if (strategy === 'skip') {
                            skippedCount++;
                        } else if (strategy === 'overwrite') {
                            state.db[existingIdx] = importedItem;
                            updatedCount++;
                        } else { // Merge
                            const ex = state.db[existingIdx];
                            ex.score = Math.max(ex.score || 0, importedItem.score || 0);
                            ex.crown = Math.max(ex.crown || 0, importedItem.crown || 0);
                            ex.ep = Math.max(ex.ep || 0, importedItem.ep || 0);
                            if (importedItem.status === 'Finished') ex.status = 'Finished';
                            if (importedItem.sagaId) ex.sagaId = importedItem.sagaId;
                            updatedCount++;
                        }
                    } else {
                        state.db.push(importedItem);
                        importedCount++;
                    }
                });
            }

            // 2. Sources
            if (impSources && data.sources) {
                if (strategy === 'overwrite') {
                    sourcesDb = data.sources;
                } else {
                    Object.keys(data.sources).forEach(cat => {
                        if (!sourcesDb[cat]) sourcesDb[cat] = [];
                        data.sources[cat].forEach(src => {
                            if (!sourcesDb[cat].some(ex => ex.url === src.url)) sourcesDb[cat].push(src);
                        });
                    });
                }
                localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
                if (typeof renderSources === 'function') renderSources();
            }

            // 3. Custom Sagas
            if (impSagas && data.customSagas) {
                if (strategy === 'overwrite') {
                    customSagas = data.customSagas;
                } else {
                    data.customSagas.forEach(impSaga => {
                        const exIdx = customSagas.findIndex(ex => ex.id === impSaga.id || ex.name === impSaga.name);
                        if (exIdx === -1) customSagas.push(impSaga);
                        else if (strategy !== 'skip') customSagas[exIdx].parts = impSaga.parts;
                    });
                }
                localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));
            }

            // 4. Reminders
            if (impRadar && data.reminders) {
                if (strategy === 'overwrite') state.reminders = data.reminders;
                else if (strategy === 'merge') {
                    data.reminders.forEach(r => {
                        if (!state.reminders.find(ex => ex.id === r.id)) state.reminders.push(r);
                    });
                }
                localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));
            }

            // 5. Settings / Prefs
            if (impPrefs && data.prefs) {
                prefs = { ...prefs, ...data.prefs };
                savePrefs();
                updateSafeModeUI();
                currentSearchLayout = prefs.searchLayout;
                setSearchLayout(currentSearchLayout);
            }

            save();
            if (state.view === 'mylist') renderList();
            
            document.getElementById('advancedIOModal').classList.add('hidden');
            document.getElementById('advImportFile').value = ''; 
            
            showNotification(`Sync Complete! ${importedCount} Added, ${updatedCount} Updated, ${skippedCount} Skipped.`);

        } catch (err) {
            console.error(err);
            showNotification("Data corruption detected. Import aborted.", true);
        }
    };
    reader.readAsText(file);
}
// --- MULTI-SELECT ENGINE ---

function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    selectedItems.clear(); 
    
    const bar = document.getElementById('multiSelectBar');
    if (isSelectMode) bar.classList.add('active');
    else bar.classList.remove('active');
    
    updateSelectCount();
    
    // Refresh the current view to show/hide checkboxes
    if (state.view === 'mylist') renderList();
    if (state.view === 'rhythmlab') runLab();
    if (state.view === 'sagamatrix') renderMySagas();
}

function updateSelectCount() {
    const countEl = document.getElementById('selectedCount');
    if(countEl) countEl.innerText = selectedItems.size;
}

function handleCardClick(event, id, type) {
    if (isSelectMode) {
        // Intercept standard click behavior
        event.preventDefault();
        event.stopPropagation();
        
        if (selectedItems.has(id)) {
            selectedItems.delete(id);
        } else {
            selectedItems.add(id);
        }
        
        updateSelectCount();
        if (state.view === 'mylist') renderList(); // Re-render My List
        if (state.view === 'rhythmlab') runLab();  // Re-render Rhythm Lab
        return;
    }
    
    // Default flow if not in select mode
    openModal(id, type);
}

function selectAllItems() {
    const visibleCards = document.querySelectorAll('.selectable-card');
    visibleCards.forEach(el => {
        const rawId = el.getAttribute('data-id');
        const isSaga = el.getAttribute('data-issaga') === 'true';
        const id = isSaga ? rawId : parseInt(rawId);
        if (id) selectedItems.add(id);
    });
    
    updateSelectCount();
    if (state.view === 'mylist') renderList();
    if (state.view === 'rhythmlab') runLab();
    if (state.view === 'sagamatrix') renderMySagas();
}
// Custom click handler for Saga Matrix cards
// Custom click handler for Saga Matrix cards
function handleSagaCardClick(event, id) {
    if (isSelectMode) {
        event.preventDefault();
        event.stopPropagation();
        
        const stringId = String(id);
        if (selectedItems.has(stringId)) selectedItems.delete(stringId);
        else selectedItems.add(stringId);
        
        updateSelectCount();
        renderMySagas(); 
        return;
    }
    openSaga(id);
}
function deleteSelectedItems() {
    if (selectedItems.size === 0) return;
    
    if (state.view === 'sagamatrix') {
        if (!confirm(`Are you sure you want to permanently eject ${selectedItems.size} Universes from your Neural Link?`)) return;
        
        selectedItems.forEach(sagaId => {
            // Delete custom saga if it is one
            customSagas = customSagas.filter(s => String(s.id) !== String(sagaId));
            // Sever the link from any items currently in the library
            state.db.forEach(item => {
                if (String(item.sagaId) === String(sagaId)) {
                    delete item.sagaId;
                    delete item.sagaName;
                }
            });
        });
        localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));
    } else {
        // Normal Library/Lab items
        if (!confirm(`Are you sure you want to permanently eject ${selectedItems.size} items from your Neural Library?`)) return;
        state.db = state.db.filter(i => !selectedItems.has(i.id));
    }
    
    save();
    toggleSelectMode(); 
    showNotification(`${selectedItems.size} Entries Purged Successfully.`);
}
// --- EXPORT SELECTED ITEMS ENGINE ---
function exportSelectedItems() {
    if (selectedItems.size === 0) {
        return showNotification("No items selected to export.", true);
    }

    showNotification("Packaging Selected Neural Data...");

    let exportDb = [];
    let exportSagas = [];

    if (state.view === 'sagamatrix') {
        // If in Saga Matrix, export the selected custom sagas
        exportSagas = customSagas.filter(s => selectedItems.has(String(s.id)));
        
        // And automatically bundle all the library items that belong to those sagas!
        exportDb = state.db.filter(item => selectedItems.has(String(item.sagaId)));
    } else {
        // If in standard Library/Lab view, just export the specific selected items
        exportDb = state.db.filter(i => selectedItems.has(i.id));
    }

    // Create a specialized partial package
    const backupPackage = {
        version: "3.1-partial", // Tagged as partial so the import engine knows it's a curated list
        db: exportDb,
        customSagas: exportSagas
    };

    setTimeout(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPackage));
        const node = document.createElement('a');
        node.setAttribute("href", dataStr);
        node.setAttribute("download", `cinepulse_selection_${Date.now()}.json`);
        document.body.appendChild(node);
        node.click();
        node.remove();
        
        showNotification(`Exported ${selectedItems.size} selected entries successfully!`);
        toggleSelectMode(); // Exit select mode cleanly after export
    }, 500);
}
// --- MOBILE LONG-PRESS SELECTION ENGINE ---
function setupLongPressSelection() {
    let touchTimer;
    let isDragging = false;

    const startPress = (e) => {
        // Look for cards equipped with our new selectable class
        const card = e.target.closest('.selectable-card');
        if (!card) return;
        isDragging = false;
        
        touchTimer = setTimeout(() => {
            if (!isDragging) {
                // Haptic feedback if supported
                if (navigator.vibrate) navigator.vibrate(50);
                
                // Activate select mode if it isn't already
                if (!isSelectMode) toggleSelectMode();
                
                // Extract metadata
                const rawId = card.getAttribute('data-id');
                const type = card.getAttribute('data-type');
                const isSaga = card.getAttribute('data-issaga') === 'true';
                const id = isSaga ? rawId : parseInt(rawId); // Sagas can have string IDs ('custom_123')
                
                // Select the item
                if (!selectedItems.has(id)) {
                    selectedItems.add(id);
                    updateSelectCount();
                    
                    // Re-render the active view instantly
                    if (state.view === 'mylist') renderList();
                    if (state.view === 'rhythmlab') runLab();
                    if (state.view === 'sagamatrix') renderMySagas();
                }
            }
        }, 500); // 500ms long press to trigger
    };

    const cancelPress = () => clearTimeout(touchTimer);
    const movePress = () => { isDragging = true; clearTimeout(touchTimer); };

    // Attach to the main content area for event delegation
    const main = document.getElementById('mainContent');
    main.addEventListener('touchstart', startPress, { passive: true });
    main.addEventListener('touchend', cancelPress);
    main.addEventListener('touchcancel', cancelPress);
    main.addEventListener('touchmove', movePress, { passive: true });
}



// FACTORY RESET (THE NUKE)
function openFactoryResetModal() {
    document.getElementById('factoryResetModal').classList.remove('hidden');
}

function executeFactoryReset() {
    // 1. Identify all CinePulse data keys
    const keysToDestroy = [
        'cp_elite_db_v3', 
        'cp_elite_sources', 
        'cp_elite_custom_sagas', 
        'cp_elite_reminders', 
        'cp_elite_notifs', 
        'cp_elite_notifs_archived', 
        'cp_elite_prefs'
    ];
    
    // 2. Erase from Local Storage
    keysToDestroy.forEach(key => localStorage.removeItem(key));
    
    // 3. The cleanest way to reset in-memory variables and UI is to reload the window.
    // The visual transition makes it feel like a true system reboot.
    document.body.innerHTML = `
        <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: #ff2d55; font-family: sans-serif;">
            <i class="fas fa-radiation fa-spin" style="font-size: 64px; margin-bottom: 20px;"></i>
            <h1 style="font-weight: 900; letter-spacing: 5px; text-transform: uppercase;">System Wiped</h1>
            <p style="color: #666; font-size: 10px; margin-top: 10px; letter-spacing: 2px;">Rebooting Neural Interface...</p>
        </div>
    `;
    
    setTimeout(() => {
        location.reload();
    }, 1500);
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
        // CHANGED 'const' TO 'let'
        let results = data.results || [];

        // NEW: Fallback to Similar if Recommendations are empty
        if (results.length === 0) {
            const fallbackData = await fetchAPI(`/${type}/${id}/similar?page=${page}`);
            results = fallbackData.results || [];
        }

        // REMOVED THE DUPLICATE CHECK
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
    if (!text) return false;
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

// 1. Bulletproof Initialization (Fixes the Asian array crash)
function initSourcesDb() {
    let db = JSON.parse(localStorage.getItem('cp_elite_sources'));
    const defaultDb = { movie: [], tv: [], anime: [], kdrama: [], turkish: [], asian: [] };
    if (!db || typeof db !== 'object') return defaultDb;
    // Forces a merge, ensuring 'asian' and any future categories are always present
    return { ...defaultDb, ...db };
}
let sourcesDb = initSourcesDb();

// 2. Upgraded Render function with the Edit Button
function renderSources() {
    const container = document.getElementById('sourceListContainer');
    if (!container) return;
    
    const categories = Object.keys(sourcesDb);
    container.innerHTML = categories.map(cat => {
        if (!sourcesDb[cat] || !sourcesDb[cat].length) return '';
        return `
            <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 class="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-4 border-b border-white/5 pb-2">${cat} Sources</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${sourcesDb[cat].map((src, idx) => {
                        // Safe fallback if URL is malformed
                        let domain = 'Link';
                        try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch(e){}
                        
                        return `
                            <div class="flex items-center justify-between bg-dark border border-white/10 p-3 rounded-xl hover:border-pulse/50 transition-colors">
                                <div class="flex items-center gap-3 overflow-hidden">
                                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-6 h-6 rounded-md bg-white/10 p-0.5 shrink-0">
                                    <div class="truncate">
                                        <div class="text-[11px] font-black uppercase text-white truncate">${src.name}</div>
                                        <div class="text-[8px] text-gray-500 truncate">${domain}</div>
                                    </div>
                                </div>
                                <div class="flex gap-2 shrink-0">
                                    <button onclick="editSource('${cat}', ${idx})" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3b82f6]/20 transition-all" title="Edit Source"><i class="fas fa-edit text-[10px]"></i></button>
                                    <button onclick="removeSource('${cat}', ${idx})" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/10 transition-all" title="Delete Source"><i class="fas fa-trash text-[10px]"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('') || `<div class="text-center py-10 text-[10px] uppercase font-black text-gray-600 tracking-widest">No Sources Configured</div>`;
}

// 3. The New Edit Function
function editSource(cat, idx) {
    const src = sourcesDb[cat][idx];
    const newName = prompt(`Editing name for ${cat.toUpperCase()} source:`, src.name);
    if (newName === null) return; // Cancelled
    
    const newUrl = prompt(`Editing URL template for ${newName}:`, src.url);
    if (newUrl === null) return; // Cancelled
    
    if (!newName.trim() || !newUrl.trim() || !newUrl.startsWith('http')) {
        return alert("Invalid input. Must provide a name and a valid HTTP/HTTPS URL.");
    }
    
    sourcesDb[cat][idx] = { name: newName.trim(), url: newUrl.trim() };
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    renderSources();
    showNotification("Source Matrix Updated");
}

function addSource() {
    const cat = document.getElementById('srcCategory').value;
    const name = document.getElementById('srcName').value.trim();
    const url = document.getElementById('srcUrl').value.trim();

    if (!name || !url) return alert("Please provide both a name and a URL template.");
    if (!url.startsWith('http')) return alert("URL must start with http:// or https://");

    if (!sourcesDb[cat]) sourcesDb[cat] = []; 
    sourcesDb[cat].push({ name, url });
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    
    document.getElementById('srcName').value = '';
    document.getElementById('srcUrl').value = '';
    renderSources();
}

function clearAllSources() {
    if(confirm("Are you sure you want to delete all configured sources?")) {
        sourcesDb = { movie: [], tv: [], anime: [], kdrama: [], turkish: [], asian: [] };
        localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
        renderSources();
        showNotification("All sources purged.");
    }
}



function removeSource(cat, idx) {
    sourcesDb[cat].splice(idx, 1);
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    renderSources();
}


// --- UNIFIED HOVER PLAY ENGINE ---
function getPlayHoverHTML(item) {
    // 1. Determine exact category natively
    const local = state.db.find(i => i.id === item.id);
    const cat = local ? local.type : determineCategory(item);
    
    // 2. Escape strings safely for inline HTML
    const title = (item.title || item.name || '').replace(/'/g, "\\'");
    const year = (item.release_date || item.first_air_date || item.year || '').split('-')[0];

    // 3. CHECK IF UPCOMING (Unreleased)
    let dateStr = item.release_date || item.first_air_date;
    let isUpcoming = false;
    if (dateStr) {
        isUpcoming = new Date(dateStr) > new Date();
    }

    // 4. RETURN YOUTUBE TRAILER BUTTON FOR UPCOMING
    if (isUpcoming) {
        return `
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none flex items-center justify-center">
            <button onclick="quickTrailer(event, ${item.id}, '${cat}')" class="w-14 h-14 rounded-full bg-white/10 border border-pulse text-pulse flex items-center justify-center text-xl hover:bg-pulse hover:text-white hover:scale-110 transition-all pointer-events-auto shadow-[0_5px_15px_rgba(255,45,85,0.4)]">
                <i class="fab fa-youtube"></i>
            </button>
        </div>`;
    }

    // 5. RETURN STANDARD PLAY BUTTON
    return `
    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none flex items-center justify-center">
        <button onclick="quickWatch(event, ${item.id}, '${cat}', '${title}', '${year}')" class="w-14 h-14 rounded-full bg-white/10 border border-white/40 flex items-center justify-center text-white text-xl hover:bg-pulse hover:border-pulse hover:scale-110 transition-all pointer-events-auto shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            <i class="fas fa-play ml-1"></i>
        </button>
    </div>`;
}
function quickWatch(event, id, cat, title, year) {
    // Stop the click from opening the info modal underneath
    event.preventDefault();
    event.stopPropagation();

    const availableSources = sourcesDb[cat] || [];
    const safeTitle = encodeURIComponent(title);
    const safeYear = year;
    const tmdbType = (cat === 'tv' || cat === 'anime' || cat === 'kdrama' || cat === 'turkish' || cat === 'asian') ? 'tv' : 'movie';

    // 1. BUILT-IN PLAYER SECTION
    let html = `
        <div class="mb-6 border-b border-white/10 pb-6">
            <h4 class="text-[10px] font-black uppercase text-[#22c55e] tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-play"></i> Neural Stream (Built-in)
            </h4>
            <button onclick="launchInternalPlayer(${id}, '${tmdbType}', '${title.replace(/'/g, "\\'")}')"
                    class="w-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">
                <i class="fas fa-broadcast-tower"></i> Launch Secure Stream
            </button>
        </div>
        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
            <i class="fas fa-external-link-alt"></i> External Sources
        </h4>
    `;

    // 2. EXTERNAL SOURCES SECTION
    if (availableSources.length === 0) {
        html += `
            <div class="text-center py-4 space-y-3 bg-dark/50 rounded-xl border border-white/5">
                <p class="text-[9px] text-gray-500 uppercase font-bold px-4 leading-relaxed">
                    No custom external links configured for <span class="text-${cat}">${cat}</span>.
                </p>
                <button onclick="document.getElementById('watchModal').classList.add('hidden'); navigate('sources');" 
                        class="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] uppercase font-black hover:bg-white/10 transition-all w-full">
                    Configure Sources
                </button>
            </div>
        `;
    } else if (availableSources.length === 1) {
        // Exactly ONE external source -> Show a single, distinct button for it
        const src = availableSources[0];
        const finalUrl = src.url.replace(/{title}/g, safeTitle).replace(/{tmdb_id}/g, id).replace(/{year}/g, safeYear);
        let domain = 'Link';
        try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch(e){}
        
        html += `
            <a href="${finalUrl}" target="_blank" onclick="document.getElementById('watchModal').classList.add('hidden')" 
               class="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-${cat} hover:bg-${cat}/10 transition-all group">
                <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-8 h-8 rounded-md grayscale group-hover:grayscale-0 transition-all">
                <div class="flex-1">
                    <div class="text-[10px] font-black uppercase text-white group-hover:text-${cat} line-clamp-1">Launch ${src.name}</div>
                    <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Direct External Link</div>
                </div>
                <i class="fas fa-external-link-alt text-gray-700 group-hover:text-${cat} transition-all text-[10px]"></i>
            </a>
        `;
    } else {
        // MULTIPLE sources -> Show the scrolling list picker
        html += `<div class="space-y-2 max-h-[30vh] overflow-y-auto hide-scroll pr-1">`;
        html += availableSources.map(src => {
            const finalUrl = src.url.replace(/{title}/g, safeTitle).replace(/{tmdb_id}/g, id).replace(/{year}/g, safeYear);
            let domain = 'Link';
            try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch(e){}
            
            return `
                <a href="${finalUrl}" target="_blank" onclick="document.getElementById('watchModal').classList.add('hidden')" 
                   class="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-${cat} hover:bg-${cat}/10 transition-all group">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-6 h-6 rounded-md grayscale group-hover:grayscale-0 transition-all">
                    <div class="flex-1">
                        <div class="text-[10px] font-black uppercase text-white group-hover:text-${cat} line-clamp-1">${src.name}</div>
                        <div class="text-[7px] text-gray-500 uppercase tracking-widest mt-1">${domain}</div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-700 group-hover:text-${cat} transition-all text-[10px]"></i>
                </a>
            `;
        }).join('');
        html += `</div>`;
    }
    
    document.getElementById('watchSourceList').innerHTML = html;
    document.getElementById('watchModal').classList.remove('hidden');
}
function openWatchMenu() {
    if (!state.active) return;
    
    const type = determineCategory(state.active);
    const tmdbType = state.active.media_type || (state.active.title ? 'movie' : 'tv');
    const availableSources = sourcesDb[type] || [];
    const title = (state.active.title || state.active.name);
    const safeTitleUrl = encodeURIComponent(title);
    const tmdbId = state.active.id;
    const year = (state.active.release_date || state.active.first_air_date || '').split('-')[0];

    // 1. BUILT-IN PLAYER SECTION
    let html = `
        <div class="mb-6 border-b border-white/10 pb-6">
            <h4 class="text-[10px] font-black uppercase text-[#22c55e] tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-play"></i> Built-in Neural Player
            </h4>
            <button onclick="launchInternalPlayer(${tmdbId}, '${tmdbType}', '${title.replace(/'/g, "\\'")}')"
                    class="w-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">
                <i class="fas fa-broadcast-tower"></i> Launch Secure Stream
            </button>
        </div>
    `;

    // 2. EXTERNAL CUSTOM SOURCES SECTION
    html += `<h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2"><i class="fas fa-external-link-alt"></i> External Custom Sources</h4>`;

    if (availableSources.length === 0) {
        html += `
            <div class="text-center py-4 space-y-3 bg-dark/50 rounded-xl border border-white/5">
                <p class="text-[9px] text-gray-500 uppercase font-bold px-4 leading-relaxed">
                    No custom external links configured for <span class="text-${type}">${type}</span>.
                </p>
                <button onclick="document.getElementById('watchModal').classList.add('hidden'); navigate('sources');" 
                        class="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] uppercase font-black hover:bg-white/10 transition-all">
                    Configure Sources
                </button>
            </div>
        `;
    } else {
        html += `<div class="space-y-2 max-h-[30vh] overflow-y-auto hide-scroll pr-1">`;
        html += availableSources.map(src => {
            const finalUrl = src.url.replace(/{title}/g, safeTitleUrl).replace(/{tmdb_id}/g, tmdbId).replace(/{year}/g, year);
            let domain = 'Link';
            try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch(e){}
            
            return `
                <a href="${finalUrl}" target="_blank" onclick="document.getElementById('watchModal').classList.add('hidden')" 
                   class="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-${type} hover:bg-${type}/10 transition-all group">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-6 h-6 rounded-md grayscale group-hover:grayscale-0 transition-all">
                    <div class="flex-1">
                        <div class="text-[10px] font-black uppercase text-white group-hover:text-${type} line-clamp-1">${src.name}</div>
                        <div class="text-[7px] text-gray-500 uppercase tracking-widest mt-1">${domain}</div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-700 group-hover:text-${type} transition-all text-[10px]"></i>
                </a>
            `;
        }).join('');
        html += `</div>`;
    }

    document.getElementById('watchSourceList').innerHTML = html;
    document.getElementById('watchModal').classList.remove('hidden');
}

async function quickTrailer(event, id, type) {
    event.preventDefault();
    event.stopPropagation();
    
    showNotification("Locating Neural Trailer...");
    
    try {
        const apiType = (type === 'tv' || type === 'anime' || type === 'kdrama' || type === 'turkish') ? 'tv' : 'movie';
        const vids = await fetchAPI(`/${apiType}/${id}/videos`);
        
        // Find official trailer, or fallback to the first available video clip
        const tr = vids.results.find(v => v.type === 'Trailer') || vids.results[0]; 
        
        if (tr) {
            window.open(`https://youtube.com/watch?v=${tr.key}`, '_blank');
        } else {
            showNotification("No trailer found in Neural Archives.", true);
        }
    } catch (err) {
        showNotification("Neural link severed. Failed to fetch trailer.", true);
    }
}
function renderSmartList() {
    const container = document.getElementById('listGrid');
    const grouped = {};

    // Group items by Saga
    state.myList.forEach(item => {
        if (item.sagaId) {
            if (!grouped[item.sagaId]) grouped[item.sagaId] = { isSaga: true, name: item.sagaName, items: [] };
            grouped[item.sagaId].items.push(item);
        } else {
            grouped[item.id] = { isSaga: false, item: item };
        }
    });

    container.innerHTML = Object.values(grouped).map(group => {
        if (group.isSaga && group.items.length > 1) {
            // RENDER MEMORY CLUSTER (STACK)
            const sorted = group.items.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
            return `
                <div class="group cursor-pointer relative" onclick="openSaga(${group.items[0].sagaId})">
                    <div class="memory-cluster mb-4">
                        <img src="${IMG + sorted[0].poster_path}" class="cluster-top object-cover bg-dark">
                        <img src="${IMG + sorted[1].poster_path}" class="cluster-mid object-cover bg-dark">
                        <div class="absolute -top-2 -right-2 bg-pulse text-white text-[10px] font-black px-2 py-1 rounded-full z-40 shadow-lg">
                            ${group.items.length}
                        </div>
                    </div>
                    <div class="text-[10px] font-black uppercase tracking-widest text-center">${group.name}</div>
                </div>
            `;
        } else {
            // RENDER STANDARD SINGLE ITEM
            const item = group.isSaga ? group.items[0] : group.item;
            return renderSingleGridItem(item); // Use your existing item HTML generator
        }
    }).join('');
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
    if (val === 'asian') path = `/discover/tv?with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc&page=${discoverPage}`;

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
        applyDiscoverLocalFilters(); // Engine natively handles slicing the next batch
    } else if (state.searchMode === 'filter') {
        state.filterPage++;
        await applySearchFilters(true);
    } else if (state.searchMode === 'trending') {
        discoverPage++; 
        await fetchDiscoverData(true); 
    }
    
    btn.innerText = "Load More Discovery";
}




// Add this function to reset Discovery
// 1. Discover Page Reset
function resetDiscoverFilters() {
    state.discoverFilters.genres = [];
    document.getElementById('searchYear').value = '';
    document.getElementById('searchSort').value = 'popularity.desc';
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
    // 1. Determine which data source to filter based on current mode
    let sourceData = state.searchMode === 'actor' ? state.actorCredits : state.discoverDataRaw;
    if (!sourceData || sourceData.length === 0) return;

    // 2. Apply Filters
    let filtered = sourceData.filter(i => {
       

      let type = determineCategory(i);

        let tMatch = state.discoverFilters.type === 'all' || type === state.discoverFilters.type;
        let gMatch = state.discoverFilters.genres.length === 0 || state.discoverFilters.genres.every(g => {
            const equivalents = GENRE_MAP[g] || [g];
            return i.genre_ids && i.genre_ids.some(id => equivalents.includes(id));
        });

        return tMatch && gMatch;
    });

    // 3. Render Logic (Handle Actor Pagination vs Standard Render)
    if (state.searchMode === 'actor') {
        const slice = filtered.slice(0, state.actorPage * 20); // Paginate dynamically
        renderGrid('searchGrid', slice, false, true); 
        
        // Toggle Load More button based on filtered results
        const loadBtn = document.getElementById('discoverLoadContainer');
        if (slice.length < filtered.length) loadBtn.classList.remove('hidden');
        else loadBtn.classList.add('hidden');
    } else {
        renderGrid('searchGrid', filtered, false, true); 
    }
    
    applyLayoutToGrid();
}
//reset mylist
// 2. My List Reset
function resetListFilters() {
    state.listFilters.genres = [];
    state.listSearchQuery = '';
    
    const searchInput = document.getElementById('listSearchInput');
    if(searchInput) searchInput.value = '';
    
    renderGenrePills();
    toggleListFilter('type', 'all'); 
}
// 3. Rhythm Lab Reset
function resetLabFilters() {
    state.labFilters.genres = [];
    state.labSearchQuery = '';
    
    // Clear the local text search
    const searchInput = document.getElementById('labSearchInput');
    if(searchInput) searchInput.value = '';
    
    // Reset Advanced Dropdowns
    document.getElementById('labStatus').value = 'all';
    document.getElementById('labYear').value = 'all';
    document.getElementById('labImdb').value = 'all';
    document.getElementById('labPersonal').value = 'all';
    
    renderGenrePills();
    toggleLabFilter('type', 'all'); 
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
        // FIX: Include 'asian' in the wipe reset
        sourcesDb = { movie: [], tv: [], anime: [], kdrama: [], turkish: [], asian: [] };
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
    if (item.forceType) return item.forceType; 
    
    const local = state.db.find(i => i.id === item.id);
    if (local && local.type) return local.type;

    const lang = item.original_language;
    const genres = item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []);
    const origin = item.origin_country || (item.production_countries ? item.production_countries.map(c => c.iso_3166_1) : []);

    if (lang === 'ja' && genres.includes(16)) return 'anime';
    if (lang === 'ko') return 'kdrama';
    if (lang === 'tr') return 'turkish';

    // NEW ASIAN DRAMA LOGIC: China, Taiwan, Thailand, Philippines, Vietnam, OR Japanese Live-Action
    const isAsianCountry = origin.some(c => ['CN', 'TW', 'TH', 'PH', 'VN'].includes(c));
    const isAsianLang = ['zh', 'th', 'tl', 'vi'].includes(lang);
    const isJpLiveAction = (lang === 'ja' || origin.includes('JP')) && !genres.includes(16);
    
    if (isAsianCountry || isAsianLang || isJpLiveAction) return 'asian';

    return item.title ? 'movie' : 'tv';
}
// --- SMART TYPE FORMATTER ---
function formatTypeLabel(baseType, tmdbType) {
    if (baseType === 'movie') return 'MOVIE';
    if (baseType === 'tv') return tmdbType === 'movie' ? 'TV MOVIE' : 'SERIES';
    if (baseType === 'anime') return tmdbType === 'movie' ? 'ANIME MOVIE' : 'ANIME';
    if (baseType === 'kdrama') return tmdbType === 'movie' ? 'K-DRAMA MOVIE' : 'K-DRAMA';
    if (baseType === 'asian') return tmdbType === 'movie' ? 'ASIAN MOVIE' : 'ASIAN DRAMA';
    if (baseType === 'turkish') return tmdbType === 'movie' ? 'TURKISH MOVIE' : 'TURKISH SERIES';
    return baseType ? baseType.toUpperCase() : 'UNKNOWN';
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
    const realmBox = document.getElementById('mSovereignRealmBox');
    
    // Clear dethroned 1-3 crowns
    if (crownLevel > 0 && crownLevel < 4) {
        state.db.forEach(i => {
            if (i.type === item.type && i.crown === crownLevel) i.crown = 0; 
        });
        realmBox.classList.add('hidden');
    } else if (crownLevel === 4) {
        // Populate the specific genres for THIS item
        const select = document.getElementById('mSovereignRealmSelect');
        const activeGenres = state.active.genres || [];
        
        if (activeGenres.length > 0) {
            select.innerHTML = activeGenres.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
            item.realm = item.realm || activeGenres[0].name; // Default to first genre
            select.value = item.realm;
        } else {
            select.innerHTML = `<option value="Cinematic">Cinematic</option>`;
            item.realm = "Cinematic";
        }
        realmBox.classList.remove('hidden');
    } else {
        realmBox.classList.add('hidden');
    }
    
    item.crown = crownLevel;
    save();
    if (state.view === 'masterpieces') renderMasterpieces();
}

function saveSovereignRealm(realmName) {
    const item = state.db.find(i => i.id === state.active.id);
    if (item) {
        item.realm = realmName;
        save();
        if (state.view === 'masterpieces') renderMasterpieces();
    }
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
    const types = ['movie', 'tv', 'anime', 'kdrama', 'turkish', 'asian'];
    const typeNames = { movie: 'Movies', tv: 'Series', anime: 'Anime', kdrama: 'K-Drama', turkish: 'Turkish', asian: 'Asian Drama' };

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
            // Main Top 3
            const crowned = state.db.filter(i => i.type === type && i.crown > 0 && i.crown < 4).sort((a,b) => a.crown - b.crown);
            // Genre Sovereigns (Unlimited)
            const sovereigns = state.db.filter(i => i.type === type && i.crown === 4);
            
            if(!crowned.length && !sovereigns.length) return '';
            
            let sectionHtml = `
                <div class="mb-16 animate-in fade-in duration-500">
                    <h3 class="text-xl md:text-2xl font-black italic uppercase text-yellow-500/80 tracking-widest mb-6 md:mb-8 border-b border-white/5 pb-4 flex items-center gap-4">
                        <i class="fas fa-crown"></i> ${typeNames[type]} Royal Court
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"> 
                        ${crowned.map(i => getRankedCard(i, i.crown, true)).join('')}
                    </div>
            `;
            
            if (sovereigns.length > 0) {
                 sectionHtml += `
                    <h4 class="text-sm font-black italic uppercase text-pulse tracking-widest mt-12 mb-6 flex items-center gap-3">
                        <i class="fas fa-gem"></i> Genre Sovereigns
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"> 
                        ${sovereigns.map(i => getRankedCard(i, 4, true)).join('')}
                    </div>
                 `;
            }
            
            sectionHtml += `</div>`;
            return sectionHtml;
        }).join('') || '<div class="text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em] w-full">No crowned items in this category.</div>';
        container.innerHTML = html;
    }
    else if (state.mpTab === 'perfect') {
        html += displayTypes.map(type => {
            const perfect = state.db.filter(i => i.type === type && i.score === 5).sort((a,b) => b.imdb - a.imdb);
            if(!perfect.length) return '';
            return `
                <div class="mb-16 animate-in fade-in duration-500">
                    <h3 class="text-lg md:text-xl font-black italic uppercase text-white tracking-widest mb-6 border-b border-white/5 pb-2">${typeNames[type]} Masterpieces</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
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
            <div class="flex gap-4 mb-8 md:mb-12 overflow-x-auto hide-scroll pb-2">
                ${[3, 10, 25, 100].map(l => `
                    <button onclick="state.mpLimit=${l}; renderMasterpieces()" class="px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.mpLimit === l ? 'bg-pulse text-white shadow-lg shadow-pulse/20' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">Top ${l} Records</button>
                `).join('')}
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8 animate-in fade-in duration-500">
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
            <div class="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 flex items-end justify-between z-30 pointer-events-none">
                <div class="text-4xl md:text-6xl font-black italic tracking-tighter ${color} drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] opacity-90 group-hover:scale-110 transition-transform origin-bottom-left">
                    #${rank}
                </div>
                <div class="text-[8px] md:text-[10px] font-black uppercase text-white text-right drop-shadow-md bg-dark/60 backdrop-blur-md px-2 md:px-3 py-1 rounded-xl border border-white/10">
                    ★ ${i.score}/5<br><span class="text-[7px] md:text-[8px] text-gray-400">${i.type}</span>
                </div>
            </div>
        `;
    } else {
         badgeHtml = `
            <div class="absolute top-3 right-3 z-30 pointer-events-none">
                 <div class="text-[8px] md:text-[10px] font-black uppercase text-pulse bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    ★ ${i.score}/5
                </div>
            </div>
        `;
    }

    return `
    <div class="group cursor-pointer relative" onclick="openModal(${i.id}, '${i.type === 'movie' ? 'movie' : 'tv'}')">
        <div class="aspect-[2/3] rounded-2xl md:rounded-[30px] overflow-hidden mb-3 md:mb-4 border ${borderShadow} group-hover:border-pulse transition-all relative">
            <img src="${IMG+i.poster}" class="w-full h-full object-cover bg-dark">
            <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            ${badgeHtml}
            ${getPlayHoverHTML(i)}
        </div>
        <div class="text-[9px] md:text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
        <div class="text-[7px] md:text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-widest">${i.year || 'N/A'} • IMDB: ${i.imdb?.toFixed(1) || '0.0'}</div>
    </div>
    `;
}

function getRankedCard(i, rank, isCrownCard = false) {
    let badgeHtml = '';
    let borderShadow = 'border-white/5 shadow-xl';
    const originalGetRankedCard = getRankedCard;
getRankedCard = function(i, rank, isCrownCard = false, realmName = '') {
    // If it's a Sovereign (4), override the badge UI to show the Realm
    if (rank === 4) {
        return `
        <div class="group cursor-pointer relative" onclick="openModal(${i.id}, '${i.type === 'movie' ? 'movie' : 'tv'}')">
            <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-pulse/30 shadow-[0_10px_40px_rgba(255,45,85,0.15)] group-hover:border-pulse transition-all relative">
                <img src="${IMG+i.poster}" class="w-full h-full object-cover bg-dark">
                <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
                    <div class="text-[10px] font-black uppercase text-pulse bg-dark/80 backdrop-blur-md px-3 py-2 rounded-xl border border-pulse/50 text-center shadow-lg">
                        💎 ${realmName || i.realm || 'Sovereign'}<br>
                        <span class="text-[8px] text-white mt-1 block">★ ${i.score}/5</span>
                    </div>
                </div>
                ${getPlayHoverHTML(i)}
            </div>
            <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
            <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-widest">${i.year || 'N/A'} • IMDB: ${i.imdb?.toFixed(1) || '0.0'}</div>
        </div>
        `;
    }
    return originalGetRankedCard(i, rank, isCrownCard);
};
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
        


 //manual type override 
 function overrideType(newType) {
    if (!state.active) return;
    const idx = state.db.findIndex(i => i.id === state.active.id);
    
    if (idx !== -1) {
        state.db[idx].type = newType;
        save();
    } else {
        // If not in library yet, store the forceType to be used when they click '+ Add to List'
        state.active.forceType = newType;
    }
    
    showNotification(`Type overridden to ${newType.toUpperCase()}`);
    
    // Instantly hide/show the episode tracker based on the new logic
  const maxEp = details.number_of_episodes || 1;
    document.getElementById('mProgressBox').classList.toggle('hidden', calculatedType === 'movie' || !local || maxEp <= 1);
    if(calculatedType !== 'movie' && local && maxEp > 1) {
        // Fix for Season Mismatch: Recalculate based on real limits
        document.getElementById('mEpRange').max = maxEp;
        document.getElementById('mEpRange').value = local.ep || 0;
        
        state.activeSeasons = (details.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
        let cumulative = 0;
        state.activeSeasons.forEach(s => {
            s.startEp = cumulative;
            cumulative += s.episode_count;
            // Cap it strictly at the total episodes so it doesn't overflow
            s.endEp = Math.min(cumulative, maxEp); 
        });
        
        updateEpUI(local.ep || 0, maxEp);
        renderSeasonsUI(); 
    }
}
 //country load
// loadCountries() 
async function loadCountries() {
    // Curated top 15 media-producing regions for a premium, uncluttered UI
    const topCountries = [
        { iso: 'US', name: 'United States' },
        { iso: 'GB', name: 'United Kingdom (UK)' },
        { iso: 'KR', name: 'South Korea' },
        { iso: 'JP', name: 'Japan' },
        { iso: 'IN', name: 'India' },
        { iso: 'CN', name: 'China' },
        { iso: 'TH', name: 'Thailand' },
        { iso: 'TW', name: 'Taiwan' },
        { iso: 'PH', name: 'Philippines' },
        { iso: 'TR', name: 'Turkey' },
        { iso: 'FR', name: 'France' },
        { iso: 'ES', name: 'Spain' },
        { iso: 'IT', name: 'Italy' },
        { iso: 'DE', name: 'Germany' },
        { iso: 'BR', name: 'Brazil' }
    ];

    const select = document.getElementById('searchCountry');
    if (select) {
        // Sort them alphabetically just for a clean look, but keep US/UK at top if you prefer (currently alphabetical)
        const sorted = topCountries.sort((a, b) => a.name.localeCompare(b.name));
        const options = sorted.map(c => `<option value="${c.iso}">${c.name}</option>`).join('');
        select.innerHTML = '<option value="">All Regions</option>' + options;
    }
}
// --- SAGA MATRIX ENGINE (UPGRADED) ---
const EXTENDED_SAGAS = [
    119, 86311, 531241, 1241, 404609, 3033, 10, 230, 645, 295, 
    124, 9485, 87359, 131635, 1703, 33514, 264, 420, 84, 118, 528, 556, 178
];
let currentSagaTab = 'discover';
let sagaSearchTimeout;



// Dynamic Debounced Search
function handleSagaSearch(query) {
    clearTimeout(sagaSearchTimeout);
    if (!query) return renderSagaMatrix();
    sagaSearchTimeout = setTimeout(() => searchSagas(query), 500);
}

async function searchSagas(query) {
    const grid = document.getElementById('sagaGrid');
    grid.innerHTML = '<div class="page-loader"></div>';
    
    try {
        const data = await fetchAPI(`/search/collection?query=${encodeURIComponent(query)}`);
        
        // Filter out sagas that are already tracked
        let untrackedCollections = data.results.filter(c => 
            !state.db.some(i => String(i.sagaId) === String(c.id)) && 
            !customSagas.some(cs => String(cs.id) === String(c.id))
        );

        if(!untrackedCollections.length) {
            grid.innerHTML = `<div class="col-span-full text-center py-20 text-[#22c55e] font-black uppercase tracking-widest">All matching universes are already tracked or none found.</div>`;
            return;
        }
        
        const sagas = await Promise.all(untrackedCollections.slice(0, 10).map(c => fetchAPI(`/collection/${c.id}`)));
        renderSagaGridUI(sagas, grid, false);
    } catch (e) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-pulse font-black uppercase tracking-widest">Search Link Severed</div>`;
    }
}

async function renderSagaMatrix() {
    const grid = document.getElementById('sagaGrid');
    grid.innerHTML = '<div class="page-loader"></div>';

    try {
        // Shuffle array to randomize recommendations
        const shuffled = EXTENDED_SAGAS.sort(() => 0.5 - Math.random());
        
        let untrackedIds = [];
        for (let id of shuffled) {
            // Check if it's already in the DB or Custom Sagas
            const isTracked = state.db.some(i => String(i.sagaId) === String(id)) || customSagas.some(c => String(c.id) === String(id));
            if (!isTracked) {
                untrackedIds.push(id);
            }
            if (untrackedIds.length >= 10) break; // Limit to 10 fresh recommendations
        }

        if (untrackedIds.length === 0) {
             grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500 font-black uppercase tracking-widest italic">All known elite universes tracked. Search for more.</div>`;
             return;
        }

        const sagas = await Promise.all(untrackedIds.map(id => fetchAPI(`/collection/${id}`)));
        renderSagaGridUI(sagas, grid, false);
    } catch (err) {
       grid.innerHTML = `<div class="col-span-full text-center py-20 text-pulse font-black uppercase tracking-widest">Neural Link to Saga Matrix Severed</div>`;
    }
}

function renderSagaGridUI(sagas, gridElement, isMyList) {
    gridElement.innerHTML = sagas.filter(s => s && s.parts && s.parts.length > 0).map(saga => {
        let overlayHtml = `<div class="absolute -top-3 -right-3 bg-pulse text-white text-[10px] font-black px-3 py-1.5 rounded-full z-40 shadow-[0_0_15px_rgba(255,45,85,0.6)]">${saga.parts.length} Parts</div>`;
        
        if (isMyList) {
            const statusColor = saga.progress === 100 ? 'text-[#22c55e]' : (saga.progress > 0 ? 'text-[#f59e0b]' : 'text-gray-500');
            const statusBg = saga.progress === 100 ? 'bg-[#22c55e]' : (saga.progress > 0 ? 'bg-[#f59e0b]' : 'bg-gray-500');
            overlayHtml = `
                <div class="absolute -top-3 -right-3 ${statusBg} text-white text-[10px] font-black px-3 py-1.5 rounded-full z-40 shadow-lg flex items-center gap-2">
                    ${saga.progress}% <span class="hidden md:inline">Completed</span>
                </div>
                <div class="absolute bottom-2 left-2 right-2 bg-dark/90 backdrop-blur-md rounded-lg p-2 border border-white/10 z-40">
                    <div class="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1 ${statusColor}">
                        <span>${saga.status}</span>
                        <span>${saga.finished}/${saga.total}</span>
                    </div>
                    <div class="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                        <div class="${statusBg} h-full transition-all duration-500" style="width: ${saga.progress}%"></div>
                    </div>
                </div>
            `;
        }

        // The New Quick Add Button
        const quickAddBtn = !isMyList ? `
            <button onclick="event.stopPropagation(); syncSagaData('${saga.id}', '${saga.name.replace(/'/g, "\\'")}')" class="absolute bottom-2 left-2 right-2 bg-pulse/90 hover:bg-pulse text-white text-[9px] font-black uppercase py-2 rounded-xl z-50 transition-all shadow-lg backdrop-blur-sm flex items-center justify-center gap-2">
                <i class="fas fa-plus"></i> Track Universe
            </button>
        ` : '';

      return `
    <div class="group cursor-pointer mb-8 animate-in zoom-in duration-300 relative saga-selectable-card selectable-card ${isMyList && isSelectMode ? 'select-mode-pulse' : ''}" 
         data-id="${saga.id}" data-issaga="true" 
         onclick="${isMyList ? `handleSagaCardClick(event, '${saga.id}')` : `openSaga('${saga.id}')`}">
        
        ${isMyList ? `
            <div class="card-checkbox ${selectedItems.has(String(saga.id)) ? 'selected' : ''} ${!isSelectMode ? 'hidden' : ''}" style="top: -10px; left: -10px;">
                <i class="fas fa-check"></i>
            </div>
        ` : ''}

        <div class="memory-cluster mb-4 relative">
            <img src="${saga.parts[0]?.poster_path ? IMG+saga.parts[0].poster_path : 'https://via.placeholder.com/300'}" class="cluster-top object-cover bg-dark">
            ${saga.parts[1] ? `<img src="${IMG+saga.parts[1].poster_path}" class="cluster-mid object-cover bg-dark">` : ''}
            ${saga.parts[2] ? `<img src="${IMG+saga.parts[2].poster_path}" class="cluster-back object-cover bg-dark">` : ''}
            ${overlayHtml}
            ${quickAddBtn}
        </div>
        <div class="bg-dark/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 group-hover:border-pulse/50 transition-colors shadow-xl">
            <div class="text-[10px] font-black uppercase text-white tracking-widest line-clamp-1">${saga.name}</div>
        </div>
    </div>
    `;
    }).join('');
}

function renderMySagas() {
    const grid = document.getElementById('sagaGrid'); // Fixed container target
    if (!grid) return;
    
    grid.innerHTML = '<div class="page-loader"></div>';
    let grouped = {}; // FIXED: Was completely missing

    // Group local DB by sagaId
    state.db.forEach(item => {
        if (item.sagaId) {
            if (!grouped[item.sagaId]) grouped[item.sagaId] = { id: item.sagaId, name: item.sagaName, parts: [] };
            grouped[item.sagaId].parts.push(item);
        }
    });
    
    const mySagas = Object.values(grouped);
    
    // Format Standard Sagas
    const formattedSagas = mySagas.filter(s => !String(s.id).startsWith('custom_')).map(s => {
        const total = s.parts.length;
        const finished = s.parts.filter(p => p.status === 'Finished').length;
        const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
        let status = progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Uncharted');

        return {
            id: s.id, name: s.name,
            parts: s.parts.sort((a,b) => (a.year || 0) - (b.year || 0)).map(p => ({ poster_path: p.poster })),
            progress: progress, status: status, finished: finished, total: total
        };
    });
    
    // Format Custom Sagas
    const customSagasList = typeof customSagas !== 'undefined' ? customSagas : [];
    const customFormatted = customSagasList.map(cs => {
        const total = cs.parts.length;
        const watchedCount = cs.parts.filter(p => {
            const match = state.db.find(d => d.id === p.id);
            return match && match.status === 'Finished';
        }).length;
        const progress = total > 0 ? Math.round((watchedCount / total) * 100) : 0;
        
        return {
            id: cs.id,
            name: cs.name + ' <span class="text-pulse text-[8px] ml-2 border border-pulse px-1 rounded shadow-[0_0_10px_rgba(255,45,85,0.4)]">(CUSTOM)</span>',
            parts: cs.parts,
            progress: progress,
            status: progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Custom Realm'),
            finished: watchedCount, total: total, isCustom: true
        };
        
    });

    const combinedSagas = [...formattedSagas, ...customFormatted];

    if (!combinedSagas.length) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500 font-black uppercase tracking-widest italic">No synchronized sagas detected in your library.</div>`;
        return;
    }
    
    renderSagaGridUI(combinedSagas, grid, true);
}

// Global Core Function to Sync a Saga
async function syncSagaData(cId, cName) {
    try {
        const col = await fetchAPI(`/collection/${cId}`);
        let addedCount = 0; let linkedCount = 0;
        
        col.parts.forEach(part => {
            let existing = state.db.find(i => i.id === part.id);
            if (!existing) {
                state.db.push({
                    id: part.id, title: part.title, poster: part.poster_path, type: 'movie',
                    status: 'Plan to Watch', ep: 0, max_ep: 1, score: 0, crown: 0, imdb: part.vote_average,
                    year: (part.release_date || '').split('-')[0], genres: part.genre_ids || [],
                    added: Date.now(), sagaId: cId, sagaName: cName
                });
                addedCount++;
            } else {
                existing.sagaId = cId;
                existing.sagaName = cName;
                linkedCount++;
            }
        });
        
        save();
        showNotification(`Universe Synced: ${addedCount} new, ${linkedCount} linked!`);
        document.getElementById('sagaModal').classList.add('hidden');
        
        // If on Discover tab, replace with new recommendations immediately
        if (currentSagaTab === 'discover') {
            renderSagaMatrix(); 
        } else {
            setSagaTab('mylist'); 
        }
        
        return true;
    } catch (e) {
        showNotification("Failed to synchronize universe.", true);
        return false;
    }
}

// Global Core Function to Delete a Saga
function purgeSagaData(cId, cName) {
    if (!confirm(`Are you sure you want to eject "${cName}" and all its entities from your neural link?`)) return;

    state.db = state.db.filter(item => String(item.sagaId) !== String(cId));
    save();

    document.getElementById('sagaModal').classList.add('hidden');
    showNotification(`Link with ${cName} terminated.`);

    // Dynamic UI Refresh Fix
    if (state.view === 'mylist') renderList();
    if (state.view === 'sagamatrix') renderMySagas();
}

// Auto-Prompt Hook when updating a movie's status
const originalUpdateStatusWithGlow = updateStatus;
updateStatus = function() {
    originalUpdateStatusWithGlow();
    
    if (state.active && state.active.belongs_to_collection) {
        const cId = state.active.belongs_to_collection.id;
        const cName = state.active.belongs_to_collection.name;
        const sagaNavBtn = document.querySelector('button[onclick="setView(\'sagamatrix\')"]');
        
        if (sagaNavBtn) sagaNavBtn.classList.add('saga-glow-active');
        
        const localItem = state.db.find(i => i.id === state.active.id);
        if(localItem) {
            localItem.sagaId = cId;
            localItem.sagaName = cName;
            save();
        }

        const existingParts = state.db.filter(i => i.sagaId === cId).length;
        
        if (existingParts <= 1) {
            document.getElementById('mSagaPromptText').innerHTML = `This title belongs to the <span class="text-pulse font-black">${cName}</span>. Track all associated records?`;
            const confirmBtn = document.getElementById('mSagaPromptConfirm');
            
            confirmBtn.onclick = async () => {
                confirmBtn.innerText = "Syncing...";
                await syncSagaData(cId, cName);
                document.getElementById('mSagaPromptBox').classList.add('hidden');
                confirmBtn.innerText = "Track Entire Universe"; 
            };
            document.getElementById('mSagaPromptBox').classList.add('hidden');
        }
    }
};

// --- NEW: INLINE SAGA EDITING ENGINE ---
let currentSagaViewContext = null; 
let inlineSearchTimer = null;

async function openSaga(id, isEditing = false) {
    const modal = document.getElementById('sagaModal');
    const isCustomId = String(id).startsWith('custom_');

    if (!isEditing || !currentSagaViewContext) {
        if (isCustomId) {
            const found = customSagas.find(s => String(s.id) === String(id));
            if (!found) return showNotification("Custom Universe lost.", true);
            currentSagaViewContext = JSON.parse(JSON.stringify(found)); 
        } else {
            currentSagaViewContext = await fetchAPI(`/collection/${id}`);
            if (!currentSagaViewContext) return showNotification("Universe data corrupted.", true);
        }
    }

    // ============================================
    // MODE A: INLINE EDIT MODE 
    // ============================================
    if (isEditing) {
        if (!isCustomId && !currentSagaViewContext.isCustom) {
            currentSagaViewContext = {
                id: 'custom_' + Date.now() + '_' + id, 
                name: currentSagaViewContext.name + ' (Custom)',
                description: currentSagaViewContext.overview || '',
                backdrop_path: currentSagaViewContext.backdrop_path,
                parts: currentSagaViewContext.parts.map(p => ({
                    id: p.id, media_type: 'movie', title: p.title,
                    poster_path: p.poster_path, release_date: p.release_date || '2000-01-01', size: 'main'
                })),
                isCustom: true
            };
            showNotification("TMDB Blueprint converted for editing.");
        }

        const saga = currentSagaViewContext;

        modal.innerHTML = `
            <div class="relative min-h-screen pb-32 bg-dark p-4 md:p-12 lg:p-24 animate-in zoom-in-95 duration-300">
                <button onclick="document.getElementById('sagaModal').classList.add('hidden')" class="saga-close-btn rounded-full flex items-center justify-center shadow-2xl">
                    <i class="fas fa-times text-lg"></i>
                </button>

                <div class="max-w-4xl mx-auto space-y-6 md:space-y-8 mt-12 md:mt-10 relative z-50">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-white/10 pb-6 md:pb-8">
                        <div>
                            <h2 class="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tighter">Edit <span class="text-pulse">Universe</span></h2>
                            <p class="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Modify Blueprint & Entities Instantly</p>
                        </div>
                        <button onclick="saveInlineSaga()" class="w-full md:w-auto px-6 py-4 bg-[#22c55e] rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#22c55e]/30 hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <i class="fas fa-save"></i> Commit Changes
                        </button>
                    </div>

                    <div class="space-y-4">
                        <label class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Universe Identity</label>
                        <input type="text" id="inlineSagaTitle" value="${saga.name || ''}" class="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl text-[12px] md:text-[14px] font-black uppercase tracking-widest text-white outline-none focus:border-pulse transition-all" placeholder="Enter Universe Name...">
                        <textarea id="inlineSagaDesc" class="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-300 outline-none focus:border-pulse transition-all h-24 md:h-28 resize-none" placeholder="Enter lore or description...">${saga.description || ''}</textarea>
                    </div>

                    <div class="space-y-4 relative z-[200]">
                        <label class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Inject Entities</label>
                        <div class="relative">
                            <i class="fas fa-search absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-white/40"></i>
                            <input type="text" oninput="handleInlineSagaSearch(this.value)" placeholder="Search TMDB Archives to add..." class="w-full bg-dark border border-white/10 p-4 md:p-5 pl-12 md:pl-14 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-pulse transition-all shadow-inner">
                            <div id="inlineSagaSearchResults" class="absolute top-full left-0 w-full mt-2 bg-[#0a0c12] border border-white/10 rounded-2xl shadow-2xl max-h-64 overflow-y-auto hidden"></div>
                        </div>
                    </div>

                    <div class="space-y-4 mt-8">
                     <label id="inlineSagaCountLabel" class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2 flex justify-between">
                            <span>Entity Hierarchy (${saga.parts.length} Parts)</span>
                        </label>
                        <div class="space-y-3" id="inlineSagaList">
                            ${saga.parts.map((p, idx) => `
                                <div class="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-pulse/30 transition-colors gap-3 md:gap-0">
                                    <div class="flex items-center gap-3 md:gap-4 w-full md:w-2/3">
                                        <div class="w-6 h-6 md:w-8 md:h-8 rounded-full bg-dark border border-white/10 flex items-center justify-center text-[9px] md:text-[10px] font-black text-gray-500 shrink-0">${idx + 1}</div>
                                        <img src="${p.poster_path ? IMG+p.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 md:w-10 md:h-14 object-cover rounded-md shadow-lg shrink-0">
                                        <div class="truncate flex-1">
                                            <div class="text-[10px] md:text-[11px] font-black uppercase text-white truncate">${p.title || p.name}</div>
                                            <div class="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-widest mt-1">${(p.release_date || p.first_air_date || '').split('-')[0] || 'N/A'} • ${p.media_type || 'movie'}</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 border-t border-white/5 pt-2 md:pt-0 md:border-t-0 mt-2 md:mt-0">
                                        <button onclick="moveInlineSagaItem(${idx}, -1)" class="w-8 h-8 rounded-lg bg-dark border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"><i class="fas fa-arrow-up text-[10px]"></i></button>
                                        <button onclick="moveInlineSagaItem(${idx}, 1)" class="w-8 h-8 rounded-lg bg-dark border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"><i class="fas fa-arrow-down text-[10px]"></i></button>
                                        <div class="w-px h-6 bg-white/10 mx-1"></div>
                                        <button onclick="removeInlineSagaItem(${idx})" class="w-8 h-8 rounded-lg bg-pulse/10 text-pulse hover:bg-pulse hover:text-white transition-all flex items-center justify-center"><i class="fas fa-times text-[10px]"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        renderInlineSagaList(); // <-- ADD THIS LINE
        return;
    }

   // ============================================
    // MODE B: CINEMATIC VIEW MODE 
    // ============================================
    const saga = currentSagaViewContext;
    const ownedParts = state.db.filter(i => String(i.sagaId) === String(id));
    const isFullySynced = ownedParts.length >= saga.parts.length;
    
    // Bulletproof Custom Saga Check (Catches older custom formats too)
    const isCustomSaga = String(id).startsWith('custom_') || customSagas.some(s => String(s.id) === String(id));

    let actionButtons = '';
    
    // 1. Add All (Only if there are missing parts AND it's a TMDB saga)
    if (!isFullySynced && !isCustomSaga) {
        actionButtons += `<button onclick="syncSagaData('${id}', '${saga.name.replace(/'/g, "\\'")}')" class="bg-pulse text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-pulse/30 hover:scale-105 transition-all flex items-center gap-2 w-full md:w-auto justify-center"><i class="fas fa-plus"></i> Add All</button>`;
    }
    
    // 2. Finish All (If they own parts of it, or if it's custom)
    if (ownedParts.length > 0 || isCustomSaga) {
        actionButtons += `<button onclick="markSagaFinished('${id}')" class="bg-[#22c55e] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-[#22c55e]/30 w-full md:w-auto justify-center"><i class="fas fa-check-double"></i> Finish All</button>`;
    }
    
    // 3. Eject (For Official TMDB sagas they have tracked)
    if (ownedParts.length > 0 && !isCustomSaga) {
        actionButtons += `<button onclick="purgeSagaData('${id}', '${saga.name.replace(/'/g, "\\'")}')" class="bg-white/5 text-gray-400 hover:text-pulse border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-pulse transition-all flex items-center gap-2 w-full md:w-auto justify-center"><i class="fas fa-trash-alt"></i> Eject</button>`;
    }
    
    // 4. Edit Inline (Always available to modify the blueprint)
    actionButtons += `<button onclick="openSaga('${id}', true)" class="bg-[#3b82f6]/20 border border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[#3b82f6]/20 w-full md:w-auto justify-center"><i class="fas fa-edit"></i> Edit Inline</button>`;
    
    // 5. Collapse (For Custom Sagas)
    if (isCustomSaga) {
        actionButtons += `<button onclick="deleteCustomUniverse('${id}')" class="bg-red-600/20 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 w-full md:w-auto justify-center"><i class="fas fa-radiation"></i> Collapse</button>`;
    }

    const parts = saga.parts.sort((a, b) => new Date(a.release_date || a.first_air_date) - new Date(b.release_date || b.first_air_date));

    // Fallback logic for TMDB's "overview" vs Custom Forge's "description"
    const displayDesc = saga.description || saga.overview;

    modal.innerHTML = `
        <div class="relative min-h-screen pb-32 animate-in fade-in duration-300">
            <button onclick="document.getElementById('sagaModal').classList.add('hidden')" class="saga-close-btn rounded-full flex items-center justify-center shadow-2xl">
                <i class="fas fa-times text-lg"></i>
            </button>
            <div class="relative w-full h-[35vh] md:h-[45vh] md:rounded-b-[40px] overflow-hidden mb-8 border-b border-white/10 shadow-2xl bg-dark">
                <img src="${IMG_HD + (saga.backdrop_path || '')}" class="saga-backdrop-img">
                <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent"></div>
                <h2 class="absolute bottom-6 left-6 md:left-12 text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
                    ${saga.name}
                </h2>
            </div>
            
            ${displayDesc ? `<p class="px-6 md:px-12 text-[10px] md:text-sm text-gray-400 mb-8 max-w-3xl leading-relaxed font-medium italic border-l-4 border-pulse ml-6 md:ml-12 pl-4">"${displayDesc}"</p>` : ''}

            <div class="px-6 md:px-12 mb-10 relative z-50 flex flex-wrap gap-2 md:gap-3">
                <button onclick="toggleSagaCollapse()" class="text-[9px] font-bold text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-xl uppercase tracking-widest bg-dark/50 backdrop-blur-md flex items-center gap-2 transition-all w-full md:w-auto justify-center"><i class="fas fa-layer-group"></i> Toggle View</button>
                ${actionButtons}
            </div>

            <div class="space-y-6 md:space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-pulse before:via-white/10 before:to-transparent px-2 md:px-0">
                ${parts.map((p, index) => {
                    const localData = state.db.find(i => i.id === p.id);
                    const isFinished = localData && localData.status === 'Finished';
                    const statusIcon = isFinished ? '<i class="fas fa-check text-[#22c55e]"></i>' : (localData ? '<i class="fas fa-eye text-pulse"></i>' : '');
                    const borderHighlight = localData ? (isFinished ? 'border-[#22c55e]/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-pulse/50 shadow-[0_0_15px_rgba(255,45,85,0.1)]') : 'border-white/5';

                    return `
                    <div class="saga-movie-card relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 overflow-hidden" style="max-height: 500px; opacity:1;">
                        <div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dark ${localData ? (isFinished ? 'bg-[#22c55e]' : 'bg-pulse') : 'bg-gray-800'} text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ml-1 md:ml-0">
                            <span class="text-[9px] md:text-[10px] font-black">${statusIcon || (index + 1)}</span>
                        </div>
                        
                        <div class="w-[calc(100%-3rem)] md:w-[calc(50%-3rem)] p-3 md:p-4 rounded-2xl md:rounded-3xl border ${borderHighlight} bg-[#0a0c12]/80 backdrop-blur-md hover:border-pulse transition-all flex gap-3 md:gap-4 cursor-pointer shadow-xl" onclick="document.getElementById('sagaModal').classList.add('hidden'); openModal('${p.id}', '${p.media_type || 'movie'}')">
                            <div class="w-16 h-24 md:w-24 md:h-32 shrink-0 rounded-xl overflow-hidden border border-white/5">
                                <img src="${IMG + (p.poster_path || '')}" class="w-full h-full object-cover bg-dark">
                            </div>
                            <div class="flex flex-col justify-center flex-1">
                                <h4 class="text-[11px] md:text-sm font-black uppercase italic text-white line-clamp-2">${p.title || p.name}</h4>
                                <div class="text-[8px] md:text-[9px] text-gray-500 font-bold tracking-widest mt-2 flex flex-col md:flex-row md:items-center justify-between w-full gap-2 md:gap-0">
                                    <div class="flex items-center gap-2">
                                        <span class="bg-white/5 px-2 py-1 rounded text-white">${(p.release_date || p.first_air_date || '').split('-')[0] || 'N/A'}</span>
                                        <span class="text-pulse">★ ${p.vote_average ? p.vote_average.toFixed(1) : 'N/A'}</span>
                                    </div>
                                    ${localData ? `<span class="uppercase font-black ${isFinished ? 'text-[#22c55e]' : 'text-pulse'} text-[7px] md:text-[8px] bg-white/10 px-2 py-1 rounded tracking-tighter w-fit">${localData.status}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

async function saveInlineSaga() {
    const title = document.getElementById('inlineSagaTitle').value.trim();
    const desc = document.getElementById('inlineSagaDesc').value || "A curated cinematic universe.";

    if (!title) return showNotification("Universe Title is required!", true);
    if (!currentSagaViewContext) return;

    // 1. Sync the context
    currentSagaViewContext.name = title;
    currentSagaViewContext.description = desc;
    // currentSagaViewContext.parts is already updated by add/remove functions

    // 2. Identify if it's an existing custom saga or a new conversion
    const sId = String(currentSagaViewContext.id);
    const existingIndex = customSagas.findIndex(s => String(s.id) === sId);

    if (existingIndex !== -1) {
        customSagas[existingIndex] = currentSagaViewContext;
    } else {
        customSagas.push(currentSagaViewContext);
    }

    // 3. Save Custom Sagas cleanly to LocalStorage
    localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));

    let addedCount = 0;
    currentSagaViewContext.parts.forEach(part => {
        let localItem = state.db.find(i => i.id === part.id);
        if (localItem) {
            localItem.sagaId = sId;
            localItem.sagaName = title;
        } else {
            state.db.push({
                id: part.id, title: part.title || part.name, poster: part.poster_path || part.poster,
                type: part.media_type || 'movie', status: 'Plan to Watch', 
                ep: 0, max_ep: 1, score: 0, crown: 0, imdb: 0, 
                year: (part.release_date || '').split('-')[0], genres: [], added: Date.now(),
                sagaId: sId, sagaName: title
            });
            addedCount++;
        }
    });

    // 4. Cleanup Ejected Items (Remove link if user deleted a part from the universe)
    state.db.forEach(item => {
        if (String(item.sagaId) === sId && !currentSagaViewContext.parts.find(f => String(f.id) === String(item.id))) {
            delete item.sagaId; delete item.sagaName;
        }
    });

    // 5. Trigger master save which auto-updates general counters
    save();

    // 6. Close Modal & Give Feedback
    document.getElementById('sagaModal').classList.add('hidden');
    showNotification(`Universe "${title}" synchronized.`);

    // 7. Dynamically update UI Background Grids instantly
    if (state.view === 'sagamatrix') {
        if (currentSagaTab === 'mylist') renderMySagas();
        else if (currentSagaTab === 'discover') renderSagaMatrix();
    } else if (state.view === 'mylist') {
        renderList();
    }
}

function toggleSagaCollapse() {
    document.querySelectorAll('.saga-movie-card').forEach(el => {
        if (el.style.maxHeight === '0px') {
            el.style.maxHeight = '500px';
            el.style.opacity = '1';
            el.style.marginBottom = '2rem';
        } else {
            el.style.maxHeight = '0px';
            el.style.opacity = '0';
            el.style.marginBottom = '0';
        }
    });
}
function markSagaFinished(sagaId) {
    let updated = 0;
    const isCustom = String(sagaId).startsWith('custom_');
    let sagaParts = [];

    if (isCustom) {
        const cs = customSagas.find(s => String(s.id) === String(sagaId));
        if (cs) sagaParts = cs.parts;
    }

    if (isCustom) {
        // Custom Sagas: Ensure all blueprint parts exist in DB and mark as Finished
        sagaParts.forEach(part => {
            let item = state.db.find(i => i.id === part.id);
            if (item) {
                item.status = 'Finished';
                item.ep = item.max_ep || 1;
                item.sagaId = sagaId;
                updated++;
            } else {
                state.db.push({
                    id: part.id, title: part.title || part.name, poster: part.poster_path,
                    type: part.media_type || 'movie', status: 'Finished', 
                    ep: 1, max_ep: 1, score: 0, crown: 0, imdb: 0, 
                    year: (part.release_date || '').split('-')[0], genres: [], added: Date.now(),
                    sagaId: sagaId, sagaName: "Custom Universe"
                });
                updated++;
            }
        });
    } else {
        // Standard Sagas: Update existing DB links
        state.db.forEach(item => {
            if (item.sagaId && String(item.sagaId) === String(sagaId)) {
                item.status = 'Finished';
                item.ep = item.max_ep || 1;
                updated++;
            }
        });
    }

    save(); 
    document.getElementById('sagaModal').classList.add('hidden');
    showNotification(updated > 0 ? `Universe Completed! ${updated} records updated.` : "Universe marked as completed.");

    // Dynamic UI Refresh Fix
    if (state.view === 'mylist') renderList();
    if (state.view === 'sagamatrix') renderMySagas();
}

function toggleSafeMode() {
    prefs.safeMode = !prefs.safeMode;
    savePrefs();
    updateSafeModeUI();
    showNotification(`Safe Mode is now ${prefs.safeMode ? 'ON' : 'OFF'}.`);
}

function updateSafeModeUI() {
    document.querySelectorAll('.safe-mode-toggle').forEach(btn => {
        if (prefs.safeMode) {
            btn.innerHTML = `<i class="fas fa-shield-alt text-[#22c55e] text-lg"></i> <span class="text-[#22c55e]">Safe: ON</span>`;
            btn.classList.add('border-[#22c55e]/30', 'bg-[#22c55e]/10');
            btn.classList.remove('border-pulse/30', 'bg-pulse/10');
        } else {
            btn.innerHTML = `<i class="fas fa-exclamation-triangle text-pulse text-lg"></i> <span class="text-pulse">Safe: OFF</span>`;
            btn.classList.add('border-pulse/30', 'bg-pulse/10');
            btn.classList.remove('border-[#22c55e]/30', 'bg-[#22c55e]/10');
        }
    });
}

// Ensure UI sets correctly on load by adding this inside your init() function:
updateSafeModeUI();

// --- SAGA FORGE ENGINE ---
let customSagas = JSON.parse(localStorage.getItem('cp_elite_custom_sagas')) || [];
let activeForgeItems = [];
let forgeSearchTimer;
let draggedItemIndex = null;
let currentEditingSagaId = null; // Tracks if the Forge is currently editing a Universe

function populateSagaDropdown(currentSagaId) {
    const select = document.getElementById('mSagaAssign');
    if (!select) return;

    let optionsHTML = '<option value="">None / Independent</option>';
    
    // Inject Custom Sagas
    customSagas.forEach(s => {
        const selected = (currentSagaId && String(currentSagaId) === String(s.id)) ? 'selected' : '';
        optionsHTML += `<option value="${s.id}" ${selected}>[Custom] ${s.name}</option>`;
    });

    // Inject Standard Sagas mapped from the DB
    const standardSagasMap = new Map();
    state.db.forEach(i => {
        if (i.sagaId && !String(i.sagaId).startsWith('custom_')) {
            standardSagasMap.set(i.sagaId, i.sagaName);
        }
    });
    standardSagasMap.forEach((name, id) => {
        const selected = (currentSagaId && String(currentSagaId) === String(id)) ? 'selected' : '';
        optionsHTML += `<option value="${id}" ${selected}>${name}</option>`;
    });

    select.innerHTML = optionsHTML;
}

function assignToSaga(sagaId) {
    if (!state.active) return;
    const item = state.db.find(i => i.id === state.active.id);
    
    if (!item) {
        showNotification("Initialize record first by setting a status.", true);
        document.getElementById('mSagaAssign').value = "";
        return;
    }

    if (!sagaId) {
        delete item.sagaId;
        delete item.sagaName;
        showNotification(`Ejected from Universe.`);
    } else {
        let sagaName = "Universe";
        if (String(sagaId).startsWith('custom_')) {
            const cs = customSagas.find(s => String(s.id) === String(sagaId));
            if (cs) {
                sagaName = cs.name;
                // Safely add to custom saga blueprint
                if (!cs.parts.find(p => p.id === item.id)) {
                    cs.parts.push({
                        id: item.id, title: item.title, poster_path: item.poster,
                        media_type: item.type, release_date: item.year + '-01-01', size: 'main'
                    });
                    localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));
                }
            }
        } else {
            const existing = state.db.find(i => String(i.sagaId) === String(sagaId));
            if (existing) sagaName = existing.sagaName;
        }

        item.sagaId = sagaId;
        item.sagaName = sagaName;
        showNotification(`Assigned to ${sagaName}`);
    }
    save();
    if (state.view === 'sagamatrix') renderMySagas();
}

async function handleInlineSagaSearch(query) {
    const resultsContainer = document.getElementById('inlineSagaSearchResults');
    if (!query || query.length < 2) {
        // If search is empty, show contextual recommendations based on the Saga content
        if (currentSagaViewContext.parts.length > 0) {
            const lastId = currentSagaViewContext.parts[currentSagaViewContext.parts.length - 1].id;
            const data = await fetchAPI(`/movie/${lastId}/recommendations`);
            renderInlineResults(data.results.slice(0, 5), "Based on Universe Content");
        } else {
            resultsContainer.classList.add('hidden');
        }
        return;
    }

    // Standard search logic
    clearTimeout(inlineSearchTimer);
    inlineSearchTimer = setTimeout(async () => {
        const data = await fetchAPI(`/search/multi`, `&query=${encodeURIComponent(query)}`);
        renderInlineResults(data.results, "Search Results");
    }, 500);
}

function renderInlineResults(results, label) {
    const container = document.getElementById('inlineSagaSearchResults');
    container.innerHTML = `<div class="p-3 text-[8px] font-black uppercase text-pulse bg-white/5 border-b border-white/10 tracking-[0.2em]">${label}</div>`;
    
    results.forEach(item => {
        if (item.media_type === 'person') return;
        const div = document.createElement('div');
        div.className = "p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-all border-b border-white/5";
        div.onclick = () => addEntityToSaga(item);
        div.innerHTML = `
            <img src="${item.poster_path ? IMG + item.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-10 object-cover rounded">
            <div class="truncate">
                <div class="text-[10px] font-bold uppercase text-white truncate">${item.title || item.name}</div>
                <div class="text-[8px] text-gray-500 uppercase">${(item.release_date || item.first_air_date || '').split('-')[0]}</div>
            </div>
        `;
        container.appendChild(div);
    });
    container.classList.remove('hidden');
}


// Unified Saga Tab Handler
function setSagaTab(tab) {
    currentSagaTab = tab;
    const tabs = ['discover', 'mylist', 'forge'];
    
    // 1. Update Tab Button Styles
    tabs.forEach(t => {
        const btn = document.getElementById(`sagaTab-${t}`);
        if(btn) {
            btn.className = t === tab 
                ? "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-pulse text-white shadow-lg shadow-pulse/20 whitespace-nowrap" 
                : "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white whitespace-nowrap border-l border-white/10 ml-2 pl-6";
        }
    });
    
    // 2. Toggle View Containers
    document.getElementById('sagaGrid').classList.toggle('hidden', tab === 'forge');
    document.getElementById('sagaActionBar').classList.toggle('hidden', tab === 'forge');
    document.getElementById('sagaForgeContainer').classList.toggle('hidden', tab !== 'forge');

    // 3. Toggle Select Button Visibility
    const selectBtn = document.getElementById('sagaSelectBtn');
    if (selectBtn) {
        if (tab === 'mylist') selectBtn.classList.remove('hidden');
        else selectBtn.classList.add('hidden');
    }

    // Turn off select mode if leaving the My Sagas tab
    if (isSelectMode && tab !== 'mylist') toggleSelectMode();

    // 4. Render Appropriate View
    if (tab === 'discover') renderSagaMatrix();
    else if (tab === 'mylist') renderMySagas();
    else initForge();
}


// Forge Search
function handleForgeSearch(query) {
    clearTimeout(forgeSearchTimer);
    if (!query) { document.getElementById('forgeSearchResults').innerHTML = ''; return; }
    forgeSearchTimer = setTimeout(async () => {
        const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(query)}&include_adult=${!prefs.safeMode}`);
        const results = data.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv').slice(0, 8);
        
        document.getElementById('forgeSearchResults').innerHTML = results.map(i => `
            <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-pulse/50 transition-all cursor-pointer group" 
                draggable="true" 
                ondragstart="forgeSearchDragStart(event, ${i.id}, '${i.media_type}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}', '${(i.release_date || i.first_air_date || '').split('-')[0]}')"
                onclick="addToForge(${i.id}, '${i.media_type}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}', '${(i.release_date || i.first_air_date || '').split('-')[0]}')">
                <div class="flex items-center gap-3">
                    <img src="${i.poster_path ? IMG+i.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 object-cover rounded-md pointer-events-none">
                    <div class="pointer-events-none">
                        <div class="text-[10px] font-black uppercase text-white line-clamp-1 group-hover:text-pulse">${i.title || i.name}</div>
                        <div class="text-[8px] font-bold text-gray-500 tracking-widest mt-1">${i.media_type} • ${(i.release_date || i.first_air_date || '').split('-')[0]}</div>
                    </div>
                </div>
                <i class="fas fa-plus text-gray-500 group-hover:text-pulse pointer-events-none"></i>
            </div>
        `).join('');
    }, 400);
}
function forgeSearchDragStart(e, id, type, title, poster, year) {
    e.dataTransfer.setData('application/json', JSON.stringify({id, type, title, poster, year}));
    e.dataTransfer.effectAllowed = 'copy';
}
function addToForge(id, type, title, poster, year) {
    if (activeForgeItems.find(i => i.id === id)) return showNotification("Entity already in canvas.", true);
    
    activeForgeItems.push({
        id: id, type: type, title: title, poster: poster, year: year, size: 'main' // default size
    });
    renderForgeCanvas();
    showNotification(`Added ${title} to Canvas.`);
    loadForgeRecommendations();
}

function removeFromForge(index) {
    activeForgeItems.splice(index, 1);
    renderForgeCanvas();
}

// Manual Controls
function moveForgeItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= activeForgeItems.length) return;
    
    // Add [0] to extract the actual object from the spliced array
    const item = activeForgeItems.splice(index, 1)[0]; 
    activeForgeItems.splice(newIndex, 0, item);
    renderForgeCanvas();
}

function toggleForgeSize(index) {
    const sizes = ['main', 'spinoff'];
    const current = sizes.indexOf(activeForgeItems[index].size);
    activeForgeItems[index].size = sizes[(current + 1) % sizes.length];
    renderForgeCanvas();
}

// Drag and Drop Controls
function forgeDragStart(e, index) {
    draggedItemIndex = index;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = "move";
}
function forgeDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.forge-item').forEach(el => el.classList.remove('drag-over'));
}
function forgeDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/json') ? "copy" : "move";
    
    const targetCard = e.target.closest('.forge-item');
    if (targetCard && targetCard.dataset.index != draggedItemIndex) {
        targetCard.classList.add('drag-over');
    }
}
function forgeDragLeave(e) {
    const targetCard = e.target.closest('.forge-item');
    if (targetCard) targetCard.classList.remove('drag-over');
}
function forgeDrop(e) {
    e.preventDefault();
    document.querySelectorAll('.forge-item').forEach(el => el.classList.remove('drag-over'));

    // 1. Handle drop from search (Added for the new search drag feature)
    try {
        const searchData = e.dataTransfer.getData('application/json');
        if (searchData) {
            const data = JSON.parse(searchData);
            addToForge(data.id, data.type, data.title, data.poster, data.year);
            return;
        }
    } catch(err) {}

    // 2. Existing Canvas Reorder Logic
    const targetCard = e.target.closest('.forge-item');
    if (!targetCard || draggedItemIndex === null) return;
    
    const dropIndex = parseInt(targetCard.dataset.index);
    if (draggedItemIndex === dropIndex) return;

    // Add [0] here as well
    const itemToMove = activeForgeItems.splice(draggedItemIndex, 1)[0]; 
    activeForgeItems.splice(dropIndex, 0, itemToMove);
    
    draggedItemIndex = null;
    setTimeout(() => { renderForgeCanvas(); }, 10); 
}

function renderForgeCanvas() {
    const canvas = document.getElementById('forgeCanvas');
    if (activeForgeItems.length === 0) {
        canvas.innerHTML = `
            <div class="text-center py-20 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                <i class="fas fa-meteor text-4xl mb-4 block"></i> Canvas is Empty. Search to add.
            </div>`;
        return;
    }

    canvas.innerHTML = activeForgeItems.map((item, index) => `
        <div class="forge-item bg-dark/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between items-center cursor-grab active:cursor-grabbing ${item.size === 'main' ? 'forge-size-main' : 'forge-size-spinoff'}" 
             draggable="true" 
             data-index="${index}"
             ondragstart="forgeDragStart(event, ${index})" 
             ondragend="forgeDragEnd(event)"
             ondragenter="forgeDragOver(event)"
             ondragleave="forgeDragLeave(event)">
            
            <div class="flex items-center gap-4 pointer-events-none">
                <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-black text-[10px]">${index + 1}</div>
                <img src="${item.poster ? IMG+item.poster : 'https://via.placeholder.com/50'}" class="w-12 h-16 rounded object-cover shadow-lg">
                <div>
                    <h4 class="text-[12px] font-black uppercase text-white line-clamp-1">${item.title}</h4>
                    <span class="text-[8px] uppercase tracking-widest text-gray-500">${item.type} • ${item.year}</span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button onclick="toggleForgeSize(${index})" class="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-pulse/20 transition-all flex items-center justify-center text-[10px]" title="Toggle Size/Importance"><i class="fas fa-compress-alt"></i></button>
                <div class="flex flex-col gap-1 mx-2">
                    <button onclick="moveForgeItem(${index}, -1)" class="text-gray-500 hover:text-white text-[10px]"><i class="fas fa-chevron-up"></i></button>
                    <button onclick="moveForgeItem(${index}, 1)" class="text-gray-500 hover:text-white text-[10px]"><i class="fas fa-chevron-down"></i></button>
                </div>
                <button onclick="removeFromForge(${index})" class="w-8 h-8 rounded-full bg-pulse/10 text-pulse hover:bg-pulse hover:text-white transition-all flex items-center justify-center text-[10px]"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `).join('');
    loadForgeRecommendations();
}
function deleteCustomUniverse(id) {
    if (!confirm("CRITICAL WARNING: This will permanently erase this Universe blueprint from your Forge. Entities already in your library will remain, but the Saga link will be severed. Proceed?")) return;

    // 1. Remove from the local array
    customSagas = customSagas.filter(s => String(s.id) !== String(id));
    
    // 2. Update localStorage
    localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));
    
    // 3. Clean up the state: Remove the saga link from any items in your DB
    state.db.forEach(item => {
        if (String(item.sagaId) === String(id)) {
            delete item.sagaId;
            delete item.sagaName;
        }
    });

    save();
    
    // 4. UI Refresh
    document.getElementById('sagaModal').classList.add('hidden');
    showNotification("Universe collapsed and erased from memory.");
    
    // Go back to the matrix to show it's gone
    setSagaTab('mylist');
}
function initForge() {
    activeForgeItems = [];
    currentEditingSagaId = null; // Reset editing state
    document.getElementById('forgeTitleInput').value = '';
    document.getElementById('forgeDescInput').value = '';
    document.getElementById('forgeSearchInput').value = '';
    document.getElementById('forgeSearchResults').innerHTML = '';
    document.getElementById('forgeRecGrid').innerHTML = '';
    renderForgeCanvas();
}

function editCustomUniverse(id) {
    const saga = customSagas.find(s => String(s.id) === String(id));
    if (!saga) return;

    currentEditingSagaId = saga.id;
    document.getElementById('forgeTitleInput').value = saga.name;
    document.getElementById('forgeDescInput').value = saga.description || '';
    
    activeForgeItems = saga.parts.map(p => ({
        id: p.id, type: p.media_type || 'movie', title: p.title, 
        poster: p.poster_path, year: (p.release_date || '').split('-')[0], size: p.size || 'main'
    }));

    document.getElementById('sagaModal').classList.add('hidden');
    setSagaTab('forge');
    renderForgeCanvas();
}

async function loadForgeRecommendations() {
    const container = document.getElementById('forgeRecGrid');
    if (!container) return;
    
    if (activeForgeItems.length === 0) {
        container.innerHTML = '<div class="col-span-full text-[9px] text-gray-500 uppercase tracking-widest">Add an entity to see neural suggestions.</div>';
        return;
    }

    const seed = activeForgeItems[activeForgeItems.length - 1];
    const apiType = seed.type === 'tv' ? 'tv' : 'movie';
    
    try {
        const data = await fetchAPI(`/${apiType}/${seed.id}/recommendations`);
        let recs = (data.results || []).filter(r => !activeForgeItems.find(f => f.id === r.id)).slice(0, 5);
        
        if (recs.length === 0) {
            container.innerHTML = '<div class="col-span-full text-[9px] text-gray-500 uppercase tracking-widest">No matching suggestions found.</div>';
            return;
        }

        container.innerHTML = recs.map(i => `
            <div class="flex items-center gap-3 bg-dark/50 border border-white/5 p-3 rounded-xl hover:border-pulse/50 cursor-pointer transition-all group"
                 onclick="addToForge(${i.id}, '${apiType}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}', '${(i.release_date || i.first_air_date || '').split('-')[0]}')">
                <img src="${i.poster_path ? IMG+i.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 rounded object-cover shadow">
                <div class="flex-1 overflow-hidden">
                    <div class="text-[10px] font-black uppercase text-white truncate group-hover:text-pulse">${i.title || i.name}</div>
                    <div class="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest"><i class="fas fa-plus"></i> Add Entity</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '';
    }
}

// --- INLINE EDIT MODE: LIST RENDERER & LOGIC ---

// Dynamically renders the list so it can update instantly on move/drag
function renderInlineSagaList() {
    const container = document.getElementById('inlineSagaList');
    const countLabel = document.getElementById('inlineSagaCountLabel');
    if (!container || !currentSagaViewContext) return;

    if (countLabel) {
        countLabel.innerHTML = `<span>Entity Hierarchy (${currentSagaViewContext.parts.length} Parts)</span>`;
    }

    container.innerHTML = currentSagaViewContext.parts.map((p, idx) => `
        <div class="inline-saga-item flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-pulse/30 transition-colors gap-3 md:gap-0 cursor-grab active:cursor-grabbing"
             draggable="true" 
             data-index="${idx}"
             ondragstart="inlineDragStart(event, ${idx})" 
             ondragend="inlineDragEnd(event)"
             ondragover="inlineDragOver(event)"
             ondragleave="inlineDragLeave(event)"
             ondrop="inlineDrop(event, ${idx})">
             
            <div class="flex items-center gap-3 md:gap-4 w-full md:w-2/3 pointer-events-none">
                <div class="w-6 h-6 md:w-8 md:h-8 rounded-full bg-dark border border-white/10 flex items-center justify-center text-[9px] md:text-[10px] font-black text-gray-500 shrink-0">${idx + 1}</div>
                <img src="${p.poster_path ? IMG+p.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 md:w-10 md:h-14 object-cover rounded-md shadow-lg shrink-0">
                <div class="truncate flex-1">
                    <div class="text-[10px] md:text-[11px] font-black uppercase text-white truncate">${p.title || p.name}</div>
                    <div class="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-widest mt-1">${(p.release_date || p.first_air_date || '').split('-')[0] || 'N/A'} • ${p.media_type || 'movie'}</div>
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 border-t border-white/5 pt-2 md:pt-0 md:border-t-0 mt-2 md:mt-0 z-10">
                <button onclick="moveInlineSagaItem(${idx}, -1)" class="w-8 h-8 rounded-lg bg-dark border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center" title="Move Up"><i class="fas fa-arrow-up text-[10px]"></i></button>
                <button onclick="moveInlineSagaItem(${idx}, 1)" class="w-8 h-8 rounded-lg bg-dark border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center" title="Move Down"><i class="fas fa-arrow-down text-[10px]"></i></button>
                <div class="w-px h-6 bg-white/10 mx-1"></div>
                <button onclick="removeInlineSagaItem(${idx})" class="w-8 h-8 rounded-lg bg-pulse/10 text-pulse hover:bg-pulse hover:text-white transition-all flex items-center justify-center" title="Remove Entity"><i class="fas fa-times text-[10px]"></i></button>
                <div class="ml-2 text-gray-600 pointer-events-none"><i class="fas fa-grip-lines"></i></div>
            </div>
        </div>
    `).join('');
}

// Manual Button Logic
function moveInlineSagaItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentSagaViewContext.parts.length) return;
    
    const itemToMove = currentSagaViewContext.parts.splice(index, 1)[0];
    currentSagaViewContext.parts.splice(newIndex, 0, itemToMove);
    renderInlineSagaList();
}

function removeInlineSagaItem(index) {
    currentSagaViewContext.parts.splice(index, 1);
    renderInlineSagaList();
}

// Search Injector Logic
function addEntityToSaga(item) {
    if (!currentSagaViewContext) return;
    if (currentSagaViewContext.parts.find(p => p.id === item.id)) {
        return showNotification("Entity is already in the blueprint.", true);
    }
    
    currentSagaViewContext.parts.push({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        media_type: item.media_type || 'movie',
        release_date: item.release_date || item.first_air_date || '2000-01-01'
    });
    
    renderInlineSagaList();
    showNotification(`Injected ${item.title || item.name} into Universe.`);
    document.getElementById('inlineSagaSearchResults').classList.add('hidden');
}

// Drag & Drop Engine
let draggedInlineIndex = null;

function inlineDragStart(e, index) {
    draggedInlineIndex = index;
    e.target.classList.add('opacity-40', 'scale-[0.98]', 'border-pulse');
    e.dataTransfer.effectAllowed = "move";
}

function inlineDragEnd(e) {
    e.target.classList.remove('opacity-40', 'scale-[0.98]', 'border-pulse');
    document.querySelectorAll('.inline-saga-item').forEach(el => {
        el.classList.remove('border-t-4', 'border-t-pulse', 'mt-4');
    });
}

function inlineDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const targetCard = e.target.closest('.inline-saga-item');
    if (targetCard && parseInt(targetCard.dataset.index) !== draggedInlineIndex) {
        targetCard.classList.add('border-t-4', 'border-t-pulse', 'mt-4');
    }
}

function inlineDragLeave(e) {
    const targetCard = e.target.closest('.inline-saga-item');
    if (targetCard) {
        targetCard.classList.remove('border-t-4', 'border-t-pulse', 'mt-4');
    }
}

function inlineDrop(e, dropIndex) {
    e.preventDefault();
    document.querySelectorAll('.inline-saga-item').forEach(el => {
        el.classList.remove('border-t-4', 'border-t-pulse', 'mt-4');
    });
    
    if (draggedInlineIndex === null || draggedInlineIndex === dropIndex) return;

    const itemToMove = currentSagaViewContext.parts.splice(draggedInlineIndex, 1)[0];
    currentSagaViewContext.parts.splice(dropIndex, 0, itemToMove);
    
    draggedInlineIndex = null;
    renderInlineSagaList();
}

function saveCustomUniverse() {
    let title = document.getElementById('forgeTitleInput').value.trim();
    let desc = document.getElementById('forgeDescInput').value.trim();
    
    if (!title) title = "Universe " + Math.floor(Math.random() * 1000);
    if (activeForgeItems.length < 2) return showNotification("Add at least 2 items to forge.", true);

    const sagaId = currentEditingSagaId || ('custom_' + Date.now());
    
    // Prevent duplicates only if creating new
    if (!currentEditingSagaId) {
        let finalTitle = title;
        let counter = 1;
        while(customSagas.some(s => s.name === finalTitle)) {
            finalTitle = `${title} (${counter})`;
            counter++;
        }
        title = finalTitle;
    }

    const newSagaBlueprint = {
        id: sagaId, name: title, description: desc, isCustom: true,
        backdrop_path: activeForgeItems[0].poster,
        parts: activeForgeItems.map(item => ({
            id: item.id, title: item.title, poster_path: item.poster,
            media_type: item.type, release_date: item.year + '-01-01', size: item.size
        }))
    };

    if (currentEditingSagaId) {
        const idx = customSagas.findIndex(s => s.id === currentEditingSagaId);
        if (idx > -1) customSagas[idx] = newSagaBlueprint;
    } else {
        customSagas.push(newSagaBlueprint);
    }

    localStorage.setItem('cp_elite_custom_sagas', JSON.stringify(customSagas));
    
    // Smart Syncing with the Neural DB
    let addedCount = 0;
    activeForgeItems.forEach(part => {
        let existing = state.db.find(i => i.id === part.id);
        if (existing) {
            existing.sagaId = sagaId;
            existing.sagaName = title;
        } else {
            state.db.push({
                id: part.id, title: part.title, poster: part.poster,
                type: part.type === 'tv' ? 'tv' : 'movie', status: 'Plan to Watch', 
                ep: 0, max_ep: 1, score: 0, crown: 0, imdb: 0, 
                year: part.year, genres: [], added: Date.now(),
                sagaId: sagaId, sagaName: title
            });
            addedCount++;
        }
    });

    // Cleanup Ejected Items (if editing)
    if (currentEditingSagaId) {
        state.db.forEach(item => {
            if (item.sagaId === sagaId && !activeForgeItems.find(f => f.id === item.id)) {
                delete item.sagaId; delete item.sagaName;
            }
        });
    }
    
    save(); 
    showNotification(currentEditingSagaId ? `Universe "${title}" updated!` : `Universe "${title}" forged! ${addedCount} new items tracked.`);
    setSagaTab('mylist');
    renderMySagas();
}
function updateSelectButtonVisibility(tabName) {
    const selectBtn = document.getElementById('sagaSelectBtn');
    const separator = document.getElementById('sagaSelectSeparator');

    // Allow the select button in both My List and Saga Matrix
    if (tabName === 'mylist' || tabName === 'sagamatrix') {
        selectBtn.classList.remove('hidden');
        separator.classList.remove('hidden');
    } else {
        selectBtn.classList.add('hidden');
        separator.classList.add('hidden');
    }
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
        

// --- BUILT-IN NEURAL PLAYER ENGINE ---

const EMBED_SERVERS = [
    { 
        id: 'vidsrccc', 
        name: 'Neural Alpha (VidSrc CC)', 
        build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t==='tv'?`/${s}/${e}`:''}` 
    },
    { 
        id: 'autoembed', 
        name: 'Eastern Relay (AutoEmbed)', // Historically strong for K-Drama and Asian cinema
        build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t==='tv'?`-${s}-${e}`:''}` 
    },
    { 
        id: 'multiembed', 
        name: 'Nexus Stream (MultiEmbed)', // Excellent fallback aggregator
        build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t==='tv'?`&s=${s}&e=${e}`:''}` 
    },
    { 
        id: 'vidsrcme', 
        name: 'Neural Beta (VidSrc ME)', // Classic, highly reliable backup
        build: (t, id, s, e) => `https://vidsrc.me/embed/${t}?tmdb=${id}${t==='tv'?`&season=${s}&episode=${e}`:''}` 
    },
    { 
        id: 'smashy', 
        name: 'Smashy Proxy', // Good global coverage, slightly different UI
        build: (t, id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}${t==='tv'?`&season=${s}&episode=${e}`:''}` 
    }
];

let playerState = {
    tmdbId: null, tmdbType: null, title: '',
    season: 1, episode: 1, serverIdx: 0,
    activeItemData: null // Stores TMDB API data passed from the modal
};

// --- WATCH OPTIONS MODAL LOGIC ---
function openWatchOptions(id, type, title) {
    const modal = document.getElementById('watchOptionsModal');
    const titleEl = document.getElementById('watchOptionsTitle');
    const btnInternal = document.getElementById('btnInternalPlayer');
    const linkJustWatch = document.getElementById('linkJustWatch');
    const linkTMDB = document.getElementById('linkTMDB');

    // Decode safe strings just in case
    const displayTitle = decodeURIComponent(title);
    titleEl.innerText = displayTitle;
    
    // 1. Setup Internal Player Route
    const safeTitle = encodeURIComponent(displayTitle);
    btnInternal.onclick = () => {
        window.location.href = `player.html?id=${id}&type=${type}&title=${safeTitle}`;
    };

    // 2. Setup External Fallback Links
    linkJustWatch.href = `https://www.justwatch.com/us/search?q=${safeTitle}`;
    linkTMDB.href = `https://www.themoviedb.org/${type}/${id}`;

    // Show Modal
    modal.classList.remove('hidden');
    // Tiny delay to ensure CSS transition triggers
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.firstElementChild.classList.remove('scale-95');
    }, 10);
}

function closeWatchOptions() {
    const modal = document.getElementById('watchOptionsModal');
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Close modal if clicking outside the box
document.getElementById('watchOptionsModal').addEventListener('click', function(e) {
    if (e.target === this) closeWatchOptions();
});

function launchInternalPlayer(id, tmdbType, title) {
    // Hide the watch source modal before navigating away
    document.getElementById('watchModal').classList.add('hidden');
    
    // URL encode the title safely
    const safeTitle = encodeURIComponent(title);
    
    // Redirect to the newly separated player page
    window.location.href = `player.html?id=${id}&type=${tmdbType}&title=${safeTitle}`;
}


function renderPlayerEpisodes(seasonNum) {
    playerState.season = parseInt(seasonNum);
    const validSeasons = playerState.activeItemData.seasons.filter(s => s.season_number > 0);
    const targetSeason = validSeasons.find(s => s.season_number === playerState.season);
    
    const grid = document.getElementById('playerEpGrid');
    if (!targetSeason) return grid.innerHTML = '';

    let html = '';
    for (let i = 1; i <= targetSeason.episode_count; i++) {
        const isActive = (playerState.episode === i);
        const btnClass = isActive 
            ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white';
            
        html += `<button onclick="switchPlayerEpisode(${i})" class="w-full aspect-square rounded-xl border flex items-center justify-center text-[11px] font-black transition-all ${btnClass}">${i}</button>`;
    }
    grid.innerHTML = html;
}



function highlightActiveServer() {
    document.querySelectorAll('.player-srv-btn').forEach((btn, idx) => {
        if (idx === playerState.serverIdx) {
            btn.classList.add('bg-pulse/20', 'border-pulse/50', 'text-pulse');
            btn.classList.remove('bg-white/5', 'border-white/10', 'text-gray-400');
        } else {
            btn.classList.remove('bg-pulse/20', 'border-pulse/50', 'text-pulse');
            btn.classList.add('bg-white/5', 'border-white/10', 'text-gray-400');
        }
    });
}




function syncProgressToLibrary() {
    // Calculates absolute episode number and saves it so the "Liquid" UI stays updated
    if (playerState.tmdbType !== 'tv') return;
    
    let absoluteEp = 0;
    const validSeasons = playerState.activeItemData.seasons.filter(s => s.season_number > 0);
    
    for (let s of validSeasons) {
        if (s.season_number < playerState.season) {
            absoluteEp += s.episode_count;
        } else if (s.season_number === playerState.season) {
            absoluteEp += playerState.episode;
            break;
        }
    }

    const idx = state.db.findIndex(i => i.id === playerState.tmdbId);
    if (idx !== -1) {
        state.db[idx].ep = absoluteEp;
        state.db[idx].status = 'Watching'; // Auto-mark as watching
        save();
    }
}

function closePlayerAndReturn() {
    document.getElementById('neuralIframe').src = ""; // Stop video playback
    navigate('home'); // Or navigate('mylist') if you want. Home is safest.
}