/**
 * 聲音郵局 (Sound Postcard)
 * 信封拆開動畫 + 豎版明信片 + 音頻脈衝
 */

const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.webp",
        desc: "2026.01.16。冬日午後的寺院，鳥鳴聲在木造建築間迴盪，空氣中彷彿能聽見寧靜。"
    },
    {
        id: "fushimi",
        name: "京都・伏見稻荷",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.webp",
        desc: "2026.01.12。千本鳥居旁的流水聲，午後的泉水帶著苔蘚的濕氣與山林的幽靜。"
    },
    {
        id: "arashiyama",
        name: "京都・嵐山",
        coords: [35.0094, 135.6667],
        audio: "audio/arashiyama.mp3",
        image: "images/arashiyama.webp",
        desc: "2026.01.14。渡月橋邊的風聲與桂川細浪，竹林深處偶爾傳來的葉片摩擦聲。"
    },
    {
        id: "takamatsu",
        name: "高松・瀨戶內海",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.webp",
        desc: "2026.03.11。瀨戶內海的平靜海風，夾雜著遠處微弱的船笛聲。"
    },
    {
        id: "kanazawa",
        name: "金澤・雨聲",
        coords: [36.5621, 136.6627],
        audio: "audio/kanazawa.mp3",
        image: "images/kanazawa.webp",
        desc: "2026.03.03。北陸地區冬日常見的雨，落在鈴木大拙舘上的滴答聲。"
    },
    {
        id: "uji",
        name: "宇治・宇治川",
        coords: [34.8893, 135.8077],
        audio: "audio/uji.mp3",
        image: "images/uji.webp",
        desc: "2026.01.17。宇治橋下湍急的川流聲，伴隨著兩岸茶香。"
    },
    {
        id: "inapark",
        name: "長野・伊那公園",
        coords: [35.8361, 137.9711],
        audio: "audio/inapark.mp3",
        image: "images/inapark.webp",
        desc: "2026.02.27。信州高地的清晨，公園內高大松樹間的鳥鳴，空氣帶著涼意。"
    },
    {
        id: "inahigh",
        name: "長野・伊那北高中",
        coords: [35.8505, 137.9614],
        audio: "audio/inahigh.mp3",
        image: "images/inahigh.webp",
        desc: "2026.02.26。校園放學後的寧靜，遠處運動場的呼喊與南阿爾卑斯山的風。"
    },
    {
        id: "chofu",
        name: "調布・花火大會",
        coords: [35.6385, 139.5286],
        audio: "audio/chofu.mp3",
        image: "images/chofu.webp",
        desc: "2025.09.20。多摩川岸邊的夏末秋初，巨大的花火在夜空中綻放，震撼的爆炸聲劃破靜謐。"
    },
    {
        id: "hitotsubashi",
        name: "國立・一橋祭",
        coords: [35.6946, 139.4442],
        audio: "audio/hitotsubashi.mp3",
        image: "images/hitotsubashi.webp",
        desc: "2025.11.22。深秋的校園祭典，人們圍在一起歡快跳舞，充滿溫度的歡笑與節奏。"
    }
];

// ── 狀態 ──
let currentLocId = null;
const isMobile   = window.innerWidth < 768;

// ── 引導頁 ──
const introEl = document.getElementById('intro');
introEl.addEventListener('click', () => {
    introEl.classList.add('fade-out');
    setTimeout(() => { introEl.style.display = 'none'; }, 1900);
});

// ── 地圖 ──
const map = L.map('map', {
    zoomControl: false,
    maxBounds: [[20, 115], [50, 155]],
    minZoom: 4
}).setView([37.5, 137.5], isMobile ? 5 : 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CARTO'
}).addTo(map);

// ── Web Audio ──
let audioCtx, gainNode, analyser, currentSource;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode  = audioCtx.createGain();
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    startPulse();
}

async function playSound(url) {
    initAudio();
    if (gainNode && currentSource) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    }
    try {
        const res    = await fetch(url);
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        if (currentSource) { try { currentSource.stop(); } catch(e) {} }
        currentSource        = audioCtx.createBufferSource();
        currentSource.buffer = buffer;
        currentSource.loop   = true;
        currentSource.connect(gainNode);
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2);
        currentSource.start();
    } catch (e) { console.error('Audio error:', e); }
}

// ── 脈衝可視化 ──
const pulseWrap   = document.getElementById('pulse-wrap');
const pulseRing   = document.getElementById('pulse-ring');
const pulseRipple = document.getElementById('pulse-ripple');
let rippleTimeout = null;

