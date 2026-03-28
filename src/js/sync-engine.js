/**
 * CINEPULSE NEURAL LINK - P2P SYNC ENGINE (ELITE V4.2)
 * Smart Topology, Quick Connect, Cast Fixes, & UI Boosts
 */

// --- 1. SMART DEVICE DETECTION ---
function getDevicePlatform() {
    const ua = navigator.userAgent;
    let os = 'UNK';
    if (/Windows/i.test(ua)) os = 'WIN';
    else if (/Mac OS X/i.test(ua)) os = 'MAC';
    else if (/Android/i.test(ua)) os = 'AND';
    else if (/Linux/i.test(ua)) os = 'LIN';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'IOS';

    let type = 'PC';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) type = 'TAB';
    else if (/Mobile|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i.test(ua)) type = 'MOB';

    return `${os}-${type}`;
}

const P2P_CONFIG = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    }
};

const NeuralSync = {
    peer: null,
    activeConns: {},
    role: 'standalone',
    deviceId: localStorage.getItem('cp_device_id') || `${getDevicePlatform()}-${Math.floor(Math.random() * 10000)}`,
    deviceName: localStorage.getItem('cp_device_name') || 'Local Node',
    deviceType: getDevicePlatform(),
    pendingDiffs: [],
    history: JSON.parse(localStorage.getItem('cp_network_history')) || []
};

// Migrate old history to new schema
NeuralSync.history = NeuralSync.history.map(h => {
    if (!h.deviceId) {
        const baseIdMatch = h.id.match(/^(.*?-\w+-\d+)/);
        h.deviceId = baseIdMatch ? baseIdMatch[1] : h.id;
        h.name = h.id;
        h.type = h.id.includes('MOB') ? 'MOB' : (h.id.includes('TAB') ? 'TAB' : 'PC');
    }
    return h;
});

window.editLocalNodeName = function() {
    const curr = NeuralSync.deviceName;
    const res = prompt("Enter a name for this device:", curr);
    if(res && res.trim().length > 0) {
        NeuralSync.deviceName = res.trim();
        localStorage.setItem('cp_device_name', NeuralSync.deviceName);
        renderTopology();
    }
}

window.editTopologyNodeName = function(dId) {
    const aliases = JSON.parse(localStorage.getItem('cp_network_aliases')) || {};
    const curr = aliases[dId] || dId;
    const res = prompt("Enter a custom alias for this device:", curr);
    if(res && res.trim().length > 0) {
        aliases[dId] = res.trim();
        localStorage.setItem('cp_network_aliases', JSON.stringify(aliases));
        // Update history immediately if it exists
        const histItem = NeuralSync.history.find(h => h.deviceId === dId);
        if (histItem) histItem.name = res.trim();
        localStorage.setItem('cp_network_history', JSON.stringify(NeuralSync.history));
        renderTopology();
    }
}


let reconnectInterval = null;
// --- TRUE AUTO-RECONNECT ENGINE ---
function startAutoReconnectLoop() {
    if (reconnectInterval) clearInterval(reconnectInterval);
    reconnectInterval = setInterval(() => {
        const savedRole = localStorage.getItem('cp_neural_role');
        const savedHostId = localStorage.getItem('cp_neural_host_id');

        if (savedRole === 'node' && savedHostId) {
            const conn = NeuralSync.activeConns[savedHostId];
            const peerDead = !NeuralSync.peer || NeuralSync.peer.disconnected || NeuralSync.peer.destroyed;
            const connDead = !conn || !conn.open;

            if (peerDead || connDead) {
                console.log("Neural Link severed. Auto-reconnecting to Hub...");
                joinNeuralNetwork(savedHostId, true);
            }
        }
    }, 8000);
}

localStorage.setItem('cp_device_id', NeuralSync.deviceId);

document.addEventListener('DOMContentLoaded', () => {
    renderTopology();
    renderQuickConnect();
});

// --- 2. QUICK CONNECT ENGINE ---
window.renderQuickConnect = function () {
    const savedHostId = localStorage.getItem('cp_neural_host_id');
    const savedRole = localStorage.getItem('cp_neural_role');
    const manualInput = document.getElementById('manualPeerId');

    if (manualInput && savedHostId && savedRole === 'node') {
        let qcBtn = document.getElementById('quickConnectBtn');
        if (!qcBtn) {
            const container = manualInput.parentElement.parentElement;
            qcBtn = document.createElement('button');
            qcBtn.id = 'quickConnectBtn';
            qcBtn.className = "w-full bg-pulse/10 border border-pulse/30 text-pulse py-4 mt-2 mb-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-pulse hover:text-white transition-all shadow-[0_10px_20px_rgba(255,45,85,0.2)] flex items-center justify-center gap-2";
            container.insertBefore(qcBtn, manualInput.parentElement);
        }
        qcBtn.innerHTML = `<i class="fas fa-bolt"></i> Quick Reconnect: ${savedHostId}`;
        qcBtn.onclick = () => joinNeuralNetwork(savedHostId);
        qcBtn.classList.remove('hidden');
    }
}

