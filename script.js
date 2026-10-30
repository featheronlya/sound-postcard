/**
 * 聲音郵局 (Sound Postcard)
 * 信封開蓋 → 照片從信封尺寸放大至全屏
 * 每個地點有專屬信封顏色
 *
 * v3：新增英文／日文介面（EN / 日本語）。
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
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.webp",
        name: { en: "Nara · Toshodai-ji", ja: "奈良・唐招提寺" },
        desc: { en: "16 Jan 2026. A winter afternoon at the temple: birdsong echoing among the wooden buildings, as if quiet itself could be heard.", ja: "2026.01.16。冬の午後の寺院。木造の建物に鳥の声が響き、静けさそのものが聞こえてくるようです。" },
        envColor: ["#b8c4b8", "#96a896"]
    },
    {
        id: "fushimi",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.webp",
        name: { en: "Kyoto · Fushimi Inari", ja: "京都・伏見稲荷" },
        desc: { en: "12 Jan 2026. Flowing water beside the thousand torii gates, with small bubbles breaking within the stream; the afternoon spring water carries the damp of moss and the hush of the mountain forest.", ja: "2026.01.12。千本鳥居のそばを流れる水の音に、小さな泡のはじける音が混じります。午後の湧き水は、苔の湿り気と山林の静けさを帯びています。" },
        envColor: ["#c8695a", "#a84838"]
    },
    {
        id: "arashiyama",
        coords: [35.0094, 135.6667],
        audio: "audio/arashiyama.mp3",
        image: "images/arashiyama.webp",
        name: { en: "Kyoto · Arashiyama", ja: "京都・嵐山" },
        desc: { en: "14 Jan 2026. A shakuhachi performance beside Togetsukyo Bridge, with the wind and gentle ripples of the Katsura River, and leaves rubbing together deep in the bamboo grove.", ja: "2026.01.14。渡月橋のほとりで聞こえた尺八の演奏。風と桂川の細かな波音、竹林の奥からときおり聞こえる葉の擦れる音も混じります。" },
        envColor: ["#8aaa78", "#6a8a58"]
    },
    {
        id: "takamatsu",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.webp",
        name: { en: "Takamatsu · near the port", ja: "高松・港の近く" },
        desc: { en: "11 Mar 2026. Calm sea wind of the Seto Inland Sea, heard from a rooftop near the port, with a faint ship’s horn in the distance.", ja: "2026.03.11。港の近くの屋上で聞いた、瀬戸内海の穏やかな海風。遠くにかすかな船の汽笛が混じります。" },
        envColor: ["#7aaabf", "#5a8aaa"]
    },
    {
        id: "kanazawa",
        coords: [36.5621, 136.6627],
        audio: "audio/kanazawa.mp3",
        image: "images/kanazawa.webp",
        name: { en: "Kanazawa · Rain", ja: "金沢・雨音" },
        desc: { en: "3 Mar 2026. The winter rain common in the Hokuriku region, dripping onto the Suzuki Daisetz Museum.", ja: "2026.03.03。北陸の冬によくある雨が、鈴木大拙館に落ちるしずくの音。" },
        envColor: ["#9898a8", "#787888"]
    },
    {
        id: "uji",
        coords: [34.8893, 135.8077],
        audio: "audio/uji.mp3",
        image: "images/uji.webp",
        name: { en: "Uji · Uji River", ja: "宇治・宇治川" },
        desc: { en: "17 Jan 2026. The rushing current of the Uji River beneath Uji Bridge, with the scent of tea on both banks.", ja: "2026.01.17。宇治橋の下を勢いよく流れる川の音と、両岸に漂うお茶の香り。" },
        envColor: ["#9ab87a", "#7a9858"]
    },
    {
        id: "inapark",
        coords: [35.8361, 137.9711],
        audio: "audio/inapark.mp3",
        image: "images/inapark.webp",
        name: { en: "Nagano · Ina Park", ja: "長野・伊那公園" },
        desc: { en: "27 Feb 2026. An early morning in the Shinshu highlands: birdsong among the tall pines in the park, the air cool.", ja: "2026.02.27。信州の高原の早朝。公園の高い松の間に響く鳥の声と、ひんやりとした空気。" },
        envColor: ["#c8c0a0", "#a8a080"]
    },
    {
        id: "inahigh",
        coords: [35.8505, 137.9614],
        audio: "audio/inahigh.mp3",
        image: "images/inahigh.webp",
        name: { en: "Nagano · Ina Kita High School", ja: "長野・伊那北高校" },
        desc: { en: "26 Feb 2026. The dismissal bell at the end of the school day, with shouts from a distant sports field and the wind from the Southern Alps.", ja: "2026.02.26。放課後を告げるチャイムの音。遠くの運動場から届く声と、南アルプスの風。" },
        envColor: ["#b0c0d8", "#8aaac0"]
    },
    {
        id: "chofu",
        coords: [35.6385, 139.5286],
        audio: "audio/chofu.mp3",
        image: "images/chofu.webp",
        name: { en: "Chofu · Fireworks", ja: "調布・花火大会" },
        desc: { en: "20 Sep 2025. Late summer on the Tama River bank: huge fireworks bloom in the night sky, and the blasts break the quiet.", ja: "2025.09.20。多摩川の岸辺の夏の終わり。夜空に大きく咲く花火と、静けさを破る爆発音。" },
        envColor: ["#3a3a58", "#252540"]
    },
    {
        id: "hitotsubashi",
        coords: [35.6946, 139.4442],
        audio: "audio/hitotsubashi.mp3",
        image: "images/hitotsubashi.webp",
        name: { en: "Kunitachi · Hitotsubashi Festival", ja: "国立・一橋祭" },
        desc: { en: "22 Nov 2025. A late-autumn campus festival: people gathering to dance, full of warmth, laughter, and rhythm.", ja: "2025.11.22。晩秋の学園祭。人々が輪になって楽しく踊り、笑い声とリズムに温かさが満ちています。" },
        envColor: ["#c09858", "#a07838"]
    },
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

// ── 語言 / Languages (English · 日本語) ──
const I18N = {
    en: { title: 'Sound Postcard', sub: 'A Collection of Real Moments', hint: 'Click anywhere to enter',
          back: '← BACK', surprise: 'SURPRISE ME', collected: 'Collected at:', original: 'Original Recording',
          introAria: 'Enter Sound Postcard', backAria: 'Back to the map',
          desc: 'Sound Postcard — a collection of real moments, in sound and image' },
    ja: { title: '音の郵便局', sub: 'Sound Postcard — 実際の瞬間のコレクション', hint: 'どこかをクリックして入る',
          back: '← 戻る', surprise: 'おまかせ', collected: '録音地：', original: 'オリジナル録音',
          introAria: 'Sound Postcard に入る', backAria: '地図に戻る',
          desc: 'Sound Postcard — 音と写真で集める、実際の旅の瞬間' }
};
let lang = 'en';
try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('sp-lang');
    lang = (q && I18N[q]) ? q : ((saved && I18N[saved]) ? saved : 'en');
} catch (e) { lang = 'en'; }
const tr = obj => obj[lang] || obj.en;
let currentLoc = null;
const markers  = [];

function setStampText(loc) {
    $('stamp-label').textContent = I18N[lang].collected;
    $('stamp-orig').textContent  = I18N[lang].original;
    $('stamp-loc').textContent   = tr(loc.name).split(/[・·]/)[0].trim();
}

function applyLang(l) {
    if (!I18N[l]) return;
    lang = l;
    try { localStorage.setItem('sp-lang', l); } catch (e) {}
    const t = I18N[l];
    document.documentElement.lang = l;
    document.title = t.title + ' | Sound Postcard';
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t.desc);
    $('intro-title').textContent = t.title;
    $('intro-sub').textContent   = t.sub;
    $('intro-hint').textContent  = t.hint;
    intro.setAttribute('aria-label', t.introAria);
    backBtn.textContent = t.back;
    backBtn.setAttribute('aria-label', t.backAria);
    surpriseBtn.textContent = t.surprise;
    document.querySelectorAll('#lang button').forEach(b => {
        const on = b.dataset.lang === l;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    markers.forEach(({ m, loc }) => {
        const el = m.getElement && m.getElement();
        if (el) { el.title = tr(loc.name); el.setAttribute('alt', tr(loc.name)); }
    });
    if (currentLoc) {
        setStampText(currentLoc);
        if (isOpen) {
            $('loc-name').textContent = tr(currentLoc.name);
            $('loc-desc').textContent = tr(currentLoc.desc);
            bgImg.alt = tr(currentLoc.name);
        }
    }
}
document.querySelectorAll('#lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));

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

// 截圖用：網址加 ?view=takamatsu 會放大到高松附近；?view=setouchi 看整個瀨戶內海。
// 只改開啟時的視角，預設（沒有參數）仍是日本全圖。可再加 &zoom=數字 自行微調。
(function () {
    try {
        const q = new URLSearchParams(location.search);
        const v = q.get('view');
        const z = parseInt(q.get('zoom'), 10);
        if (v === 'takamatsu') map.setView([34.35, 134.05], z || (isMobile() ? 9 : 10));
        else if (v === 'setouchi') map.setView([34.35, 133.9], z || (isMobile() ? 8 : 9));
    } catch (e) {}
})();

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
    const m = L.marker(loc.coords, {
        icon: customIcon,
        title: tr(loc.name),
        alt: tr(loc.name),
        keyboard: true
    });
    markers.push({ m, loc });
    m.addTo(map).on('click', () => {
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
    setStampText(loc);
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
    currentLoc = loc;
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
    bgImg.alt = tr(loc.name);
    $('loc-name').textContent = tr(loc.name);
    $('loc-desc').textContent = tr(loc.desc);

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

// ── 初始語言 ──
applyLang(lang);
