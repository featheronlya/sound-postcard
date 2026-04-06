/**
 * 聲音郵局 (Sound Postcard)
 * 含：引導頁、膠片顆粒、盖章動效、音頻脈衝可視化、自定義光標
 */

const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.jpg",
        desc: "2026.01.16。冬日午後的寺院，鳥鳴聲在木造建築間迴盪，空氣中彷彿能聽見寧靜。"
    },
    {
        id: "fushimi",
        name: "京都・伏見稻荷",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.jpg",
        desc: "2026.1.12。千本鳥居旁的流水聲，午後的泉水帶著苔蘚的濕氣與山林的幽靜。"
    },
    {
        id: "arashiyama",
        name: "京都・嵐山",
        coords: [35.0094, 135.6667],
        audio: "audio/arashiyama.mp3",
        image: "images/arashiyama.jpg",
        desc: "2026.1.14。渡月橋邊的風聲與桂川細浪，竹林深處偶爾傳來的葉片摩擦聲。"
    },
    {
        id: "takamatsu",
        name: "高松・高松港",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.jpg",
        desc: "2026.3.11。港口的平靜海風，夾雜著遠處微弱的船笛聲。"
    },
    {
        id: "kanazawa",
        name: "金澤・雨聲",
        coords: [36.5621, 136.6627],
        audio: "audio/kanazawa.mp3",
        image: "images/kanazawa.jpg",
        desc: "2026.3.3。北陸地區冬日常見的雨，落在鈴木大拙舘上的滴答聲。"
    },
    {
        id: "uji",
        name: "宇治・宇治川",
        coords: [34.8893, 135.8077],
        audio: "audio/uji.mp3",
        image: "images/uji.jpg",
        desc: "2026.1.17。宇治橋下湍急的川流聲，伴隨著兩岸茶香。"
    },
    {
        id: "inapark",
        name: "長野・伊那公園",
        coords: [35.8361, 137.9711],
        audio: "audio/inapark.mp3",
        image: "images/inapark.jpg",
        desc: "2026.2.27。信州高地的清晨，公園內高大樹木間的鳥鳴，空氣帶著涼意。"
    },
    {
        id: "inahigh",
        name: "長野・伊那北高中",
        coords: [35.8505, 137.9614],
        audio: "audio/inahigh.mp3",
        image: "images/inahigh.jpg",
        desc: "2026.2.27。校園放學後的寧靜與南阿爾卑斯山的風。"
    }
];

// ── 狀態 ──
let currentLocId = null;
const isMobile = window.innerWidth < 768;

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
    gainNode = audioCtx.createGain();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    startPulse();
}

async function playSound(url) {
    initAudio();

    // 淡出舊聲音
    if (gainNode && currentSource) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        await new Promise(r => setTimeout(r, 1000));
    }

    try {
        const res = await fetch(url);
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        if (currentSource) { try { currentSource.stop(); } catch(e) {} }

        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = buffer;
        currentSource.loop = true;
        currentSource.connect(gainNode);

        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 3);
        currentSource.start();
    } catch (e) {
        console.error('Audio error:', e);
    }
}

// ── 脈衝可視化 ──
const pulseWrap = document.getElementById('pulse-wrap');
const pulseRing = document.getElementById('pulse-ring');

function startPulse() {
    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
        const scale = 1 + (avg / 255) * 0.65;
        const glow = Math.round((avg / 255) * 14);
        pulseRing.style.transform = `scale(${scale.toFixed(3)})`;
        pulseRing.style.boxShadow = `0 0 ${glow}px rgba(255,255,255,0.5)`;
        requestAnimationFrame(draw);
    }
    draw();
}

// ── 標記點 ──
const customIcon = L.divIcon({
    className: 'glow-point',
    iconSize: [8, 8],
    iconAnchor: [4, 4]
});

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon })
        .addTo(map)
        .on('click', () => enterImmersive(loc));
});

// ── 進入沈浸模式 ──
function enterImmersive(loc) {
    currentLocId = loc.id;

    const bgImg    = document.getElementById('bg-image');
    const infoText = document.getElementById('info-text');
    const overlay  = document.getElementById('image-overlay');
    const stamp    = document.getElementById('stamp');

    // 重置郵戳動畫
    stamp.classList.remove('active', 'inactive');
    void stamp.offsetWidth; // reflow

    // 設定圖片
    bgImg.style.backgroundImage = `url('${loc.image}')`;
    bgImg.style.backgroundSize = window.innerWidth > window.innerHeight ? 'contain' : 'cover';
    bgImg.style.opacity = '0';
    bgImg.classList.remove('zooming');

    overlay.style.display = 'block';
    document.getElementById('back-btn').style.display = 'block';
    infoText.style.opacity = '0';

    // 圖片淡入 + 緩慢縮放
    requestAnimationFrame(() => {
        setTimeout(() => {
            bgImg.style.opacity = '0.72';
            bgImg.classList.add('zooming');
        }, 80);
    });

    // 文字延遲出現
    setTimeout(() => { infoText.style.opacity = '1'; }, 2200);

    // 填充資訊
    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText  = loc.desc;
    document.getElementById('stamp-loc').innerText   = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;

    // 郵戳蓋章（延遲，讓動畫感更獨立）
    setTimeout(() => { stamp.classList.add('active'); }, 800);

    // 顯示脈衝
    pulseWrap.classList.add('visible');

    // 播放聲音
    playSound(loc.audio);
}

// ── 返回 ──
document.getElementById('back-btn').addEventListener('click', exitImmersive);

function exitImmersive() {
    const bgImg    = document.getElementById('bg-image');
    const stamp    = document.getElementById('stamp');

    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('info-text').style.opacity = '0';
    pulseWrap.classList.remove('visible');

    bgImg.style.opacity = '0';
    bgImg.classList.remove('zooming');

    // 郵戳淡出
    stamp.classList.remove('active');
    stamp.classList.add('inactive');
    setTimeout(() => stamp.classList.remove('inactive'), 500);

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
