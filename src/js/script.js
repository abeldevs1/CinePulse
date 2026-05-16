const secureEncode = (str) => btoa(str).split('').reverse().join('');
const secureDecode = (str) => atob(str.split('').reverse().join(''));

window.addEventListener('popstate', (e) => {
    // 1. Intercept Back Button for Modals
    const modal = document.getElementById('modal');
    const personModal = document.getElementById('personModal');

    if (personModal && !personModal.classList.contains('hidden')) {
        closePersonModal(true);
        return; // Stop routing
    } else if (modal && !modal.classList.contains('hidden')) {
        closeModal(true);
        return; // Stop routing
    }

    // 2. Normal URL Hash Routing
    const hash = window.location.hash.substring(2);
    if (hash) {
        try {
            const view = secureDecode(hash);
            if (document.getElementById(`view-${view}`)) navigate(view, true);
        } catch (e) { navigate('home', true); }
    } else {
        navigate('home', true);
    }
});
// 1. Framebusting (Anti-Clickjacking): Prevents site from being embedded in an invisible iframe
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

// 2. Self-XSS Warning for DevTools
console.log("%cSTOP!", "color: red; font-size: 50px; font-weight: 900; text-shadow: 2px 2px 0px black;");
console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature, it is a scam and will give them access to your CinePulse Neural Database.", "color: white; font-size: 14px;");

// 3. String Sanitizer (To wrap around user inputs/searches before rendering)
function sanitize(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

function checkPWADisplay() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone || document.referrer.includes('android-app://');

    // Permanent hide: app was installed at some point
    const isPermanentlyInstalled = localStorage.getItem('cp_pwa_installed') === '1';

    // Check if dismissed within the last 3 days (3 * 24 * 60 * 60 * 1000 ms)
    const lastDismissed = parseInt(localStorage.getItem('cp_dismissed_install_time') || '0', 10);
    const isSnoozed = (Date.now() - lastDismissed) < 259200000;

    const lnk = document.getElementById('mobileInstallLink');
    const crd = document.getElementById('installReminderCard');

    // Permanent hide takes priority over snooze
    if (isStandalone || isPermanentlyInstalled || isSnoozed) {
        if (lnk) lnk.classList.add('hidden');
        if (crd) crd.classList.add('hidden');
    } else {
        if (lnk) lnk.classList.remove('hidden');
        if (crd) crd.classList.remove('hidden');
    }
}
window.addEventListener('DOMContentLoaded', () => {
    checkPWADisplay();
    const sidebarBackdrop = document.getElementById('modalSidebarBackdrop');
    const pageSidebarBackdrop = document.getElementById('pageInfoSidebarBackdrop');
    const modalHoverArea = document.getElementById('modalSidebarHoverArea');
    const pageInfoHoverArea = document.getElementById('pageInfoSidebarHoverArea');
    const modalSidebar = document.getElementById('modalSidebar');
    const pageInfoSidebar = document.getElementById('pageInfoSidebar');
    const inlineModalHomeBtn = document.querySelector('button[onclick="closeModal(); navigate(\'home\')"]');

    if (inlineModalHomeBtn) {
        inlineModalHomeBtn.setAttribute('onclick', "navigateFromModal('home')");
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => hideModalSidebar(true));
    }
    if (pageSidebarBackdrop) {
        pageSidebarBackdrop.addEventListener('click', () => hidePageInfoSidebar(true));
    }

    if (modalHoverArea && modalSidebar) {
        modalHoverArea.addEventListener('mouseenter', () => {
            showModalSidebar();
            modalSidebar.dataset.hoverActive = 'true';
        });
        modalHoverArea.addEventListener('mouseleave', () => {
            if (modalSidebar.dataset.userOpen !== 'true') hideModalSidebar();
        });
        modalSidebar.addEventListener('mouseenter', () => {
            modalSidebar.dataset.hoverActive = 'true';
        });
        modalSidebar.addEventListener('mouseleave', () => {
            if (modalSidebar.dataset.userOpen !== 'true') hideModalSidebar();
        });
    }

    if (pageInfoHoverArea && pageInfoSidebar) {
        pageInfoHoverArea.addEventListener('mouseenter', () => {
            showPageInfoSidebar();
            pageInfoSidebar.dataset.hoverActive = 'true';
        });
        pageInfoHoverArea.addEventListener('mouseleave', () => {
            if (pageInfoSidebar.dataset.userOpen !== 'true') hidePageInfoSidebar();
        });
        pageInfoSidebar.addEventListener('mouseenter', () => {
            pageInfoSidebar.dataset.hoverActive = 'true';
        });
        pageInfoSidebar.addEventListener('mouseleave', () => {
            if (pageInfoSidebar.dataset.userOpen !== 'true') hidePageInfoSidebar();
        });
    }

    function _safeContains(el, target) {
        return el && typeof el.contains === 'function' ? el.contains(target) : false;
    }

    // Auto-close sidebar when user hovers outside it.
    document.addEventListener('mousemove', function (event) {
        var pageInfoSidebar = document.getElementById('pageInfoSidebar');
        var modalSidebar = document.getElementById('modalSidebar');
        var target = event.target;

        if (pageInfoSidebar && pageInfoSidebar.classList.contains('open')) {
            var keepOpen = _safeContains(pageInfoSidebar, target) ||
                _safeContains(document.getElementById('pageInfoSidebarHoverArea'), target) ||
                _safeContains(document.getElementById('pageInfoSidebarToggle'), target) ||
                _safeContains(document.getElementById('pageInfoOverlaySidebarButton'), target);
            if (!keepOpen) hidePageInfoSidebar(true);
        }

        if (modalSidebar && modalSidebar.classList.contains('open')) {
            var keepModalOpen = _safeContains(modalSidebar, target) ||
                _safeContains(document.getElementById('modalSidebarHoverArea'), target) ||
                _safeContains(document.getElementById('modalSidebarToggle'), target);
            if (!keepModalOpen) hideModalSidebar(true);
        }
    });

    document.addEventListener('click', function (event) {
        var pageInfoSidebar = document.getElementById('pageInfoSidebar');
        var modalSidebar = document.getElementById('modalSidebar');

        if (pageInfoSidebar && pageInfoSidebar.classList.contains('open')) {
            var keepOpen = _safeContains(pageInfoSidebar, event.target) ||
                _safeContains(document.getElementById('pageInfoSidebarToggle'), event.target) ||
                _safeContains(document.getElementById('pageInfoOverlaySidebarButton'), event.target);
            if (!keepOpen) hidePageInfoSidebar(true);
        }

        if (modalSidebar && modalSidebar.classList.contains('open')) {
            var keepModalOpen = _safeContains(modalSidebar, event.target) ||
                _safeContains(document.getElementById('modalSidebarToggle'), event.target);
            if (!keepModalOpen) hideModalSidebar(true);
        }
    });

    // Ensure nav icons route correctly by explicit route data binding.
    if (typeof window.initNavRouting === 'function') {
        window.initNavRouting();
    }
});

window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWADisplay);

// Permanent hide on successful PWA install
window.addEventListener('appinstalled', () => {
    localStorage.setItem('cp_pwa_installed', '1');
    const lnk = document.getElementById('mobileInstallLink');
    const crd = document.getElementById('installReminderCard');
    if (lnk) lnk.classList.add('hidden');
    if (crd) crd.classList.add('hidden');
});

window.dismissInstallReminder = function (event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    localStorage.setItem('cp_dismissed_install_time', Date.now().toString());
    const crd = document.getElementById('installReminderCard');
    const lnk = document.getElementById('mobileInstallLink');
    if (crd) crd.classList.add('hidden');
    if (lnk) lnk.classList.add('hidden');
};
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

const HARD_BLOCK_LIST = {
    ids: [124440, 95557, 101161, 71597, 85404, 76269], // Overflow, Adam's Sweet Agony, etc.
    names: ["overflow", "adam's sweet agony", "adams sweet agony", "furyu", "mankitsu", "euphoria"]
};

function isBlocked(item) {
    if (!item) return true;
    const title = (item.title || item.name || '').toLowerCase();
    const isAdult = item.adult || item.genre_ids?.includes(10749) && item.genre_ids?.includes(16); // Double check for Hentai pattern
    return HARD_BLOCK_LIST.ids.includes(item.id) ||
        HARD_BLOCK_LIST.names.some(n => title.includes(n)) ||
        isAdult;
}
// --- NETWORK LOADER LOGIC ---
function showLoader() {
    let el = document.getElementById('globalLoader');
    if (!el) {
        el = document.createElement('div');
        el.id = 'globalLoader';
        document.body.appendChild(el);
    }
    el.style.opacity = '1';
    el.style.width = '30%';
    setTimeout(() => { if (el.style.opacity === '1') el.style.width = '70%'; }, 200);
}

function hideLoader() {
    const el = document.getElementById('globalLoader');
    if (el) {
        el.style.width = '100%';
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => { el.style.width = '0%'; }, 300);
        }, 250);
    }
}
// Smart Mobile Scroll Observer
const navEl = document.getElementById('sidebarNav');
const scrollHint = document.getElementById('sidebarScrollHint');

if (navEl) {
    // 1. Show hint if not dismissed in this session and on mobile
    if (window.innerWidth < 1024 && !sessionStorage.getItem('cp_sidebar_hint_seen')) {
        if (scrollHint) {
            scrollHint.classList.remove('hidden');
            // Allow CSS transition to fire
            requestAnimationFrame(() => {
                scrollHint.style.opacity = '1';
                scrollHint.style.transform = 'translateX(-50%) translateY(0)';
            });
        }
    }

    // 2. Dismiss logic
    const dismissHint = () => {
        if (scrollHint && !scrollHint.classList.contains('hidden')) {
            scrollHint.style.opacity = '0';
            scrollHint.style.transform = 'translateX(-50%) translateY(20px)';
            scrollHint.style.pointerEvents = 'none';
            sessionStorage.setItem('cp_sidebar_hint_seen', 'true');

            // Clean up DOM after animation
            setTimeout(() => {
                scrollHint.classList.add('hidden');
            }, 600);
        }
    };

    navEl.addEventListener('scroll', () => {
        // Dismiss hint on first scroll
        dismissHint();

        // Check if user reached the right side (within 10px)
        const isAtEnd = navEl.scrollLeft + navEl.clientWidth >= navEl.scrollWidth - 10;
        if (isAtEnd) {
            navEl.parentElement.classList.add('nav-at-end');
        } else {
            navEl.parentElement.classList.remove('nav-at-end');
        }
    }, { passive: true });

    // Also dismiss on touch
    navEl.addEventListener('touchstart', dismissHint, { passive: true });
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
let globalHeroInterval = null;
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
let calendarOffset = 0;
let calendarWasOpen = false;
let calendarHoverLocked = false;
let calendarHoverKey = null;
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
    currentSyncBatch: [],
    radar: (() => { try { return JSON.parse(localStorage.getItem('cp_neural_radar') || '[]'); } catch (e) { return []; } })(),
    reminders: (() => { try { return JSON.parse(localStorage.getItem('cp_elite_reminders') || '[]'); } catch (e) { return []; } })(),
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
        ] = await Promise.all([
            fetchAPI('/trending/all/week'),
            fetchAPI('/discover/tv?sort_by=popularity.desc&with_original_language=en'),
            fetchAPI('/discover/tv?with_genres=16&with_original_language=ja&without_genres=10749&include_adult=false&sort_by=popularity.desc'),
            fetchAPI('/discover/tv?with_original_language=ko&sort_by=popularity.desc'),
            fetchAPI('/discover/tv?with_original_language=tr&sort_by=popularity.desc'),
            fetchAPI('/discover/tv?with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc'),

            // UPCOMING: use /discover with strict date.gte=today so released content never appears
            fetchAPI(`/discover/movie?primary_release_date.gte=${today}&sort_by=popularity.desc&region=US`),
            fetchAPI(`/discover/tv?first_air_date.gte=${today}&sort_by=popularity.desc&with_original_language=en`),
            // Anime upcoming: also exclude hentai (genre 10749) and adult content
            fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_genres=16&with_original_language=ja&without_genres=10749&include_adult=false&sort_by=popularity.desc`),
            fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_original_language=ko&sort_by=popularity.desc`),
            fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_original_language=tr&sort_by=popularity.desc`),
            fetchAPI(`/discover/tv?first_air_date.gte=${today}&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc`),

            fetchAPI('/genre/movie/list'), fetchAPI('/genre/tv/list')
        ]);

        state.hero = trending.results.filter(i => i.backdrop_path).slice(0, 5);
        const allGenres = [...mGenres.genres, ...tGenres.genres];
        state.genres = Array.from(new Map(allGenres.map(g => [g.id, g])).values());

        state.homeData = { trending, tv, anime, kdrama, turkish, asian, upMovie, upTv, upAnime, upKdrama, upTurkish, upAsian };

        const hash = window.location.hash.substring(2);
        if (hash) {
            try {
                const decodedView = secureDecode(hash);
                await navigate(decodedView, true);
            } catch (e) {
                await navigate('home', true);
            }
        } else {
            await navigate('home', true);
        }

        checkReminders(); // Fire reminder check on load

        setupFilters();
        updateCounters();
        setupSearchBehavior();
        setupStarLogic();
        initNeuralEngine();
        renderSources();
        setupLongPressCopy();
        loadCountries();
        updateSafeModeUI();
        setupLongPressSelection();
        getContinueWatchingHTML();
        initSmartScrollButtons();

    } catch (e) {
        console.error("Neural init error", e);


    }
}

async function fetchAPI(path) {
    const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${API_KEY}`);
    return res.json();
}
// --- URL ROUTING (Handles returning from Player) ---
// --- URL ROUTING & DEEP LINK INTERCEPTOR ---
document.addEventListener('DOMContentLoaded', () => {
    // Boot clock IMMEDIATELY so it never shows frozen 00:00 while API calls load
    startClock();

    const urlParams = new URLSearchParams(window.location.search);

    // Legacy/Standard Open
    const openId = urlParams.get('open');
    const openType = urlParams.get('type');

    // New Deep Link Parameters
    const shareParam = urlParams.get('share');
    const listParam = urlParams.get('list');
    const searchQuery = urlParams.get('search');

    // Helper to clean the URL silently so it doesn't loop if the user refreshes
    const cleanURL = () => window.history.replaceState({}, document.title, window.location.pathname);

    if (shareParam) {
        cleanURL();
        const [type, id] = shareParam.split('-');
        if (type && id) {
            setTimeout(() => {
                state.db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
                openModal(id, type);
            }, 500);
        }
    } else if (openId && openType) {
        cleanURL();
        setTimeout(() => {
            state.db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
            openModal(openId, openType);
            if (typeof renderContinueWatching === 'function') renderContinueWatching();
        }, 500);
    } else if (listParam) {
        cleanURL();
        const items = listParam.split(',');

        // Confirm before mass-importing into their DB
        if (confirm(`Incoming Neural Link: Import ${items.length} items to your library?`)) {
            showNotification(`Importing ${items.length} items. Please wait...`);

            // Sequentially trigger your existing quickAdd function
            items.reduce(async (promise, encodedItem) => {
                await promise;
                const type = encodedItem.charAt(0) === 'm' ? 'movie' : 'tv';
                const id = encodedItem.substring(1);
                return quickAdd(id, type);
            }, Promise.resolve()).then(() => {
                showNotification("Watchlist import complete!");
                if (state.view === 'mylist') renderList();
            });
        }
    } else if (searchQuery) {
        cleanURL();
        document.getElementById('mainSearch').value = searchQuery;
        setTimeout(() => {
            navigate('search');
            deepSearch(searchQuery);
        }, 500);
    }

    checkInstallSnooze();
});

// api helper 

async function loadModalFragment(id) {
    if (document.getElementById(id)) return;
    showLoader();
    try {
        const res = await fetch(`pages/${id}.html`);
        if (res.ok) {
            const html = await res.text();
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const el = temp.querySelector(`#${id}`) || temp.firstElementChild;
            if (el) document.body.appendChild(el);
        }
    } catch (e) { console.error("Failed to load modal", id, e); }
    hideLoader();
}

function getTodayAPI() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderHome() {
    if (!state.homeData) return;
    const { trending, tv, anime, kdrama, turkish, asian, upMovie, upTv, upAnime, upKdrama, upTurkish, upAsian } = state.homeData;

    renderHero();
    renderContinueWatching();
    initializeSmartHomeSections();
    initSmartScrollButtons();

    const top10 = [...trending.results]
        .filter(i => i.vote_average > 0 && i.poster_path)
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 10);
    renderTop10(top10);

    renderRow('row-movies', trending.results.filter(i => i.media_type === 'movie'), 'movie');
    renderRow('row-tv', tv.results, 'tv');
    renderRow('row-anime', anime.results, 'tv');
    renderRow('row-kdrama', kdrama.results, 'tv');
    renderRow('row-turkish', turkish.results, 'tv');
    renderRow('row-asian', asian.results, 'tv');

    renderRow('row-up-movies', upMovie.results, 'movie');
    renderRow('row-up-tv', upTv.results, 'tv');
    renderRow('row-up-anime', upAnime.results, 'tv');
    renderRow('row-up-kdrama', upKdrama.results, 'tv');
    renderRow('row-up-turkish', upTurkish.results, 'tv');
    renderRow('row-up-asian', upAsian.results, 'tv');
}

// Navigation
async function navigate(view, skipHistory = false) {
    showLoader();
    state.view = view;

    // --- NEW: Update Encrypted URL Hash ---
    if (!skipHistory) {
        window.history.pushState(null, null, `#/${secureEncode(view)}`);
    }
    // --------------------------------------

    const sidebar = document.getElementById('mainSidebar');
    if (sidebar) {
        sidebar.classList.add('pointer-events-none');
        setTimeout(() => sidebar.classList.remove('pointer-events-none'), 600);
    }

    let targetView = document.getElementById(`view-${view}`);
    if (!targetView) {
        try {
            const res = await fetch(`pages/${view}.html`);
            if (res.ok) {
                const html = await res.text();
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const loadedView = temp.querySelector(`#view-${view}`) || temp.querySelector('.page-view') || temp.firstElementChild;
                if (loadedView) {
                    document.getElementById('mainContent').appendChild(loadedView);
                    targetView = document.getElementById(`view-${view}`);
                }
            } else {
                console.error(`Failed to load view: ${view}`);
                hideLoader();
                return;
            }
        } catch (e) {
            console.error(`Error loading view: ${view}`, e);
            hideLoader();
            return;
        }
    }

    document.querySelectorAll('.page-view').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('page-transition-enter');
    });

    if (targetView) {
        targetView.classList.remove('hidden');
        void targetView.offsetWidth;
        targetView.classList.add('page-transition-enter');
    }

    document.getElementById('pathLabel').innerText = view.toUpperCase();

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick').includes(`'${view}'`));
    if (btn) btn.classList.add('active');

    // Run view specific logic inside setTimeout to ensure DOM is ready
    setTimeout(() => {
        if (view === 'home') renderHome();
        if (view === 'mylist') renderList();
        if (view === 'upcoming') loadUpcomingPage();
        if (view === 'rhythmlab') {
            setupFilters();
            runLab();
        }
        if (view === 'search') {
            setupFilters();
            loadCountries();
            loadDiscoverContent();
            
            const input = document.getElementById('mainSearch');
            const header = document.getElementById('searchHeader');
            if (!input.value && !header.innerText.includes('• Works')) {
                header.innerText = "Discover";
                loadDiscoverContent();
            }
        }
        if (view === 'sync') renderSync();
        if (view === 'masterpieces') renderMasterpieces();
        if (view === 'sagamatrix') renderSagaMatrix();
        if (view === 'radar') renderRadar();
    }, 50);

    if (view === 'neurallink') {
        // 1. Reset Host UI to default state
        const qrContainer = document.getElementById('qrContainer');
        const hostStatus = document.getElementById('hostStatusText');
        if (qrContainer) qrContainer.classList.add('hidden');
        if (hostStatus) {
            hostStatus.classList.add('hidden');
            hostStatus.innerText = "Awaiting Connection...";
            hostStatus.className = "hidden mt-4 text-[10px] text-pulse font-bold uppercase tracking-widest animate-pulse";
        }

        // 2. Clear manual input
        const manualInput = document.getElementById('manualPeerId');
        if (manualInput) manualInput.value = '';

        // 3. Optional: Auto-init Peer if you want the ID ready immediately 
        // otherwise, let the user click "Generate Sync Key"
        console.log("Neural Link View Initialized");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(hideLoader, 300);

    // --- Back-to-Top/Bottom button visibility ---
    const topBtn = document.getElementById('backToTopBtn');
    const botBtn = document.getElementById('backToBotBtn');
    if (topBtn && botBtn) {
        if (view === 'mylist' || view === 'rhythmlab') {
            // Show buttons when scrolled past 400px
            const scrollHandler = () => {
                const visible = window.scrollY > 400;
                topBtn.classList.toggle('opacity-0', !visible);
                topBtn.classList.toggle('pointer-events-none', !visible);
                botBtn.classList.toggle('opacity-0', !visible);
                botBtn.classList.toggle('pointer-events-none', !visible);
            };
            // Remove any existing listener before re-adding
            window.removeEventListener('scroll', window._cpScrollHandler);
            window._cpScrollHandler = scrollHandler;
            window.addEventListener('scroll', scrollHandler, { passive: true });
            scrollHandler(); // run immediately
            topBtn.classList.remove('hidden');
            botBtn.classList.remove('hidden');
        } else {
            topBtn.classList.add('hidden');
            botBtn.classList.add('hidden');
            window.removeEventListener('scroll', window._cpScrollHandler);
        }
    }
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
            searchTimeout = setTimeout(() => {
                if (state.searchMode === 'filter') {
                    applySearchFilters(false);
                } else {
                    deepSearch(q);
                }
            }, 500);
        } else {
            if (!q) { drop.classList.add('hidden'); return; }
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
window.checkScrollLock = function () {
    const modalIds = [
        'modal', 'personModal', 'sagaModal', 'pickerModal', 'advancedIOModal',
        'networkPurgeModal', 'factoryResetModal', 'watchModal', 'watchOptionsModal',
        'qrScannerModal', 'neuralDiffOverlay', 'purgeModal', 'temporalArchiveModal'
    ];

    // Mirror sidebar nav into modal sidebar for item info modal
    var sidebarNav = document.getElementById('sidebarNav');
    var modalSidebarNav = document.getElementById('modalSidebarNav');

    if (sidebarNav && modalSidebarNav) {
        modalSidebarNav.innerHTML = sidebarNav.innerHTML;
        modalSidebarNav.querySelectorAll('button').forEach(function (btn) {
            // Extract the target route from the original onclick
            var baseOnclick = btn.getAttribute('onclick') || '';
            btn.removeAttribute('onclick'); // Prevent double firing

            var routeMatch = baseOnclick.match(/navigate\('([^']+)'\)/);

            btn.onclick = function (e) {
                e.stopPropagation();
                e.preventDefault();

                // If it's a navigation button, use our safe router
                if (routeMatch && routeMatch[1]) {
                    navigateFromModal(routeMatch[1]);
                } else {
                    // Fallback for non-navigation buttons
                    if (baseOnclick) eval(baseOnclick);
                    closeModal();
                }
            };
        });
    }

    const isAnyModalOpen = modalIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
    });

    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';
};

window.addEventListener('DOMContentLoaded', () => {
    setupNeuralDiffOverlayGestures();
});

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
    if (!res.length) { drop.classList.add('hidden'); return; }
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

                <img src="${img ? IMG + img : 'https://via.placeholder.com/50'}" class="w-8 h-12 rounded-lg object-cover shadow-lg">
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
    const pModal = document.getElementById('personModal');
    if (pModal) pModal.scrollTop = 0;

    // Save current scroll before opening
    if (pModal.classList.contains('hidden')) {
        window._cpModalScrollY = window.scrollY;
    }
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
    checkScrollLock();
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
        <div class="group cursor-pointer" onclick="openModal(${w.id}, '${w.media_type || 'movie'}')">
            <div class="aspect-[2/3] rounded-2xl overflow-hidden mb-3 border border-white/5 group-hover:border-pulse transition-all">
                <img src="${IMG + w.poster_path}" class="w-full h-full object-cover">
            </div>
            <div class="text-[9px] font-black uppercase line-clamp-1 group-hover:text-pulse">${w.title || w.name}</div>
        </div>
    `).join('');

    loadMoreBox.classList.toggle('hidden', personDisplayLimit >= currentPersonCredits.length);
}


function renderDrop(items, query) {
    const drop = document.getElementById('searchDrop');
    if (!items || items.length === 0) {
        drop.innerHTML = `<div class="p-4 text-[10px] font-bold text-gray-500 uppercase italic">No signals found for "${sanitize(query)}"</div>`;
    } else {
        drop.innerHTML = items.map(i => {
            const title = i.title || i.name;
            const year = (i.release_date || i.first_air_date || '').split('-')[0];
            const type = determineCategory(i);
            const tmdbType = i.media_type || (i.title ? 'movie' : 'tv');
            const label = formatTypeLabel(type, tmdbType);

            return `
                <div class="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 group relative" 
                     onpointerdown="event.preventDefault(); openModal(${i.id}, '${tmdbType}')">
                    <img src="${i.poster_path ? IMG + i.poster_path : 'https://via.placeholder.com/45x68?text=?'}" 
                         class="w-10 h-14 object-cover rounded shadow-md pointer-events-none">
                    <div class="flex-1 min-w-0 pointer-events-none">
                        <div class="text-[11px] font-black uppercase truncate group-hover:text-pulse transition-colors">${title}</div>
                        <div class="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest">
                            ${label} • ${year || 'TBA'}
                        </div>
                    </div>
                    <button onpointerdown="event.preventDefault(); event.stopPropagation(); quickAdd(${i.id}, '${tmdbType}')" 
                            class="p-2 px-3 bg-pulse/10 hover:bg-pulse text-pulse hover:text-white rounded-lg transition-all border border-pulse/20 z-10">
                        <i class="fas fa-plus text-[10px]"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    drop.classList.remove('hidden');
}

