/**
 * 聲音郵局 (Sound Postcard)
 * 信封開蓋 → 照片從信封尺寸放大至全屏
 * 每個地點有專屬信封顏色
 *
 * v2 修正重點：
 *  - 更新 CARTO 底圖網址（需 key）
 *  - 音訊：處理 autoplay 限制、連點競態、淡出後真正停止、緩衝快取
 *  - 動畫時間軸可被取消（快速退出／切換不再出現幽靈郵戳或照片）
 *  - 圖片預載、載入失敗處理
 *  - 鍵盤操作（Esc 退出、標記可用 Tab 聚焦）、分頁隱藏時暫停音訊
 */

const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.webp",
        desc: "2026.01.16。冬日午後的寺院，鳥鳴聲在木造建築間迴盪，空氣中彷彿能聽見寧靜。",
        envColor: ["#b8c4b8", "#96a896"]   // 寺院青灰
    },
    {
        id: "fushimi",
        name: "京都・伏見稻荷",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.webp",
        desc: "2026.01.12。千本鳥居旁的流水聲，午後的泉水帶著苔蘚的濕氣與山林的幽靜。",
        envColor: ["#c8695a", "#a84838"]   // 鳥居硃紅
    },
    {
        id: "arashiyama",
        name: "京都・嵐山",
        coords: [35.0094, 135.6667],
        audio: "audio/arashiyama.mp3",
        image: "images/arashiyama.webp",
        desc: "2026.01.14。渡月橋邊的風聲與桂川細浪，竹林深處偶爾傳來的葉片摩擦聲。",
        envColor: ["#8aaa78", "#6a8a58"]   // 竹林綠
    },
    {
        id: "takamatsu",
        name: "高松・高松港",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.webp",
        desc: "2026.03.11。瀨戶內海的平靜海風，夾雜著遠處微弱的船笛聲。",
        envColor: ["#7aaabf", "#5a8aaa"]   // 海藍
    },
    {
        id: "kanazawa",
        name: "金澤・雨聲",
        coords: [36.5621, 136.6627],
        audio: "audio/kanazawa.mp3",
        image: "images/kanazawa.webp",
        desc: "2026.03.03。北陸地區冬日常見的雨，落在鈴木大拙舘上的滴答聲。",
        envColor: ["#9898a8", "#787888"]   // 雨雲灰紫
    },
    {
        id: "uji",
        name: "宇治・宇治川",
        coords: [34.8893, 135.8077],
        audio: "audio/uji.mp3",
        image: "images/uji.webp",
        desc: "2026.01.17。宇治橋下湍急的川流聲，伴隨著兩岸茶香。",
        envColor: ["#9ab87a", "#7a9858"]   // 抹茶綠
    },
    {
        id: "inapark",
        name: "長野・伊那公園",
        coords: [35.8361, 137.9711],
        audio: "audio/inapark.mp3",
        image: "images/inapark.webp",
        desc: "2026.02.27。信州高地的清晨，公園內高大松樹間的鳥鳴，空氣帶著涼意。",
        envColor: ["#c8c0a0", "#a8a080"]   // 枯草米色
    },
    {
        id: "inahigh",
        name: "長野・伊那北高中",
        coords: [35.8505, 137.9614],
        audio: "audio/inahigh.mp3",
        image: "images/inahigh.webp",
        desc: "2026.02.26。校園放學後的寧靜，遠處運動場的呼喊與南阿爾卑斯山的風。",
        envColor: ["#b0c0d8", "#8aaac0"]   // 山嵐淡藍
    },
    {
        id: "chofu",
        name: "調布・花火大會",
        coords: [35.6385, 139.5286],
        audio: "audio/chofu.mp3",
        image: "images/chofu.webp",
        desc: "2025.09.20。多摩川岸邊的夏末秋初，巨大的花火在夜空中綻放，震撼的爆炸聲劃破靜謐。",
        envColor: ["#3a3a58", "#252540"]   // 夜空深藍
    },
    {
        id: "hitotsubashi",
        name: "國立・一橋祭",
        coords: [35.6946, 139.4442],
        audio: "audio/hitotsubashi.mp3",
        image: "images/hitotsubashi.webp",
        desc: "2025.11.22。深秋的校園祭典，人們圍在一起歡快跳舞，充滿溫度的歡笑與節奏。",
        envColor: ["#c09858", "#a07838"]   // 秋葉金棕
    }
];

// ── 設定 ──
// 注意：前端的 key 是公開的，請到 CARTO 後台把它限制在你的網域
const CARTO_KEY = 'cb1_48uy_1_e910454a7abf005bffc07b09';