// ==========================================
// 1. HOST MODE (PRIMARY NODE)
// ==========================================
window.initNeuralHost = function (optionalPeerId = null) {
    if (typeof Peer === 'undefined') return showNotification("P2P Module failed to load.", true);
    NeuralSync.hostAttempt = (NeuralSync.hostAttempt || 0) + 1;
    if (NeuralSync.hostAttempt > 5) {
        return showNotification("Unable to establish host after several retries. Try a different name.", true);
    }

    const nameInput = document.getElementById('deviceNameInput');
    const customName = (nameInput && nameInput.value) ? nameInput.value : NeuralSync.deviceId;
    const hostStatus = document.getElementById('hostStatusText');
    const qrContainer = document.getElementById('qrContainer');

    if (hostStatus) {
        hostStatus.classList.remove('hidden');
        hostStatus.innerText = "Initializing Peer Network...";
    }

    try {
        const baseName = customName || NeuralSync.deviceId;
        const sanitizedId = baseName.replace(/[^a-zA-Z0-9\-_]/g, '-').slice(0, 20).toUpperCase();
        const peerId = (optionalPeerId || sanitizedId || `CP-HUB-${Math.floor(Math.random() * 100000)}`).toUpperCase();

        if (NeuralSync.peer) NeuralSync.peer.destroy();

        NeuralSync.peer = new Peer(peerId, P2P_CONFIG);

        NeuralSync.peer.on('open', (id) => {
            NeuralSync.role = 'host';
            localStorage.setItem('cp_neural_role', 'host');
            localStorage.setItem('cp_neural_host_id', id);
            if (qrContainer) qrContainer.classList.remove('hidden');

            const qrCanvas = document.getElementById('qrCanvas');
            if (qrCanvas && typeof QRCode !== 'undefined') {
                qrCanvas.innerHTML = '';
                new QRCode(qrCanvas, {
                    text: id, width: 200, height: 200,
                    colorDark: "#ff2d55",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
            NeuralSync.hostAttempt = 0;
            showNotification(`Neural Hub Opened: ${id}`);
            startHeartbeat();
            renderQuickConnect();
        });

        NeuralSync.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                const retryId = `${peerId}-${Math.floor(Math.random() * 100000)}`;
                showNotification(`ID taken. Retrying with ${retryId}`, true);
                setTimeout(() => initNeuralHost(retryId), 600);
                return;
            }
            showNotification(`Network Error: ${err.type}`, true);
        });

        NeuralSync.peer.on('connection', (conn) => {
            setupConnection(conn);
        });

    } catch (e) { console.error("Critical failure:", e); }
}

// ==========================================
// 2. CLIENT MODE (SECONDARY NODE)
// ==========================================
window.joinNeuralNetwork = function (targetId = null, isSilent = false) {
    const hostId = targetId || document.getElementById('manualPeerId')?.value.trim();
    if (!hostId) return !isSilent && showNotification("Please enter a Host Key.", true);
    if (typeof Peer === 'undefined') return !isSilent && showNotification("P2P Module blocked.", true);

    if (!isSilent) showNotification(`Establishing link to ${hostId}...`);

    if (NeuralSync.peer) NeuralSync.peer.destroy();

    // FIX: Use a Stable Client ID instead of randomizing on every reconnect
    let clientId = localStorage.getItem('cp_neural_client_id');
    if (!clientId) {
        clientId = `${NeuralSync.deviceId}-NODE`;
        localStorage.setItem('cp_neural_client_id', clientId);
    }

    NeuralSync.peer = new Peer(clientId, P2P_CONFIG);

    NeuralSync.peer.on('open', (id) => {
        NeuralSync.role = 'node';
        localStorage.setItem('cp_neural_role', 'node');
        localStorage.setItem('cp_neural_host_id', hostId);
        renderQuickConnect();
        const conn = NeuralSync.peer.connect(hostId);
        setupConnection(conn);
        startAutoReconnectLoop();
    });

    NeuralSync.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            const newClientId = `${NeuralSync.deviceId}-${Math.floor(Math.random() * 1000)}`;
            localStorage.setItem('cp_neural_client_id', newClientId);
            setTimeout(() => joinNeuralNetwork(hostId, isSilent), 500);
            return;
        }
        if (!isSilent) showNotification(`Connection Error: ${err.type}`, true);
    });
};