function startPulse() {
    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    function draw() {
        analyser.getByteFrequencyData(dataArr);
        const avg   = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
        const ratio = avg / 255;
        const scale = 1 + ratio * 1.2;
        pulseRing.style.transform  = `scale(${scale.toFixed(3)})`;
        pulseRing.style.boxShadow  = `0 0 ${Math.round(ratio * 22)}px rgba(255,255,255,${(ratio * 0.9).toFixed(2)})`;
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
const customIcon = L.divIcon({ className: 'glow-point', iconSize: [8,8], iconAnchor: [4,4] });
locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon })
        .addTo(map)
        .on('click', () => enterImmersive(loc));
});

// ── 信封尺寸同步（讀取 CSS 變數） ──
function getCSSVar(name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}

// ── 進入沈浸模式 ──
function enterImmersive(loc) {
    currentLocId = loc.id;

    const overlay   = document.getElementById('image-overlay');
    const scene     = document.getElementById('envelope-scene');
    const wrap      = document.getElementById('postcard-wrap');
    const bgImg     = document.getElementById('bg-image');
    const flap      = document.getElementById('flap');
    const infoText  = document.getElementById('info-text');

    // 隨機小傾角
    const tilt = (Math.random() * 3 - 1.5).toFixed(2) + 'deg';
    wrap.style.setProperty('--tilt', tilt);

    // 重置所有動畫狀態
    flap.classList.remove('open');
    wrap.classList.remove('slide-up');
    wrap.style.zIndex  = '1';
    infoText.style.opacity = '0';

    // 填充內容
    bgImg.src = loc.image;
    bgImg.alt = loc.name;
    document.getElementById('card-caption').innerText =
        loc.desc.slice(0, 10) + '  ·  ' + loc.name;
    document.getElementById('loc-name').innerText    = loc.name;
    document.getElementById('loc-desc').innerText    = loc.desc;
    document.getElementById('stamp-loc').innerText   = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText =
        `${loc.coords[0]}° N, ${loc.coords[1]}° E`;

    // 同步信封場景高度（= 卡片高度的 55%）
    const cardH = getCSSVar('--card-h') || 440;
    scene.style.height = (cardH * 0.55) + 'px';

    // 打開遮罩
    overlay.classList.add('open');
    document.getElementById('back-btn').style.display = 'block';
    pulseWrap.classList.add('visible');

    // 播放聲音（立即開始，與動畫並行）
    playSound(loc.audio);

    // ── 動畫時間軸 ──
    // 0.4s：信封蓋打開
    setTimeout(() => { flap.classList.add('open'); }, 400);

    // 1.4s（蓋打開完畢後）：明信片滑出
    setTimeout(() => {
        wrap.style.zIndex = '3';
        wrap.classList.add('slide-up');
    }, 1400);

    // 2.6s：資訊文字淡入
    setTimeout(() => { infoText.style.opacity = '1'; }, 2600);

    // 3.4s：郵戳蓋下
    setTimeout(() => triggerStamp(), 3400);
}

// ── 郵戳（cloneNode 保證每次動畫重播） ──
function triggerStamp() {
    const old   = document.getElementById('stamp');
    const fresh = old.cloneNode(true);
    fresh.id    = 'stamp';
    fresh.style.cssText = 'opacity:0; transform:rotate(-6deg) scale(1.9);';
    old.parentNode.replaceChild(fresh, old);
    requestAnimationFrame(() => requestAnimationFrame(() => fresh.classList.add('active')));
}

// ── 退出 ──
document.getElementById('back-btn').addEventListener('click', exitImmersive);

function exitImmersive() {
    const wrap  = document.getElementById('postcard-wrap');
    const flap  = document.getElementById('flap');
    const stamp = document.getElementById('stamp');

    document.getElementById('image-overlay').classList.remove('open');
    document.getElementById('back-btn').style.display = 'none';
    pulseWrap.classList.remove('visible');

    // 重置
    wrap.classList.remove('slide-up');
    wrap.style.zIndex = '1';
    flap.classList.remove('open');
    document.getElementById('info-text').style.opacity = '0';

    // 郵戳淡出
    stamp.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    stamp.style.opacity    = '0';
    stamp.style.transform  = 'rotate(-6deg) scale(0.85)';

    // 音量淡出
    if (gainNode && audioCtx) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
    }
}

// ── Surprise Me ──
document.getElementById('surprise-btn').addEventListener('click', () => {
    const pool = locations.filter(l => l.id !== currentLocId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (currentLocId) {
        exitImmersive();
        setTimeout(() => flyAndEnter(pick), 500);
    } else {
        flyAndEnter(pick);
    }
});

function flyAndEnter(loc) {
    map.flyTo(loc.coords, isMobile ? 7 : 9, { duration: 2 });
    setTimeout(() => enterImmersive(loc), 2300);
}
