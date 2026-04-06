/**
 * 聲音郵局 (Sound Postcard) - 藝術增強版
 * 包含 8 個地點、節氣判斷、磨砂玻璃 UI、動態底噪
 */

const locations = [
    { id: "nara", name: "奈良・唐招提寺", coords: [34.6761, 135.7844], audio: "audio/nara.mp3", image: "images/nara.jpg", desc: "冬日午後的寺院，鳥鳴聲在古老的木造建築間迴盪，空氣中彷彿能聽見寧靜。", date: "2026-01-16" },
    { id: "fushimi", name: "京都・伏見稻荷", coords: [34.9671, 135.7727], audio: "audio/fushimi.mp3", image: "images/fushimi.jpg", desc: "千本鳥居旁的流水聲，午後的泉水帶著苔蘚的濕氣與山林的幽靜。", date: "2026-01-12" },
    { id: "arashiyama", name: "京都・嵐山", coords: [35.0094, 135.6667], audio: "audio/arashiyama.mp3", image: "images/arashiyama.jpg", desc: "渡月橋邊的風聲與桂川細浪，竹林深處偶爾傳來的葉片摩擦聲。", date: "2026-01-14" },
    { id: "takamatsu", name: "高松・瀨戶內海", coords: [34.3503, 134.0465], audio: "audio/takamatsu.mp3", image: "images/takamatsu.jpg", desc: "瀨戶內海的平靜海風，夾雜著遠處微弱的船笛聲，是港口特有的節奏。", date: "2026-03-11" },
    { id: "kanazawa", name: "金澤・雨聲", coords: [36.5621, 136.6627], audio: "audio/kanazawa.mp3", image: "images/kanazawa.jpg", desc: "北陸地區冬日常見的雨，落在鈴木大拙舘上的滴答聲。", date: "2026-03-03" },
    { id: "uji", name: "宇治・宇治川", coords: [34.8893, 135.8077], audio: "audio/uji.mp3", image: "images/uji.jpg", desc: "宇治橋下湍急的川流聲，伴隨著兩岸茶香，記錄下流動的時間。", date: "2026-01-17" },
    { id: "inapark", name: "長野・伊那公園", coords: [35.8361, 137.9711], audio: "audio/inapark.mp3", image: "images/inapark.jpg", desc: "信州高地的清晨，公園內高大松樹間的鳥鳴，空氣中仍帶著殘雪的涼意。", date: "2026-04-02" },
    { id: "inahigh", name: "長野・伊那北高中", coords: [35.8505, 137.9614], audio: "audio/inahigh.mp3", image: "images/inahigh.jpg", desc: "校園放學後的寧靜，遠處運動場的呼喊聲與南阿爾卑斯山下的微風。", date: "2026-04-03" }
];

// 簡易節氣判斷
function getSolarTerm(dateStr) {
    const month = new Date(dateStr).getMonth() + 1;
    const day = new Date(dateStr).getDate();
    if (month === 1 && day >= 5) return "小寒 (Lesser Cold)";
    if (month === 1 && day >= 20) return "大寒 (Great Cold)";
    if (month === 3 && day >= 5) return "驚蟄 (Awakening of Insects)";
    if (month === 3 && day >= 20) return "春分 (Spring Equinox)";
    if (month === 4 && day >= 4) return "清明 (Pure Brightness)";
    return "物候觀測中";
}

let currentLocId = null;
const isMobile = window.innerWidth < 768;

const map = L.map('map', {
    zoomControl: false, 
    maxBounds: [[20, 115], [50, 155]],
    minZoom: 4
}).setView([37.5, 137.5], isMobile ? 5 : 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CARTO'
}).addTo(map);

// Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx, gainNode, currentSource;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
    }
}

async function playSound(url) {
    initAudio();
    if (gainNode) gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

    try {
        const res = await fetch(url);
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        if (currentSource) currentSource.stop();
        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = buffer;
        currentSource.loop = true;
        currentSource.connect(gainNode);
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 3);
        currentSource.start();
    } catch (e) { console.error(e); }
}

const customIcon = L.divIcon({ className: 'glow-point', iconSize: [8, 8], iconAnchor: [4, 4] });

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon }).addTo(map).on('click', () => enterImmersive(loc));
});

function enterImmersive(loc) {
    currentLocId = loc.id;
    const bgImg = document.getElementById('bg-image');
    
    bgImg.style.backgroundImage = `url('${loc.image}')`;
    bgImg.style.backgroundSize = window.innerWidth > window.innerHeight ? "contain" : "cover";
    
    document.getElementById('image-overlay').style.display = 'block';
    document.getElementById('back-btn').style.display = 'block';

    setTimeout(() => {
        bgImg.style.opacity = "0.7"; 
        bgImg.classList.add('zooming');
    }, 100);

    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    document.getElementById('tech-info').innerText = `RECORDED ON ${loc.date} | 48KHZ 24BIT | NOISE REDUCTION OFF`;
    
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;
    document.getElementById('stamp-term').innerText = getSolarTerm(loc.date);
    document.getElementById('stamp').classList.add('active');
    
    playSound(loc.audio);
}

document.getElementById('back-btn').addEventListener('click', () => {
    const bgImg = document.getElementById('bg-image');
    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('stamp').classList.remove('active');
    bgImg.style.opacity = "0";
    bgImg.classList.remove('zooming');
    if (gainNode) gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
});

document.getElementById('surprise-btn').addEventListener('click', () => {
    const others = locations.filter(l => l.id !== currentLocId);
    const randomLoc = others[Math.floor(Math.random() * others.length)];
    document.getElementById('back-btn').click();
    setTimeout(() => {
        map.flyTo(randomLoc.coords, isMobile ? 7 : 9, { duration: 2.5 });
        setTimeout(() => enterImmersive(randomLoc), 2800);
    }, 600);
});