// ==========================================
// 3. QR SCANNER INTEGRATION
// ==========================================
let html5QrCode;
window.startQRScanner = async function () {
    if (typeof Html5Qrcode === 'undefined') return showNotification("Scanner library not loaded.", true);

    const modal = document.getElementById('qrScannerModal');
    modal.classList.remove('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();

    setTimeout(async () => {
        try {
            if (!html5QrCode) html5QrCode = new Html5Qrcode("qr-reader");

            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || !cameras.length) throw new Error("No camera devices found");

            let selectedCamera = cameras[0];
            const preferred = cameras.find(c => /back|rear|environment/i.test(c.label));
            if (preferred) selectedCamera = preferred;

            await html5QrCode.start(
                selectedCamera.id,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    closeQRScanner();
                    document.getElementById('manualPeerId').value = decodedText;
                    joinNeuralNetwork(decodedText);
                },
                (errorMessage) => {
                    // Silent continuous scan errors; keep user experience fast.
                }
            );

            showNotification("Quick scan activated. Point camera at Hub QR code.");

        } catch (err) {
            console.error(err);
            showNotification(err.message || "Unable to start scanner.", true);
            closeQRScanner();
        }
    }, 100);
};

window.closeQRScanner = async function () {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            await html5QrCode.clear();
        } catch (e) {
            console.log("QR cleanup error:", e);
        }
        html5QrCode = null;
    }
    document.getElementById('qrScannerModal').classList.add('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();
}

// ==========================================
// 4. TOPOLOGY (HISTORY & LIVE PRESENCE)
// ==========================================
function saveToHistory(peerId, explicitDeviceId, explicitName, explicitType) {
    let dId = explicitDeviceId || peerId;
    if (!explicitDeviceId) {
        const baseIdMatch = peerId.match(/^(.*?-\w+-\d+)/);
        if (baseIdMatch) dId = baseIdMatch[1];
    }
    
    const aliases = JSON.parse(localStorage.getItem('cp_network_aliases')) || {};
    const localAlias = aliases[dId];
    const dName = localAlias ? localAlias : (explicitName && explicitName !== 'Local Node' ? explicitName : dId);
    const dType = explicitType || (dId.includes('MOB') ? 'MOB' : (dId.includes('TAB') ? 'TAB' : 'PC'));

    NeuralSync.history = NeuralSync.history.filter(h => h.deviceId !== dId && h.id !== peerId);
    
    const isLive = NeuralSync.activeConns[peerId] !== undefined;
    
    NeuralSync.history.push({ 
        id: peerId, 
        deviceId: dId, 
        name: dName, 
        type: dType, 
        lastSeen: Date.now() 
    });

    localStorage.setItem('cp_network_history', JSON.stringify(NeuralSync.history));
    renderTopology();
}