// ── 狀態 ──
let currentLocId = null;
let isOpen       = false;   // 沈浸層是否開啟
let sessionId    = 0;       // 每次進入／退出遞增，用來作廢舊的非同步流程
const isMobile   = () => window.innerWidth < 768;

// ── DOM ──
const $ = id => document.getElementById(id);
const intro     = $('intro');
const overlay   = $('image-overlay');
const stage     = $('envelope-stage');
const flap      = $('flap');
const wrap      = $('photo-wrap');
const bgImg     = $('bg-image');
const info      = $('info-text');
const stamp     = $('stamp');
const backBtn   = $('back-btn');
const surpriseBtn = $('surprise-btn');
const pulseWrap   = $('pulse-wrap');
const pulseRing   = $('pulse-ring');
const pulseRipple = $('pulse-ripple');

// ── 可取消的計時器 ──
let timers = [];
function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
}
function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
}

// ── 引導頁 ──
function dismissIntro() {
    if (intro.classList.contains('fade-out')) return;
    initAudio();   // 在使用者手勢中建立 AudioContext，避免瀏覽器 autoplay 限制
    intro.classList.add('fade-out');
    setTimeout(() => { intro.style.display = 'none'; }, 1900);
}
intro.addEventListener('click', dismissIntro);
intro.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissIntro(); }
});

// ── 地圖 ──
const map = L.map('map', {
    zoomControl: false,
    maxBounds: [[20, 115], [50, 155]],
    maxBoundsViscosity: 0.8,
    minZoom: 4
}).setView([37.5, 137.5], isMobile() ? 5 : 6);

