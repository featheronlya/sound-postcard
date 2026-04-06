/**
 * 聲音郵局 - 加長蓋印動效版
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
    { id: "chofu", name: "調布・花火大會", coords: [35.6385, 139.5286], audio: "audio/chofu.mp3", image: "images/chofu.jpg", desc: "2025.09.20。多摩川岸邊的夏末秋初，巨大的花火在夜空中綻放，震撼的爆炸聲劃破靜謐。" },
    { id: "hitotsubashi", name: "國立・一橋祭", coords: [35.6946, 139.4442], audio: "audio/hitotsubashi.mp3", image: "images/hitotsubashi.jpg", desc: "2025.11.22。深秋的校園祭典，人們圍在一起歡快跳舞，充滿溫度的歡笑與節奏。" }
];

let currentLocId = null;
const isMobile = window.innerWidth < 768;

const introEl = document.getElementById('intro');
introEl.addEventListener('click', () => {
    introEl.classList.add('fade-out');
    setTimeout(() => { introEl.style.display = 'none'; }, 1500);
});

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    maxBounds: [[20, 110], [50, 160]],
    minZoom: 4
}).setView([36.5, 138.5], isMobile ? 5 : 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

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
    if (gainNode) {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    }
    try {
        const res = await fetch(url);
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        if (currentSource) try { currentSource.stop(); } catch(e){}
        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = buffer;
        currentSource.loop = true;
        currentSource.connect(gainNode);
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2);
        currentSource.start(0);
    } catch(e){}
}

function startPulse() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const ring = document.getElementById('pulse-ring');
    function draw() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a,b)=>a+b,0)/data.length;
        const s = 1 + (avg/255)*1.8; // 增加靈敏度
        ring.style.transform = `scale(${s.toFixed(2)})`;
        requestAnimationFrame(draw);
    }
    draw();
}

const customIcon = L.divIcon({ className: 'glow-point', iconSize: [12, 12], iconAnchor: [6, 6] });

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon }).addTo(map).on('click', (e) => {
        map.flyTo(e.latlng, isMobile ? 8 : 9, { duration: 1.5 });
        setTimeout(() => enterImmersive(loc), 1600);
    });
});

function enterImmersive(loc) {
    currentLocId = loc.id;
    const bgImg = document.getElementById('bg-image');
    const infoText = document.getElementById('info-text');
    const stamp = document.getElementById('stamp');

    stamp.classList.remove('stamp-effect');
    void stamp.offsetWidth;

    bgImg.style.backgroundImage = `url('${loc.image}')`;
    bgImg.style.backgroundSize = isMobile ? 'cover' : 'contain';
    bgImg.style.opacity = '0';
    bgImg.classList.remove('zooming');

    document.getElementById('image-overlay').style.display = 'block';
    document.getElementById('back-btn').style.display = 'block';
    infoText.style.opacity = '0';

    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;

    requestAnimationFrame(() => {
        setTimeout(() => {
            bgImg.style.opacity = '0.85';
            bgImg.classList.add('zooming');
        }, 50);
    });

    // 延遲視覺出現順序：為了配合更長的郵戳動畫，我們稍微調整間隔
    setTimeout(() => { stamp.classList.add('stamp-effect'); }, 600);
    setTimeout(() => { infoText.style.opacity = '1'; }, 1800); 

    document.getElementById('pulse-wrap').style.opacity = '1';
    playSound(loc.audio);
}

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('pulse-wrap').style.opacity = '0';
    if(gainNode) gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    currentLocId = null;
});

document.getElementById('surprise-btn').addEventListener('click', () => {
    const pool = locations.filter(l => l.id !== currentLocId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    map.flyTo(pick.coords, isMobile ? 8 : 9, { duration: 2 });
    setTimeout(() => enterImmersive(pick), 2200);
});