function renderTopology() {
    const container = document.getElementById('topologyTree');
    if (!container) return;

    if (NeuralSync.history.length === 0) {
        container.innerHTML = '<div class="text-[10px] text-gray-500 uppercase tracking-widest font-black py-12 text-center w-full border border-dashed border-white/10 rounded-[30px]">Network Void. No external nodes detected.</div>';
        return;
    }

    const localIsMob = NeuralSync.deviceType.includes('MOB');
    const localIsTab = NeuralSync.deviceType.includes('TAB');
    const localIcon = localIsMob ? 'fa-mobile-alt' : (localIsTab ? 'fa-tablet-alt' : 'fa-desktop');

    let html = `
        <div class="relative z-20 bg-dark border-2 border-[#22c55e] rounded-[30px] p-6 md:p-8 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)] mb-12 w-full max-w-xs text-center group">
            <button onclick="editLocalNodeName()" class="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:bg-pulse hover:text-white transition-all md:opacity-0 md:group-hover:opacity-100 z-20">
                <i class="fas fa-pen text-[10px]"></i>
            </button>
            <i onclick="showLocalQR()" class="fas ${localIcon} text-[#22c55e] text-3xl md:text-4xl mb-3 cursor-pointer hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all"></i>
            <div class="text-[11px] font-black text-white uppercase tracking-widest">${NeuralSync.deviceName}</div>
            <div class="text-[7px] text-gray-500 uppercase mt-2 tracking-widest font-bold"><i class="fas fa-qrcode mr-1"></i> Tap icon for QR Code</div>
        </div>
        <div class="w-px h-12 bg-gradient-to-b from-[#22c55e] to-white/10 absolute top-[130px] md:top-[160px] z-10 hidden md:block"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 w-full relative pt-8 border-t border-white/10 md:border-white/20">
    `;

    // Grouping uniquely by deviceId so we don't display duplicates with the same name.
    const uniqueHistoryMap = new Map();
    NeuralSync.history.forEach(item => {
        // If we already have this device in map, check if this object's lastSeen is newer
        const existing = uniqueHistoryMap.get(item.deviceId);
        if (!existing || item.lastSeen > existing.lastSeen) {
            uniqueHistoryMap.set(item.deviceId, item);
        }
    });
    
    const uniqueHistory = Array.from(uniqueHistoryMap.values());

    html += uniqueHistory.sort((a, b) => b.lastSeen - a.lastSeen).map(node => {
        const isLive = NeuralSync.activeConns[node.id] !== undefined;
        const statusColor = isLive ? '#a855f7' : '#4b5563';
        const glowClass = isLive ? 'shadow-[0_0_30px_rgba(168,85,247,0.3)] border-[#a855f7]' : 'border-white/10';
        const dateStr = new Date(node.lastSeen).toLocaleDateString();
        const timeStr = new Date(node.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isMob = node.type && node.type.includes('MOB');
        const isTab = node.type && node.type.includes('TAB');
        const icon = isMob ? 'fa-mobile-alt' : (isTab ? 'fa-tablet-alt' : 'fa-desktop');

        return `
            <div class="relative flex flex-col items-center group">
                <div class="hidden md:block absolute -top-10 left-1/2 w-px h-10 bg-white/10"></div>
                <div class="bg-[#0a0c12] border ${glowClass} p-6 rounded-[30px] hover:border-[#a855f7]/50 transition-all w-full relative overflow-hidden group-hover:-translate-y-2 shadow-xl">
                    <button onclick="removeTopologyNode('${node.id}')" class="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:bg-pulse hover:text-white transition-all md:opacity-0 md:group-hover:opacity-100 z-20">
                        <i class="fas fa-times text-[10px]"></i>
                    </button>
                    <button onclick="editTopologyNodeName('${node.deviceId}')" class="absolute top-4 left-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#3b82f6] hover:text-white transition-all md:opacity-0 md:group-hover:opacity-100 z-20" title="Edit Alias">
                        <i class="fas fa-pen text-[10px]"></i>
                    </button>
                    <div class="w-14 h-14 rounded-full border-2 border-[${statusColor}] flex items-center justify-center mb-4 mx-auto bg-dark shadow-inner">
                        <i class="fas ${icon} ${isLive ? 'animate-pulse' : ''} text-[${statusColor}] text-lg"></i>
                    </div>
                    <div class="text-center">
                        <div class="text-[12px] font-black uppercase text-white truncate px-4">${node.name}</div>
                        <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-2 bg-white/5 py-1.5 rounded-lg border border-white/5">Sync: ${dateStr}</div>
                        ${isLive ? `<div class="text-[9px] text-[#a855f7] mt-3 uppercase font-black tracking-widest live-status" data-peer="${node.id}"><i class="fas fa-link mr-1"></i> Connected</div>` : ''}
                    </div>
                </div>
                <!-- Remove connect button entirely if already live, looks much cleaner -->
                ${!isLive ? `
                    <button onclick="joinNeuralNetwork('${node.id}')" class="mt-4 px-6 py-3 w-[80%] bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white hover:bg-[#4b5563] transition-all flex items-center justify-center gap-2 shadow-lg">
                        <i class="fas fa-bolt"></i> Reconnect
                    </button>
                ` : '<div class="mt-4 px-6 py-3 border border-transparent h-[40px]"></div>'}
            </div>
        `;
    }).join('');

    html += `</div>`;
    container.innerHTML = html;
}

window.removeTopologyNode = function (id) {
    const node = NeuralSync.history.find(n => n.id === id);
    if(node) NeuralSync.history = NeuralSync.history.filter(n => n.deviceId !== node.deviceId);
    else NeuralSync.history = NeuralSync.history.filter(n => n.id !== id);
    
    localStorage.setItem('cp_network_history', JSON.stringify(NeuralSync.history));
    renderTopology();
}

// ------------------------------------------
// UPGRADED: Modern Notification Purge
// ------------------------------------------
window.clearTopology = function () {
    document.getElementById('networkPurgeModal').classList.remove('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();
}

window.closeNetworkPurgeModal = function () {
    document.getElementById('networkPurgeModal').classList.add('hidden');
    if (typeof checkScrollLock === 'function') checkScrollLock();
}

window.executeNetworkPurge = function () {
    NeuralSync.history = [];
    localStorage.setItem('cp_network_history', JSON.stringify([]));
    localStorage.removeItem('cp_neural_role');
    localStorage.removeItem('cp_neural_host_id');
    renderTopology();
    closeNetworkPurgeModal();
    showNotification("Network Topology Purged.");
}
// ------------------------------------------

let heartbeatInterval;
function startHeartbeat() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
        const watching = state.db.find(i => i.status === 'Watching');
        const statusMsg = watching ? `Watching: ${watching.title}` : 'System Idle';

        Object.keys(NeuralSync.activeConns).forEach(peerId => {
            const conn = NeuralSync.activeConns[peerId];
            if (conn && conn.open) {
                conn.send({ 
                    type: 'HEARTBEAT', 
                    status: statusMsg,
                    deviceId: NeuralSync.deviceId,
                    deviceName: NeuralSync.deviceName,
                    deviceType: NeuralSync.deviceType
                });
            } else {
                delete NeuralSync.activeConns[peerId];
                renderTopology();
            }
        });
    }, 10000);
}