// Logic for the Quick Add Button
function quickWatch(event, id, cat, tmdbType, title, year) {
    // Stop the click from opening the info modal underneath
    event.preventDefault();
    event.stopPropagation();

    // Failsafe: if called from old cached HTML without tmdbType, shift the arguments
    if (year === undefined) {
        year = title;
        title = tmdbType;
        tmdbType = (cat === 'tv' || cat === 'anime' || cat === 'kdrama' || cat === 'turkish' || cat === 'asian') ? 'tv' : 'movie';
    }

    const availableSources = sourcesDb[cat] || [];
    const safeTitle = encodeURIComponent(title);
    const safeYear = year;

    // Auto-Launch Internal Player and bypass Modal if no external sources exist
    if (availableSources.length === 0) {
        showNotification(`Launching Built-in Player. <u onclick="navigate('sources')" class="cursor-pointer text-white hover:text-pulse ml-1">Configure External Sources Here</u>`);
        launchInternalPlayer(id, tmdbType, title);
        return;
    }

    // 1. BUILT-IN PLAYER SECTION
    let html = `
        <div class="mb-6 border-b border-white/10 pb-6">
            <h4 class="text-[10px] font-black uppercase text-[#22c55e] tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-play"></i> Built-in Player
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
    if (availableSources.length === 1) {
        const src = availableSources[0];
        const finalUrl = src.url.replace(/{title}/g, safeTitle).replace(/{tmdb_id}/g, id).replace(/{year}/g, safeYear);
        let domain = 'Link';
        try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch (e) { }

        html += `
            <a href="${finalUrl}" target="_blank" onclick="autoMarkWatching(${id}, '${tmdbType}'); document.getElementById('watchModal').classList.add('hidden')"
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
        html += `<div class="space-y-2 max-h-[30vh] overflow-y-auto hide-scroll pr-1">`;
        html += availableSources.map(src => {
            const finalUrl = src.url.replace(/{title}/g, safeTitle).replace(/{tmdb_id}/g, id).replace(/{year}/g, safeYear);
            let domain = 'Link';
            try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch (e) { }

            return `
               <a href="${finalUrl}" target="_blank" onclick="autoMarkWatching(${id}, '${tmdbType}'); document.getElementById('watchModal').classList.add('hidden')"
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

    if (!data.results || data.results.length === 0) {
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
    if (safeResults.length === 0) {
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

    const query = document.getElementById('mainSearch').value.trim();

    // Determine path based on if we have a search query or just filters
    let path = "";
    if (query) {
        path = `/search/${apiType}?query=${encodeURIComponent(query)}&page=${state.filterPage}`;
        if (year) {
            if (apiType === 'movie') path += `&primary_release_year=${year}`;
            else path += `&first_air_date_year=${year}`;
        }
        // Search API doesn't support genres/country in the same call, 
        // local filter (applyDiscoverLocalFilters) will handle them.
    } else {
        path = `/discover/${apiType}?sort_by=${sort}&page=${state.filterPage}`;

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

        // Apply Year
        if (year) {
            if (apiType === 'movie') path += `&primary_release_year=${year}`;
            else path += `&first_air_date_year=${year}`;
        }

        // Apply Country
        if (country) {
            path += `&with_origin_country=${country}`;
        }

        // Apply Genres
        if (state.discoverFilters.genres && state.discoverFilters.genres.length > 0) {
            path += `&with_genres=${state.discoverFilters.genres.join(',')}`;
        }
    }

    try {
        const data = await fetchAPI(path);

        // If we have a query, we might need extra local filtering as search API is less restrictive
        if (query) {
            state.discoverDataRaw = data.results;
            applyDiscoverLocalFilters();
        } else {
            renderGrid('searchGrid', data.results, apiType, !append);
            applyLayoutToGrid();
        }

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
// --- NEW SLIDER ENGINE ---
function renderHero() {
    const slider = document.getElementById('heroSlider');
    const dotsContainer = document.getElementById('heroNavDots');

    slider.innerHTML = state.hero.map((item, i) => `
        <div class="hero-item absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${i === 0 ? 'active' : 'inactive'}" data-index="${i}">
            <img src="${IMG_HD + item.backdrop_path}" class="w-full h-full object-cover transform transition-transform duration-[10s] ease-out ${i === 0 ? 'scale-105' : 'scale-100'}">
            <div class="hero-overlay absolute inset-0 bg-[#020408] transition-opacity duration-1000 ${i === 0 ? 'opacity-0' : 'opacity-60'} z-10"></div>
        </div>
    `).join('');

    if (dotsContainer) {
        dotsContainer.innerHTML = state.hero.map((_, i) => `
            <div class="hero-dot w-2 h-2 rounded-full transition-all duration-500 cursor-pointer ${i === 0 ? 'w-8 bg-pulse' : 'bg-white/30 hover:bg-white/60'}" onclick="goToHero(${i})"></div>
        `).join('');
    }

    updateHeroContent();
    startHeroAutoSlide();
}

function startHeroAutoSlide() {
    clearInterval(globalHeroInterval);
    if (!state.hero || state.hero.length <= 1) return;

    globalHeroInterval = setInterval(() => {
        if (document.hidden) return;
        nextHero();
    }, 8000);
}

function updateHeroContent() {
    const item = state.hero[state.heroIdx];
    const title = item.title || item.name;
    const hTitle = document.getElementById('heroTitle');
    const hDesc = document.getElementById('heroDesc');

    // Fade out text, slide down slightly
    hTitle.style.opacity = 0;
    hTitle.style.transform = 'translateY(15px)';
    if (hDesc) {
        hDesc.style.opacity = 0;
        hDesc.style.transform = 'translateY(15px)';
    }

    // Wait for fade out, then swap text and fade in
    setTimeout(() => {
        hTitle.innerText = title;
        if (hDesc) hDesc.innerText = item.overview || "Narrative archive encrypted.";

        const length = title.length;
        let size = 3.5;
        if (length > 25) size = 2;
        else if (length > 15) size = 2.5;
        else if (length < 8) size = 4.5;
        if (window.innerWidth < 768) size = size * 0.7; // Mobile adjustment
        hTitle.style.setProperty('--title-size', `${size}rem`);

        hTitle.style.opacity = 1;
        hTitle.style.transform = 'translateY(0)';
        if (hDesc) {
            hDesc.style.opacity = 1;
            hDesc.style.transform = 'translateY(0)';
        }

        // Button Assignments
        document.getElementById('heroInfoBtn').onclick = () => openModal(item.id, item.media_type);
        const watchBtn = document.getElementById('heroWatchBtn');
        if (watchBtn) watchBtn.onclick = () => openWatchOptions(item.id, item.media_type, encodeURIComponent(title));

        fetchAPI(`/${item.media_type}/${item.id}/videos`).then(v => {
            const tr = v.results.find(x => x.type === 'Trailer');
            document.getElementById('heroTrailerBtn').onclick = () => tr ? window.open(`https://youtube.com/watch?v=${tr.key}`) : null;
        });
    }, 400);
}

function goToHero(idx) {
    if (idx === state.heroIdx) return;
    const items = document.querySelectorAll('.hero-item');
    const dots = document.querySelectorAll('.hero-dot');

    // Animate out current
    items[state.heroIdx].classList.remove('active');
    items[state.heroIdx].classList.add('inactive');
    items[state.heroIdx].querySelector('img').classList.remove('scale-105');
    items[state.heroIdx].querySelector('img').classList.add('scale-100');
    items[state.heroIdx].querySelector('.hero-overlay').classList.replace('opacity-0', 'opacity-60');
    if (dots[state.heroIdx]) {
        dots[state.heroIdx].classList.replace('w-8', 'w-2');
        dots[state.heroIdx].classList.replace('bg-pulse', 'bg-white/30');
    }

    state.heroIdx = idx;

    // Animate in new
    items[state.heroIdx].classList.remove('inactive');
    items[state.heroIdx].classList.add('active');
    items[state.heroIdx].querySelector('img').classList.remove('scale-100');
    items[state.heroIdx].querySelector('img').classList.add('scale-105');
    items[state.heroIdx].querySelector('.hero-overlay').classList.replace('opacity-60', 'opacity-0');
    if (dots[state.heroIdx]) {
        dots[state.heroIdx].classList.replace('w-2', 'w-8');
        dots[state.heroIdx].classList.replace('bg-white/30', 'bg-pulse');
    }

    updateHeroContent();
    startHeroAutoSlide();
}

function nextHero() {
    if (!state.hero || state.hero.length <= 1) return;
    goToHero((state.heroIdx + 1) % state.hero.length);
}

// User Status Counter Toggle
window.toggleHomeCounters = function () {
    const wrapper = document.getElementById('homeCountersWrapper');
    const icon = document.getElementById('counterToggleIcon');
    if (!wrapper) return;

    // Force a hard toggle check
    if (wrapper.classList.contains('grid-rows-0') || wrapper.style.display === 'none') {
        wrapper.style.display = 'grid'; // Force block
        setTimeout(() => {
            wrapper.classList.remove('grid-rows-0', 'opacity-0', 'pointer-events-none', 'mt-0');
            wrapper.classList.add('grid-rows-[1fr]', 'opacity-100', 'pointer-events-auto', 'mt-4');
        }, 10);
        if (icon) icon.classList.add('rotate-180');
    } else {
        wrapper.classList.add('grid-rows-0', 'opacity-0', 'pointer-events-none', 'mt-0');
        wrapper.classList.remove('grid-rows-[1fr]', 'opacity-100', 'pointer-events-auto', 'mt-4');
        setTimeout(() => { wrapper.style.display = 'none'; }, 300);
        if (icon) icon.classList.remove('rotate-180');
    }
};

// Modal Layout Controller
window.updateModalTopLeftButtons = function () {
    const hasHistory = state.modalHistory && state.modalHistory.length > 0;
    const backBtn = document.getElementById('mBackBtn');
    const sidebarToggle = document.getElementById('modalSidebarToggle');
    const isSidebarOpen = document.getElementById('modalSidebar') && document.getElementById('modalSidebar').classList.contains('open');

    if (backBtn) backBtn.classList.toggle('hidden', !hasHistory);

    if (sidebarToggle) {
        if (!hasHistory) {
            // Default position: Top Left
            sidebarToggle.className = "fixed top-6 left-6 lg:top-10 lg:left-10 z-[290] w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-[#7f1d8c] via-[#d946ef] to-[#ec4899] text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_rgba(236,72,153,0.45)] hover:scale-110 transition-all duration-300";
        } else {
            // Shifted position when Back Button is present: Bottom Left
            sidebarToggle.className = "fixed bottom-6 left-6 z-[290] w-12 h-12 bg-gradient-to-br from-[#7f1d8c] via-[#d946ef] to-[#ec4899] text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_rgba(236,72,153,0.45)] hover:scale-110 transition-all duration-300";
        }

        sidebarToggle.innerHTML = isSidebarOpen
            ? '<i class="fas fa-times rotate-90 transition-transform duration-300"></i>'
            : '<i class="fas fa-stream rotate-0 transition-transform duration-300"></i>';
    }
};

// Modal Logic
async function openModal(id, type, isBack = false) {
    let modalEl = document.getElementById('modal');
    if (!modalEl) {
        showLoader();
        try {
            const res = await fetch(`pages/modal.html`);
            if (res.ok) {
                const html = await res.text();
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const loadedModal = temp.querySelector('#modal') || temp.firstElementChild;
                if (loadedModal) {
                    document.body.appendChild(loadedModal);
                    modalEl = document.getElementById('modal');
                    setupModalSearch(); // Bind search listeners now that elements exist
                }
            }
        } catch (e) {
            console.error("Failed to load modal HTML", e);
        }
        hideLoader();
    }

    let modalCountdownInterval;
    // Save current scroll before opening (used to restore when modal is closed via Back)
    if (!isBack && modalEl && modalEl.classList.contains('hidden')) {
        window._cpModalScrollY = window.scrollY;
    }
    // Ensure modal starts at the top and floats above other overlays
    if (modalEl) {
        modalEl.scrollTop = 0;
        modalEl.style.zIndex = '700';
    }

    // Push history state so the Back Button works safely
    if (!isBack) {
        if (!modalEl.classList.contains('hidden')) {
            window.history.replaceState({ modalOpen: true }, '', window.location.hash);
        } else {
            window.history.pushState({ modalOpen: true }, '', window.location.hash);
        }
        if (state.active) state.modalHistory.push({ id: state.active.id, type: state.active.media_type });
    }


    updateModalTopLeftButtons();

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
    // Always read fresh from localStorage to get latest episode/status
    const freshDb = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const local = freshDb.find(i => String(i.id) === String(id));
    // Update state.db with fresh data
    state.db = freshDb;
    const originalRenderMasterpieces = renderMasterpieces;
    renderMasterpieces = function () {
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
            const crowned = state.db.filter(i => i.type === type && i.crown > 0 && i.crown < 4).sort((a, b) => a.crown - b.crown);
            const sovereigns = state.db.filter(i => i.type === type && i.crown === 4);

            if (!crowned.length && !sovereigns.length) return '';

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
                cTimer.innerHTML = '<span class="text-[#22c55e]">AVAILABLE NOW</span>';
                clearInterval(modalCountdownInterval);
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            cTimer.innerHTML = `
                <div class="flex flex-col items-center w-12 md:w-16"><span class="text-pulse tabular-nums">${d}</span><span class="text-[8px] text-gray-500 uppercase">Days</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${h.toString().padStart(2, '0')}</span><span class="text-[8px] text-gray-500 uppercase">Hrs</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${m.toString().padStart(2, '0')}</span><span class="text-[8px] text-gray-500 uppercase">Min</span></div><span class="text-gray-700 font-light">:</span>
                <div class="flex flex-col items-center w-12 md:w-16"><span class="tabular-nums">${s.toString().padStart(2, '0')}</span><span class="text-[8px] text-gray-500 uppercase">Sec</span></div>
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

    // 1. BUG FIX: Force clear previous season state so it never bleeds over
    state.activeSeasons = [];
    document.getElementById('mSeasonsList').innerHTML = '';

    // 2. BUG FIX: Always calculate seasons for TV shows so they are ready when added
    if (type !== 'movie') {
        const total = details.number_of_episodes || 1;

        state.activeSeasons = (details.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
        let cumulative = 0;
        state.activeSeasons.forEach(s => {
            s.startEp = cumulative;
            cumulative += s.episode_count;
            s.endEp = cumulative;
        });

        if (local) {
            document.getElementById('mEpRange').max = total;
            document.getElementById('mEpRange').value = local.ep || 0;
            updateEpUI(local.ep || 0, total);
            renderSeasonsUI(); // Initialize season bubbles
        }
    }

    updateRatingCard(local);

    document.getElementById('mRemoveBtn').classList.toggle('hidden', !local);
    // --- P2P UI VISIBILITY LOGIC ---
    // This checks if the NeuralSync engine is running and has active peers
    const netActions = document.getElementById('mNetworkActions');
    if (netActions) {
        if (typeof NeuralSync !== 'undefined' && Object.keys(NeuralSync.activeConns).length > 0) {
            netActions.classList.remove('hidden');
            netActions.classList.add('flex');
        } else {
            netActions.classList.add('hidden');
            netActions.classList.remove('flex');
        }
    }
    document.getElementById('modal').classList.remove('hidden');
    checkScrollLock();
    document.body.style.overflow = 'hidden';

    state.recPage = 1;
    loadModalRecommendations(id, type, state.recPage, false);
}

function updateRatingCard(local) {
    const card = document.getElementById('mRatingCard');
    if (local && local.status === 'Finished') {
        card.classList.remove('hidden');
        // BUG FIX: Removed the dead slider reference and replaced it with the precision visualizer
        updateStarVisuals(local.score || 0);
        const crownSelect = document.getElementById('mCrownSelect');
        if (crownSelect) crownSelect.value = local.crown || 0;
    } else {
        card.classList.add('hidden');
    }
}

window.updateMainRatingVisuals = function () {
    const slider = document.getElementById('mainDecimalSlider');
    const mask = document.getElementById('mainStarMask');
    const display = document.getElementById('mainRatingDisplay');
    const scale = parseInt(document.getElementById('mainRatingScaleToggle').value);

    let rawValue = parseFloat(slider.value);
    mask.style.width = `${(rawValue / 5) * 100}%`;
    display.innerText = scale === 10 ? (rawValue * 2).toFixed(1) : rawValue.toFixed(1);
};

window.commitMainDecimalRating = function () {
    const val = parseFloat(document.getElementById('mainDecimalSlider').value);
    const idx = state.db.findIndex(i => String(i.id) === String(state.active.id));
    if (idx !== -1) {
        state.db[idx].score = val;
        state.db[idx].updatedAt = Date.now();
        save();

        const sagaModal = document.getElementById('sagaModal');
        if (sagaModal && !sagaModal.classList.contains('hidden') && currentSagaViewContext) {
            openSaga(currentSagaViewContext.id);
        }
        showNotification("Score Updated!");
    }
};


function setupStarLogic() {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach(s => {
        s.onclick = () => {
            const val = parseInt(s.dataset.val);
            const idx = state.db.findIndex(i => String(i.id) === String(state.active.id));
            if (idx !== -1) {
                state.db[idx].score = val;
                state.db[idx].updatedAt = Date.now();
                save();
                setStars(val);

                // FIX: Live-sync the Saga Modal if it is open in the background
                const sagaModal = document.getElementById('sagaModal');
                if (sagaModal && !sagaModal.classList.contains('hidden') && currentSagaViewContext) {
                    openSaga(currentSagaViewContext.id);
                }
            }
        };
    });
}
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




function setStars(n) {
    document.querySelectorAll('#starRating i').forEach((s, i) => {
        s.className = i < n ? 'fas fa-star active' : 'far fa-star';
    });
}

function updateStatus() {
    const status = document.getElementById('mStatus').value;
    if (!status) return;

    const item = state.active;
    let existing = state.db.find(i => String(i.id) === String(item.id));

    if (existing) {
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
        renderSeasonsUI(); // <--- BUG FIX: Added this so bubbles show up instantly
    } else {
        document.getElementById('mProgressBox').classList.add('hidden');
    }

    const sagaModal = document.getElementById('sagaModal');
    if (sagaModal && !sagaModal.classList.contains('hidden') && currentSagaViewContext) {
        openSaga(currentSagaViewContext.id);
    }
}

// --- QUICK ADD ENGINE ---
async function quickAdd(id, type) {
    showLoader();
    try {
        // 1. Check if it already exists to prevent duplicates
        let existing = state.db.find(i => String(i.id) === String(id));
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

        if (!items.length) return '';
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
                        <img src="${IMG + i.poster}" class="w-full h-full object-cover">
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
                        <img src="${IMG + i.poster}" class="w-full h-full object-cover">
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
        const deletedItem = state.reminders[idx];
        state.reminders.splice(idx, 1);
        const btn = document.getElementById('mRemindBtn');
        if (btn) updateRemindBtnUI(false);
        showNotification(`Removed ${deletedItem.title || deletedItem.name || 'item'} from Radar.`);
        
        const upcomingView = document.getElementById('view-upcoming');
        if (upcomingView && !upcomingView.classList.contains('hidden')) {
            renderUpcomingRadar();
        }
    } else {
        let releaseDate = item.release_date;
        let isEpisodic = false;
        let nextSeason = null;
        let nextEp = null;

        if (item.media_type !== 'movie' && item.next_episode_to_air) {
            releaseDate = item.next_episode_to_air.air_date;
            nextSeason = item.next_episode_to_air.season_number;
            nextEp = item.next_episode_to_air.episode_number;
            isEpisodic = true;
        }

        state.reminders.push({
            id: item.id, title: item.title || item.name, poster: item.poster_path,
            type: item.media_type, date: releaseDate, added: Date.now(),
            isEpisodic: isEpisodic, nextSeason: nextSeason, nextEp: nextEp
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
        const urgency = days <= 1 ? 'text-[#22c55e]' : (days <= 7 ? 'text-[#f59e0b]' : 'text-pulse');
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
async function refreshEpisodicReminders() {
    let changed = false;
    const now = Date.now();

    for (let r of state.reminders) {
        if (r.isEpisodic) {
            const diff = new Date(r.date).getTime() - now;
            const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));

            // If the episode aired more than 24 hours ago, we need to fetch the next one
            if (daysPassed < 0) {
                try {
                    const data = await fetchAPI(`/tv/${r.id}`);
                    if (data.next_episode_to_air) {
                        r.date = data.next_episode_to_air.air_date;
                        r.nextSeason = data.next_episode_to_air.season_number;
                        r.nextEp = data.next_episode_to_air.episode_number;
                        r.statusText = null;
                        changed = true;
                    } else {
                        // No future episodes listed
                        r.statusText = (data.status === 'Ended' || data.status === 'Canceled')
                            ? 'SERIES FINISHED'
                            : 'SEASON FINISHED';
                        changed = true;
                    }
                } catch (e) { console.warn("Failed to update reminder for", r.title); }
            }
        }
    }

    if (changed) {
        localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));
    }
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
        if (!itemGenres || !itemGenres.length) return Math.floor(Math.random() * 20) + 70;
        const userGenres = state.db.filter(i => i.score >= 4).flatMap(i => i.genres);
        if (!userGenres.length) return Math.floor(Math.random() * 20) + 70;

        let matches = itemGenres.filter(g => userGenres.includes(g)).length;
        let pct = Math.min(99, 60 + (matches * 15) + Math.floor(Math.random() * 10));
        return pct;
    };

    for (let type of types) {
        // FEATURE 2: Elite Seeding
        const anchors = state.db.filter(i => i.type === type && (i.score >= 4 || i.status === 'Watching'));
        if (!anchors.length) continue;

        const seed = anchors[Math.floor(Math.random() * anchors.length)];
        const apiType = (type === 'movie' ? 'movie' : 'tv');

        try {
            const data = await fetchAPI(`/${apiType}/${seed.id}/recommendations`);
            let recommendations = data.results.filter(i => !dbIds.has(i.id));
            if (recommendations.length === 0) continue;

            // FEATURE 3: Context UI Text
            let contextText = seed.crown > 0 ? `Because you crowned 👑 ${seed.title}` :
                seed.score >= 4 ? `Because you rated ${seed.title} ★ ${seed.score}/5` :
                    `Since you are watching ${seed.title}`;

            let rowHtml = `
                <section class="animate-in fade-in duration-500">
                    <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 md:mb-8 italic flex items-center gap-4">
                        <span class="w-2 h-2 bg-pulse rounded-full shadow-[0_0_10px_#ff2d55]"></span>
                        ${contextText} <div class="h-px flex-1 bg-white/5"></div>
                    </h3>
                    <div class="flex gap-4 md:gap-8 overflow-x-auto hide-scroll pb-6 -mx-6 px-6 md:mx-0 md:px-1">
                        ${recommendations.slice(0, 10).map(i => {
                let matchPct = calculateMatch(i.genre_ids);
                let matchColor = matchPct >= 90 ? 'text-[#22c55e]' : matchPct >= 80 ? 'text-[#f59e0b]' : 'text-pulse';

                return `
                            <div class="flex-none w-32 md:w-44 group cursor-pointer relative" onclick="openModal(${i.id}, '${apiType}')">
                                <div class="aspect-[2/3] rounded-[20px] md:rounded-[24px] overflow-hidden mb-3 md:mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative">
                                    <img src="${IMG + i.poster_path}" class="w-full h-full object-cover">
                                    <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10 opacity-80"></div>
                                    
                                    <div class="absolute top-2 left-2 md:top-3 md:left-3 bg-dark/80 backdrop-blur-md px-2 py-1 rounded-md text-[7px] md:text-[8px] font-black uppercase border border-white/10 z-30 flex items-center gap-1 ${matchColor}">
                                        <i class="fas fa-brain"></i> ${matchPct}% Match
                                    </div>
                                    
                                    ${getPlayHoverHTML({ ...i, type: type })}
                                </div>
                                <div class="text-[9px] font-black uppercase line-clamp-1">${i.title || i.name}</div>
                            </div>
                        `}).join('')}
                    </div>
                </section>
            `;
            sectionsHTML.push(rowHtml);
        } catch (e) {
            console.error("Failed to fetch recs for sync", e);
        }
    }

    // FEATURE 5: The "Sync Engine Mix"
    if (state.db.length > 5) {
        let allGenres = state.db.filter(i => i.score >= 4).flatMap(i => i.genres);
        let counts = {};
        allGenres.forEach(g => counts[g] = (counts[g] || 0) + 1);
        let topGenres = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);

        if (topGenres.length >= 2) {
            try {
                const mixData = await fetchAPI(`/discover/movie?with_genres=${topGenres.join(',')}&sort_by=vote_average.desc&vote_count.gte=500`);
                let mixRecs = mixData.results.filter(i => !dbIds.has(i.id)).slice(0, 10);

                if (mixRecs.length > 0) {
                    sectionsHTML.push(`
                        <section class="animate-in fade-in duration-500">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-pulse mb-6 md:mb-8 italic flex items-center gap-4">
                                <i class="fas fa-dna"></i> Neural Intersection Mix <div class="h-px flex-1 bg-white/5 shadow-[0_0_10px_#ff2d55]"></div>
                            </h3>
                            <div class="flex gap-4 md:gap-8 overflow-x-auto hide-scroll pb-6 -mx-6 px-6 md:mx-0 md:px-1">
                                ${mixRecs.map(i => `
                                    <div class="flex-none w-32 md:w-44 group cursor-pointer relative" onclick="openModal(${i.id}, 'movie')">
                                        <div class="aspect-[2/3] rounded-[20px] md:rounded-[24px] overflow-hidden mb-3 md:mb-4 border border-pulse/30 shadow-[0_0_20px_rgba(255,45,85,0.15)] group-hover:border-pulse transition-all relative">
                                            <img src="${IMG + i.poster_path}" class="w-full h-full object-cover">
                                            <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent z-10"></div>
                                            <div class="absolute top-2 left-2 md:top-3 md:left-3 bg-pulse/20 text-pulse px-2 py-1 rounded-md text-[7px] md:text-[8px] font-black uppercase border border-pulse/30 z-30">
                                                99% Match
                                            </div>
                                            ${getPlayHoverHTML({ ...i, type: 'movie' })}
                                        </div>
                                        <div class="text-[9px] font-black uppercase line-clamp-1">${i.title || i.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </section>
                    `);
                }
            } catch (e) {
                console.error("Failed to fetch mix", e);
            }
        }
    }

    container.innerHTML = sectionsHTML.join('') || `<div class="text-center py-20 text-gray-700 font-black uppercase tracking-widest italic">Insufficient elite data for synchronization. Add highly rated shows to seed the engine.</div>`;
    state.currentSyncBatch = sectionsHTML;
    initSmartScrollButtons();
}

