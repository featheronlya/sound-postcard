/**
 * 聲音郵局 (Sound Postcard) - 記錄完整版
 */

const locations = [
    { id: "nara", name: "奈良・唐招提寺", coords: [34.6761, 135.7844], audio: "audio/nara.mp3", image: "images/nara.jpg", desc: "2026.01.16。冬日午後的寺院，鳥鳴聲在木造建築間迴盪，空氣中彷彿能聽見寧靜。" },
    { id: "fushimi", name: "京都・伏見稻荷", coords: [34.9671, 135.7727], audio: "audio/fushimi.mp3", image: "images/fushimi.jpg", desc: "2026.1.12。千本鳥居旁的流水聲，午後的泉水帶著苔蘚的濕氣與山林的幽靜。" },
    { id: "arashiyama", name: "京都・嵐山", coords: [35.0094, 135.6667], audio: "audio/arashiyama.mp3", image: "images/arashiyama.jpg", desc: "2026.1.14。渡月橋邊的風聲與桂川細浪，竹林深處偶爾傳來的葉片摩擦聲。" },
    { id: "takamatsu", name: "高松・高松港", coords: [34.3503, 134.0465], audio: "audio/takamatsu.mp3", image: "images/takamatsu.jpg", desc: "2026.3.11。港口的平靜海風，夾雜著遠處微弱的船笛聲。" },
    { id: "kanazawa", name: "金澤・雨聲", coords: [36.5621, 136.6627], audio: "audio/kanazawa.mp3", image: "images/kanazawa.jpg", desc: "2026.3.3。北陸地區冬日常見的雨，落在鈴木大拙舘上的滴答聲。" },
    { id: "uji", name: "宇治・宇治川", coords: [34.8893, 135.8077], audio: "audio/uji.mp3", image: "images/uji.jpg", desc: "2026.1.17。宇治橋下湍急的川流聲，伴隨著兩岸茶香。" },
    { id: "inapark", name: "長野・伊那公園", coords: [35.8361, 137.9711], audio: "audio/inapark.mp3", image: "images/inapark.jpg", desc: "2026.2.27。信州高地的清晨，公園內高大樹木間的鳥鳴，空氣帶著涼意。" },
    { id: "inahigh", name: "長野・伊那北高中", coords: [35.8505, 137.9614], audio: "audio/inahigh.mp3", image: "images/inahigh.jpg", desc: "2026.2.27。校園放學後的寧靜與南阿爾卑斯山的風。" },
    { id: "chofu", name: "調布・花火大會", coords: [35.6385, 139.5286], audio: "audio/chofu.mp3", image: "images/chofu.jpg", desc: "2025.09.20。多摩川岸邊的夏末秋初，巨大的花火在夜空中綻放。" },
    { id: "hitotsubashi", name: "國立・一橋祭", coords: [35.6946, 139.4442], audio: "audio/hitotsubashi.mp3", image: "images/hitotsubashi.jpg", desc: "2025.11.22。深秋的校園祭典，人們圍在一起歡快跳舞，充滿溫度的歡笑與節奏。" }
];

let currentLocId = null;
const isMobile = window.innerWidth < 768;

// --- 引導頁 ---
const introEl = document.getElementById('intro');
introEl.addEventListener('click', () => {
    introEl.classList.add('fade-out');
    setTimeout(() => { introEl.style.display = 'none'; }, 1800);
});

// --- 地圖 ---
const map = L.map('map', {
    zoomControl: false,
    maxBounds: [[20, 110], [50, 160]],
    minZoom: 4
}).setView([36.5, 138.5], isMobile ? 5 : 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CARTO'
}).addTo(map);

// --- 音頻與脈衝分析 ---
let audioCtx, gainNode, analyser, currentSource;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    startPulseLogic();
}

async function playSound(url) {
    initAudio();
    if (gainNode) {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    }

    try {
        const res = await fetch(url);
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        if (currentSource) { try { currentSource.stop(); } catch(e) {} }

        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = buffer;
        currentSource.loop = true;
        currentSource.connect(gainNode);

        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2.5);
        currentSource.start(0);
    } catch (e) { console.error('Audio load error:', e); }
}

function startPulseLogic() {
    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    const ring = document.getElementById('pulse-ring');
    function draw() {
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for(let i = 0; i < dataArr.length; i++) { sum += dataArr[i]; }
        const avg = sum / dataArr.length;

        // 優化：放大靈敏度，讓圓點跳動更明顯
        const sensitivity = 1.3; 
        const scale = 1 + (avg / 255) * sensitivity;
        const glow = (avg / 255) * 35; 
        
        ring.style.transform = `scale(${scale.toFixed(3)})`;
        ring.style.boxShadow = `0 0 ${10 + glow}px rgba(255,255,255,${0.4 + (avg/200)})`;
        requestAnimationFrame(draw);
    }
    draw();
}

// --- 交互邏輯 ---
const customIcon = L.divIcon({ className: 'glow-point', iconSize: [8, 8], iconAnchor: [4, 4] });

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon }).addTo(map).on('click', () => enterImmersive(loc));
});

function enterImmersive(loc) {
    currentLocId = loc.id;
    const bgImg = document.getElementById('bg-image');
    const infoText = document.getElementById('info-text');
    const stamp = document.getElementById('stamp');

    // 重置動效
    stamp.classList.remove('stamp-effect');
    void stamp.offsetWidth; 

    bgImg.style.backgroundImage = `url('${loc.image}')`;
    bgImg.style.backgroundSize = window.innerWidth > window.innerHeight ? 'contain' : 'cover';
    bgImg.style.opacity = '0';
    bgImg.classList.remove('zooming');

    document.getElementById('image-overlay').style.display = 'block';
    document.getElementById('back-btn').style.display = 'block';
    infoText.style.opacity = '0';

    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;

    // 優化：圖片幾乎即時出現 (20ms 延遲)
    requestAnimationFrame(() => {
        setTimeout(() => {
            bgImg.style.opacity = '0.75';
            bgImg.classList.add('zooming');
        }, 20);
    });

    // 郵戳稍微提早 (0.4s)
    setTimeout(() => { stamp.classList.add('stamp-effect'); }, 400);
    // 文字加速 (1.2s)
    setTimeout(() => { infoText.style.opacity = '1'; }, 1200);

    document.getElementById('pulse-wrap').style.opacity = '1';
    playSound(loc.audio);
}

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('pulse-wrap').style.opacity = '0';
    document.getElementById('stamp').classList.remove('stamp-effect');
    
    if (gainNode) {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    }
    currentLocId = null;
});

document.getElementById('surprise-btn').addEventListener('click', () => {
    const pool = locations.filter(l => l.id !== currentLocId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (currentLocId) document.getElementById('back-btn').click();
    
    setTimeout(() => {
        map.flyTo(pick.coords, isMobile ? 7 : 9, { duration: 2 });
        setTimeout(() => enterImmersive(pick), 2200);
    }, 400);
});