// ==========================================
// 5. CONNECTION HANDSHAKE & NEW P2P FEATURES
// ==========================================
function setupConnection(conn) {
    conn.on('open', () => {
        NeuralSync.activeConns[conn.peer] = conn;
        showNotification(`Link Established with ${conn.peer}`);
        saveToHistory(conn.peer);

        // Re-render modal to show the Network Actions if a modal is open
        const netActions = document.getElementById('mNetworkActions');
        if (netActions && !document.getElementById('modal').classList.contains('hidden')) {
            netActions.classList.remove('hidden');
            netActions.classList.add('flex');
        }

        if (NeuralSync.role === 'node') {
            conn.send({ 
                type: 'SYNC_REQUEST', 
                sender: NeuralSync.deviceId,
                deviceId: NeuralSync.deviceId,
                deviceName: NeuralSync.deviceName,
                deviceType: NeuralSync.deviceType
            });
        }
    });

    conn.on('data', (data) => {
        // --- BASE SYNC PAYLOADS ---
        if (data.type === 'SYNC_REQUEST') {
            if (data.deviceId) saveToHistory(conn.peer, data.deviceId, data.deviceName, data.deviceType);
            sendPayload(conn);
            conn.send({ 
                type: 'SYNC_REQUEST_REPLY', 
                sender: NeuralSync.deviceId,
                deviceId: NeuralSync.deviceId,
                deviceName: NeuralSync.deviceName,
                deviceType: NeuralSync.deviceType
            });
        }
        else if (data.type === 'SYNC_REQUEST_REPLY') {
            if (data.deviceId) saveToHistory(conn.peer, data.deviceId, data.deviceName, data.deviceType);
            sendPayload(conn);
        }
        else if (data.type === 'SYNC_PROPOSAL') {
            processIncomingData(data.payload, data.sender, conn);
        }
        else if (data.type === 'SYNC_ACKNOWLEDGED') {
            showNotification(`Remote Node (${data.sender}) committed changes.`);
        }
        else if (data.type === 'HEARTBEAT') {
            const el = document.querySelector(`.live-status[data-peer="${conn.peer}"]`);
            if (el) el.innerHTML = `<i class="fas fa-eye"></i> Remote: ${data.status}`;
            saveToHistory(conn.peer, data.deviceId, data.deviceName, data.deviceType);
        }
        // --- NEW P2P FEATURES ---
        else if (data.type === 'CAST_MEDIA') {
            showNotification(`Incoming Cast for ${data.title}. Opening player...`);
            if (typeof autoMarkWatching === 'function') autoMarkWatching(data.id, data.mediaType);
            setTimeout(() => {
                if (typeof launchInternalPlayer === 'function') {
                    // FIX: Pass true so it uses same-tab behavior
                    launchInternalPlayer(data.id, data.mediaType, data.title || '', true);
                    return;
                }
                // FIX: use same-tab navigation to avoid popup blocks
                window.location.href = `player.html?id=${data.id}&type=${data.mediaType}&title=${encodeURIComponent(data.title || '')}`;
            }, 600);
        }
        else if (data.type === 'PING_MEDIA') {
            if (typeof dispatchNotification === 'function') {
                dispatchNotification(data.item, 'PEER PING', `Node recommended: ${data.item.title || data.item.name}`);
            }
        }
        else if (data.type === 'MICRO_SYNC') {
            const incoming = data.item;
            const idx = state.db.findIndex(i => i.id === incoming.id);
            if (idx !== -1) {
                // Only merge if the incoming data is actually newer
                if ((incoming.updatedAt || 0) > (state.db[idx].updatedAt || 0)) {
                    state.db[idx] = incoming;
                    if (typeof save === 'function') save(true); // true = skip broadcasting to avoid loops
                }
            } else {
                state.db.push(incoming);
                if (typeof save === 'function') save(true);
            }

            // Live-update the UI if the user is looking at the same item!
            if (state.active && state.active.id === incoming.id && !document.getElementById('modal').classList.contains('hidden')) {
                document.getElementById('mStatus').value = incoming.status;
                if (typeof setStars === 'function') setStars(incoming.score || 0);
                if (typeof updateEpUI === 'function' && incoming.type !== 'movie') {
                    document.getElementById('mEpRange').value = incoming.ep || 0;
                    updateEpUI(incoming.ep || 0, incoming.max_ep);
                    if (typeof renderSeasonsUI === 'function') renderSeasonsUI();
                }
            }
        }
        else if (data.type === 'NODE_DISCONNECTING') {
            delete NeuralSync.activeConns[data.id];
            NeuralSync.history = NeuralSync.history.filter(h => h.id !== data.id);
            localStorage.setItem('cp_network_history', JSON.stringify(NeuralSync.history));
            renderTopology();
            showNotification("A device has left the network.");
        }
    });

    conn.on('close', () => {
        delete NeuralSync.activeConns[conn.peer];
        renderTopology();
        showNotification(`Link Severed: ${conn.peer}`, true);

        // Hide Network actions if no connections left
        if (Object.keys(NeuralSync.activeConns).length === 0) {
            const netActions = document.getElementById('mNetworkActions');
            if (netActions) {
                netActions.classList.add('hidden');
                netActions.classList.remove('flex');
            }
        }
    });
}