const tiles = L.tileLayer(
    `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    }
).addTo(map);

let tileErrWarned = false;
tiles.on('tileerror', () => {
    if (tileErrWarned) return;
    tileErrWarned = true;
    console.warn('地圖圖磚載入失敗：請檢查 CARTO_KEY 是否正確，或網域是否已授權。');
});

// ── Web Audio ──
let audioCtx, masterGain, analyser;
let current   = null;   // { source, gain }
let playToken = 0;      // 連點時作廢較早的載入
const bufferCache = new Map();

function initAudio() {
    if (!audioCtx) {
        audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        analyser   = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);
        startPulse();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

async function loadBuffer(url) {
    if (bufferCache.has(url)) return bufferCache.get(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
    bufferCache.set(url, buffer);
    return buffer;
}

// 淡出並真正停止（每個音源有自己的 gain，切換時可交叉淡入淡出）
function fadeOutAndStop(node, seconds) {
    if (!node) return;
    const t = audioCtx.currentTime;
    const g = node.gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(g.value, 0.0001), t);
    g.exponentialRampToValueAtTime(0.0001, t + seconds);
    try { node.source.stop(t + seconds + 0.05); } catch (e) {}
    node.source.onended = () => {
        try { node.source.disconnect(); node.gain.disconnect(); } catch (e) {}
    };
}

async function playSound(url) {
    initAudio();
    const token = ++playToken;
    fadeOutAndStop(current, 0.8);
    current = null;

    try {
        const buffer = await loadBuffer(url);
        if (token !== playToken) return;   // 期間已退出或切換到別處

        const source = audioCtx.createBufferSource();
        const gain   = audioCtx.createGain();
        const t      = audioCtx.currentTime;
        source.buffer = buffer;
        source.loop   = true;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(1, t + 2);
        source.connect(gain);
        gain.connect(masterGain);
        source.start();
        current = { source, gain };
    } catch (e) {
        console.error('Audio error:', e);
    }
}

function stopSound(seconds = 1.2) {
    playToken++;
    fadeOutAndStop(current, seconds);
    current = null;
}

// 分頁切到背景時暫停，回來再繼續
document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend();
    else if (isOpen) audioCtx.resume();
});

// ── 脈衝可視化 ──
let rippleTimeout = null;
function startPulse() {
    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    function draw() {
        analyser.getByteFrequencyData(dataArr);
        const avg   = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
        const ratio = avg / 255;
        pulseRing.style.transform = `scale(${(1 + ratio * 1.2).toFixed(3)})`;
        pulseRing.style.boxShadow = `0 0 ${Math.round(ratio * 22)}px rgba(255,255,255,${(ratio * 0.9).toFixed(2)})`;
        if (ratio > 0.28 && !rippleTimeout) {
            pulseRipple.style.animation = 'none';
            void pulseRipple.offsetWidth;
            pulseRipple.style.animation = 'ripple-out 0.9s ease-out forwards';
            rippleTimeout = setTimeout(() => { rippleTimeout = null; }, 900);
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// ── 地圖標記 ──
const customIcon = L.divIcon({ className: 'glow-point', iconSize: [8, 8], iconAnchor: [4, 4] });
locations.forEach(loc => {
    L.marker(loc.coords, {
        icon: customIcon,
        title: loc.name,
        alt: loc.name,
        keyboard: true
    })
        .addTo(map)
        .on('click', () => {
            if (isOpen) return;
            initAudio();
            enterImmersive(loc);
        });
});

// ── 圖片預載 ──
function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(true);
        img.onerror = () => { console.warn('圖片載入失敗：', src); resolve(false); };
        img.src = src;
    });
}

// ── 郵戳（用 class + 強制重排重播動畫，不再 cloneNode） ──
function triggerStamp(loc) {
    $('stamp-loc').textContent   = loc.name.split('・')[0];
    $('stamp-coord').textContent = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;
    stamp.classList.remove('active');
    void stamp.offsetWidth;
    stamp.classList.add('active');
}
function hideStamp() {
    stamp.classList.remove('active');
}

// ── 進入沈浸模式 ──
function enterImmersive(loc) {
    clearTimers();
    map.stop();
    const session = ++sessionId;
    currentLocId = loc.id;
    isOpen = true;

    // 注入信封顏色
    const root = document.documentElement;
    root.style.setProperty('--env-main', loc.envColor[0]);
    root.style.setProperty('--env-dark', loc.envColor[1]);

    // 重置所有狀態
    flap.classList.remove('open');
    wrap.classList.remove('expand');
    wrap.style.opacity = '0';
    stage.classList.remove('hidden');
    stage.classList.add('visible');
    info.style.opacity = '0';
    hideStamp();

    // 填充內容（同時開始預載圖片）
    const imageReady = loadImage(loc.image);
    bgImg.src = loc.image;
    bgImg.alt = loc.name;
    $('loc-name').textContent = loc.name;
    $('loc-desc').textContent = loc.desc;

    // 打開遮罩
    overlay.classList.add('open');
    overlay.classList.remove('phase-photo');
    requestAnimationFrame(() => overlay.classList.add('phase-envelope'));

    backBtn.style.display = 'block';
    backBtn.focus({ preventScroll: true });
    pulseWrap.classList.add('visible');

    // 播放聲音（與動畫並行）
    playSound(loc.audio);

    // ── 動畫時間軸（全部可被 clearTimers 取消） ──
    // 0.5s：信封蓋打開
    later(() => flap.classList.add('open'), 500);

    // 1.5s：照片開始從信封尺寸放大（若圖片還沒載好會等它）
    later(async () => {
        await imageReady;
        if (session !== sessionId) return;
        wrap.style.opacity = '1';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (session !== sessionId) return;
            wrap.classList.add('expand');
            overlay.classList.add('phase-photo');
            later(() => stage.classList.add('hidden'), 400);
        }));
    }, 1500);

    // 2.8s：文字淡入
    later(() => { info.style.opacity = '1'; }, 2800);

    // 3.6s：郵戳蓋下
    later(() => triggerStamp(loc), 3600);
}

// ── 退出 ──
backBtn.addEventListener('click', exitImmersive);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) exitImmersive();
});

function exitImmersive() {
    clearTimers();
    sessionId++;
    isOpen = false;

    hideStamp();
    overlay.classList.remove('open', 'phase-envelope', 'phase-photo');
    backBtn.style.display = 'none';
    info.style.opacity = '0';
    pulseWrap.classList.remove('visible');

    // 重置信封和照片
    wrap.classList.remove('expand');
    wrap.style.opacity = '0';
    stage.classList.remove('visible', 'hidden');
    flap.classList.remove('open');

    stopSound(1.2);
}

// ── Surprise Me ──
surpriseBtn.addEventListener('click', () => {
    initAudio();   // 這裡是使用者手勢，之後 setTimeout 內播放才不會被擋
    const pool = locations.filter(l => l.id !== currentLocId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (isOpen) {
        exitImmersive();
        later(() => flyAndEnter(pick), 500);
    } else {
        clearTimers();
        flyAndEnter(pick);
    }
});

function flyAndEnter(loc) {
    map.flyTo(loc.coords, isMobile() ? 7 : 9, { duration: 2 });
    later(() => enterImmersive(loc), 2300);
}
