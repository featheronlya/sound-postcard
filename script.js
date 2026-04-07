/**
 * 聲音郵局 (Sound Postcard)
 * 信封開蓋 → 照片從信封尺寸放大至全屏
 * 每個地點有專屬信封顏色
 * 郵戳退出時正確隱藏
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

// ── 狀態 ──
let currentLocId = null;
const isMobile   = window.innerWidth < 768;

// ── 引導頁 ──
document.getElementById('intro').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    intro.classList.add('fade-out');
    setTimeout(() => { intro.style.display = 'none'; }, 1900);
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
        currentSource = audioCtx.createBufferSource();
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
        pulseRing.style.transform = `scale(${(1 + ratio * 1.2).toFixed(3)})`;
        pulseRing.style.boxShadow = `0 0 ${Math.round(ratio*22)}px rgba(255,255,255,${(ratio*0.9).toFixed(2)})`;
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

// ── 郵戳輔助（cloneNode 保證每次動畫重播） ──
function triggerStamp(loc) {
    const old   = document.getElementById('stamp');
    const fresh = old.cloneNode(true);
    fresh.id    = 'stamp';
    // 確保初始完全隱藏
    fresh.style.cssText = 'opacity:0; transform:rotate(-6deg) scale(1.9); transition:none;';
    old.parentNode.replaceChild(fresh, old);

    // 更新內容
    fresh.querySelector('#stamp-loc').innerText   = loc.name.split('・')[0];
    fresh.querySelector('#stamp-coord').innerText =
        `${loc.coords[0]}° N, ${loc.coords[1]}° E`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
        fresh.classList.add('active');
    }));
}

// 隱藏郵戳（直接設 style，不依賴 class）
function hideStamp() {
    const stamp = document.getElementById('stamp');
    // 移除 active class，讓 transition 生效
    stamp.classList.remove('active');
    // 強制設定隱藏狀態
    stamp.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    stamp.style.opacity    = '0';
    stamp.style.transform  = 'rotate(-6deg) scale(0.85)';
}

// ── 進入沈浸模式 ──
function enterImmersive(loc) {
    currentLocId = loc.id;

    const overlay = document.getElementById('image-overlay');
    const stage   = document.getElementById('envelope-stage');
    const flap    = document.getElementById('flap');
    const wrap    = document.getElementById('photo-wrap');
    const bgImg   = document.getElementById('bg-image');
    const info    = document.getElementById('info-text');
    const root    = document.documentElement;

    // 注入信封顏色
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

    // 填充內容
    bgImg.src = loc.image;
    bgImg.alt = loc.name;
    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText  = loc.desc;

    // 打開遮罩
    overlay.classList.add('open');
    overlay.classList.remove('phase-photo');

    requestAnimationFrame(() => {
        overlay.classList.add('phase-envelope');
    });

    document.getElementById('back-btn').style.display = 'block';
    pulseWrap.classList.add('visible');

    // 播放聲音（與動畫並行）
    playSound(loc.audio);

    // ── 動畫時間軸 ──
    // 0.5s：信封蓋打開
    setTimeout(() => { flap.classList.add('open'); }, 500);

    // 1.5s：照片開始從信封尺寸放大
    setTimeout(() => {
        bgImg.onload = startPhotoExpand;
        if (bgImg.complete) startPhotoExpand();
        else bgImg.onload = startPhotoExpand;

        function startPhotoExpand() {
            bgImg.onload = null;
            // 先讓照片在信封尺寸顯示
            wrap.style.opacity = '1';
            // 下一幀開始放大
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    wrap.classList.add('expand');
                    overlay.classList.add('phase-photo');
                    // 信封淡出
                    setTimeout(() => { stage.classList.add('hidden'); }, 400);
                });
            });
        }
    }, 1500);

    // 2.8s：文字淡入
    setTimeout(() => { info.style.opacity = '1'; }, 2800);

    // 3.6s：郵戳蓋下
    setTimeout(() => triggerStamp(loc), 3600);
}

// ── 退出 ──
document.getElementById('back-btn').addEventListener('click', exitImmersive);

function exitImmersive() {
    const overlay = document.getElementById('image-overlay');
    const stage   = document.getElementById('envelope-stage');
    const wrap    = document.getElementById('photo-wrap');
    const flap    = document.getElementById('flap');

    // 立刻隱藏郵戳
    hideStamp();

    overlay.classList.remove('open', 'phase-envelope', 'phase-photo');
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('info-text').style.opacity = '0';
    pulseWrap.classList.remove('visible');

    // 重置信封和照片
    wrap.classList.remove('expand');
    wrap.style.opacity = '0';
    stage.classList.remove('visible', 'hidden');
    flap.classList.remove('open');

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