window.disconnectNeuralLink = function () {
    // 1. Notify peers, if this device was a node
    if (NeuralSync.role === 'node') {
        Object.values(NeuralSync.activeConns).forEach(conn => {
            if (conn && conn.open) {
                conn.send({ type: 'NODE_DISCONNECTING', id: NeuralSync.peer?.id || '' });
            }
        });
    }

    // 2. Destroy peer instance
    if (NeuralSync.peer) {
        NeuralSync.peer.destroy();
        NeuralSync.peer = null;
    }

    // 3. WIPE THE MEMORY and prevent auto reconnect
    localStorage.removeItem('cp_neural_role');
    localStorage.removeItem('cp_neural_host_id');
    localStorage.removeItem('cp_neural_client_id');
    localStorage.removeItem('cp_node_identity');

    // 4. Reset local state
    NeuralSync.role = 'standalone';
    NeuralSync.activeConns = {};

    showNotification("Neural Link Severed. Auto-connect disabled.");

    // 5. Refresh UI
    renderTopology();
    if (typeof renderQuickConnect === 'function') renderQuickConnect();
};

// ------------------------------------------
// NEW: Outbound P2P Actions
// ------------------------------------------
window.castToPeer = function () {
    if (!state.active) return;
    let sent = false;
    Object.values(NeuralSync.activeConns).forEach(conn => {
        if (conn && conn.open) {
            conn.send({
                type: 'CAST_MEDIA',
                id: state.active.id,
                mediaType: state.active.media_type || (state.active.title ? 'movie' : 'tv'),
                title: state.active.title || state.active.name
            });
            sent = true;
        }
    });
    if (sent) showNotification("Cast command transmitted to peer.");
};



window.pingPeer = function () {
    if (!state.active) return;
    let sent = false;

    // Construct a payload that perfectly matches your Notification UI requirements
    const pingItem = {
        id: state.active.id,
        title: state.active.title || state.active.name,
        poster: state.active.poster_path,
        type: state.active.media_type || (state.active.title ? 'movie' : 'tv')
    };

    Object.values(NeuralSync.activeConns).forEach(conn => {
        if (conn && conn.open) {
            conn.send({ type: 'PING_MEDIA', item: pingItem });
            sent = true;
        }
    });

    if (sent) showNotification("Ping transmitted. Peer notified.");
};

// ==========================================
// 6. DELTA RESOLUTION AND MANUAL MERGE INTERFACE
// ==========================================
function sendPayload(conn) {
    if (conn && conn.open) {
        let payload = state.db;
        const filterCheckboxes = document.querySelectorAll('.sync-filter:checked');
        if (document.querySelector('.sync-filter')) {
            const filters = Array.from(filterCheckboxes).map(cb => cb.value);
            if (filters.length < 6) payload = state.db.filter(i => filters.includes(i.type));
        }
        conn.send({ type: 'SYNC_PROPOSAL', sender: NeuralSync.deviceId, payload: payload });
    }
}

function processIncomingData(remoteDb, senderId, conn) {
    const localDb = state.db;
    NeuralSync.pendingDiffs = [];
    const localMap = new Map(localDb.map(item => [item.id, item]));

    remoteDb.forEach(remoteItem => {
        const localItem = localMap.get(remoteItem.id);
        if (!localItem) {
            NeuralSync.pendingDiffs.push({ type: 'add', remote: remoteItem, local: null });
        } else {
            let isNewer = false;
            const rTime = remoteItem.updatedAt || remoteItem.added || 0;
            const lTime = localItem.updatedAt || localItem.added || 0;

            if (rTime > lTime) isNewer = true;
            if (remoteItem.ep > localItem.ep) isNewer = true;
            if (remoteItem.score !== localItem.score && rTime >= lTime) isNewer = true;
            if (remoteItem.status === 'Finished' && localItem.status !== 'Finished') isNewer = true;

            if (isNewer) {
                NeuralSync.pendingDiffs.push({ type: 'update', remote: remoteItem, local: localItem, conn: conn });
            }
        }
    });

    if (NeuralSync.pendingDiffs.length > 0) {
        showNotification("Delta differences detected. Awaiting manual resolution.");
        openDiffOverlay(senderId, conn);
    } else {
        if (conn && conn.open) conn.send({ type: 'SYNC_ACKNOWLEDGED', sender: NeuralSync.deviceId });
        showNotification("Timelines perfectly synchronized. No updates needed.");
    }
}