function saveSyncBatch() {
    if (!state.currentSyncBatch || state.currentSyncBatch.length === 0) {
        showNotification("No neural batch to archive.");
        return;
    }

    let archives = JSON.parse(localStorage.getItem('cp_sync_archives') || '[]');
    archives.unshift({
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        htmls: state.currentSyncBatch,
        count: state.currentSyncBatch.length
    });

    localStorage.setItem('cp_sync_archives', JSON.stringify(archives.slice(0, 15)));
    showNotification("Recommendation snapshot archived to Neural Repository.");
}

function openSnapshotHub() {
    const hub = document.getElementById('snapshotHub');
    const list = document.getElementById('snapshotList');
    if (!hub || !list) return;

    const archives = JSON.parse(localStorage.getItem('cp_sync_archives') || '[]');

    if (archives.length === 0) {
        list.innerHTML = `
            <div class="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                <i class="fas fa-box-open text-5xl text-gray-800 mb-6"></i>
                <p class="text-gray-600 font-black uppercase tracking-widest italic">Repository Empty. Save a batch from the 'For You' page.</p>
            </div>
        `;
    } else {
        list.innerHTML = archives.map(a => `
            <div class="bg-white/5 border border-white/10 p-8 rounded-[35px] hover:border-pulse/50 transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="deleteSnapshot(${a.id})" class="text-gray-500 hover:text-pulse transition-colors"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="text-[9px] text-pulse font-black uppercase tracking-[0.3em] mb-4">Snapshot / ${a.id}</div>
                <h4 class="text-xl font-black text-white italic mb-2">${a.timestamp}</h4>
                <p class="text-xs text-gray-500 font-bold mb-8">${a.count} Recommendations Cached</p>
                <button onclick="loadSnapshot(${a.id})" class="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pulse hover:text-white transition-all shadow-xl">
                    Restore Neural View
                </button>
            </div>
        `).join('');
    }

    hub.classList.remove('hidden');
    hub.classList.add('flex');
}

function closeSnapshotHub() { document.getElementById('snapshotHub').classList.add('hidden'); }

function deleteSnapshot(id) {
    let archives = JSON.parse(localStorage.getItem('cp_sync_archives') || '[]');
    archives = archives.filter(a => a.id !== id);
    localStorage.setItem('cp_sync_archives', JSON.stringify(archives));
    openSnapshotHub();
    showNotification("Archive deleted from repository.");
}

function loadSnapshot(id) {
    const archives = JSON.parse(localStorage.getItem('cp_sync_archives') || '[]');
    const snap = archives.find(a => a.id === id);
    if (!snap) return;

    const container = document.getElementById('syncContainer');
    if (!container) return;

    container.innerHTML = snap.htmls.map(h => h.replace(' Neural ', ' Archived Neural ')).join('');
    state.currentSyncBatch = snap.htmls;
    initSmartScrollButtons();
    closeSnapshotHub();
    showNotification("Archived batch synchronized.");
}

function loadSyncBatch() { openSnapshotHub(); }

// --- NEURAL RADAR TRACKING SYSTEM ---
async function toggleRadar(id, type, title, poster) {
    const idx = state.radar.findIndex(r => String(r.id) === String(id));
    if (idx !== -1) {
        state.radar.splice(idx, 1);
        showNotification(`${title} removed from Radar.`);
    } else {
        const memo = prompt("Add a neural memo for this release (optional):", "");

        let releaseDate = '';
        let weeklyDay = -1;
        let overview = '';
        let statusText = '';

        if (type === 'tv') {
            const details = await fetchAPI(`/tv/${id}`);
            overview = details.overview || details.tagline || '';
            statusText = details.status || '';
            if (details.next_episode_to_air) {
                releaseDate = details.next_episode_to_air.air_date;
                weeklyDay = new Date(releaseDate).getDay();
            } else if (details.last_episode_to_air) {
                releaseDate = details.last_episode_to_air.air_date;
                weeklyDay = new Date(releaseDate).getDay();
            }
        } else {
            const details = await fetchAPI(`/movie/${id}`);
            overview = details.overview || details.tagline || '';
            statusText = details.status || '';
            releaseDate = details.release_date;
        }

        state.radar.push({
            id,
            type,
            title,
            poster,
            memo: memo || 'Tracking for Pulse Release',
            date: releaseDate,
            weeklyDay,
            overview,
            statusText
        });
        showNotification(`${title} added to My Tracker.`);
    }

    localStorage.setItem('cp_neural_radar', JSON.stringify(state.radar));
    if (state.view === 'upcoming') loadUpcomingPage();
}

function closeCalendar() {
    document.getElementById('calendarModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    calendarHoverLocked = false;
    calendarHoverKey = null;
    hideCalendarHoverCard();
}

function navigateFromCalendar(view) {
    if (!view) return;
    const select = document.getElementById('calendarPageSelect');
    if (select) select.value = '';
    closeCalendar();
    navigate(view);
}

function getCalendarHoverItem(id, source) {
    if (source === 'radar') return state.radar.find(r => String(r.id) === String(id));
    if (source === 'episodic') return state.reminders.find(r => String(r.id) === String(id));
    if (source === 'global') return state.globalCalendarReleases.find(r => String(r.id) === String(id));
    return null;
}

function formatCalendarHoverData(item, source) {
    if (!item) return null;
    const title = item.title || item.name || 'Untitled';
    const mediaType = (item.media_type || item.type || 'media').toUpperCase();
    const category = item.cal_category || (item.isEpisodic ? 'Airing Now' : mediaType === 'MOVIE' ? 'Movie' : 'Series');
    const itemDate = getCalendarItemDate(item);
    const date = itemDate ? new Date(itemDate) : null;
    const dateLabel = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
    const label = source === 'radar'
        ? 'PRIORITY TRACKER'
        : item.nextEp
            ? `S${item.nextSeason} E${item.nextEp}`
            : category;

    const memoText = item.memo?.toString().trim();
    const detailText = (item.description || item.note || item.overview || item.summary || item.statusText || '').toString().trim();
    let overview = '';

    if (memoText && detailText) {
        overview = `${memoText}\n\n${detailText}`;
    } else if (memoText) {
        overview = memoText;
    } else if (detailText) {
        overview = detailText;
    } else if (source === 'radar' || source === 'episodic') {
        overview = 'Tracked release details will appear here after the next sync update.';
    } else {
        overview = 'No additional details available.';
    }

    const badge = source === 'global' ? 'GLOBAL RELEASE' : (source === 'radar' ? 'TRACKED' : 'AIRING NOW');
    return { title, mediaType, category, dateLabel, label, overview, badge };
}

function positionCalendarHoverCard(target) {
    const card = document.getElementById('calendarHoverCard');
    const modal = document.getElementById('calendarModal');
    if (!card || !modal) return;
    const targetRect = target.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    let top = targetRect.top - modalRect.top - cardRect.height - 12;
    let left = targetRect.left - modalRect.left;
    if (top < 16) {
        top = targetRect.bottom - modalRect.top + 12;
    }
    if (left + cardRect.width > modalRect.width - 16) {
        left = Math.max(16, modalRect.width - cardRect.width - 16);
    }
    if (left < 16) left = 16;
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
}

function showCalendarHoverCard(target, id, source) {
    const card = document.getElementById('calendarHoverCard');
    const item = getCalendarHoverItem(id, source);
    if (!card || !item) return;
    const data = formatCalendarHoverData(item, source);
    if (!data) return;
    calendarHoverKey = `${source}-${id}`;
    card.dataset.hoverKey = calendarHoverKey;
    card.classList.remove('hidden');
    document.getElementById('calendarHoverCardBadge').innerText = data.badge;
    document.getElementById('calendarHoverCardType').innerText = data.mediaType;
    document.getElementById('calendarHoverCardDate').innerText = data.dateLabel;
    document.getElementById('calendarHoverCardTitle').innerText = data.title;
    document.getElementById('calendarHoverCardLabel').innerText = data.label;
    document.getElementById('calendarHoverCardOverview').innerText = data.overview;
    requestAnimationFrame(() => positionCalendarHoverCard(target));
}

function hideCalendarHoverCard() {
    const card = document.getElementById('calendarHoverCard');
    if (!card) return;
    if (calendarHoverLocked) return;
    card.classList.add('hidden');
    calendarHoverKey = null;
}

function toggleCalendarHoverLock(target, id, source) {
    const key = `${source}-${id}`;
    if (calendarHoverLocked && calendarHoverKey === key) {
        calendarHoverLocked = false;
        hideCalendarHoverCard();
    } else {
        calendarHoverLocked = true;
        showCalendarHoverCard(target, id, source);
    }
}

function getCalendarItemDate(item) {
    return item.next_episode_to_air?.air_date || item.release_date || item.first_air_date || item.date || null;
}

function getCalendarCategory(item) {
    const lang = (item.original_language || '').toLowerCase();
    const countries = (item.origin_country || []).map(c => c.toLowerCase());
    const country = countries[0] || '';

    if (lang === 'ja' || item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16 || g.name === 'Animation')) {
        // Double check it's actually anime (Japanese animation)
        if (lang === 'ja' || countries.includes('jp')) return 'Anime';
    }

    if (lang === 'ko' || countries.includes('kr')) return 'K-Drama';
    if (lang === 'tr' || countries.includes('tr')) return 'Turkish';

    const asianCountries = ['cn', 'tw', 'th', 'ph', 'vn', 'hk', 'my', 'id', 'sg', 'jp'];
    if (countries.some(c => asianCountries.includes(c))) return 'Asian';

    return item.media_type === 'movie' ? 'Movie' : 'TV';
}

function getCalendarBadgeClass(category) {
    switch (category) {
        case 'Movie': return 'bg-[#2563eb] text-white';
        case 'Anime': return 'bg-[#7c3aed] text-white';
        case 'K-Drama': return 'bg-[#ef4444] text-white';
        case 'Turkish': return 'bg-[#f59e0b] text-black';
        case 'Asian': return 'bg-[#14b8a6] text-white';
        default: return 'bg-white/10 text-white';
    }
}

async function fetchAiringCalendarItems() {
    try {
        const resp = await fetch(BASE + `/tv/on_the_air?api_key=${API_KEY}`);
        const data = await resp.json();
        const candidates = (data.results || []).filter(i => (i.vote_count || 0) >= 40).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 16);
        const details = await Promise.all(candidates.map(i => fetchAPI(`/tv/${i.id}`).catch(() => null)));
        return details.filter(Boolean).map(detail => ({
            ...detail,
            media_type: 'tv',
            cal_category: getCalendarCategory(detail),
            date: getCalendarItemDate(detail)
        }));
    } catch (err) {
        console.warn('Airing calendar enrichment failed', err);
        return [];
    }
}

let calendarFetchPromise = null;
async function initCalendarData() {
    if (calendarFetchPromise) return calendarFetchPromise;
    calendarFetchPromise = (async () => {
        const today = new Date();
        const start = new Date(today);
        const dateStrStart = start.toISOString().split('T')[0];

        const end = new Date(start);
        end.setDate(end.getDate() + 34);
        const dateStrEnd = end.toISOString().split('T')[0];

        const fetchCategory = async (type, params) => {
            let items = [];
            for (let page = 1; page <= 2; page++) {
                try {
                    const resp = await fetch(BASE + `/discover/${type}?api_key=${API_KEY}&${params}&page=${page}`);
                    const data = await resp.json();
                    if (data.results) items = items.concat(data.results);
                    if (page >= data.total_pages) break;
                } catch (e) { break; }
            }
            return items;
        };

        const movieParams = `primary_release_date.gte=${dateStrStart}&primary_release_date.lte=${dateStrEnd}&sort_by=popularity.desc`;
        const tvParams = `first_air_date.gte=${dateStrStart}&first_air_date.lte=${dateStrEnd}&sort_by=popularity.desc`;

        try {
            const [
                movies, animeTV, animeMovie, kdramaTV, kdramaMovie,
                turkishTV, turkishMovie, asianTV, asianMovie, upcomingMovies
            ] = await Promise.all([
                fetchCategory('movie', `${movieParams}&vote_count.gte=20`),
                fetchCategory('tv', `${tvParams}&with_genres=16&with_original_language=ja`),
                fetchCategory('movie', `${movieParams}&with_genres=16&with_original_language=ja`),
                fetchCategory('tv', `${tvParams}&with_original_language=ko`),
                fetchCategory('movie', `${movieParams}&with_original_language=ko`),
                fetchCategory('tv', `${tvParams}&with_original_language=tr`),
                fetchCategory('movie', `${movieParams}&with_original_language=tr`),
                fetchCategory('tv', `${tvParams}&with_origin_country=CN|TW|TH|PH|VN|HK|MY|ID&without_genres=16`),
                fetchCategory('movie', `${movieParams}&with_origin_country=CN|TW|TH|PH|VN|HK|MY|ID&without_genres=16`),
                fetch(BASE + `/movie/upcoming?api_key=${API_KEY}&page=1`).then(r => r.json()).catch(() => ({ results: [] }))
            ]);

            const calendarItems = [
                ...movies.map(m => ({ ...m, media_type: 'movie', cal_category: 'Movie' })),
                ...animeTV.map(m => ({ ...m, media_type: 'tv', cal_category: 'Anime' })),
                ...animeMovie.map(m => ({ ...m, media_type: 'movie', cal_category: 'Anime' })),
                ...kdramaTV.map(m => ({ ...m, media_type: 'tv', cal_category: 'K-Drama' })),
                ...kdramaMovie.map(m => ({ ...m, media_type: 'movie', cal_category: 'K-Drama' })),
                ...turkishTV.map(m => ({ ...m, media_type: 'tv', cal_category: 'Turkish' })),
                ...turkishMovie.map(m => ({ ...m, media_type: 'movie', cal_category: 'Turkish' })),
                ...asianTV.map(m => ({ ...m, media_type: 'tv', cal_category: 'Asian' })),
                ...asianMovie.map(m => ({ ...m, media_type: 'movie', cal_category: 'Asian' })),
                ...(upcomingMovies.results || []).map(m => ({ ...m, media_type: 'movie', cal_category: 'Movie' }))
            ];

            const airingItems = await fetchAiringCalendarItems();
            return [...calendarItems, ...airingItems]
                .map(item => ({ ...item, date: getCalendarItemDate(item) }))
                .filter(item => item.date)
                .filter(i => {
                    const isFuture = new Date(i.date) > new Date();
                    return isFuture || (i.popularity || 0) >= 8 || (i.vote_count || 0) >= 20 || i.next_episode_to_air;
                })
                .filter((item, idx, all) => {
                    const key = `${item.id}-${item.date}`;
                    return all.findIndex(i => `${i.id}-${i.date}` === key) === idx;
                })
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        } catch (e) {
            console.error("Global cal fetch failed", e);
            return [];
        }
    })();
    state.globalCalendarReleases = await calendarFetchPromise;
    return state.globalCalendarReleases;
}