window.openDiffOverlay = function (senderId, conn) {
    if (!NeuralSync || !Array.isArray(NeuralSync.pendingDiffs) || NeuralSync.pendingDiffs.length === 0) {
        return;
    }

    NeuralSync.activeMergeConn = conn;
    const overlay = document.getElementById('neuralDiffOverlay');
    document.getElementById('syncConnectionInfo').innerHTML = `<i class="fas fa-network-wired mr-2 text-pulse"></i> Payload from: <span class="text-white">${senderId}</span>`;

    const container = document.getElementById('diffCardsContainer');
    document.getElementById('selectAllDiffs').checked = true;
    container.innerHTML = '';

    NeuralSync.pendingDiffs.forEach((diff, index) => {
        const isAdd = diff.type === 'add';
        const title = diff.remote.title || diff.remote.name;
        const poster = diff.remote.poster ? `https://image.tmdb.org/t/p/w200${diff.remote.poster}` : 'https://via.placeholder.com/200x300';

        const localStats = isAdd ? `<span class="text-gray-600">No Local Archive</span>` : `<span class="text-gray-400">${diff.local.status}</span> <span class="mx-1 opacity-30">|</span> <span>EP: ${diff.local.ep}</span> <span class="mx-1 opacity-30">|</span> <span class="text-yellow-500">★ ${diff.local.score}</span>`;
        const remoteStats = `<span class="text-[#22c55e]">${diff.remote.status}</span> <span class="mx-1 opacity-30">|</span> <span class="text-white">EP: ${diff.remote.ep}</span> <span class="mx-1 opacity-30">|</span> <span class="text-yellow-500">★ ${diff.remote.score}</span>`;

        const cardHTML = `
            <div class="diff-card-new group flex flex-col md:flex-row bg-dark/60 border border-white/10 rounded-2xl p-4 md:p-5 gap-3 md:gap-4 items-start md:items-center relative overflow-hidden transition-all hover:border-pulse/50" 
                 data-index="${index}" 
                 style="animation-delay: ${index * 0.05}s"> 
                
                <div class="flex items-center gap-3 w-full md:w-auto border-b border-white/5 pb-3 md:border-0 md:pb-0 shrink-0">
                    <input type="checkbox" class="diff-checkbox w-5 h-5 accent-pulse cursor-pointer shrink-0" value="${index}" checked onchange="toggleSingleDiff(this)">
                    <div class="text-xs font-black uppercase text-white truncate flex-1 md:hidden pr-2">${title}</div>
                </div>

                <div class="flex flex-col md:flex-row md:items-center justify-between w-full gap-3 md:gap-4 mt-1 md:mt-0 min-w-0">
                    <div class="flex-1 flex items-center gap-3 md:gap-4 bg-black/40 p-3 rounded-xl border border-white/5 opacity-70 w-full min-w-0">
                        <img src="${poster}" class="w-14 h-20 md:w-12 md:h-16 object-cover rounded-lg shadow-md shrink-0">
                        <div class="min-w-0 flex-1">
                            <div class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Local State</div>
                            <div class="text-xs font-black uppercase text-white truncate hidden md:block mb-1">${title}</div>
                            <div class="text-[9px] font-bold uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1 leading-relaxed">${localStats}</div>
                        </div>
                    </div>
                    
                    <div class="flex justify-center w-full md:w-auto shrink-0 py-1 md:py-0 opacity-50">
                        <i class="fas fa-chevron-down md:hidden text-pulse text-lg animate-pulse"></i>
                        <i class="fas fa-chevron-right hidden md:block text-pulse text-xl px-2 animate-pulse"></i>
                    </div>
                    
                    <div class="flex-1 flex items-center gap-3 md:gap-4 bg-[#22c55e]/5 p-3 rounded-xl border border-[#22c55e]/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)] w-full min-w-0">
                        <img src="${poster}" class="w-14 h-20 md:w-12 md:h-16 object-cover rounded-lg shadow-md shrink-0">
                        <div class="min-w-0 flex-1">
                            <div class="text-[8px] text-[#22c55e] font-bold uppercase tracking-widest mb-1">${isAdd ? 'New Addition' : 'Payload Update'}</div>
                            <div class="text-xs font-black uppercase text-white truncate hidden md:block mb-1">${title}</div>
                            <div class="text-[9px] font-bold uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1 leading-relaxed">${remoteStats}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    // We no longer add .flex here. It acts as a standard block modal now.
    overlay.classList.remove('hidden');
    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.classList.add('neural-diff-active');

    if (typeof checkScrollLock === 'function') checkScrollLock();

    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        // Scroll to the overlay when activated
        overlay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10);
}

window.closeDiffOverlay = function () {
    const overlay = document.getElementById('neuralDiffOverlay');
    const card = document.getElementById('neuralDiffCard');
    const searchBar = document.getElementById('searchBar');

    if (card) card.classList.remove('scale-95');
    if (searchBar) searchBar.classList.remove('neural-diff-active');
    overlay.classList.add('opacity-0');

    setTimeout(() => {
        overlay.classList.add('hidden');
        if (typeof checkScrollLock === 'function') checkScrollLock();
    }, 300);
}

window.toggleAllDiffs = function (masterCheckbox) {
    const isChecked = masterCheckbox.checked;
    const checkboxes = Array.from(document.querySelectorAll('.diff-checkbox'));

    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        toggleSingleDiff(cb);
    });

    const actionTip = document.getElementById('neuralDiffActionTip');
    if (actionTip) actionTip.textContent = isChecked ? 'Swipe right to approve selected' : 'Select items to approve';
}

window.toggleSingleDiff = function (cb) {
    const card = cb.closest('.diff-card-new');
    if (!card) return;

    if (cb.checked) {
        card.classList.remove('deselected');
    } else {
        card.classList.add('deselected');
    }

    const total = document.querySelectorAll('.diff-checkbox').length;
    const checked = document.querySelectorAll('.diff-checkbox:checked').length;
    const master = document.getElementById('selectAllDiffs');
    if (master) master.checked = total > 0 && checked === total;
    if (master) master.indeterminate = checked > 0 && checked < total;
}

function setupNeuralDiffOverlayGestures() {
    const overlay = document.getElementById('neuralDiffOverlay');
    if (!overlay || typeof Hammer === 'undefined') return;

    const hammer = new Hammer(overlay);
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 12, velocity: 0.3 });

    hammer.on('swiperight', () => {
        if (overlay.classList.contains('hidden')) return;
        executeSelectedMerges();
    });
    hammer.on('swipeleft', () => {
        if (overlay.classList.contains('hidden')) return;
        closeDiffOverlay();
    });
}

window.executeSelectedMerges = function () {
    const selectedIndices = Array.from(document.querySelectorAll('.diff-checkbox:checked')).map(cb => parseInt(cb.value));
    if (selectedIndices.length === 0) return showNotification("No items selected to merge.", true);

    const animContainer = document.getElementById('syncAnimationContainer');
    const cardsContainer = document.getElementById('diffCardsContainer');

    cardsContainer.style.opacity = '0.2';
    animContainer.innerHTML = '';
    animContainer.classList.remove('hidden');
    animContainer.classList.add('flex'); // Add flexbox dynamically

    const animSet = selectedIndices.slice(0, 10);
    animSet.forEach((idx, i) => {
        const diff = NeuralSync.pendingDiffs[idx];
        const img = document.createElement('img');
        img.src = diff.remote.poster ? `https://image.tmdb.org/t/p/w300${diff.remote.poster}` : 'https://via.placeholder.com/300x450';
        img.className = 'absolute w-32 h-48 rounded-2xl object-cover z-50 shadow-2xl shadow-pulse/40';
        img.style.animation = `neuralSyncJump 1.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.15}s forwards`;
        animContainer.appendChild(img);
    });

    const totalAnimTime = 1500 + (animSet.length * 150);

    setTimeout(() => {
        applyMerges(selectedIndices);
        animContainer.classList.remove('flex'); // Clean up flexbox
        animContainer.classList.add('hidden');
        cardsContainer.style.opacity = '1';
        closeDiffOverlay();
    }, totalAnimTime);
}

function applyMerges(indices) {
    let updatesApplied = 0;
    if (typeof TemporalEngine !== 'undefined') TemporalEngine.commit("Pre-Sync Anchor");
    indices.forEach(idx => {
        const diff = NeuralSync.pendingDiffs[idx];
        if (diff.type === 'add') {
            state.db.push(diff.remote);
            updatesApplied++;
        } else if (diff.type === 'update') {
            const localIndex = state.db.findIndex(i => i.id === diff.remote.id);
            if (localIndex !== -1) {
                state.db[localIndex] = diff.remote;
                updatesApplied++;
            }
        }
    });

    save(true); // Pass true to avoid micro-syncing these back immediately

    if (NeuralSync.activeMergeConn && NeuralSync.activeMergeConn.open) {
        NeuralSync.activeMergeConn.send({ type: 'SYNC_ACKNOWLEDGED', sender: NeuralSync.deviceId });
    }

    showNotification(`Timeline merged! ${updatesApplied} records secured.`);
    if (state.view === 'mylist') renderList();
    if (state.view === 'rhythmlab') runLab();
}

window.rejectAllChanges = function () {
    closeDiffOverlay();
    showNotification("Payload rejected. Local timeline preserved.");
}

// ==========================================
// 7. AUTO-RESTORE ENGINE
// ==========================================
// Optional legacy method; no longer required but kept for compatibility
window.autoRestoreNeuralLink = function () {
    const savedRole = localStorage.getItem('cp_neural_role');
    const savedHostId = localStorage.getItem('cp_neural_host_id');

    if (savedRole === 'host' && savedHostId) {
        showNotification("Restoring Primary Hub...");
        initNeuralHost(savedHostId);
    } else if (savedRole === 'node' && savedHostId) {
        showNotification("Re-establishing link to Hub...");
        joinNeuralNetwork(savedHostId, true);
    }
};

// Attach to your existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderTopology();
    // Auto-boot previously established connections
    setTimeout(() => {
        const savedRole = localStorage.getItem('cp_neural_role');
        const savedHostId = localStorage.getItem('cp_neural_host_id');
        if (savedRole === 'host' && savedHostId) {
            initNeuralHost(savedHostId);
        } else if (savedRole === 'node' && savedHostId) {
            joinNeuralNetwork(savedHostId, true);
        }
        startAutoReconnectLoop();
    }, 1000);
});

// Optional: Add to your clearTopology/Purge function to wipe saved states
// localStorage.removeItem('cp_neural_role');
// localStorage.removeItem('cp_neural_host_id');