async function openCalendar(highlightId = null) {
    const modal = document.getElementById('calendarModal');
    const grid = document.getElementById('calendarGrid');
    const monthLabelEl = document.getElementById('calendarMonthLabel');
    if (!modal || !grid) return;

    calendarHoverLocked = false;
    calendarHoverKey = null;
    hideCalendarHoverCard();
    closeCalendarMonthPicker();
    document.body.style.overflow = 'hidden';

    const today = new Date();
    const start = new Date(today);
    if (typeof calendarOffset !== 'number' || isNaN(calendarOffset)) calendarOffset = 0;
    start.setDate(start.getDate() + calendarOffset);
    const dateStrStart = start.toISOString().split('T')[0];

    const end = new Date(start);
    end.setDate(end.getDate() + 34);
    const dateStrEnd = end.toISOString().split('T')[0];

    const future = new Date(start);
    future.setDate(future.getDate() + 364);
    const dateStrFuture = future.toISOString().split('T')[0];

    if (calendarOffset === 0) {
        if (!state.globalCalendarReleases || state.globalCalendarReleases.length === 0) {
            await initCalendarData();
        }
    } else {
        // Just use existing calendar functionality for offsets but only populate state.globalCalendarReleases on load.
        // If an offset is selected, we should theoretically fetch, but actually the pre-fetched data spans 34 days!
        // We will just use the prefetched data. It already spans the entire 35 days.
        if (!state.globalCalendarReleases || state.globalCalendarReleases.length === 0) {
            await initCalendarData();
        }
    }

    const startLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthLabelEl.innerText = startLabel === endLabel ? startLabel.toUpperCase() : `${startLabel.toUpperCase()} – ${endLabel.toUpperCase()}`;

    grid.innerHTML = Array.from({ length: 35 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const ds = d.toISOString().split('T')[0];
        const isToday = ds === new Date().toISOString().split('T')[0];
        const isSelected = ds === highlightId;

        const radarItems = state.radar.filter(r => r.date === ds);
        const reminders = state.reminders.filter(r => r.isEpisodic && r.date === ds);
        const trackedIds = new Set([...radarItems, ...reminders].map(it => String(it.id)));
        const globalOnDay = state.globalCalendarReleases.filter(g => getCalendarItemDate(g) === ds && !trackedIds.has(String(g.id)));

        const highlightPoster = radarItems[0]?.poster || reminders[0]?.poster || globalOnDay[0]?.poster || globalOnDay[0]?.poster_path || globalOnDay[0]?.backdrop_path || '';
        const backgroundStyle = highlightPoster ? `background-image: linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.85) 35%, rgba(10,12,18,0.96) 100%), url(${IMG + highlightPoster}); background-size: cover; background-position: center;` : '';

        const isMobileCalendar = window.matchMedia('(max-width: 768px)').matches;
        const primaryItem = radarItems[0] || reminders[0] || globalOnDay[0] || null;
        const primaryPoster = primaryItem ? IMG + (primaryItem.poster || primaryItem.poster_path || primaryItem.backdrop_path || '') : '';
        const primaryTitle = primaryItem ? (primaryItem.title || primaryItem.name || 'Untitled') : 'No release selected';
        const primaryBadge = radarItems[0] ? 'Tracked' : reminders[0] ? 'Airing Now' : primaryItem ? (primaryItem.cal_category || 'Anticipated') : 'No release';
        const primaryLabel = radarItems[0] ? 'Priority Tracker' : reminders[0] ? `E${primaryItem?.nextEp || '?'} ` : primaryItem ? (primaryItem.media_type === 'movie' ? 'Movie' : 'TV') : '';

        if (isMobileCalendar) {
            return `
            <div id="cal-day-${ds}" onclick="openDaySummary('${ds}')" class="day-cell flex flex-col min-h-[220px] max-h-none bg-white/5 border ${isSelected ? 'border-pulse shadow-lg shadow-pulse/20' : (isToday ? 'border-pulse/30 bg-pulse/5' : 'border-white/10')} rounded-[35px] hover:bg-white/10 transition-all cursor-pointer group/day overflow-hidden" style="${backgroundStyle}">
                <div class="flex justify-between items-start mb-4 px-3">
                    <span class="text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-pulse' : 'text-gray-500'}">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span class="text-xl font-black italic ${isToday ? 'text-pulse' : 'text-white'}">${d.getDate()}</span>
                </div>
                <div class="mobile-day-card overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0c12]/90 mx-3">
                    ${primaryPoster ? `<div class="mobile-day-poster" style="background-image:url(${primaryPoster})"></div>` : `<div class="mobile-day-placeholder flex h-40 items-center justify-center text-[10px] uppercase tracking-[0.35em] text-white/70 bg-white/5">No image available</div>`}
                    <div class="p-4">
                        <div class="text-[8px] font-black uppercase tracking-[0.35em] text-pulse mb-2">${primaryBadge}</div>
                        <div class="text-[12px] font-black uppercase text-white leading-tight line-clamp-2 mb-3">${primaryTitle}</div>
                        <div class="flex items-center justify-between text-[8px] uppercase text-gray-400">
                            <span>${primaryLabel}</span>
                            ${primaryItem && primaryItem.vote_average ? `<span>★ ${primaryItem.vote_average.toFixed(1)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        return `
            <div id="cal-day-${ds}" onclick="openDaySummary('${ds}')" class="day-cell flex flex-col min-h-[180px] max-h-[340px] p-5 bg-white/5 border ${isSelected ? 'border-pulse shadow-lg shadow-pulse/20' : (isToday ? 'border-pulse/30 bg-pulse/5' : 'border-white/10')} rounded-[35px] hover:bg-white/10 transition-all cursor-pointer group/day" style="${backgroundStyle}">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-pulse' : 'text-gray-500'}">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span class="text-xl font-black italic ${isToday ? 'text-pulse' : 'text-white'}">${d.getDate()}</span>
                </div>
                
                <div class="space-y-3 flex-1 overflow-y-auto hide-scroll">
                    ${radarItems.map(it => {
            const eventTag = it.nextEp === 1 ? '<span class="text-[8px] font-black uppercase text-[#22c55e]">★ FIRST EP</span>' : (it.statusText && /FINISHED/.test(it.statusText) ? '<span class="text-[8px] font-black uppercase text-[#f59e0b]">■ FINAL EP</span>' : '');
            return `
                        <div onmouseenter="showCalendarHoverCard(this, ${it.id}, 'radar')" onmouseleave="hideCalendarHoverCard()" onclick="event.stopPropagation(); toggleCalendarHoverLock(this, ${it.id}, 'radar'); openCalendarDetail(${it.id}, '${it.type}', 'radar')" class="group/calitem relative flex items-center gap-3 p-2 bg-pulse/10 rounded-3xl border border-pulse/20 cursor-pointer hover:bg-pulse/20 transition-all">
                            <img src="${IMG + (it.poster || it.poster_path || it.backdrop_path || '')}" class="w-10 h-14 object-cover rounded-lg shadow-lg">
                            <div class="min-w-0">
                                <div class="text-[10px] font-black uppercase text-white truncate">${it.title}</div>
                                <div class="flex flex-wrap items-center gap-1 mt-1 text-[8px] uppercase font-black">
                                    <span class="text-pulse">Tracked</span>${eventTag}
                                </div>
                            </div>
                            <div class="absolute left-full ml-4 top-0 w-48 bg-[#0a0c12] border border-white/10 rounded-2xl p-3 z-[100] opacity-0 pointer-events-none group-hover/calitem:opacity-100 transition-opacity shadow-2xl backdrop-blur-xl">
                                <div class="text-[9px] font-black text-pulse uppercase mb-1">Tracked Content</div>
                                <div class="text-[10px] font-black text-white uppercase mb-2">${it.title}</div>
                                <div class="text-[8px] text-gray-500 leading-relaxed line-clamp-3">${it.memo || 'No active memo for this tracker.'}</div>
                            </div>
                        </div>
                    `;
        }).join('')}
                    
                    ${reminders.map(it => {
            let epLabel = '';
            if (it.nextEp === 1) epLabel = '<span class="text-[8px] bg-[#22c55e] text-white px-1 rounded ml-1">FIRST EP</span>';
            if (it.statusText && /FINISHED/.test(it.statusText)) epLabel = '<span class="text-[8px] bg-[#f59e0b] text-black px-1 rounded ml-1">FINAL EP</span>';
            return `
                        <div onmouseenter="showCalendarHoverCard(this, ${it.id}, 'episodic')" onmouseleave="hideCalendarHoverCard()" onclick="event.stopPropagation(); toggleCalendarHoverLock(this, ${it.id}, 'episodic'); openCalendarDetail(${it.id}, '${it.type}', 'episodic')" class="group/calitem relative flex items-center gap-3 p-2 bg-kdrama/10 rounded-3xl border border-kdrama/20 cursor-pointer hover:bg-kdrama/20 transition-all">
                            <img src="${IMG + (it.poster || it.poster_path || it.backdrop_path || '')}" class="w-10 h-14 object-cover rounded-lg shadow-lg">
                            <div class="min-w-0">
                                <div class="text-[10px] font-black uppercase text-white truncate">${it.title}</div>
                                <div class="flex flex-wrap items-center gap-1 mt-1 text-[8px] uppercase font-black">
                                    <span class="text-kdrama">E${it.nextEp}</span>${epLabel}
                                </div>
                            </div>
                            <div class="absolute left-full ml-4 top-0 w-48 bg-[#0a0c12] border border-white/10 rounded-2xl p-3 z-[100] opacity-0 pointer-events-none group-hover/calitem:opacity-100 transition-opacity shadow-2xl backdrop-blur-xl">
                                <div class="text-[9px] font-black text-kdrama uppercase mb-1">Upcoming Episode</div>
                                <div class="text-[10px] font-black text-white uppercase mb-1">${it.title}</div>
                                <div class="text-[7px] text-white/40 uppercase mb-2">Thursday May 15 at 8 PM</div>
                                <div class="text-[8px] text-gray-500 leading-relaxed mb-2">Episode ${it.nextEp} releases on this day.</div>
                            </div>
                        </div>
                    `;
        }).join('')}

                    ${globalOnDay.slice(0, 6).map(it => {
            const topLabel = (it.vote_average || 0) >= 8 ? '<span class="text-[8px] bg-[#22c55e] text-white px-1 rounded ml-1">★ TOP PICK</span>' : '';
            const badgeClass = getCalendarBadgeClass(it.cal_category || (it.media_type === 'movie' ? 'Movie' : 'TV'));
            const badgeLabel = it.cal_category || (it.media_type === 'movie' ? 'Movie' : 'Global');
            return `
                        <div onmouseenter="showCalendarHoverCard(this, ${it.id}, 'global')" onmouseleave="hideCalendarHoverCard()" onclick="event.stopPropagation(); toggleCalendarHoverLock(this, ${it.id}, 'global'); closeCalendar(); openModal(${it.id}, '${it.media_type}')" class="group/global relative flex items-center gap-3 p-2 bg-white/10 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/15 transition-all opacity-70 hover:opacity-100">
                            <div class="relative w-10 h-14 shrink-0">
                                <img src="${IMG + (it.poster || it.poster_path || it.backdrop_path || '')}" class="w-full h-full object-cover rounded-lg shadow-lg group-hover/global:scale-110 transition-transform">
                            </div>
                            <div class="min-w-0">
                                <div class="text-[10px] font-black uppercase text-gray-200 truncate group-hover/global:text-white transition-colors">${it.title || it.name}</div>
                                <div class="flex flex-wrap items-center gap-1 mt-1 text-[8px] uppercase font-black">
                                    <span class="px-2 py-0.5 rounded-full ${badgeClass}">${badgeLabel}</span>${topLabel}
                                </div>
                            </div>
                            <div class="absolute left-full ml-4 top-0 w-48 bg-[#0a0c12] border border-white/10 rounded-2xl p-3 z-[100] opacity-0 pointer-events-none group-hover/global:opacity-100 transition-opacity shadow-2xl backdrop-blur-xl">
                                <div class="text-[9px] font-black text-white/40 uppercase mb-1">${badgeLabel}</div>
                                <div class="text-[10px] font-black text-white uppercase mb-2">${it.title || it.name}</div>
                                <div class="text-[8px] text-gray-500 leading-relaxed line-clamp-3">${it.overview || 'No overview available.'}</div>
                            </div>
                        </div>
                    `}).join('')}
                    
                    ${globalOnDay.length > 6 ? `
                        <div class="text-[8px] font-black uppercase text-gray-400 text-center mt-1">+ ${globalOnDay.length - 6} More</div>` : ''}

                  ${radarItems.length === 0 && reminders.length === 0 && globalOnDay.length === 0 ? (() => {
                // Force a filler item for empty days so it never looks blank
                const fillers = state.globalCalendarReleases.filter(g => g.poster_path);
                if (fillers.length > 0) {
                    const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
                    return `
            <div onclick="event.stopPropagation(); closeCalendar(); openModal(${randomFiller.id}, '${randomFiller.media_type}')" class="group/global relative flex items-center gap-3 p-2 bg-white/5 rounded-3xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all opacity-50 hover:opacity-100">
                <div class="relative w-10 h-14 shrink-0">
                    <img src="${IMG + randomFiller.poster_path}" class="w-full h-full object-cover rounded-lg shadow-lg group-hover/global:scale-110 transition-transform">
                </div>
                <div class="min-w-0">
                    <div class="text-[9px] font-black uppercase text-gray-400 truncate group-hover/global:text-white transition-colors">Anticipated</div>
                    <div class="text-[10px] font-black text-white truncate">${randomFiller.title || randomFiller.name}</div>
                </div>
            </div>
        `;
                }
                return `<div class="text-[10px] text-gray-400 uppercase tracking-[0.25em] text-center mt-4">No Data</div>`;
            })() : ''}
                </div>
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (highlightId) {
        const el = document.getElementById(`cal-day-${highlightId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function shiftCalendar(days) {
    calendarOffset += days;
    openCalendar();
}

function goToCalendarToday() {
    calendarOffset = 0;
    openCalendar();
}

function openCalendarMonthPicker(event) {
    event.stopPropagation();
    const picker = document.getElementById('calendarMonthPicker');
    if (!picker) return;
    picker.classList.toggle('hidden');
    if (!picker.classList.contains('hidden')) {
        buildCalendarMonthPicker();
        setTimeout(() => window.addEventListener('click', closeCalendarMonthPicker), 0);
    }
}

function closeCalendarMonthPicker(event) {
    const picker = document.getElementById('calendarMonthPicker');
    if (!picker) return;
    if (event && picker.contains(event.target)) return;
    picker.classList.add('hidden');
    window.removeEventListener('click', closeCalendarMonthPicker);
}

function buildCalendarMonthPicker() {
    const grid = document.getElementById('calendarMonthPickerGrid');
    if (!grid) return;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    // Expand to 5 years for "indefinite" future navigation
    const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

    grid.innerHTML = years.flatMap(y => [
        `<div class="col-span-4 text-[9px] uppercase tracking-[0.3em] text-pulse/50 mt-4 mb-2 font-black border-b border-white/5 pb-1">${y}</div>`,
        ...months.map((label, idx) => {
            const isCurrentMonth = y === new Date().getFullYear() && idx === new Date().getMonth();
            return `<button type="button" onclick="selectCalendarMonth(${y}, ${idx})" class="text-[10px] uppercase tracking-[0.15em] ${isCurrentMonth ? 'text-pulse bg-pulse/10 border-pulse/30' : 'text-white/80 bg-white/5 border-white/10'} hover:bg-pulse hover:text-white border rounded-2xl py-2 transition-all font-bold">${label}</button>`;
        })
    ]).join('');
}

function selectCalendarMonth(year, monthIndex) {
    const today = new Date();
    const target = new Date(year, monthIndex, 1);
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const deltaDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
    calendarOffset = Math.max(deltaDays, 0);
    closeCalendarMonthPicker();
    openCalendar();
}

async function openCalendarDetail(id, type, source) {
    const modal = document.getElementById('calendarDetailModal');
    if (!modal) return;

    showLoader();
    try {
        const data = await fetchAPI(`/${type}/${id}`);
        const local = state.db.find(i => String(i.id) === String(id));
        const tracked = source === 'radar' ? state.radar.find(r => String(r.id) === String(id)) : state.reminders.find(r => String(r.id) === String(id));

        document.getElementById('calDetailPoster').style.backgroundImage = `url(${IMG_HD + data.backdrop_path})`;
        document.getElementById('calDetailTitle').innerText = data.title || data.name;
        document.getElementById('calDetailBadge').innerText = source === 'radar' ? 'MY TRACKER' : 'AIRING NOW';

        const statusInfo = (() => {
            if (data.status === 'Returning Series' || data.in_production) return { label: 'Airing', className: 'text-[#22c55e]' };
            if (data.status === 'Ended') return { label: 'Finished Airing', className: 'text-gray-400' };
            if (data.status === 'Canceled') return { label: 'Canceled', className: 'text-red-500' };
            return { label: 'Upcoming', className: 'text-pulse' };
        })();
        const statusEl = document.getElementById('calDetailStatus');
        statusEl.innerText = statusInfo.label;
        statusEl.className = `text-lg font-black italic uppercase ${statusInfo.className}`;

        let nextText = 'N/A';
        let nextClass = 'text-gray-400';
        if (data.next_episode_to_air) {
            const targetDate = new Date(data.next_episode_to_air.air_date);
            const diffMs = targetDate.getTime() - new Date().getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffMs < 0) {
                nextText = 'AVAILABLE NOW';
                nextClass = 'text-[#22c55e]';
            } else if (days === 0) {
                nextText = 'AIRING TODAY';
                nextClass = 'text-[#22c55e]';
            } else if (days === 1) {
                nextText = 'TOMORROW';
                nextClass = 'text-[#f59e0b]';
            } else if (days <= 7) {
                nextText = `IN ${days} DAYS`;
                nextClass = 'text-[#f59e0b]';
            } else {
                nextText = `IN ${days} DAYS`;
                nextClass = 'text-pulse';
            }
            nextText = `S${data.next_episode_to_air.season_number} E${data.next_episode_to_air.episode_number} • ${nextText}`;
        } else if (data.status === 'Ended' || data.status === 'Canceled') {
            nextText = 'Season Concluded';
            nextClass = 'text-gray-400';
        }
        const nextEl = document.getElementById('calDetailNext');
        nextEl.innerText = nextText;
        nextEl.className = `text-lg font-black italic uppercase ${nextClass}`;

        // MEMO logic
        const memo = tracked?.memo || data.overview?.slice(0, 100) + '...' || 'No pulse memo active.';
        document.getElementById('calDetailMemo').innerText = memo;

        const progSection = document.getElementById('calDetailProgressSection');
        if (local && type === 'tv') {
            progSection.classList.remove('hidden');
            const ep = local.ep || 0;
            const max = data.number_of_episodes || local.max_ep || 12;
            const pct = Math.round((ep / max) * 100);
            document.getElementById('calDetailProgressText').innerText = `Progress: ${ep}/${max} eps (${pct}%)`;
            document.getElementById('calDetailProgressBar').style.width = `${pct}%`;
        } else {
            progSection.classList.add('hidden');
        }

        document.getElementById('calDetailActionBtn').onclick = () => {
            closeCalendarDetail();
            closeCalendar();
            openModal(id, type);
        };

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (e) {
        console.error("Cal detail failed", e);
        showNotification("Failed to fetch deep tracker data.");
    }
    hideLoader();
}

function closeCalendarDetail() { document.getElementById('calendarDetailModal').classList.add('hidden'); }

function jumpToCalendar(date) {
    if (!date) return;
    // Calculate offset to center this date
    const target = new Date(date);
    const today = new Date();
    const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
    calendarOffset = diff;
    openCalendar(date);
}

function openDaySummary(dateStr) {
    const modal = document.getElementById('calendarDayModal');
    const calendar = document.getElementById('calendarModal');
    if (!modal) return;

    if (calendar && !calendar.classList.contains('hidden')) {
        calendarWasOpen = true;
        calendar.classList.add('hidden');
    }
    document.body.style.overflow = 'hidden';
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const dayNum = d.getDate();
    const year = d.getFullYear();

    document.getElementById('calDayTitle').innerHTML = `<span class="text-pulse">${dayName}</span> <span class="text-white">${monthName} ${dayNum}</span> <span class="text-gray-600">${year}</span>`;

    const radarItems = state.radar.filter(r => r.date === dateStr);
    const reminders = state.reminders.filter(r => r.isEpisodic && r.date === dateStr);
    const trackedIds = new Set([...radarItems, ...reminders].map(it => String(it.id)));
    const globals = state.globalCalendarReleases.filter(g => getCalendarItemDate(g) === dateStr && !trackedIds.has(String(g.id)));

    const content = document.getElementById('calDayContent');

    // Matrix Groups (Columns)
    const columns = {
        'Movies': globals.filter(g => g.media_type === 'movie'),
        'Anime': globals.filter(g => g.cal_category === 'Anime'),
        'K-Drama': globals.filter(g => g.cal_category === 'K-Drama'),
        'Turkish': globals.filter(g => g.cal_category === 'Turkish'),
        'Asian': globals.filter(g => g.cal_category === 'Asian'),
        'TV Shows': globals.filter(g => g.media_type === 'tv' && !['Anime', 'K-Drama', 'Turkish', 'Asian'].includes(g.cal_category))
    };

    let html = '';

    // 1. My Tracker Priority Card
    if (radarItems.length > 0 || reminders.length > 0) {
        html += `
            <div class="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 mb-16 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-pulse/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <h3 class="text-xs font-black uppercase tracking-[0.5em] text-pulse mb-10 flex items-center gap-4">
                    <span>Priority Tracker</span>
                    <div class="h-px flex-1 bg-pulse/20"></div>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${[...radarItems, ...reminders].map(it => `
                        <div onclick="closeDaySummary(); closeCalendar(); openModal(${it.id}, '${it.type}')" class="flex gap-6 items-center p-4 hover:bg-white/5 rounded-[32px] transition-all cursor-pointer">
                            <img src="${IMG + it.poster}" class="w-20 h-32 object-cover rounded-2xl shadow-xl">
                            <div>
                                <h4 class="text-lg font-black text-white uppercase italic leading-tight mb-2">${it.title}</h4>
                                <div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">${it.isEpisodic ? 'Airing Episode' : 'Release Day'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 2. The Matrix (Columns by Type, Rows by Impact)
    html += `
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
            ${Object.keys(columns).map(colName => {
        const items = columns[colName].sort((a, b) => b.popularity - a.popularity);
        if (items.length === 0) return '';
        return `
                    <div class="space-y-8">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 border-b border-white/5 pb-4">${colName}</h4>
                        <div class="space-y-4">
                            ${items.map(it => {
            const rating = it.vote_average || 0;
            const impactColor = rating >= 8 ? 'text-pulse' : (rating >= 7 ? 'text-[#f59e0b]' : 'text-gray-500');
            return `
                                    <div onclick="closeDaySummary(); closeCalendar(); openModal(${it.id}, '${it.media_type}')" class="group flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                                        <div class="w-12 h-16 shrink-0 rounded-xl overflow-hidden relative">
                                            <img src="${IMG + it.poster_path}" class="w-full h-full object-cover">
                                            <div class="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="text-[9px] font-black text-white truncate uppercase mb-1">${it.title || it.name}</div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-[8px] font-black ${impactColor}">★ ${rating.toFixed(1)}</span>
                                                <div class="h-1 flex-1 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-current ${impactColor}" style="width: ${rating * 10}%"></div></div>
                                            </div>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    content.innerHTML = html || '<div class="h-full flex items-center justify-center text-gray-700 font-black uppercase tracking-widest italic">No global releases detected for this frequency.</div>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDaySummary() {
    const modal = document.getElementById('calendarDayModal');
    const calendar = document.getElementById('calendarModal');
    if (modal) modal.classList.add('hidden');
    if (calendarWasOpen && calendar) {
        calendar.classList.remove('hidden');
        calendar.classList.add('flex');
    }
    calendarWasOpen = false;
    if (!calendar || calendar.classList.contains('hidden')) {
        document.body.style.overflow = 'auto';
    }
}
// --- COUNTER INTERACTIVITY & CATEGORY ENGINE ---

let clickTimer = null; // Used to distinguish single vs double clicks

function updateCounters() {
    const types = ['all', 'movie', 'tv', 'anime', 'kdrama', 'turkish', 'asian'];
    const html = types.map(t => {
        const count = t === 'all' ? state.db.length : state.db.filter(i => i.type === t).length;
        const label = t === 'all' ? 'All Data' : t;
        const border = t === 'all' ? 'pulse' : t;
        const tooltipText = t === 'all' ? 'Single click to view collection. Double tap for a random pick!' : `Single click to view ${label} category. Double tap for a random pick!`;

        return `
                    <div class="bg-white/5 border border-white/10 p-6 rounded-3xl border-t-4 border-${border} shadow-xl cursor-pointer hover:bg-white/10 hover:-translate-y-1 transition-all select-none" 
                         title="${tooltipText}"
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
    await navigate('category');

    document.getElementById('catSearchInput').value = '';

    const titleMap = { 'movie': 'Movies', 'tv': 'Series', 'anime': 'Anime', 'kdrama': 'K-Drama', 'turkish': 'Turkish', 'asian': 'Asian Drama' };
    document.getElementById('catTitle').innerHTML = `${mode === 'upcoming' ? 'Upcoming ' : 'Trending '}<span class="text-pulse">${titleMap[type]}</span>`;

    // Hide Top Rated sort button if we are looking at upcoming
    document.getElementById('btnTopRated').classList.toggle('hidden', mode === 'upcoming');

    document.getElementById('categoryGrid').innerHTML = '<div class="page-loader"></div>';
    document.getElementById('catLoadMore').classList.remove('hidden');

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
        // Trending/Top Rated logic
        if (type === 'movie') return sort === 'trending' ? `/trending/movie/week?page=${page}` : `/movie/top_rated?page=${page}`;

        let base = `/discover/tv?page=${page}`;
        // Lower vote threshold for specialty categories to ensure "legends" appear
        let threshold = (type === 'tv' || type === 'movie') ? 300 : 50;
        let sortParam = sort === 'trending' ? 'popularity.desc' : `vote_average.desc&vote_count.gte=${threshold}`;

        if (type === 'tv') return `${base}&sort_by=${sortParam}&with_original_language=en`;
        if (type === 'anime') return `${base}&sort_by=${sortParam}&with_genres=16&with_original_language=ja&without_genres=10749&include_adult=false`;
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
    if (!window.homeDataStore) window.homeDataStore = {};
    window.homeDataStore[id] = { items, type }; // Cache data for instant flipping

    const container = document.getElementById(id);
    if (!container) return;

    if (!prefs.homeLayouts) prefs.homeLayouts = {};
    const isGrid = prefs.homeLayouts[id] === 'grid';

    if (isGrid) {
        // Automatically switch to Grid Mode if saved
        container.className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6 pb-6 px-2';
        renderGrid(id, items, type, true);
    } else {
        // Standard Row Mode
        container.className = 'flex gap-6 md:gap-8 overflow-x-auto hide-scroll pb-6 px-2';
        const filteredItems = items.filter(i => !isBlocked(i));
        container.innerHTML = filteredItems.map((item, idx) => `
            <div class="flex-none w-[170px] md:w-[190px] lg:w-[210px] group cursor-pointer relative overflow-visible" onclick="openModal(${item.id}, '${type}')">
                <div class="absolute -left-6 bottom-2 background-card-number z-0 select-none leading-none">
                    ${idx + 1}
                </div>
                <div class="relative aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-white/5 group-hover:scale-105 group-hover:border-pulse/50 transition-all duration-500 shadow-xl bg-dark z-10 ml-6 skeleton">
                    <img src="${IMG + item.poster_path}" 
                         loading="lazy" 
                         decoding="async" 
                         class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity poster-loading"
                         onload="this.classList.add('poster-loaded'); this.parentElement.classList.remove('skeleton')">
                    ${getPlayHoverHTML({ ...item, type: type })}
                </div>
                <h3 class="font-black text-[11px] uppercase line-clamp-1 px-2 text-white glow-hover transition-colors ml-6">${item.title || item.name}</h3>
                <div class="text-[8px] font-bold text-gray-600 mt-2 uppercase px-2 tracking-widest ml-6">${(item.release_date || item.first_air_date || '').split('-')[0]} • ★ ${item.vote_average.toFixed(1)}</div>
            </div>
        `).join('');
    }
}
function renderGrid(id, items, forced, clear = true) {
    const container = document.getElementById(id);
    const html = items.filter(i => !isBlocked(i)).map(i => {
        const type = forced || i.media_type || (i.title ? 'movie' : 'tv');
        const actualType = i.media_type || (i.title ? 'movie' : 'tv');
        const category = determineCategory(i);
        const displayLabel = formatTypeLabel(category, actualType);
        const isPerson = i.media_type === 'person';
        const poster = i.poster_path || i.profile_path ? IMG + (i.poster_path || i.profile_path) : 'https://via.placeholder.com/300';

        const isTracked = (state.radar || []).some(r => String(r.id) === String(i.id));

        return `
        <div class="group cursor-pointer relative" onclick="${isPerson ? `openPersonModal(${i.id})` : `openModal(${i.id}, '${type}')`}">
            
            <div class="absolute top-10 left-3 flex flex-col gap-2 z-40 opacity-0 group-hover:opacity-100 transition-all">
                ${!isPerson ? `
                    <button onclick="event.stopPropagation(); quickAdd(${i.id}, '${type}')" 
                            title="Quick Add"
                            class="w-11 h-11 bg-dark/90 backdrop-blur-xl border border-white/20 rounded-2xl text-pulse flex items-center justify-center hover:bg-pulse hover:text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-90">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                ` : ''}

              ${id.includes('upcoming') ? `
                <button onclick="event.stopPropagation(); toggleRadar(${i.id}, '${type}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}')" 
                        title="${isTracked ? 'Stop Tracking' : 'Track on Radar'}"
                        class="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl ${isTracked ? 'text-kdrama border-kdrama/50 bg-kdrama/10' : 'text-white'} flex items-center justify-center hover:bg-pulse hover:border-pulse transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-90">
                    <i class="fas ${isTracked ? 'fa-satellite-dish' : 'fa-bell'} text-sm"></i>
                </button>
                <button onclick="event.stopPropagation(); jumpToCalendar('${i.release_date || i.first_air_date}')" 
                        title="Jump to Calendar"
                        class="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white/90 flex items-center justify-center hover:text-pulse hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-90 mt-2">
                    <i class="fas fa-calendar-day text-sm"></i>
                </button>
            ` : ''}
            </div>

            <div class="text-[8px] font-black uppercase text-pulse mb-1">${displayLabel}</div>
            
            <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-white/5 group-hover:border-pulse transition-all shadow-xl relative skeleton">
                <img src="${poster}" 
                     loading="lazy"
                     class="w-full h-full object-cover bg-dark poster-loading"
                     onload="this.classList.add('poster-loaded'); this.parentElement.classList.remove('skeleton')">
                
                ${i.vote_average ? `
                    <div class="absolute top-3 right-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-pulse border border-white/10 z-30">
                        ★ ${i.vote_average.toFixed(1)}
                    </div>
                ` : ''}

                ${id === 'upcomingMatrixGrid' && i.date ? (() => {
                    const diff = new Date(i.date).getTime() - new Date().getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    const dayText = days <= 0 ? 'Out Now' : (days === 1 ? 'Tomorrow' : `In ${days} Days`);
                    return `
                        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#22c55e] border border-white/10 z-30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                            <i class="fas fa-clock mr-1"></i> ${dayText}
                        </div>
                    `;
                })() : ''}
                
                ${!isPerson ? getPlayHoverHTML({ ...i, type: type }) : ''}
            </div>
            
            <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title || i.name}</div>
            <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase">
                ${(i.release_date || i.first_air_date || '').split('-')[0] || 'N/A'}
            </div>
        </div>
    `}).join('');

    if (clear) container.innerHTML = html || `<div class="col-span-full py-20 text-center text-gray-700 font-black uppercase tracking-widest italic">No data matched your neural frequency. Try resetting filters.</div>`;
    else container.insertAdjacentHTML('beforeend', html);
}
function setupFilters() {
    const yearSels = [document.getElementById('searchYear'), document.getElementById('labYear')].filter(Boolean);
    const years = Array.from({ length: 50 }, (_, i) => 2026 - i);
    yearSels.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = `<option value="${sel.id.includes('lab') ? 'all' : ''}">Year</option>` + years.map(y => `<option value="${y}">${y}</option>`).join('');
        if (currentVal) sel.value = currentVal;
    });

    const genreSels = [document.getElementById('pGenre')].filter(Boolean);
    genreSels.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = `<option value="">Genre</option>` + state.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        if (currentVal) sel.value = currentVal;
    });

    const hGenres = document.getElementById('homeGenres');
    if (hGenres) {
        hGenres.innerHTML = state.genres.slice(0, 15).map(g => `
            <button onclick="deepSearch('${g.name}')" class="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-pulse transition-all">#${g.name}</button>
        `).join('');
    }

    // Ensure Discover genres are also rendered if container exists
    if (document.getElementById('discoverGenreContainer')) renderGenrePills();
}

function openPicker() {
    document.getElementById('pickerModal').classList.remove('hidden');
    document.getElementById('pickerResult').classList.add('hidden');
}
function closePicker() { document.getElementById('pickerModal').classList.add('hidden'); checkScrollLock(); }

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

    if (!pool.length) return alert("Database empty for selected criteria.");

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
    document.getElementById('mProgressBar').style.width = `${(curr / tot) * 100}%`;
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

    // Find which season this episode belongs to
    let currentSeason = 1;
    if (state.activeSeasons && state.activeSeasons.length > 0) {
        for (let s of state.activeSeasons) {
            if (v >= s.startEp && v <= s.endEp) {
                currentSeason = s.season_number;
                break;
            }
        }
    }

    document.getElementById('mEpRange').value = v;
    const idx = state.db.findIndex(i => String(i.id) === String(state.active.id));

    if (idx !== -1) {
        state.db[idx].ep = v;
        state.db[idx].season = currentSeason;
        state.db[idx].updatedAt = Date.now();
        updateEpUI(v, max);
        renderSeasonsUI(); // Update glowing/checked states instantly
        save();

        // Auto-mark finished if max is reached
        if (v === max && state.db[idx].status !== 'Finished') {
            document.getElementById('mStatus').value = 'Finished';
            updateStatus();
            state.db[idx].updatedAt = Date.now();
        }
    }
}
function adjustProgress(dir) {
    const curr = parseInt(document.getElementById('mEpRange').value) || 0;
    syncProgress(curr + dir);
}
async function openActor(id, name) {
    closeModal(true);
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
// --- ENHANCED CLOCK ENGINE ---
let is24Hour = localStorage.getItem('cp_clock_format') === '24'; // Default to 12h if not set

window.toggleClockFormat = function () {
    is24Hour = !is24Hour;
    localStorage.setItem('cp_clock_format', is24Hour ? '24' : '12');
    updateClockDisplay();
};

function updateClockDisplay() {
    const timeEl = document.getElementById('clockTime');
    const secEl = document.getElementById('clockSeconds');
    const dateEl = document.getElementById('clockDate');
    const ampmEl = document.getElementById('clockAmPm');

    if (!timeEl) return; // Failsafe if DOM isn't ready

    const d = new Date();
    let hours = d.getHours();
    let ampm = '';

    // Format 12h/24h Logic
    if (!is24Hour) {
        ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert '0' to '12'
    }

    // Add leading zeros
    hours = String(hours).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    // Format Date (e.g., "FRI, APR 03")
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    const dateStr = d.toLocaleDateString('en-US', options).toUpperCase();

    // Render to DOM (Using animate-pulse for a subtle ticking colon)
    timeEl.innerHTML = `${hours}<span class="animate-pulse opacity-80 text-pulse mx-[1px]">:</span>${minutes}`;

    if (secEl) secEl.innerText = seconds;
    if (ampmEl) ampmEl.innerText = ampm;
    if (dateEl) dateEl.innerText = dateStr;

    // RADAR INTEGRATION: Check for releases today
    updateClockRadarState(d);
}

function getItemPosterURL(item) {
    const poster = item.poster || item.poster_path || item.backdrop_path || item.poster_path;
    return poster ? IMG + poster : '';
}

function getClockFeaturedItem(d) {
    const todayStr = d.toISOString().split('T')[0];
    const todayDay = d.getDay();
    const hasPoster = item => item && (item.poster || item.poster_path || item.backdrop_path);

    const trackedCandidates = [...(state.radar || []), ...(state.reminders || [])]
        .filter(item => hasPoster(item) && ((item.type === 'movie' && item.date === todayStr) || (item.type === 'tv' && item.weeklyDay === todayDay) || item.date === todayStr));

    if (trackedCandidates.length) {
        return trackedCandidates.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0) || (b.popularity || 0) - (a.popularity || 0))[0];
    }

    const calendarTodayCandidates = (state.globalCalendarReleases || [])
        .filter(item => hasPoster(item) && getCalendarItemDate(item) === todayStr);

    if (calendarTodayCandidates.length) {
        return calendarTodayCandidates.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0) || (b.popularity || 0) - (a.popularity || 0))[0];
    }

    const anticipatedCandidates = (state.globalCalendarReleases || [])
        .filter(item => hasPoster(item) && getCalendarItemDate(item) && getCalendarItemDate(item) > todayStr);

    if (anticipatedCandidates.length) {
        const item = anticipatedCandidates.sort((a, b) => new Date(getCalendarItemDate(a)) - new Date(getCalendarItemDate(b)))[0];
        item.isAnticipated = true;
        return item;
    }

    return null;
}

function updateClockRadarState(d) {
    const bg = document.getElementById('clockPosterBg');
    const dot = document.getElementById('clockStatusDot');
    const label = document.getElementById('clockStatusLabel');
    const featured = getClockFeaturedItem(d);

    const featureTitle = document.getElementById('clockFeatureTitle');
    const hoverPoster = document.getElementById('clockHoverPoster');
    const hoverTitle = document.getElementById('clockHoverTitle');
    const hoverLocation = document.getElementById('clockHoverLocation');
    const hoverCard = document.getElementById('clockHoverCard');

    if (featured && bg) {
        if (hoverCard) hoverCard.classList.remove('hidden');
        const posterUrl = getItemPosterURL(featured);
        if (posterUrl) {
            bg.style.backgroundImage = `url(${posterUrl})`;
            bg.style.opacity = '0.75';
            bg.style.filter = 'brightness(0.78) contrast(1.12)';
            if (hoverPoster) hoverPoster.style.backgroundImage = `url(${posterUrl})`;
        } else {
            bg.style.backgroundImage = '';
            bg.style.opacity = '0';
            bg.style.filter = '';
            if (hoverPoster) hoverPoster.style.backgroundImage = '';
        }

        dot.style.backgroundColor = '#ff2d55';
        dot.style.boxShadow = '0 0 18px #ff2d55';
        dot.style.width = '0.75rem';
        dot.style.height = '0.75rem';

        if (featured.isAnticipated) {
            label.innerText = 'Anticipated';
            const daysLeft = Math.ceil((new Date(getCalendarItemDate(featured)).getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            let dayText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
            const typeText = featured.type === 'tv' ? 'show' : 'movie';
            hoverLocation.innerText = `${typeText} ${featured.title || featured.name} will be out ${dayText} stay tuned`;
        } else {
            if (featured.type === 'tv' || featured.next_episode_to_air) {
                label.innerText = 'Episode Out';
            } else if (featured.release_date || featured.date) {
                label.innerText = 'Movie Day';
            } else {
                label.innerText = 'Anticipated';
            }
            hoverLocation.innerText = 'Click here to watch';
        }

        label.style.color = '#ff2d55';
        label.style.textShadow = '0 0 10px rgba(255, 45, 85, 0.6)';

        const titleText = `${featured.title || featured.name || featured.original_title || featured.original_name || 'Featured release'}`;

        if (featureTitle) {
            featureTitle.innerText = titleText;
            featureTitle.style.color = 'rgba(255,255,255,0.95)';
            featureTitle.style.textShadow = '0 0 12px rgba(0,0,0,0.5)';
        }
        if (hoverTitle) {
            hoverTitle.innerText = titleText;
        }
    } else if (bg) {
        if (hoverCard) hoverCard.classList.add('hidden');
        bg.style.opacity = '0';
        bg.style.filter = '';
        dot.style.backgroundColor = '#22c55e';
        dot.style.boxShadow = '0 0 8px #22c55e';
        dot.style.width = '0.5rem';
        dot.style.height = '0.5rem';
        label.innerText = 'Clock';
        label.style.color = '';
        label.style.textShadow = '';
        if (featureTitle) featureTitle.innerText = '';
        if (hoverTitle) hoverTitle.innerText = 'No featured release';
        if (hoverLocation) hoverLocation.innerText = 'Click here to watch';
        if (hoverPoster) hoverPoster.style.backgroundImage = '';
    }
}

function openClockHoverDetail() {
    const featured = getClockFeaturedItem(new Date());
    if (!featured || !featured.id) return;
    const type = featured.type || featured.media_type || (featured.name ? 'tv' : 'movie');
    openModal(featured.id, type);
}

function startClock() {
    updateClockDisplay(); // Initialize immediately to prevent "00:00" flash
    setInterval(updateClockDisplay, 1000);
}
function save(skipBroadcast = false) {
    localStorage.setItem('cp_elite_db_v3', JSON.stringify(state.db));
    updateCounters();
    if (typeof renderContinueWatching === 'function') renderContinueWatching();

    if (state.view === 'mylist') renderList();
    if (state.view === 'rhythmlab') runLab();

    // Trigger Micro-Sync to connected peers
    if (!skipBroadcast && typeof NeuralSync !== 'undefined' && Object.keys(NeuralSync.activeConns).length > 0) {
        // Find the item that was literally just updated (within the last 1 second)
        const latest = state.db.reduce((a, b) => ((a.updatedAt || 0) > (b.updatedAt || 0) ? a : b), state.db[0]);
        if (latest && (Date.now() - (latest.updatedAt || 0)) < 1500) {
            Object.values(NeuralSync.activeConns).forEach(conn => {
                if (conn && conn.open) conn.send({ type: 'MICRO_SYNC', item: latest });
            });
        }
    }
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
function closeModal(fromPopState = false, skipHistory = false) {
    state.modalHistory = []; // Wipe history on full close
    updateModalTopLeftButtons();
    document.getElementById('modal').classList.add('hidden');

    checkScrollLock(); // Replaces document.body.style.overflow = 'auto'

    // If closed via browser Back button, restore scroll position
    if (fromPopState && typeof window._cpModalScrollY === 'number') {
        setTimeout(() => window.scrollTo({ top: window._cpModalScrollY, behavior: 'instant' }), 50);
    }

    // If closed manually via X button, reverse the history to clean the stack
    if (!fromPopState && !skipHistory) window.history.back();
}
window.navigateFromModal = function (route) {
    closeModal(false, true); // Close the modal but SKIP the history.back()

    // Cleanly replace the modal's state in the browser history with the new target page
    window.history.replaceState(null, null, `#/${secureEncode(route)}`);
    navigate(route, true); // Navigate, but tell it to skip pushing state since we just replaced it
};

function closePersonModal(fromPopState = false) {
    document.getElementById('personModal').classList.add('hidden');
    checkScrollLock(); // Replaces document.body.style.overflow = 'auto'

    // If closed via browser Back button, restore scroll position
    if (fromPopState && typeof window._cpModalScrollY === 'number') {
        setTimeout(() => window.scrollTo({ top: window._cpModalScrollY, behavior: 'instant' }), 50);
    }

    if (!fromPopState) window.history.back();
}
function removeItem() {
    state.db = state.db.filter(i => i.id !== state.active.id);
    save();
    closeModal();
}
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
    await refreshEpisodicReminders();
    // 1. Render Tracked Radar immediately
    renderUpcomingRadar();
    await initCalendarData(); // Ensure calendar items exist before matrix rendering
    renderUpcomingMatrix();

    const today = new Date().toISOString().split('T')[0];
    let future = new Date();
    future.setMonth(future.getMonth() + 9); // Look further ahead
    const futureDate = future.toISOString().split('T')[0];

    // Helper to clear grids and show loaders
    const grids = [
        'upcomingRecommendationsGrid', 'upcomingSeriesGrid', 'upcomingAnimeGrid',
        'upcomingKdramaGrid', 'upcomingTurkishGrid', 'upcomingMainGrid'
    ];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="page-loader"></div>';
    });

    try {
        // 1. Highly Anticipated Movies
        const anticipatedRes = await fetch(`${BASE}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${today}&primary_release_date.lte=${futureDate}&sort_by=popularity.desc`);
        const anticipatedData = await anticipatedRes.json();
        const futureMovies = (anticipatedData.results || []).filter(m => m.release_date >= today);
        renderGrid('upcomingRecommendationsGrid', futureMovies.slice(0, 12), 'movie', true);

        // 2. Upcoming Series
        const seriesRes = await fetch(`${BASE}/discover/tv?api_key=${API_KEY}&first_air_date.gte=${today}&first_air_date.lte=${futureDate}&sort_by=popularity.desc&with_original_language=en`);
        const seriesData = await seriesRes.json();
        renderGrid('upcomingSeriesGrid', (seriesData.results || []).slice(0, 12), 'tv', true);

        // 3. Upcoming Anime
        const animeRes = await fetch(`${BASE}/discover/tv?api_key=${API_KEY}&first_air_date.gte=${today}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`);
        const animeData = await animeRes.json();
        renderGrid('upcomingAnimeGrid', (animeData.results || []).slice(0, 12), 'tv', true);

        // 4. K-Drama Tracker
        const kdramaRes = await fetch(`${BASE}/discover/tv?api_key=${API_KEY}&first_air_date.gte=${today}&with_original_language=ko&sort_by=popularity.desc`);
        const kdramaData = await kdramaRes.json();
        renderGrid('upcomingKdramaGrid', (kdramaData.results || []).slice(0, 6), 'tv', true);

        // 5. Turkish Wave
        const turkishRes = await fetch(`${BASE}/discover/tv?api_key=${API_KEY}&first_air_date.gte=${today}&with_original_language=tr&sort_by=popularity.desc`);
        const turkishData = await turkishRes.json();
        renderGrid('upcomingTurkishGrid', (turkishData.results || []).slice(0, 6), 'tv', true);

        // 6. General Releasing Soon (Mix)
        const mainRes = await fetch(`${BASE}/movie/upcoming?api_key=${API_KEY}`);
        const mainData = await mainRes.json();
        const filteredMain = (mainData.results || []).filter(m => m.release_date >= today);
        renderGrid('upcomingMainGrid', filteredMain.slice(0, 18), 'movie', true);

    } catch (err) {
        console.error("Pulse fetch failed for Upcoming page.", err);
    }
    initSmartScrollButtons();
}

// 2. Render Tracked Radar directly on the Upcoming page
function renderUpcomingRadar() {
    const radarSection = document.getElementById('upcomingRadarSection');
    const radarGrid = document.getElementById('upcomingRadarGrid');
    const epSection = document.getElementById('upcomingEpisodicSection');
    const epGrid = document.getElementById('upcomingEpisodicGrid');

    // FIX: Protect Episodic items from being auto-cleaned if they are in the DB
    const dbIds = new Set(state.db.map(i => i.id));
    state.reminders = (state.reminders || []).filter(r => r.isEpisodic || !dbIds.has(r.id));
    localStorage.setItem('cp_elite_reminders', JSON.stringify(state.reminders));

    // 1. Render Episodic (TV Shows)
    const episodicReminders = state.reminders.filter(r => r.isEpisodic);
    if (episodicReminders.length === 0) {
        epSection.classList.add('hidden');
    } else {
        epSection.classList.remove('hidden');
        epGrid.innerHTML = episodicReminders.map(r => {
            const diff = new Date(r.date).getTime() - new Date().getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            let dayText = days < 0 ? 'AVAILABLE NOW' : (days === 0 ? 'AIRING TODAY' : (days === 1 ? 'TOMORROW' : `${days} DAYS LEFT`));
            if (r.statusText) dayText = r.statusText;

            const localData = state.db.find(i => String(i.id) === String(r.id));
            let progressHtml = '';
            let currentEpText = 'Waiting';

            if (localData) {
                const max = localData.max_ep || 1;
                const ep = localData.ep || 0;
                const pct = Math.min(100, Math.round((ep / max) * 100));
                currentEpText = `Watched: ${ep}/${max}`;
                progressHtml = `<div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2"><div class="bg-[#a855f7] h-full transition-all duration-500" style="width: ${pct}%"></div></div>`;
            }

            return `
            <div class="flex items-center gap-4 bg-[#0a0c12]/90 backdrop-blur-md p-4 rounded-3xl border border-[#a855f7]/30 hover:border-[#a855f7] transition-all cursor-pointer shadow-xl group/item" onclick="openModal(${r.id}, '${r.type}')">
                <div class="w-16 h-24 shrink-0 rounded-xl overflow-hidden border border-white/5 relative">
                    <img src="${IMG + r.poster}" class="w-full h-full object-cover">
                    <div onclick="event.stopPropagation(); jumpToCalendar('${r.date}')" class="absolute inset-0 bg-pulse/80 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-20"><i class="fas fa-calendar-day text-white text-xl"></i></div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black italic uppercase text-white truncate mb-1">${r.title}</h4>
                    <div class="flex flex-col bg-white/5 px-3 py-2 rounded-lg mb-2">
                        <div class="flex justify-between items-center"><span class="text-[8px] text-gray-400 font-black uppercase tracking-widest">${currentEpText}</span><span class="text-[9px] text-[#a855f7] font-black uppercase tracking-widest">Next: S${r.nextSeason} E${r.nextEp}</span></div>
                        ${progressHtml}
                    </div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-[#22c55e]"><i class="fas fa-clock"></i> ${dayText}</div>
                </div>
                <button onclick="event.stopPropagation(); state.active = {id: ${r.id}}; toggleReminder();" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/20 transition-all shrink-0"><i class="fas fa-trash-alt text-[10px]"></i></button>
            </div>`;
        }).join('');
    }

    // 2. Render Tracker (Radar + Standard Reminders)
    const combinedTracker = [
        ...state.radar.map(r => ({ ...r, isRadar: true })),
        ...state.reminders.filter(r => !r.isEpisodic)
    ];

    if (combinedTracker.length === 0) {
        radarSection.classList.add('hidden');
    } else {
        radarSection.classList.remove('hidden');
        radarGrid.innerHTML = combinedTracker.map(r => {
            const diff = new Date(r.date).getTime() - new Date().getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const isOut = days <= 0;
            const dayText = isOut ? 'AVAILABLE NOW' : (days === 1 ? 'TOMORROW' : `${days} DAYS LEFT`);
            const urgencyColor = isOut ? 'text-[#22c55e]' : (days <= 7 ? 'text-[#f59e0b]' : 'text-pulse');

            return `
            <div class="flex items-center gap-4 bg-[#0a0c12]/90 backdrop-blur-md p-4 rounded-3xl border border-white/10 hover:border-pulse transition-all cursor-pointer group shadow-xl" onclick="openModal(${r.id}, '${r.type}')">
                <div class="w-20 h-28 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/5 relative">
                    <img src="${IMG + r.poster}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div onclick="event.stopPropagation(); jumpToCalendar('${r.date}')" class="absolute inset-0 bg-pulse/80 flex items-center justify-center opacity-0 group:hover:opacity-100 transition-opacity z-20"><i class="fas fa-calendar-day text-white text-xl"></i></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-[8px] font-black uppercase tracking-widest text-white bg-white/10 px-2 py-0.5 rounded border border-white/5">${r.type}</span>
                        <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest">${(r.date || '').split('-')[0] || 'TBA'}</span>
                    </div>
                    <h4 class="text-xs font-black italic uppercase text-white truncate group-hover:text-pulse transition-colors mb-3">${r.title}</h4>
                    <div class="inline-block border border-white/10 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md">
                        <span class="text-[9px] font-black uppercase tracking-widest ${urgencyColor} flex items-center gap-2"><i class="fas fa-stopwatch"></i> ${dayText}</span>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); ${r.isRadar ? `toggleRadar(${r.id}, '${r.type}', '${r.title.replace(/'/g, "\\'")}', '${r.poster}')` : `state.active = {id: ${r.id}}; toggleReminder();`}" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-pulse hover:bg-pulse/20 transition-all shrink-0"><i class="fas fa-trash-alt text-[10px]"></i></button>
            </div>`;
        }).join('');
    }
}

function renderUpcomingMatrix() {
    const timeFilter = document.getElementById('matrixTimeFilter')?.value || 'today';
    const typeFilter = document.getElementById('matrixTypeFilter')?.value || 'all';
    const grid = document.getElementById('upcomingMatrixGrid');
    if (!grid) return;

    let items = state.globalCalendarReleases || [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Time Filtering
    items = items.filter(item => {
        const itemDateStr = getCalendarItemDate(item);
        if (!itemDateStr) return false;
        
        // Parse date reliably assuming YYYY-MM-DD
        const [year, month, day] = itemDateStr.split('-');
        const itemDate = new Date(year, month - 1, day);
        
        if (timeFilter === 'today') {
            return itemDate.getTime() === today.getTime();
        } else if (timeFilter === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return itemDate >= today && itemDate <= nextWeek;
        } else if (timeFilter === 'month') {
            return itemDate.getFullYear() === today.getFullYear() && itemDate.getMonth() === today.getMonth();
        }
        return true;
    });

    // Type Filtering
    if (typeFilter !== 'all') {
        items = items.filter(item => {
            if (typeFilter === 'movie' || typeFilter === 'tv') {
                return (item.media_type === typeFilter || (typeFilter === 'movie' && item.cal_category === 'Movie') || (typeFilter === 'tv' && item.cal_category === 'Series'));
            } else {
                return item.cal_category && item.cal_category.toLowerCase() === typeFilter;
            }
        });
    }

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px] italic border border-white/5 rounded-2xl bg-white/5">No releases matched your filter.</div>';
        return;
    }

    // Sort by popularity / vote average
    items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Dedup by id
    const uniqueMap = new Map();
    items.forEach(i => uniqueMap.set(i.id, i));
    items = Array.from(uniqueMap.values());

    renderGrid('upcomingMatrixGrid', items, false, true);
}

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
async function openAdvancedIO(mode) {
    await loadModalFragment("advancedIOModal");
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
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            TemporalEngine.commit("Pre-Import Anchor");
            let importedCount = 0; let updatedCount = 0; let skippedCount = 0;

            // 1. Database Processing
            if (impLib && (data.db || Array.isArray(data))) {
                const importedDB = Array.isArray(data) ? data : data.db;
                importedDB.forEach(importedItem => {
                    const existingIdx = state.db.findIndex(ex => String(ex.id) === String(importedItem.id));
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
    if (countEl) countEl.innerText = selectedItems.size;
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
async function openFactoryResetModal() {
    await loadModalFragment("factoryResetModal");
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

    // 1. Exact substring match (fastest)
    if (text.includes(query)) return true;

    // 2. Word-based matching with typo tolerance
    const titleWords = text.split(/[\s\-:]+/);
    const queryWords = query.split(/[\s\-:]+/);

    return queryWords.every(qw => {
        if (qw.length <= 2) return titleWords.some(tw => tw === qw); // Exact match for short words

        return titleWords.some(tw => {
            if (tw.includes(qw)) return true;

            // Allow 1 typo for 4-5 letter words, 2 typos for 6+ letter words
            const maxTypos = qw.length > 5 ? 2 : (qw.length > 3 ? 1 : 0);
            return calculateLevenshteinDistance(tw, qw) <= maxTypos;
        });
    });
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
            try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch (e) { }

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

function removeSource(cat, idx) {
    sourcesDb[cat].splice(idx, 1);
    localStorage.setItem('cp_elite_sources', JSON.stringify(sourcesDb));
    renderSources();
}


// --- UNIFIED HOVER PLAY ENGINE ---
function getPlayHoverHTML(item) {
    // 1. Determine exact category natively for styling
    const local = state.db.find(i => String(i.id) === String(item.id));
    const cat = local ? local.type : determineCategory(item);

    // CRITICAL FIX: If it's a tracked item, strictly use its saved tmdb_type. 
    // Otherwise, infer it from the TMDB API payload.
    const actualTmdbType = local ? local.tmdb_type : (item.media_type || (item.name ? 'tv' : 'movie'));

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
            <button onclick="quickTrailer(event, ${item.id}, '${actualTmdbType}')" class="w-14 h-14 rounded-full bg-white/10 border border-pulse text-pulse flex items-center justify-center text-xl hover:bg-pulse hover:text-white hover:scale-110 transition-all pointer-events-auto shadow-[0_5px_15px_rgba(255,45,85,0.4)]">
                <i class="fab fa-youtube"></i>
            </button>
        </div>`;
    }

    // 5. RETURN STANDARD PLAY BUTTON
    return `
    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none flex items-center justify-center">
        <button onclick="quickWatch(event, ${item.id}, '${cat}', '${actualTmdbType}', '${title}', '${year}')" class="w-14 h-14 rounded-full bg-white/10 border border-white/40 flex items-center justify-center text-white text-xl hover:bg-pulse hover:border-pulse hover:scale-110 transition-all pointer-events-auto shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            <i class="fas fa-play ml-1"></i>
        </button>
    </div>`;
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

    // NEW: Auto-Launch Internal Player and bypass Modal if no external sources exist
    if (availableSources.length === 0) {
        showNotification(`Launching Built-in Player. <u onclick="navigate('sources')" class="cursor-pointer text-white hover:text-pulse ml-1">Configure External Sources Here</u>`);
        launchInternalPlayer(tmdbId, tmdbType, title);
        return;
    }

    // 1. BUILT-IN PLAYER SECTION
    let html = `
        <div class="mb-6 border-b border-white/10 pb-6">
            <h4 class="text-[10px] font-black uppercase text-[#22c55e] tracking-[0.2em] mb-4 flex items-center gap-2">
                <i class="fas fa-play"></i> Built-in Player
            </h4>
            <button onclick="launchInternalPlayer(${tmdbId}, '${tmdbType}', '${title.replace(/'/g, "\\'")}')"
                    class="w-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">
                <i class="fas fa-broadcast-tower"></i> Launch Secure Stream
            </button>
        </div>
    `;

    // 2. EXTERNAL CUSTOM SOURCES SECTION
    html += `<h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2"><i class="fas fa-external-link-alt"></i> External Custom Sources</h4>`;

    html += `<div class="space-y-2 max-h-[30vh] overflow-y-auto hide-scroll pr-1">`;
    html += availableSources.map(src => {
        const finalUrl = src.url.replace(/{title}/g, safeTitleUrl).replace(/{tmdb_id}/g, tmdbId).replace(/{year}/g, year);
        let domain = 'Link';
        try { domain = new URL(src.url.replace(/{.*?}/g, '')).hostname; } catch (e) { }

        return `
           <a href="${finalUrl}" target="_blank" onclick="autoMarkWatching(${tmdbId}, '${tmdbType}'); document.getElementById('watchModal').classList.add('hidden')"
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

    document.getElementById('watchSourceList').innerHTML = html;
    document.getElementById('watchModal').classList.remove('hidden');
}

async function quickTrailer(event, id, type) {
    event.preventDefault();
    event.stopPropagation();
    showNotification("Locating Neural Video...");

    try {
        const apiType = (type === 'tv' || type === 'anime' || type === 'kdrama' || type === 'turkish' || type === 'asian') ? 'tv' : 'movie';
        const vids = await fetchAPI(`/${apiType}/${id}/videos`);

        // Fallback sequence: Trailer -> Teaser -> Clip -> Featurette
        const order = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
        let tr = null;

        for (let o of order) {
            tr = vids.results.find(v => v.type === o);
            if (tr) break;
        }

        // Absolute fallback: Just play the first video they have
        if (!tr && vids.results.length > 0) tr = vids.results[0];

        if (tr) {
            window.open(`https://youtube.com/watch?v=${tr.key}`, '_blank');
        } else {
            showNotification("No video archives found for this entity.", true);
        }
    } catch (err) {
        showNotification("Neural link severed. Failed to fetch video.", true);
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
setupFilters = function () {
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


// toggleDiscoverFilter :
async function fetchDiscoverData(append = false) {
    let val = state.discoverFilters.type;
    let page = discoverPage;
    let path = `/trending/all/day?page=${page}`;

    // Construct genre parameter for discovery
    let genreParam = state.discoverFilters.genres.length > 0 ? `&with_genres=${state.discoverFilters.genres.join(',')}` : '';

    // Construct year parameter
    const yearSelect = document.getElementById('searchYear');
    let yearParam = (yearSelect && yearSelect.value) ? `&primary_release_year=${yearSelect.value}&first_air_date_year=${yearSelect.value}` : '';

    // Construct region parameter
    const regionSelect = document.getElementById('searchCountry');
    let regionParam = (regionSelect && regionSelect.value) ? `&with_origin_country=${regionSelect.value}` : '';

    if (val === 'movie') path = `/discover/movie?sort_by=popularity.desc&page=${page}${genreParam}${yearParam}${regionParam}`;
    else if (val === 'tv') path = `/discover/tv?sort_by=popularity.desc&with_original_language=en&page=${page}${genreParam}${yearParam}${regionParam}`;
    else if (val === 'anime') {
        let genres = [16, ...state.discoverFilters.genres];
        path = `/discover/tv?with_genres=${genres.join(',')}&sort_by=popularity.desc&with_original_language=ja&page=${page}&without_genres=10749&include_adult=false${yearParam}${regionParam}`;
    }
    else if (val === 'kdrama') path = `/discover/tv?with_original_language=ko&sort_by=popularity.desc&page=${page}${genreParam}${yearParam}${regionParam}`;
    else if (val === 'turkish') path = `/discover/tv?with_original_language=tr&sort_by=popularity.desc&page=${page}${genreParam}${yearParam}${regionParam}`;
    else if (val === 'asian') path = `/discover/tv?with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16&sort_by=popularity.desc&page=${page}${genreParam}${yearParam}${regionParam}`;
    else if (genreParam || yearParam || regionParam) {
        // If "All" is selected but filters are active, use discover instead of trending
        path = `/discover/movie?sort_by=popularity.desc&page=${page}${genreParam}${yearParam}${regionParam}`;
    }

    const data = await fetchAPI(path);

    if (append) {
        state.discoverDataRaw = state.discoverDataRaw.concat(data.results.filter(i => !isBlocked(i)));
    } else {
        state.discoverDataRaw = data.results.filter(i => !isBlocked(i));
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

    // --- Smart mode awareness ---
    if (state.searchMode === 'search') {
        // Re-run the current search query with the new type filter applied
        const rawHeader = document.getElementById('searchHeader').innerText;
        const currentQuery = rawHeader.startsWith('Results: ') ? rawHeader.replace('Results: ', '').trim() : '';
        if (currentQuery) {
            // deepSearch re-fetches, stores in state.discoverDataRaw, then applyDiscoverLocalFilters
            // filters by the now-updated state.discoverFilters.type automatically
            await deepSearch(currentQuery);
            return;
        }
    } else if (state.searchMode === 'filter') {
        // Re-run TMDB discover with the new type
        await applySearchFilters(false);
        return;
    }

    // Default: fetch fresh discover data for the selected type
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
    if (searchInput) searchInput.value = '';

    renderGenrePills();
    toggleListFilter('type', 'all');
}
// 3. Rhythm Lab Reset
function resetLabFilters() {
    state.labFilters.genres = [];
    state.labSearchQuery = '';

    // Clear the local text search
    const searchInput = document.getElementById('labSearchInput');
    if (searchInput) searchInput.value = '';

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
    if (confirm("Are you sure you want to delete all configured sources?")) {
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

    const local = state.db.find(i => String(i.id) === String(item.id));
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
    if (notifications.length > 30) notifications.length = 30;

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
    if (idx > -1) {
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
    const item = state.db.find(i => String(i.id) === String(state.active.id));
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
    const item = state.db.find(i => String(i.id) === String(state.active.id));
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
            const crowned = state.db.filter(i => i.type === type && i.crown > 0 && i.crown < 4).sort((a, b) => a.crown - b.crown);
            // Genre Sovereigns (Unlimited)
            const sovereigns = state.db.filter(i => i.type === type && i.crown === 4);

            if (!crowned.length && !sovereigns.length) return '';

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
            const perfect = state.db.filter(i => i.type === type && i.score === 5).sort((a, b) => b.imdb - a.imdb);
            if (!perfect.length) return '';
            return `
                <div class="mb-16 animate-in fade-in duration-500">
                    <h3 class="text-lg md:text-xl font-black italic uppercase text-white tracking-widest mb-6 border-b border-white/5 pb-2">${typeNames[type]} Masterpieces</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        ${perfect.map(i => getRankedCard(i, null, false)).join('')}
                    </div>
                </div>
            `;
        }).join('') || '<div class="text-center py-20 text-gray-600 font-black uppercase italic tracking-[0.3em] w-full">Achieve a perfect score to see records here.</div>';
        container.innerHTML = html;
    }
    else if (state.mpTab === 'ranked') {
        const limit = state.mpLimit || 25;
        const ranked = [...state.db]
            .filter(i => i.score > 0 && (state.mpFilter === 'all' || i.type === state.mpFilter))
            .sort((a, b) => b.score - a.score || b.imdb - a.imdb)
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

function getRankedCard(i, rank, isCrownCard = false, realmName = '') {
    let badgeHtml = '';
    let borderShadow = 'border-white/5 shadow-xl';

    // DYNAMIC SCALE FIX: Check the active scale setting and adjust the math/text
    const scaleToggle = document.getElementById('mainRatingScaleToggle') || document.getElementById('ratingScaleToggle');
    const scale = scaleToggle ? parseInt(scaleToggle.value) : 5;
    const displayScore = scale === 10 ? `${(i.score * 2).toFixed(1)}/10` : `${i.score}/5`;
    const actualTmdbType = i.tmdb_type || (i.type === 'movie' ? 'movie' : 'tv');

    if (rank === 4) {
        return `
        <div class="group cursor-pointer relative" onclick="openModal(${i.id}, '${actualTmdbType}')">
            <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border border-pulse/30 shadow-[0_10px_40px_rgba(255,45,85,0.15)] group-hover:border-pulse transition-all relative">
                <img src="${IMG + i.poster}" class="w-full h-full object-cover bg-dark">
                <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div class="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
                    <div class="text-[10px] font-black uppercase text-pulse bg-dark/80 backdrop-blur-md px-3 py-2 rounded-xl border border-pulse/50 text-center shadow-lg">
                        💎 ${realmName || i.realm || 'Sovereign'}<br>
                        <span class="text-[8px] text-white mt-1 block">★ ${displayScore}</span>
                    </div>
                </div>
                ${getPlayHoverHTML(i)}
            </div>
            <div class="text-[10px] font-black uppercase line-clamp-1 group-hover:text-pulse transition-colors">${i.title}</div>
            <div class="text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-widest">${i.year || 'N/A'} • IMDB: ${i.imdb?.toFixed(1) || '0.0'}</div>
        </div>
        `;
    }

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
                    ★ ${displayScore}<br><span class="text-[8px] text-gray-400">${i.type}</span>
                </div>
            </div>
        `;
    } else {
        badgeHtml = `
            <div class="absolute top-3 right-3 z-30 pointer-events-none">
                 <div class="text-[10px] font-black uppercase text-pulse bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    ★ ${displayScore}
                </div>
            </div>
        `;
    }

    return `
    <div class="group cursor-pointer relative" onclick="openModal(${i.id}, '${actualTmdbType}')">
        <div class="aspect-[2/3] rounded-[30px] overflow-hidden mb-4 border ${borderShadow} group-hover:border-pulse transition-all relative">
            <img src="${IMG + i.poster}" class="w-full h-full object-cover bg-dark">
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
    checkScrollLock();
}

function backdropClosePurge(e) {
    if (e.target.id === "purgeModal") {
        closePurgeModal();
    }
}

function executePurge() {
    TemporalEngine.commit("Pre-Purge Backup");
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
    const idx = state.db.findIndex(i => String(i.id) === String(state.active.id));

    if (idx !== -1) {
        state.db[idx].type = newType;
        state.db[idx].updatedAt = Date.now();
        save();
    } else {
        // If not in library yet, store the forceType to be used when they click '+ Add to List'
        state.active.forceType = newType;
    }

    showNotification(`Type overridden to ${newType.toUpperCase()}`);

    // Instantly hide/show the episode tracker based on the new logic
    const maxEp = state.active.number_of_episodes || 1;
    const local = state.db.find(i => String(i.id) === String(state.active.id));
    const calculatedType = newType; // Use the new type being passed in

    document.getElementById('mProgressBox').classList.toggle('hidden', calculatedType === 'movie' || !local || maxEp <= 1);

    if (calculatedType !== 'movie' && local && maxEp > 1) {
        // Fix for Season Mismatch: Recalculate based on real limits
        document.getElementById('mEpRange').max = maxEp;
        document.getElementById('mEpRange').value = local.ep || 0;

        // BUG FIX: Scoped to state.active instead of details
        state.activeSeasons = (state.active.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
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

        if (!untrackedCollections.length) {
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
            <img src="${saga.parts[0]?.poster_path ? IMG + saga.parts[0].poster_path : 'https://via.placeholder.com/300'}" class="cluster-top object-cover bg-dark">
            ${saga.parts[1] ? `<img src="${IMG + saga.parts[1].poster_path}" class="cluster-mid object-cover bg-dark">` : ''}
            ${saga.parts[2] ? `<img src="${IMG + saga.parts[2].poster_path}" class="cluster-back object-cover bg-dark">` : ''}
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
            parts: s.parts.sort((a, b) => (a.year || 0) - (b.year || 0)).map(p => ({ poster_path: p.poster })),
            progress: progress, status: status, finished: finished, total: total
        };
    });

    // Format Custom Sagas
    const customSagasList = typeof customSagas !== 'undefined' ? customSagas : [];
    const customFormatted = customSagasList.map(cs => {
        const total = cs.parts.length;
        const watchedCount = cs.parts.filter(p => {
            const match = state.db.find(d => String(d.id) === String(p.id));
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
            let existing = state.db.find(i => String(i.id) === String(part.id));
            if (!existing) {
                state.db.push({
                    id: part.id, title: part.title, poster: part.poster_path, type: 'movie',
                    status: 'Plan to Watch', ep: 0, max_ep: 1, score: 0, crown: 0, imdb: part.vote_average,
                    year: (part.release_date || '').split('-')[0], genres: part.genre_ids || [],
                    added: Date.now(), sagaId: cId, sagaName: cName, updatedAt: Date.now()
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
updateStatus = function () {
    originalUpdateStatusWithGlow();

    if (state.active && state.active.belongs_to_collection) {
        const cId = state.active.belongs_to_collection.id;
        const cName = state.active.belongs_to_collection.name;
        const sagaNavBtn = document.querySelector('button[onclick="setView(\'sagamatrix\')"]');

        if (sagaNavBtn) sagaNavBtn.classList.add('saga-glow-active');

        const localItem = state.db.find(i => String(i.id) === String(state.active.id));
        if (localItem) {
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
    await loadModalFragment("sagaModal");
    const modal = document.getElementById('sagaModal');
    if (modal) {
        modal.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof checkScrollLock === 'function') checkScrollLock();

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
                    id: p.id, media_type: p.media_type || 'movie', title: p.title || p.name,
                    poster_path: p.poster_path, release_date: p.release_date || p.first_air_date || '2000-01-01', size: p.size || 'main',
                    vote_average: p.vote_average || p.imdb || 0 // <-- This saves the rating
                })),
                isCustom: true
            };
            showNotification("TMDB Blueprint converted for editing.");
        }

        const saga = currentSagaViewContext;

        modal.innerHTML = `
            <div class="relative min-h-screen pb-32 bg-dark p-4 md:p-12 lg:p-24 animate-in zoom-in-95 duration-300">
               <button onclick="closeSagaModal()" class="saga-close-btn rounded-full flex items-center justify-center shadow-2xl">
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
                                        <img src="${p.poster_path ? IMG + p.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 md:w-10 md:h-14 object-cover rounded-md shadow-lg shrink-0">
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
        modal.scrollTop = 0; // Scroll to top of the saga modal container
        renderInlineSagaList();
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

    const parts = saga.isCustom
        ? saga.parts
        : saga.parts.sort((a, b) => new Date(a.release_date || a.first_air_date) - new Date(b.release_date || b.first_air_date));

    // Fallback logic for TMDB's "overview" vs Custom Forge's "description"
    const displayDesc = saga.description || saga.overview;

    modal.innerHTML = `
        <div class="relative min-h-screen pb-32 animate-in fade-in duration-300">
           <button onclick="closeSagaModal()" class="saga-close-btn rounded-full flex items-center justify-center shadow-2xl">
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
        const localData = state.db.find(i => String(i.id) === String(p.id));
        const isFinished = localData && localData.status === 'Finished';
        const statusIcon = isFinished ? '<i class="fas fa-check text-[#22c55e]"></i>' : (localData ? '<i class="fas fa-eye text-pulse"></i>' : '');
        const borderHighlight = localData ? (isFinished ? 'border-[#22c55e]/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-pulse/50 shadow-[0_0_15px_rgba(255,45,85,0.1)]') : 'border-white/5';

        // FIX: Extract personal score safely
        const personalScore = localData && localData.score ? localData.score : 0;

        return `
                    <div class="saga-movie-card relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 overflow-hidden" style="max-height: 500px; opacity:1;">
                        <div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dark ${localData ? (isFinished ? 'bg-[#22c55e]' : 'bg-pulse') : 'bg-gray-800'} text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ml-1 md:ml-0">
                            <span class="text-[9px] md:text-[10px] font-black">${statusIcon || (index + 1)}</span>
                        </div>
                        
                        <div class="w-[calc(100%-3rem)] md:w-[calc(50%-3rem)] p-3 md:p-4 rounded-2xl md:rounded-3xl border ${borderHighlight} bg-[#0a0c12]/80 backdrop-blur-md hover:border-pulse transition-all flex gap-3 md:gap-4 cursor-pointer shadow-xl" onclick="document.getElementById('sagaModal').classList.add('hidden'); openModal(${p.id}, '${p.media_type || 'movie'}')">
                            <div class="w-16 h-24 md:w-24 md:h-32 shrink-0 rounded-xl overflow-hidden border border-white/5">
                                <img src="${IMG + (p.poster_path || '')}" class="w-full h-full object-cover bg-dark">
                            </div>
                            <div class="flex flex-col justify-center flex-1">
                                <h4 class="text-[11px] md:text-sm font-black uppercase italic text-white line-clamp-2">${p.title || p.name}</h4>
                                <div class="text-[8px] md:text-[9px] text-gray-500 font-bold tracking-widest mt-2 flex flex-col md:flex-row md:items-center justify-between w-full gap-2 md:gap-0">
                                    <div class="flex items-center gap-3">
                                        <span class="bg-white/5 px-2 py-1 rounded text-white">${(p.release_date || p.first_air_date || '').split('-')[0] || 'N/A'}</span>
                                        <span class="text-pulse">IMDb: ★ ${p.vote_average ? p.vote_average.toFixed(1) : 'N/A'}</span>
                                        ${personalScore > 0 ? `<span class="text-yellow-500">My Score: ★ ${personalScore}/5</span>` : ''}
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
        let localItem = state.db.find(i => String(i.id) === String(part.id));
        if (localItem) {
            localItem.sagaId = sId;
            localItem.sagaName = title;
        } else {
            state.db.push({
                id: part.id, title: part.title || part.name, poster: part.poster_path || part.poster,
                type: part.media_type || 'movie', status: 'Plan to Watch',
                ep: 0, max_ep: 1, score: 0, crown: 0, imdb: 0,
                year: (part.release_date || '').split('-')[0], genres: [], added: Date.now(),
                sagaId: sId, sagaName: title, updatedAt: Date.now()
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
            let item = state.db.find(i => String(i.id) === String(part.id));
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
                    sagaId: sagaId, sagaName: "Custom Universe", updatedAt: Date.now()
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
function closeSagaModal() {
    document.getElementById('sagaModal').classList.add('hidden');
    checkScrollLock();
    if (state.view === 'sagamatrix') {
        setSagaTab(currentSagaTab);
    }
}
function closeAdvancedIO() {
    document.getElementById('advancedIOModal').classList.add('hidden');
    checkScrollLock();
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
    const item = state.db.find(i => String(i.id) === String(state.active.id));

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
        if (btn) {
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
            <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-pulse/50 transition-all cursor-pointer group w-full min-w-0" 
                draggable="true" 
                ondragstart="forgeSearchDragStart(event, ${i.id}, '${i.media_type}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}', '${(i.release_date || i.first_air_date || '').split('-')[0]}')"
                onclick="addToForge(${i.id}, '${i.media_type}', '${(i.title || i.name).replace(/'/g, "\\'")}', '${i.poster_path}', '${(i.release_date || i.first_air_date || '').split('-')[0]}')">
                <div class="flex items-center gap-3 min-w-0 w-[85%]">
                    <img src="${i.poster_path ? IMG + i.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 object-cover rounded-md pointer-events-none shrink-0">
                    <div class="pointer-events-none truncate flex-1 min-w-0">
                        <div class="text-[10px] font-black uppercase text-white truncate group-hover:text-pulse">${i.title || i.name}</div>
                        <div class="text-[8px] font-bold text-gray-500 tracking-widest mt-1">${i.media_type} • ${(i.release_date || i.first_air_date || '').split('-')[0]}</div>
                    </div>
                </div>
                <i class="fas fa-plus text-gray-500 group-hover:text-pulse pointer-events-none shrink-0 ml-2"></i>
            </div>
        `).join('');
    }, 400);
}
function forgeSearchDragStart(e, id, type, title, poster, year) {
    e.dataTransfer.setData('application/json', JSON.stringify({ id, type, title, poster, year }));
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
    } catch (err) { }

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
                <img src="${item.poster ? IMG + item.poster : 'https://via.placeholder.com/50'}" class="w-12 h-16 rounded object-cover shadow-lg">
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
                <img src="${i.poster_path ? IMG + i.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 rounded object-cover shadow">
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
                <img src="${p.poster_path ? IMG + p.poster_path : 'https://via.placeholder.com/50'}" class="w-8 h-12 md:w-10 md:h-14 object-cover rounded-md shadow-lg shrink-0">
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
        release_date: item.release_date || item.first_air_date || '2000-01-01',
        vote_average: item.vote_average || 0 // <-- This saves it for newly injected items
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
        while (customSagas.some(s => s.name === finalTitle)) {
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
            media_type: item.type, release_date: item.year + '-01-01', size: item.size,
            vote_average: item.vote_average || 0 // <-- Carries it into localStorage
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
        let existing = state.db.find(i => String(i.id) === String(part.id));
        if (existing) {
            existing.sagaId = sagaId;
            existing.sagaName = title;
        } else {
            state.db.push({
                id: part.id, title: part.title, poster: part.poster,
                type: part.type === 'tv' ? 'tv' : 'movie', status: 'Plan to Watch',
                ep: 0, max_ep: 1, score: 0, crown: 0, imdb: 0,
                year: part.year, genres: [], added: Date.now(),
                sagaId: sagaId, sagaName: title, updatedAt: Date.now()
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
function getContinueWatchingHTML() {
    const dbWatching = state.db.filter(item => item.status === 'Watching');
    const historyRaw = JSON.parse(localStorage.getItem('sumi_history') || '[]');

    let mergedMap = new Map();

    // 1. Load History (Untracked Temporary Items)
    historyRaw.forEach(h => {
        mergedMap.set(String(h.id), {
            id: h.id, title: h.title, poster: h.poster_path || h.poster,
            type: h.type, tmdb_type: h.type, season: h.last_season || 1, ep: h.last_episode || 1,
            max_ep: 0, updatedAt: h.watched_at || 0, isUntracked: true
        });
    });

    // 2. Load DB (Tracked Official Items - overwrites history if duplicates exist)
    dbWatching.forEach(item => {
        mergedMap.set(String(item.id), {
            ...item, updatedAt: item.updatedAt || item.added || 0, isUntracked: false
        });
    });

    const watchingList = Array.from(mergedMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    if (watchingList.length === 0) return '';

    let html = `
    <div class="mb-12 mt-6">
        <div class="flex justify-between items-center mb-4 pr-2">
            <h2 class="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white border-l-4 border-pulse pl-3 flex items-center gap-2">
                <i class="fas fa-play-circle text-pulse"></i> Continue Watching
            </h2>
            <button onclick="clearAllContinueWatching()" class="text-[9px] text-gray-500 hover:text-pulse uppercase font-black tracking-widest flex items-center gap-2 transition-colors">
                <i class="fas fa-trash-alt"></i> Clear All
            </button>
        </div>
        <div class="flex gap-4 overflow-x-auto hide-scroll pb-4 px-1">
    `;

    const tvTypes = ['tv', 'series', 'anime', 'kdrama', 'turkish', 'asian'];

    watchingList.forEach(item => {
        const type = item.tmdb_type || 'movie';
        const isTV = tvTypes.includes(item.type?.toLowerCase()) || type === 'tv';
        let statusText = 'WATCHING';
        let progressBar = '';

        if (isTV) {
            const ep = item.ep || 1;
            const maxEp = item.max_ep || 0;
            if (!item.isUntracked && maxEp > 0) {
                const progressPercent = Math.min((ep / maxEp) * 100, 100);
                statusText = `S${item.season || 1} • ${ep}/${maxEp} EPS`;
                progressBar = `
                    <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                        <div class="h-full bg-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.8)]" style="width: ${progressPercent}%"></div>
                    </div>`;
            } else {
                statusText = `S${item.season || 1} • EP ${ep}`; // Untracked display
            }
        } else if (!item.isUntracked) {
            progressBar = `<div class="absolute bottom-0 left-0 right-0 h-1.5 bg-pulse shadow-[0_0_10px_rgba(255,45,85,0.8)]"></div>`;
        }

        const safeTitle = (item.title || '').replace(/'/g, "\\'");

        // Add URL Slug logic directly to the card
        const cleanTitle = (item.title || 'watch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const typeChar = type === 'movie' ? 'm' : 't';
        let cleanSlug = `${cleanTitle}-${typeChar}${item.id}`;
        if (isTV) cleanSlug += `-s${item.season || 1}e${item.ep || 1}`;

        html += `
        <div class="relative w-28 sm:w-32 shrink-0 group cursor-pointer" title="Click to resume ${item.title}">
            <button onclick="event.stopPropagation(); event.preventDefault(); window.removeContinueWatching(${item.id})" class="absolute top-2 right-2 w-7 h-7 bg-black/80 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-pulse hover:border-pulse z-50 transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                <i class="fas fa-times text-[10px]"></i>
            </button>

            <div onclick="window.location.href='pages/player.html?v=${cleanSlug}'" class="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-pulse shadow-lg transition-all bg-dark relative">
                ${item.isUntracked ? '<div class="absolute top-2 left-2 bg-dark/80 backdrop-blur-md px-2 py-1 rounded text-[7px] font-black uppercase text-gray-400 z-30 border border-white/10"><i class="fas fa-history"></i> History</div>' : ''}
                <img src="${IMG}${item.poster}" class="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity">
                
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div class="w-12 h-12 rounded-full bg-pulse/90 flex items-center justify-center text-white shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <i class="fas fa-play ml-1"></i>
                    </div>
                </div>

                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                    <div class="text-[10px] font-black uppercase text-white line-clamp-1 drop-shadow-md">${item.title}</div>
                    <div class="text-[8px] font-bold tracking-widest text-pulse uppercase mt-1">${statusText}</div>
                </div>
                ${progressBar}
            </div>
        </div>
        `;
    });
    html += `</div></div>`;
    return html;
}

// Update the Remove logic to handle both DB and History items
window.removeContinueWatching = function (id) {
    // 1. Remove from DB
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const idx = db.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
        db[idx].status = 'Plan to Watch';
        if (db[idx].type === 'movie') db[idx].timestamp = 0;
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        state.db = db;
    }

    // 2. Remove from History
    let history = JSON.parse(localStorage.getItem('sumi_history') || '[]');
    history = history.filter(i => String(i.id) !== String(id));
    localStorage.setItem('sumi_history', JSON.stringify(history));

    renderContinueWatching();
    if (state.view === 'mylist') renderList();
};


function formatTimestampProgress(seconds) {
    if (!seconds || isNaN(seconds)) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderContinueWatching() {
    const wrapper = document.getElementById('homeContinueWatchingWrapper');
    if (wrapper) {
        const html = getContinueWatchingHTML();
        wrapper.innerHTML = html;
        wrapper.classList.toggle('hidden', !html);
    }
}
// --- AUTO-MARK ENGINE FOR CONTINUE WATCHING ---
// --- AUTO-MARK ENGINE ---
async function autoMarkWatching(id, type, season = 1, episode = 1) {
    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    const existing = db.find(i => String(i.id) === String(id));

    if (existing) {
        // ONLY update items that the user has explicitly added to their database
        if (existing.status !== 'Finished' && existing.status !== 'Ongoing') {
            existing.status = 'Watching';
            existing.updatedAt = Date.now();
        }
        if (type === 'tv') {
            if (!existing.ep || existing.ep === 0) {
                existing.season = season || 1;
                existing.ep = (episode > 0) ? (episode - 1) : 0;
            }
        }
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        state.db = db;
    }

    // BUG FIX: Removed the `else { db.push(...) }` block. Untracked items will now only go to sumi_history!
    if (typeof renderContinueWatching === 'function') renderContinueWatching();
}
init();





// --- BUILT-IN NEURAL PLAYER ENGINE ---

const EMBED_SERVERS = [
    {
        id: 'vidsrccc',
        name: 'VidSrc CC',
        build: (t, id, s, e) => `https://vidsrc.cc/v2/embed/${t}/${id}${t === 'tv' ? `/${s}/${e}` : ''}`
    },
    {
        id: 'autoembed',
        name: 'AutoEmbed',
        build: (t, id, s, e) => `https://autoembed.co/${t}/tmdb/${id}${t === 'tv' ? `-${s}-${e}` : ''}`
    },
    {
        id: 'multiembed',
        name: 'MultiEmbed',
        build: (t, id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${t === 'tv' ? `&s=${s}&e=${e}` : ''}`
    },
    {
        id: 'vidsrcme',
        name: 'VidSrc ME',
        build: (t, id, s, e) => `https://vidsrc.me/embed/${t}?tmdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`
    },
    {
        id: 'streamsb',
        name: 'StreamSB',
        build: (t, id, s, e) => `https://streamsb.net/embed/${t}?id=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`
    },
    {
        id: 'viking',
        name: 'VikingEmbed',
        build: (t, id, s, e) => `https://vembed.stream/embed?imdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`
    },
    {
        id: 'smashy',
        name: 'Smashy Stream',
        build: (t, id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}${t === 'tv' ? `&season=${s}&episode=${e}` : ''}`
    }
];

let playerState = {
    tmdbId: null, tmdbType: null, title: '',
    season: 1, episode: 1, serverIdx: 0,
    activeItemData: null // Stores TMDB API data passed from the modal
};

// --- WATCH OPTIONS MODAL LOGIC ---
async function openWatchOptions(id, type, title) {
    await loadModalFragment("watchOptionsModal");
    const modal = document.getElementById('watchOptionsModal');
    if (!modal.dataset.clickBound) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) closeWatchOptions();
        });
        modal.dataset.clickBound = "1";
    }
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
        window.location.href = `pages/player.html?id=${id}&type=${type}&title=${safeTitle}`;
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
    if (!modal.dataset.clickBound) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) closeWatchOptions();
        });
        modal.dataset.clickBound = "1";
    }
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        checkScrollLock();
    }, 300);
}



function launchInternalPlayer(id, tmdbType, title, sameTab = true) {
    document.getElementById('watchModal').classList.add('hidden');

    const isContextActive = state.active && String(state.active.id) === String(id);
    const epSlider = document.getElementById('mEpRange');
    const dbItem = state.db.find(i => String(i.id) === String(id));

    let explicitSeason = null;
    let explicitEp = null;

    if (tmdbType === 'tv') {
        if (isContextActive && epSlider && dbItem && parseInt(epSlider.value) !== (dbItem.ep || 0)) {
            // User adjusted slider manually. Calculate relative season/ep.
            let targetAbsolute = parseInt(epSlider.value);
            if (targetAbsolute < 1) targetAbsolute = 1;

            const seasons = state.active.seasons.filter(s => s.season_number > 0);
            let acc = 0;
            for (let s of seasons) {
                if (targetAbsolute <= acc + s.episode_count) {
                    explicitSeason = s.season_number;
                    explicitEp = targetAbsolute - acc;
                    break;
                }
                acc += s.episode_count;
            }

            // Sync database immediately
            dbItem.ep = targetAbsolute;
            dbItem.season = explicitSeason;
            dbItem.status = 'Watching';
            save();
        } else if (dbItem) {
            // User clicked Quick Play. Ensure it's marked as watching.
            if (dbItem.status !== 'Finished' && dbItem.status !== 'Ongoing') {
                dbItem.status = 'Watching';
                save();
            }
        } else {
            // Completely new show clicked via Quick Watch.
            autoMarkWatching(id, tmdbType);
        }
    } else {
        autoMarkWatching(id, tmdbType);
    }

    // Safely generate the URL slug AFTER all variables are processed
    const cleanTitle = (title || 'watch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const typeChar = tmdbType === 'movie' ? 'm' : 't';
    let cleanSlug = `${cleanTitle}-${typeChar}${id}`;

    // ONLY append specific season/episode if the user manually adjusted the slider right now.
    // Otherwise, player.js will intelligently fetch the exact saved episode from localStorage!
    if (tmdbType === 'tv' && explicitSeason !== null && explicitEp !== null) {
        cleanSlug += `-s${explicitSeason}e${explicitEp}`;
    }

    const playerUrl = `pages/player.html?v=${cleanSlug}`;

    if (typeof showNotification === 'function') {
        showNotification(`<i class="fas fa-spinner fa-spin mr-2"></i> Initializing Neural Stream...`, false);
    }

    setTimeout(() => { window.location.href = playerUrl; }, 800);
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

    const idx = state.db.findIndex(i => String(i.id) === String(playerState.tmdbId));
    if (idx !== -1) {
        state.db[idx].ep = absoluteEp;
        state.db[idx].status = 'Watching'; // Auto-mark as watching
        state.db[idx].updatedAt = Date.now();
        save();
    }
}

function closePlayerAndReturn() {
    document.getElementById('neuralIframe').src = ""; // Stop video playback
    navigate('home'); // Or navigate('mylist') if you want. Home is safest.
}

function closeFactoryResetModal() {
    document.getElementById('factoryResetModal').classList.add('hidden');
    checkScrollLock();
}


// --- TEMPORAL ARCHIVE (VERSION CONTROL) ENGINE ---
const TemporalEngine = {
    maxCommits: 15, // Keeps the last 15 states to save storage space

    getHistory: () => JSON.parse(localStorage.getItem('cp_temporal_archive')) || [],
    saveHistory: (h) => localStorage.setItem('cp_temporal_archive', JSON.stringify(h)),

    // Creates a snapshot of the current state
    commit: (message = "Manual Commit") => {
        const history = TemporalEngine.getHistory();
        const snapshot = {
            id: 'commit_' + Date.now(),
            timestamp: Date.now(),
            message: message,
            itemCount: state.db.length,
            data: JSON.parse(JSON.stringify(state.db)) // Deep copy to prevent reference mutation
        };

        history.unshift(snapshot); // Add to the top of the timeline
        if (history.length > TemporalEngine.maxCommits) history.pop(); // Trim oldest

        TemporalEngine.saveHistory(history);

        // Only show notification if it's a manual commit
        if (message === "Manual Commit") showNotification(`Timeline Committed: ${message}`);

        // Live-update UI if the modal is open
        const modal = document.getElementById('temporalArchiveModal');
        if (modal && !modal.classList.contains('hidden')) renderTemporalArchive();
    },

    // Reverts the database to a specific snapshot
    revert: (commitId) => {
        const history = TemporalEngine.getHistory();
        const target = history.find(c => c.id === commitId);

        if (!target) return showNotification("Temporal coordinates lost.", true);

        // 1. Safety Net: Auto-commit the present state before reverting so the user can "Redo"
        const backupMsg = `Pre-Revert Backup (from ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

        const currentSnapshot = {
            id: 'commit_' + Date.now(),
            timestamp: Date.now(),
            message: backupMsg,
            itemCount: state.db.length,
            data: JSON.parse(JSON.stringify(state.db))
        };
        history.unshift(currentSnapshot);
        if (history.length > TemporalEngine.maxCommits) history.pop();
        TemporalEngine.saveHistory(history);

        // 2. Apply the old state
        state.db = JSON.parse(JSON.stringify(target.data));
        save(true); // Save to local storage silently

        showNotification(`Timeline shifted to: ${target.message}`);
        closeTemporalArchive();

        // 3. Force UI refresh
        if (state.view === 'mylist') renderList();
        if (state.view === 'rhythmlab') runLab();
        if (state.view === 'masterpieces') renderMasterpieces();
        if (state.view === 'sagamatrix') renderMySagas();
        updateCounters();
    }
};

// UI Triggers
window.openTemporalArchive = function () {
    renderTemporalArchive();
    document.getElementById('temporalArchiveModal').classList.remove('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();
}

window.closeTemporalArchive = function () {
    document.getElementById('temporalArchiveModal').classList.add('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();
}

window.renderTemporalArchive = function () {
    const container = document.getElementById('temporalTimeline');
    const history = TemporalEngine.getHistory();

    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 opacity-50">
                <i class="fas fa-history text-4xl mb-4 text-gray-600 block"></i>
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">No timeline data recorded.</p>
            </div>`;
        return;
    }

    container.innerHTML = history.map((commit, index) => {
        const date = new Date(commit.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // The newest commit gets a special glowing node
        const isLatest = index === 0;
        const nodeClass = isLatest ? "bg-pulse shadow-[0_0_15px_rgba(255,45,85,0.8)] animate-pulse" : "bg-gray-600";
        const borderClass = isLatest ? "border-pulse/50 shadow-lg shadow-pulse/10" : "border-white/5";

        return `
        <div class="relative pl-8 md:pl-10 pb-8 group">
            ${index !== history.length - 1 ? `<div class="absolute left-[11px] md:left-[15px] top-8 bottom-0 w-0.5 bg-white/10 group-hover:bg-pulse/30 transition-colors"></div>` : ''}
            
            <div class="absolute left-1 md:left-2 top-2 w-5 h-5 rounded-full border-4 border-[#0a0c12] ${nodeClass} z-10 transition-colors group-hover:bg-pulse"></div>

            <div class="bg-white/5 border ${borderClass} rounded-2xl p-4 md:p-5 hover:bg-white/10 transition-all cursor-default">
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h4 class="text-sm font-black uppercase text-white tracking-widest">${commit.message}</h4>
                            ${isLatest ? `<span class="bg-pulse/20 text-pulse px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">Latest</span>` : ''}
                        </div>
                        <div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            <i class="fas fa-clock mr-1 text-gray-600"></i> ${dateStr} • ${timeStr} 
                            <span class="mx-2 text-white/20">|</span> 
                            <i class="fas fa-database mr-1 text-gray-600"></i> ${commit.itemCount} Records
                        </div>
                    </div>
                    
                    <button onclick="TemporalEngine.revert('${commit.id}')" class="w-full md:w-auto px-6 py-3 bg-dark border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-pulse hover:border-pulse transition-all flex items-center justify-center gap-2 group/btn">
                        <i class="fas fa-history group-hover/btn:-rotate-180 transition-transform duration-500"></i> Revert Here
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}
// ============================================================
// --- PAGE INFO MODAL SYSTEM ---
// ============================================================
const PAGE_INFO_DATA = {
    search: { icon: 'fa-search', color: '#ff2d55', title: 'Discover & Search', desc: 'Your gateway to the entire cinematic universe. Search millions of titles or browse curated trending content.', features: ['<b>Type Filters</b> — Instantly switch between Movies, Series, Anime, K-Drama, Turkish & Asian.', '<b>Search + Filter</b> — Type a query then use type pills to narrow results to a specific category.', '<b>Genre Pills</b> — Click Genres to expand genre pills for deep filtering.', '<b>Year & Region</b> — Use the dropdowns to filter by release year or country of origin.', '<b>Layout Toggle</b> — Switch between grid densities or list view in the top-right controls.', '<b>Load More</b> — Scroll to the bottom and hit Load More to fetch additional results.'] },
    mylist: { icon: 'fa-layer-group', color: '#3b82f6', title: 'My Library', desc: 'Your personal neural database. Every title you track lives here with full status, score, and episode tracking.', features: ['<b>Status Tracking</b> — Mark titles as Watching, Plan to Watch, Ongoing, or Finished.', '<b>Star Ratings</b> — Score each title 0–5 stars. Crowned titles appear in Masterpieces.', '<b>Import / Export</b> — Back up or migrate your library using the Import/Export tools.', '<b>Timeline</b> — Use Version Control to view and revert to past library snapshots.', '<b>Multi-Select</b> — Long-press or click Select to batch-edit or delete entries.', '<b>Random Picker</b> — Let the neural engine pick what to watch next.'] },
    upcoming: { icon: 'fa-calendar-alt', color: '#a855f7', title: 'Coming Soon', desc: 'Track unreleased movies and shows. Get notified when episodes drop and monitor active season schedules.', features: ['<b>Personal Tracking</b> — Add any title to your Tracker to monitor its release date.', '<b>Airing Now</b> — Actively airing shows you track show the next episode countdown.', '<b>Release Calendar</b> — View your entire tracking timeline in a dedicated calendar view.', '<b>Highly Anticipated</b> — Discover the most buzzed-about upcoming releases.'] },
    sagamatrix: { icon: 'fa-cubes', color: '#ff2d55', title: 'Saga Matrix', desc: 'Map cinematic universes, trilogies, and multi-part sagas. Forge custom universes with your own watch order.', features: ['<b>Discover Sagas</b> — Browse pre-built cinematic universes with recommended watch orders.', '<b>My Sagas</b> — View custom universes you have forged.', '<b>Universe Forge</b> — Build your own saga by searching and arranging any titles in order.', '<b>Drag & Drop</b> — Re-order entries inside the canvas to set your timeline.', '<b>Mainline vs Spin-off</b> — Scale entries to indicate their importance in the saga.'] },
    masterpieces: { icon: 'fa-crown', color: '#eab308', title: 'Masterpieces', desc: 'Your hall of fame. Perfect scores and crowned titles curated from your library.', features: ['<b>Crowned</b> — Titles you manually marked with the crown icon from their detail card.', '<b>Perfect 5/5s</b> — Every title you rated a full 5 stars.', '<b>Rankings</b> — A sorted leaderboard of your entire library by your personal score.', '<b>Add a Masterpiece</b> — Open any title detail and use the Crown button to add it here.'] },
    rhythmlab: { icon: 'fa-layer-group', color: '#ff2d55', title: 'Collection', desc: 'A high-density view of your entire library organized with advanced filtering and sorting.', features: ['<b>Type & Genre Filters</b> — Drill into specific categories using the type and genre pills.', '<b>Advanced Filters</b> — Access status, year, IMDb score, and personal score filters.', '<b>Local Search</b> — Instantly search your collection by title.', '<b>Grid / List View</b> — Toggle between compact grid and expanded list view.', '<b>Back to Top / Bottom</b> — Floating buttons appear when scrolled for quick navigation.'] },
    sync: { icon: 'fa-magic', color: '#22c55e', title: 'For You', desc: 'AI-powered neural recommendations based on what you have watched and tracked in your library.', features: ['<b>Smart Matching</b> — Recommendations are generated from your library genres and patterns.', '<b>Resync</b> — Hit Resync to regenerate fresh recommendations.', '<b>Safe Mode</b> — Toggle Safe Mode to filter adult content from recommendations.', '<b>Direct Add</b> — Add recommended titles to your library directly from this view.'] },
    sources: { icon: 'fa-satellite-dish', color: '#ff2d55', title: 'Sources', desc: 'Browse all available streaming source engines that CinePulse uses to serve content in the Player.', features: ['<b>Source Cards</b> — Each card shows source capabilities (Movies, TV, Anime, etc.).', '<b>Test Link</b> — Open any source in a new tab to verify it is operational.', '<b>Player Integration</b> — Sources map directly to the Source Engine buttons in the Player.', '<b>Sandbox Mode</b> — Use the Sandbox Toggle in the Player if a source shows a blank screen.'] },
    neurallink: { icon: 'fa-microchip', color: '#3b82f6', title: 'Neural Link', desc: 'Peer-to-peer library synchronization. Share your entire database between devices in real-time with no cloud needed.', features: ['<b>Primary Hub</b> — Generate a Sync Key on your main device to broadcast your library.', '<b>Secondary Node</b> — Join a hub via QR scan or by pasting the Host Key.', '<b>Payload Filters</b> — Choose which types to share before syncing.', '<b>Network Topology</b> — View all connected devices and their status.', '<b>Merge Strategy</b> — Choose to merge incoming data or replace your local library.'] }
};

window.openPageInfo = function (type) {
    const data = PAGE_INFO_DATA[type];
    if (!data) return;

    const overlay = document.getElementById('pageInfoOverlay');

    // Update Header Icons
    const iconContainer = document.getElementById('pageInfoIcon');
    const miniIcon = document.getElementById('mobilePageInfoMiniIcon');
    const iconHtml = `<i class="fas ${data.icon} text-3xl md:text-5xl" style="color:${data.color}"></i>`;

    if (iconContainer) iconContainer.innerHTML = iconHtml;
    if (miniIcon) {
        miniIcon.innerHTML = `<i class="fas ${data.icon}"></i>`;
        miniIcon.style.color = data.color;
        miniIcon.style.backgroundColor = `${data.color}15`;
    }

    const titleEl = document.getElementById('pageInfoTitle');
    titleEl.innerText = data.title;
    titleEl.style.color = data.color;

    document.getElementById('pageInfoDesc').innerText = data.desc;

    // Redesigned List Items: Removed fixed widths to prevent horizontal scroll
    document.getElementById('pageInfoList').innerHTML = data.features.map(f => {
        const [label, text] = f.split(' — ');
        return `
            <li class="flex items-start gap-4 p-5 md:p-8 bg-white/5 border border-white/5 rounded-[25px] md:rounded-[35px] group/info hover:bg-white/10 transition-all w-full">
                <div class="w-2 h-2 rounded-full mt-2 shrink-0 shadow-[0_0_10px_currentColor]" style="background-color:${data.color}; color:${data.color}"></div>
                <div class="min-w-0 flex-1">
                    <span class="block text-[12px] md:text-[15px] text-white font-black uppercase tracking-tight mb-1">${label}</span>
                    <p class="text-[11px] md:text-[13px] text-gray-400 font-medium leading-relaxed">${text || ''}</p>
                </div>
            </li>
        `;
    }).join('');

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Sync sidebar links into the info modal sidebar with full labels
    var sourceNav = document.getElementById('sidebarNav');
    var targetNav = document.getElementById('pageInfoSidebarNav');
    if (sourceNav && targetNav) {

        // Map current nav to full labeled buttons
        // Map current nav to full labeled buttons safely handling both FontAwesome (i) and SVGs
        targetNav.innerHTML = Array.from(sourceNav.querySelectorAll('button')).map(btn => {
            const iEl = btn.querySelector('i');
            const svgEl = btn.querySelector('svg');

            // Safely grab the icon depending on its type
            const iconHtml = iEl
                ? `<i class="${iEl.className} text-lg w-6"></i>`
                : (svgEl ? `<div class="w-6 flex justify-center">${svgEl.outerHTML}</div>` : '');

            const spanEl = btn.querySelector('span');
            const label = spanEl ? spanEl.innerText : 'Menu';
            const onclickAttr = btn.getAttribute('onclick') || '';

            // Preserve the functionality for non-route buttons (More Tools, Calendar)
            if (onclickAttr.includes('toggleAppHub') || onclickAttr.includes('openCalendar')) {
                return `
                    <button onclick="${onclickAttr}; closePageInfo()" class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-pulse/10 transition-all">
                        ${iconHtml}
                        <span class="text-[10px] font-black uppercase tracking-widest">${label}</span>
                    </button>
                `;
            }

            // Extract standard page navigation routes
            const routeMatch = onclickAttr.match(/navigate\('([^']+)'\)/);
            const route = routeMatch ? routeMatch[1] : 'home';
            return `
                <button data-route="${route}" class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-pulse/10 transition-all">
                    ${iconHtml}
                    <span class="text-[10px] font-black uppercase tracking-widest">${label}</span>
                </button>
            `;
        }).join('');
        // bind nav buttons from the cloned list to correct behavior
        bindSidebarNavButtons(targetNav, closePageInfo);
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    var card = document.getElementById('pageInfoCard');
    if (card) card.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    hidePageInfoSidebar(true);
};

function bindSidebarNavButtons(navEl, closeCallback) {
    if (!navEl) return;
    navEl.querySelectorAll('button').forEach(function (btn) {
        var route = btn.dataset.route;
        if (!route) {
            var onclick = btn.getAttribute('onclick') || '';
            var m = onclick.match(/navigate\('([^']+)'\)/);
            if (m && m[1]) route = m[1];
        }
        if (route) {
            btn.dataset.route = route;
            btn.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                navigate(route);
                if (typeof closeCallback === 'function') closeCallback();
            };
        }
    });
}

window.initNavRouting = function () {
    bindSidebarNavButtons(document.getElementById('sidebarNav'));
    bindSidebarNavButtons(document.getElementById('pageInfoSidebarNav'), closePageInfo);
    bindSidebarNavButtons(document.getElementById('modalSidebarNav'), closeModal);
};

window.closePageInfo = function () {
    var overlay = document.getElementById('pageInfoOverlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.body.style.overflow = 'auto';
    hidePageInfoSidebar(true);
};

window.togglePageInfoSidebar = function () {
    var sidebar = document.getElementById('pageInfoSidebar');
    if (!sidebar) return;

    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.dataset.userOpen = 'false';
        hidePageInfoSidebar(true);
    } else {
        sidebar.dataset.userOpen = 'true';
        showPageInfoSidebar({ userTriggered: true });
    }
};

window.onPageInfoSidebarHover = function (isHover) {
    var sidebar = document.getElementById('pageInfoSidebar');
    if (!sidebar) return;
    if (isHover) {
        showPageInfoSidebar();
    } else {
        hidePageInfoSidebar(true);
    }
};

window.showPageInfoSidebar = function (options) {
    var sidebar = document.getElementById('pageInfoSidebar');
    var inner = document.getElementById('pageInfoSidebarInner');
    var backdrop = document.getElementById('pageInfoSidebarBackdrop');
    var toggleIcon = document.querySelector('#pageInfoSidebarToggle i');
    var card = document.getElementById('pageInfoCard');
    if (!sidebar || !inner) return;

    sidebar.classList.add('open');
    if (options && options.userTriggered) {
        sidebar.dataset.userOpen = 'true';
    }

    if (window.innerWidth <= 1024) {
        if (backdrop) backdrop.classList.add('active');
    }

    if (card) {
        card.style.transition = 'transform 0.25s ease';
        card.style.transform = 'translateX(230px)';
    }

    inner.classList.add('visible');
    inner.style.opacity = '1';
    inner.style.pointerEvents = 'auto';

    if (toggleIcon) toggleIcon.className = 'fas fa-chevron-left';
};

window.hidePageInfoSidebar = function (force) {
    var sidebar = document.getElementById('pageInfoSidebar');
    var inner = document.getElementById('pageInfoSidebarInner');
    var backdrop = document.getElementById('pageInfoSidebarBackdrop');
    var toggleIcon = document.querySelector('#pageInfoSidebarToggle i');
    var card = document.getElementById('pageInfoCard');
    if (!sidebar || !inner) return;

    sidebar.classList.remove('open');
    sidebar.dataset.userOpen = 'false';

    if (window.innerWidth <= 1024) {
        if (backdrop) backdrop.classList.remove('active');
    }

    if (card) {
        card.style.transform = 'translateX(0)';
    }

    delete sidebar.dataset.hoverActive;
    inner.classList.remove('visible');
    inner.style.opacity = '0';
    inner.style.pointerEvents = 'none';
    if (toggleIcon) toggleIcon.className = 'fas fa-chevron-right';
};

window.toggleModalSidebar = function () {
    var sidebar = document.getElementById('modalSidebar');
    var inner = document.getElementById('modalSidebarInner');
    if (!sidebar || !inner) return;

    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.dataset.userOpen = 'false';
        hideModalSidebar(true);
    } else {
        sidebar.dataset.userOpen = 'true';
        showModalSidebar({ userTriggered: true });
    }
};

window.showModalSidebar = function (options) {
    var sidebar = document.getElementById('modalSidebar');
    var inner = document.getElementById('modalSidebarInner');
    var backdrop = document.getElementById('modalSidebarBackdrop');
    var modal = document.getElementById('modal');
    if (!sidebar || !inner) return;

    sidebar.classList.add('open');
    if (options && options.userTriggered) {
        sidebar.dataset.userOpen = 'true';
    }

    if (window.innerWidth <= 1024) {
        sidebar.style.width = '80vw';
        sidebar.style.transform = 'translateX(0)';
        if (backdrop) backdrop.classList.add('active');
    } else {
        sidebar.style.width = '220px';
        sidebar.style.transform = 'translateX(0)';
        if (modal) {
            modal.style.transition = 'padding-left 0.25s ease';
            modal.style.paddingLeft = '220px';
            modal.classList.add('with-sidebar');
        }
    }
    inner.style.opacity = '1';
    inner.style.pointerEvents = 'auto';

    // Add this to animate to an 'X'
    var toggleIcon = document.querySelector('#modalSidebarToggle i');
    if (toggleIcon) toggleIcon.className = 'fas fa-times rotate-90 transition-transform duration-300';
};

window.hideModalSidebar = function (force) {
    var sidebar = document.getElementById('modalSidebar');
    var inner = document.getElementById('modalSidebarInner');
    var backdrop = document.getElementById('modalSidebarBackdrop');
    var modal = document.getElementById('modal');
    if (!sidebar || !inner) return;

    if (!force && sidebar.dataset.userOpen === 'true') {
        return; // keep open when user chose it explicitly
    }

    sidebar.classList.remove('open');
    sidebar.dataset.userOpen = 'false';

    if (window.innerWidth <= 1024) {
        sidebar.style.width = '0';
        sidebar.style.transform = 'translateX(-100%)';
        if (backdrop) backdrop.classList.remove('active');
    } else {
        sidebar.style.width = '0';
        sidebar.style.transform = 'translateX(-100%)';
        if (modal) {
            modal.style.paddingLeft = '0';
            modal.classList.remove('with-sidebar');
        }
    }

    inner.style.opacity = '0';
    inner.style.pointerEvents = 'none';

    // Add this to animate back to the 'Stream' icon
    var toggleIcon = document.querySelector('#modalSidebarToggle i');
    if (toggleIcon) toggleIcon.className = 'fas fa-stream rotate-0 transition-transform duration-300';
};


window.scrollToTop = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
window.scrollToBottom = function () { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); };

// Setup Global Scroll Interaction Observer
(function () {
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isVisible = !entry.isIntersecting;
            const opacity = isVisible ? '1' : '0';
            const pointerEvents = isVisible ? 'auto' : 'none';

            ['pcBackToTop', 'pcBackToBot', 'mobileBackToTop', 'mobileBackToBot'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = opacity;
                    el.style.pointerEvents = pointerEvents;
                }
            });
        });
    }, { threshold: 0 });

    const anchor = document.getElementById('topScrollAnchor');
    if (anchor) scrollObserver.observe(anchor);

    // Horizontal Scroll Hints Initiation
    setTimeout(initScrollHints, 2000);
})();

function initScrollHints() {
    const scrollables = document.querySelectorAll('.overflow-x-auto');
    const seenHints = new Set();

    const hintObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (seenHints.has(el)) return;

                // Only show if actually scrollable
                if (el.scrollWidth > el.clientWidth) {
                    showSwipeHint(el);
                    seenHints.add(el);
                }
            }
        });
    }, { threshold: 0.2 });

    scrollables.forEach(s => hintObserver.observe(s));
}

function showSwipeHint(container) {
    const hint = document.createElement('div');
    hint.className = 'scroll-hint-container animate-in fade-in duration-500';
    hint.innerHTML = `
        <i class="fas fa-hand-pointer text-pulse text-lg scroll-hint-icon"></i>
        <span class="text-[9px] font-black uppercase text-white tracking-widest">Swipe for more</span>
    `;

    // Ensure container is relative for absolute positioning of hint
    const originalPosition = window.getComputedStyle(container).position;
    if (originalPosition === 'static') container.style.position = 'relative';

    container.appendChild(hint);

    setTimeout(() => {
        hint.classList.replace('fade-in', 'fade-out');
        setTimeout(() => hint.remove(), 1000);
    }, 4000);
}

// --- NEW: Install Reminder Logic ---
function dismissInstallReminder(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Hide only the floating card (sidebar version removed per request)
    const floatCard = document.getElementById('installReminderCard');
    if (floatCard) floatCard.classList.add('hidden');

    // Set snooze for 3 days (in milliseconds)
    const snoozeUntil = Date.now() + (3 * 24 * 60 * 60 * 1000);
    localStorage.setItem('cp_install_dismissed_until', snoozeUntil);
}

function checkInstallSnooze() {
    const snoozeUntil = localStorage.getItem('cp_install_dismissed_until');
    const floatCard = document.getElementById('installReminderCard');

    if (snoozeUntil && Date.now() < parseInt(snoozeUntil)) {
        if (floatCard) floatCard.classList.add('hidden');
    } else {
        // Only show floating card on mobile viewports if not PWA already
        if (window.innerWidth < 1024 && floatCard && !window.matchMedia('(display-mode: standalone)').matches) {
            floatCard.classList.remove('hidden');
        }
    }
}
window.initSmartScrollButtons = function () {
    document.querySelectorAll('.hide-scroll').forEach(scrollArea => {
        const parent = scrollArea.parentElement;
        // Don't double-inject buttons
        if (!parent || parent.querySelector('.scroll-btn-smart.left')) return;

        parent.style.position = 'relative';

        // Detect if we are on the "For You" (Sync) Page
        const isSyncPage = parent.closest('#view-sync') !== null;
        const verticalPos = isSyncPage ? 'top-[35%]' : 'top-1/2';
        const extraStyles = isSyncPage ? 'border-pulse text-pulse bg-dark/95' : 'border-white/20 text-white bg-dark/80';

        // Base Tailwind Classes
        const baseBtnClass = `scroll-btn-smart absolute ${verticalPos} -translate-y-1/2 z-50 w-10 h-10 rounded-full shadow-2xl flex items-center justify-center hover:bg-pulse hover:border-pulse hover:text-white transition-all duration-300 opacity-0 pointer-events-none border ${extraStyles}`;

        // Create Left Button
        const btnLeft = document.createElement('button');
        btnLeft.className = `${baseBtnClass} left left-[-15px]`;
        btnLeft.innerHTML = '<i class="fas fa-chevron-left"></i>';
        btnLeft.onclick = () => scrollArea.scrollBy({ left: -(scrollArea.clientWidth * 0.7), behavior: 'smooth' });
        parent.appendChild(btnLeft);

        // Create Right Button
        const btnRight = document.createElement('button');
        btnRight.className = `${baseBtnClass} right right-[-15px]`;
        btnRight.innerHTML = '<i class="fas fa-chevron-right"></i>';
        btnRight.onclick = () => scrollArea.scrollBy({ left: (scrollArea.clientWidth * 0.7), behavior: 'smooth' });
        parent.appendChild(btnRight);

        // Intelligence Logic
        const updateButtons = () => {
            const maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth;

            // Left Button visibility
            if (scrollArea.scrollLeft > 5) {
                btnLeft.classList.remove('opacity-0', 'pointer-events-none');
                btnLeft.classList.add('opacity-100', 'pointer-events-auto');
            } else {
                btnLeft.classList.add('opacity-0', 'pointer-events-none');
                btnLeft.classList.remove('opacity-100', 'pointer-events-auto');
            }

            // Right Button visibility (only show if scrollable)
            if (maxScroll > 10 && scrollArea.scrollLeft < maxScroll - 5) {
                btnRight.classList.remove('opacity-0', 'pointer-events-none');
                btnRight.classList.add('opacity-100', 'pointer-events-auto');
            } else {
                btnRight.classList.add('opacity-0', 'pointer-events-none');
                btnRight.classList.remove('opacity-100', 'pointer-events-auto');
            }
        };

        // Bind Listeners
        scrollArea.addEventListener('scroll', updateButtons);

        // ResizeObserver guarantees buttons appear immediately when data loads
        const observer = new ResizeObserver(() => updateButtons());
        observer.observe(scrollArea);

        // Initial check
        setTimeout(updateButtons, 300);
    });
};
window.clearAllContinueWatching = function () {
    // Remove existing if any to prevent duplicates
    const existing = document.getElementById('customConfirmModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 px-4';
    modal.innerHTML = `
        <div class="bg-[#0a0c12] border border-pulse/30 rounded-[30px] p-8 max-w-sm w-full shadow-[0_20px_60px_rgba(255,45,85,0.15)] text-center transform scale-95 animate-in zoom-in duration-300">
            <div class="w-16 h-16 mx-auto bg-pulse/10 rounded-full flex items-center justify-center mb-5 border border-pulse/30 text-pulse text-2xl">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h3 class="text-xl font-black uppercase italic text-white tracking-widest mb-2">Clear Records?</h3>
            <p class="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-8">This will wipe all items from your Continue Watching feed.</p>
            
            <div class="flex gap-3">
                <button onclick="document.getElementById('customConfirmModal').remove()" class="flex-1 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
                    Cancel
                </button>
                <button onclick="executeClearContinueWatching()" class="flex-1 py-3.5 bg-pulse text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pulse/20">
                    Purge
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.executeClearContinueWatching = function () {
    const modal = document.getElementById('customConfirmModal');
    if (modal) modal.remove();

    let db = JSON.parse(localStorage.getItem('cp_elite_db_v3')) || [];
    let clearedCount = 0;

    db.forEach(item => {
        if (item.status === 'Watching') {
            item.status = 'Plan to Watch';
            if (item.type === 'movie') item.timestamp = 0;
            clearedCount++;
        }
    });

    if (clearedCount > 0) {
        localStorage.setItem('cp_elite_db_v3', JSON.stringify(db));
        state.db = db;
        renderContinueWatching();
        if (state.view === 'mylist') renderList();
        showNotification(`${clearedCount} records wiped from Continue Watching.`);
    }
};


// ==========================================
// DEEP LINKING & MULTI-PLATFORM SHARING ENGINE
// ==========================================

// Internal Helper for Clipboard Fallback
function copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(successMessage);
    }).catch(err => {
        prompt("Copy this link to share:", text);
    });
}
// --- CUSTOM UI SHARE ENGINE ---
async function openCustomShare(title, desc, url, richText) {
    await loadModalFragment("customShareModal");
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

window.shareActiveItem = async function () {
    if (!state.active) return showNotification("No active item to share.", true);

    const id = state.active.id;
    const type = state.active.media_type || (state.active.title ? 'movie' : 'tv');
    const title = state.active.title || state.active.name;
    const year = (state.active.release_date || state.active.first_air_date || '').split('-')[0] || '';
    const rating = state.active.vote_average ? state.active.vote_average.toFixed(1) : 'N/A';

    // Safe synopsis grab (limit length for texts)
    let synopsis = state.active.overview || "Explore this cinematic archive.";
    if (synopsis.length > 150) synopsis = synopsis.substring(0, 147) + '...';

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?share=${type}-${id}`;

    // Rich Text format for WhatsApp/iMessage
    const richText = `🎬 *${title}* (${year})\n⭐ IMDb: ${rating}/10\n\n📖 ${synopsis}\n\nWatch securely on CinePulse ⬇️\n${shareUrl}`;

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
            await navigator.share({ title: `CinePulse: ${title}`, text: richText });
        } catch (err) { openCustomShare(`Share ${title}`, "Transmit Entity Data", shareUrl, richText); }
    } else {
        openCustomShare(`Share ${title}`, "Transmit Entity Data", shareUrl, richText);
    }
};



window.shareWatchlist = async function () {
    if (!state.db || state.db.length === 0) {
        return showNotification("Library is empty.", true);
    }

    // Compression mechanism (still long for massive DBs, but much better)
    const compressedList = state.db.map(item => `${item.type === 'movie' ? 'm' : 't'}${item.id}`).join('-');
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?list=${compressedList}`;

    const richText = `🧠 *My CinePulse Neural Database*\nI'm tracking ${state.db.length} entities in my cinematic library.\n\nMerge timelines with me here ⬇️\n${shareUrl}`;

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
            await navigator.share({ title: 'My CinePulse Library', text: richText });
        } catch (err) { openCustomShare("Share Library", `Total Records: ${state.db.length}`, shareUrl, richText); }
    } else {
        openCustomShare("Share Library", `Total Records: ${state.db.length}`, shareUrl, richText);
    }
};
window.toggleAppHub = async function () {
    await loadModalFragment("appHubModal");
    const modal = document.getElementById('appHubModal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.firstElementChild.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        modal.firstElementChild.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}// --- NEW TOP 10 RATED ENGINE ---
function renderTop10(items) {
    const container = document.getElementById('row-top10');
    if (!container) return;

    container.innerHTML = items.map((item, idx) => {
        // High Def posters for Top 10
        const posterUrl = item.poster_path ? IMG_HD + item.poster_path : 'https://via.placeholder.com/500x750';

        return `
        <div class="flex-none w-[210px] md:w-[260px] lg:w-[300px] group cursor-pointer relative top10-card overflow-visible" onclick="openModal(${item.id}, '${item.media_type || 'movie'}')">
            
            <div class="absolute -left-7 bottom-4 background-card-number-top10 z-0 select-none leading-none">
                ${idx + 1}
            </div>

            <div class="relative aspect-[2/3] rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/10 shadow-2xl z-10 group-hover:border-pulse transition-all duration-500 bg-dark ml-8">
                <img src="${posterUrl}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                
                <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent opacity-80 z-20 pointer-events-none"></div>

                <div class="absolute top-0 left-0 bg-gradient-to-br from-pulse to-transparent p-4 w-16 h-16 z-30 opacity-90">
                    <span class="text-white font-black text-lg drop-shadow-md">#${idx + 1}</span>
                </div>
                
                ${getPlayHoverHTML({ ...item, type: item.media_type || 'movie' })}
            </div>
            
            <div class="relative z-10 mt-5 px-2">
                <h3 class="font-black text-[12px] md:text-[14px] uppercase line-clamp-1 text-white glow-hover transition-all tracking-wide">${item.title || item.name}</h3>
                <div class="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                    <span class="text-pulse bg-pulse/10 px-2 py-0.5 rounded"><i class="fas fa-star text-[8px]"></i> ${item.vote_average.toFixed(1)}</span>
                    <span class="opacity-50">•</span>
                    <span>${(item.release_date || item.first_air_date || '').split('-')[0] || 'TBA'}</span>
                </div>
            </div>
        </div>
        `}).join('');
}
// ==========================================
// --- NEURAL SECTION LAYOUT & TIME ENGINE ---
// ==========================================
window.homeDataStore = {}; // Caches section data for instant layout flipping
function initializeSmartHomeSections() {
    if (!prefs.homeLayouts) prefs.homeLayouts = {};
    const sections = document.querySelectorAll('#view-home section');

    sections.forEach(sec => {
        const h2 = sec.querySelector('h2');
        const container = sec.querySelector('div[id^="row-"]');
        if (!h2 || !container || sec.classList.contains('smart-initialized')) return;
        sec.classList.add('smart-initialized');

        const containerId = container.id;
        const onClickAttr = h2.getAttribute('onclick') || '';
        const typeMatch = onClickAttr.match(/'([^']+)',\s*'([^']+)'/);
        const apiMode = typeMatch ? typeMatch[1] : 'trending';
        const apiType = typeMatch ? typeMatch[2] : 'movie';

        const headerWrapper = document.createElement('div');
        headerWrapper.className = 'flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-white/5 pb-3 gap-4 transition-all';

        sec.insertBefore(headerWrapper, container);
        h2.classList.remove('mb-6');
        headerWrapper.appendChild(h2);

        const controls = document.createElement('div');
        controls.className = 'flex items-center gap-2 self-end md:self-auto';

        const isGrid = prefs.homeLayouts[containerId] === 'matrix';
        const iconClass = isGrid ? 'fa-list text-pulse' : 'fa-layer-group text-gray-400';

        controls.innerHTML = `
            <button onclick="toggleHomeLayout('${containerId}', '${apiMode}', '${apiType}')" class="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-white hover:border-pulse hover:bg-pulse/20 transition-all shadow-xl group">
                <i id="icon-${containerId}" class="fas ${iconClass} group-hover:scale-110 transition-transform"></i>
            </button>
        `;
        headerWrapper.appendChild(controls);
    });
}

// Triggers the Matrix Layout switch
window.toggleHomeLayout = async function (containerId, apiMode, apiType) {
    const container = document.getElementById(containerId);
    const icon = document.getElementById('icon-' + containerId);

    if (!prefs.homeLayouts) prefs.homeLayouts = {};
    const isCurrentlyMatrix = prefs.homeLayouts[containerId] === 'matrix';
    const targetLayout = isCurrentlyMatrix ? 'row' : 'matrix';

    prefs.homeLayouts[containerId] = targetLayout;
    savePrefs();

    container.style.opacity = '0';
    container.style.transform = 'translateY(15px)';
    container.style.transition = 'all 0.4s ease';

    setTimeout(async () => {
        if (targetLayout === 'matrix') {
            icon.className = 'fas fa-list text-pulse drop-shadow-[0_0_8px_rgba(255,45,85,0.8)]';

            // BONUS: View Snapping
            const sectionHeader = container.previousElementSibling;
            if (sectionHeader) {
                const headerOffset = sectionHeader.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: headerOffset, behavior: 'smooth' });
            }

            await renderTimeMatrix(containerId, apiMode, apiType);
        } else {
            icon.className = 'fas fa-layer-group text-gray-400';
            // Restore standard row using cached data
            const dataCache = window.homeDataStore[containerId];
            if (dataCache) {
                container.className = 'flex gap-6 md:gap-8 overflow-x-auto hide-scroll pb-6 px-2';
                renderRow(containerId, dataCache.items, dataCache.type);
            }
        }
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 400);
}

// The core matrix builder
window.renderTimeMatrix = async function (containerId, apiMode, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="col-span-full py-20 page-loader"></div>';
    container.className = 'flex flex-col gap-12 pb-10 w-full group/matrix';

    const today = new Date().toISOString().split('T')[0];
    const isSpecialty = ['anime', 'kdrama', 'turkish', 'asian'].includes(type);
    const apiType = isSpecialty ? 'tv' : type;
    let paths = {};

    let filterString = '';
    // NOTE: without_genres=10749 excludes erotic/hentai content from anime results
    if (type === 'anime') filterString = '&with_genres=16&with_original_language=ja&without_genres=10749&include_adult=false';
    if (type === 'kdrama') filterString = '&with_original_language=ko';
    if (type === 'turkish') filterString = '&with_original_language=tr';
    if (type === 'asian') filterString = '&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16';

    let movieFilterString = '';
    if (type === 'anime') movieFilterString = '&with_genres=16&with_original_language=ja&without_genres=10749&include_adult=false';
    if (type === 'kdrama') movieFilterString = '&with_original_language=ko';
    if (type === 'turkish') movieFilterString = '&with_original_language=tr';
    if (type === 'asian') movieFilterString = '&with_origin_country=CN|TW|TH|PH|VN|JP';

    const d2 = new Date(); d2.setDate(d2.getDate() - 2); const ago2 = d2.toISOString().split('T')[0];
    const d7 = new Date(); d7.setDate(d7.getDate() - 7); const ago7 = d7.toISOString().split('T')[0];
    const d30 = new Date(); d30.setDate(d30.getDate() - 30); const ago30 = d30.toISOString().split('T')[0];
    const legendVote = isSpecialty ? 100 : 1500;

    if (apiMode === 'upcoming') {
        let nxtWk = new Date(); nxtWk.setDate(nxtWk.getDate() + 7);
        let nxtMo = new Date(); nxtMo.setMonth(nxtMo.getMonth() + 1);
        let nxtYr = new Date(); nxtYr.setFullYear(nxtYr.getFullYear() + 1);
        const dtv = 'first_air_date'; const dmv = 'primary_release_date';
        paths = {
            '🔥 Dropping This Week': {
                tvPath: `/discover/${apiType}?${dtv}.gte=${today}&${dtv}.lte=${nxtWk.toISOString().split('T')[0]}&sort_by=popularity.desc`,
                moviePath: isSpecialty ? `/discover/movie?${dmv}.gte=${today}&${dmv}.lte=${nxtWk.toISOString().split('T')[0]}&sort_by=popularity.desc` : null
            },
            '🌟 Coming Next Month': {
                tvPath: `/discover/${apiType}?${dtv}.gte=${nxtWk.toISOString().split('T')[0]}&${dtv}.lte=${nxtMo.toISOString().split('T')[0]}&sort_by=popularity.desc`,
                moviePath: isSpecialty ? `/discover/movie?${dmv}.gte=${nxtWk.toISOString().split('T')[0]}&${dmv}.lte=${nxtMo.toISOString().split('T')[0]}&sort_by=popularity.desc` : null
            },
            '📅 Highly Anticipated': {
                tvPath: `/discover/${apiType}?${dtv}.gte=${today}&${dtv}.lte=${nxtYr.toISOString().split('T')[0]}&sort_by=popularity.desc`,
                moviePath: isSpecialty ? `/discover/movie?${dmv}.gte=${today}&${dmv}.lte=${nxtYr.toISOString().split('T')[0]}&sort_by=popularity.desc` : null
            }
        };
    } else {
        paths = {
            '🔥 Daily Picks': {
                tvPath: isSpecialty
                    ? `/discover/${apiType}?sort_by=popularity.desc&first_air_date.gte=${ago2}`
                    : `/trending/${apiType}/day?`,
                moviePath: isSpecialty ? `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${ago2}` : null
            },
            '🌟 Weekly Top': {
                tvPath: isSpecialty
                    ? `/discover/${apiType}?sort_by=popularity.desc&first_air_date.gte=${ago7}`
                    : `/trending/${apiType}/week?`,
                moviePath: isSpecialty ? `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${ago7}` : null
            },
            '📆 Monthly Best': {
                tvPath: `/discover/${apiType}?sort_by=popularity.desc&first_air_date.gte=${ago30}`,
                moviePath: isSpecialty ? `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${ago30}` : null
            },
            '📅 2026 Hits': {
                tvPath: `/discover/${apiType}?primary_release_year=2026&sort_by=popularity.desc`,
                moviePath: isSpecialty ? `/discover/movie?primary_release_year=2026&sort_by=popularity.desc` : null
            },
            '🏆 All-Time Legends': {
                tvPath: `/discover/${apiType}?sort_by=vote_average.desc&vote_count.gte=${legendVote}`,
                moviePath: isSpecialty ? `/discover/movie?sort_by=vote_average.desc&vote_count.gte=${legendVote}` : null
            }
        };
    }

    if (!window.matrixPageState) window.matrixPageState = {};
    let matrixHTML = '';

    for (const [title, pathObj] of Object.entries(paths)) {
        try {
            const tvPath = pathObj.tvPath;
            const moviePath = pathObj.moviePath;
            const sep = tvPath.includes('?') ? '&' : '?';
            const qf = filterString.startsWith('&') ? filterString.substring(1) : filterString;
            const data = await fetchAPI(tvPath + sep + qf);
            const top10 = data.results.filter(i => i.poster_path).slice(0, 10);
            if (top10.length === 0) continue;

            const secKey = `${containerId}-${title.replace(/[^a-z0-9]/gi, '_')}`;
            window.matrixPageState[secKey] = {
                page: 1, tvPath, moviePath, filterString, movieFilterString,
                apiType, isSpecialty, currentTab: 'tv'
            };

            const movieTabHTML = isSpecialty && moviePath ? `
                <div class="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 shrink-0">
                    <button onclick="switchMatrixTab('${secKey}','tv')"
                        id="tab-tv-${secKey}"
                        class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-pulse text-white transition-all">
                        Shows
                    </button>
                    <button onclick="switchMatrixTab('${secKey}','movie')"
                        id="tab-movie-${secKey}"
                        class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">
                        Movies
                    </button>
                </div>
            ` : '';

            matrixHTML += `
                <div class="w-full animate-in fade-in slide-in-from-bottom-4 duration-700" id="sec-${secKey}">
                    <div class="flex flex-wrap items-center gap-3 mb-6">
                        <h4 class="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-white italic drop-shadow-[0_0_10px_rgba(255,45,85,0.3)]">${title}</h4>
                        <div class="h-px flex-1 bg-gradient-to-r from-pulse/50 to-transparent min-w-[20px]"></div>
                        ${movieTabHTML}
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-5 md:gap-8 px-2" id="grid-${secKey}">
                        ${top10.map((item, idx) => buildMatrixCard(item, idx, apiType)).join('')}
                    </div>
                    <div class="flex justify-center mt-8">
                        <button onclick="loadMoreMatrix('${secKey}')" id="loadmore-${secKey}"
                            class="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:border-pulse hover:text-white hover:bg-pulse/10 transition-all shadow-lg">
                            <i class="fas fa-plus-circle text-pulse"></i> Load More
                        </button>
                    </div>
                </div>
            `;
        } catch (e) { console.error("Matrix Tier Failed:", e); }
    }
    container.innerHTML = matrixHTML;
}

function buildMatrixCard(item, idx, apiType) {
    const type = item.media_type || apiType;
    const rankMeta = [
        { bg: 'from-[#FFD700] to-[#B8860B]', glow: 'shadow-[0_0_18px_rgba(255,215,0,0.7)]', text: 'text-[#1a1200]' },
        { bg: 'from-[#C0C0C0] to-[#707070]', glow: 'shadow-[0_0_14px_rgba(200,200,200,0.5)]', text: 'text-[#1a1a1a]' },
        { bg: 'from-[#CD7F32] to-[#8B4513]', glow: 'shadow-[0_0_14px_rgba(205,127,50,0.5)]', text: 'text-white' },
    ];
    const rm = idx < 3 ? rankMeta[idx] : { bg: 'from-pulse to-[#7928ca]', glow: 'shadow-[0_0_12px_rgba(255,45,85,0.4)]', text: 'text-white' };
    return `
        <div class="matrix-card flex-none group cursor-pointer relative overflow-visible transition-all duration-500 ease-out" onclick="openModal(${item.id}, '${type}')">
            <div class="holo-wrapper relative aspect-[2/3] rounded-[24px] z-10 mb-4">
                <div class="absolute inset-0 rounded-[24px] bg-dark overflow-hidden shadow-2xl border border-white/10 group-hover:border-pulse/40 transition-all duration-500 z-20">
                    <img src="${IMG + item.poster_path}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent z-20 pointer-events-none"></div>
                    ${getPlayHoverHTML({ ...item, type })}
                    <div class="absolute top-0 left-0 z-30">
                        <div class="relative w-12 h-12 overflow-hidden rounded-br-[16px] rounded-tl-[22px]">
                            <div class="absolute inset-0 bg-gradient-to-br ${rm.bg} ${rm.glow}"></div>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-[13px] font-black ${rm.text} leading-none drop-shadow-md">${idx + 1}</span>
                            </div>
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 z-30 p-3 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div class="text-[8px] font-black text-white/70 uppercase tracking-widest">★ ${item.vote_average.toFixed(1)} • ${(item.release_date || item.first_air_date || '').split('-')[0] || 'TBA'}</div>
                    </div>
                </div>
            </div>
            <div class="relative z-10 px-1">
                <h3 class="font-black text-[11px] md:text-xs uppercase line-clamp-1 text-white group-hover:text-pulse transition-colors drop-shadow-md">${item.title || item.name}</h3>
            </div>
        </div>
    `;
}

window.loadMoreMatrix = async function (secKey) {
    const ps = window.matrixPageState?.[secKey];
    if (!ps) return;
    const btn = document.getElementById(`loadmore-${secKey}`);
    const grid = document.getElementById(`grid-${secKey}`);
    if (!btn || !grid) return;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-pulse"></i> Loading...';
    btn.disabled = true;

    try {
        ps.page += 1;
        const isMovie = ps.currentTab === 'movie';
        const basePath = isMovie ? ps.moviePath : ps.tvPath;
        const filter = isMovie ? ps.movieFilterString : ps.filterString;
        const apiType = isMovie ? 'movie' : ps.apiType;
        const sep = basePath.includes('?') ? '&' : '?';
        const qf = filter.startsWith('&') ? filter.substring(1) : filter;
        const data = await fetchAPI(`${basePath}${sep}${qf}&page=${ps.page}`);
        const newItems = data.results.filter(i => i.poster_path).slice(0, 10);
        const currentCount = grid.querySelectorAll('.matrix-card').length;
        newItems.forEach((item, idx) => {
            grid.insertAdjacentHTML('beforeend', buildMatrixCard(item, currentCount + idx, apiType));
        });
        if (ps.page >= (data.total_pages || 1)) {
            btn.remove();
        } else {
            btn.innerHTML = '<i class="fas fa-plus-circle text-pulse"></i> Load More';
            btn.disabled = false;
        }
    } catch (e) {
        btn.innerHTML = '<i class="fas fa-plus-circle text-pulse"></i> Load More';
        btn.disabled = false;
    }
}

window.switchMatrixTab = async function (secKey, tab) {
    const ps = window.matrixPageState?.[secKey];
    if (!ps) return;
    const grid = document.getElementById(`grid-${secKey}`);
    if (!grid) return;
    ps.currentTab = tab;
    ps.page = 1;

    const tvBtn = document.getElementById(`tab-tv-${secKey}`);
    const movieBtn = document.getElementById(`tab-movie-${secKey}`);
    if (tab === 'movie') {
        tvBtn?.classList.remove('bg-pulse', 'text-white');
        tvBtn?.classList.add('text-gray-400');
        movieBtn?.classList.add('bg-pulse', 'text-white');
        movieBtn?.classList.remove('text-gray-400');
    } else {
        movieBtn?.classList.remove('bg-pulse', 'text-white');
        movieBtn?.classList.add('text-gray-400');
        tvBtn?.classList.add('bg-pulse', 'text-white');
        tvBtn?.classList.remove('text-gray-400');
    }

    grid.style.opacity = '0.3';
    grid.innerHTML = '<div class="col-span-full py-10 page-loader"></div>';

    try {
        const isMovie = tab === 'movie';
        const basePath = isMovie ? ps.moviePath : ps.tvPath;
        const filter = isMovie ? ps.movieFilterString : ps.filterString;
        const apiType = isMovie ? 'movie' : ps.apiType;
        const sep = basePath.includes('?') ? '&' : '?';
        const qf = filter.startsWith('&') ? filter.substring(1) : filter;
        const data = await fetchAPI(`${basePath}${sep}${qf}`);
        const top10 = data.results.filter(i => i.poster_path).slice(0, 10);
        grid.innerHTML = top10.map((item, idx) => buildMatrixCard(item, idx, apiType)).join('');
        const loadMoreBtn = document.getElementById(`loadmore-${secKey}`);
        if (loadMoreBtn) { loadMoreBtn.innerHTML = '<i class="fas fa-plus-circle text-pulse"></i> Load More'; loadMoreBtn.disabled = false; }
    } catch (e) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-pulse text-xs font-black uppercase">Failed to load</div>';
    }
    grid.style.opacity = '1';
}

// Smart API Time Filter Engine
window.applyTimeFilter = async function (containerId, mode, type, timeFrame, btnElement) {
    const bar = btnElement.parentElement;
    bar.querySelectorAll('button').forEach(b => {
        b.className = "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors shrink-0";
    });
    btnElement.className = "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-pulse text-white shadow-[0_0_10px_rgba(255,45,85,0.4)] shrink-0 transition-all";

    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="col-span-full py-16 page-loader"></div>';

    let path = '';
    const today = new Date().toISOString().split('T')[0];
    const apiType = (type === 'anime' || type === 'kdrama' || type === 'turkish' || type === 'asian') ? 'tv' : type;

    if (mode === 'upcoming') {
        let future = new Date();
        if (timeFrame === 'day') future.setDate(future.getDate() + 2);
        if (timeFrame === 'week') future.setDate(future.getDate() + 7);
        if (timeFrame === 'year') future.setFullYear(future.getFullYear() + 1);
        if (timeFrame === 'all') future.setFullYear(future.getFullYear() + 5);
        let fDate = future.toISOString().split('T')[0];
        if (apiType === 'movie') path = `/discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${fDate}&sort_by=popularity.desc`;
        else path = `/discover/tv?first_air_date.gte=${today}&first_air_date.lte=${fDate}&sort_by=popularity.desc`;
    } else {
        if (timeFrame === 'day') path = `/trending/${apiType}/day`;
        if (timeFrame === 'week') path = `/trending/${apiType}/week`;
        if (timeFrame === 'year') path = `/discover/${apiType}?primary_release_year=${new Date().getFullYear()}&sort_by=popularity.desc`;
        if (timeFrame === 'all') path = `/discover/${apiType}?sort_by=vote_average.desc&vote_count.gte=1500`;
    }

    if (type === 'anime') path += '&with_genres=16&with_original_language=ja';
    if (type === 'kdrama') path += '&with_original_language=ko';
    if (type === 'turkish') path += '&with_original_language=tr';
    if (type === 'asian') path += '&with_origin_country=CN|TW|TH|PH|VN|JP&without_genres=16';

    try {
        const data = await fetchAPI(path);
        window.homeDataStore[containerId] = { items: data.results, type: apiType };
        renderGrid(containerId, data.results.slice(0, 18), apiType, true);
    } catch (e) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-pulse font-black text-[10px] uppercase">Filter Link Severed</div>';
    }
}

