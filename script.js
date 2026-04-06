/**
 * 聲音郵局 (Sound Postcard) - 地圖優化版
 * 修復：手機顯示完整日本、更換地圖樣式、隨機重複問題
 */

const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.jpg",
        desc: "2026.01.16。冬日午後的寺院，鳥鳴聲在古老的木造建築間迴盪，空氣中彷彿能聽見寧靜。"
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
        id: "takamatsu",
        name: "高松・瀨戶內海",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.jpg",
        desc: "2026.3.11。瀨戶內海的平靜海風，夾雜著遠處微弱的船笛聲，是港口特有的節奏。"
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
        desc: "2026.1.17。宇治橋下湍急的川流聲，伴隨著兩岸茶香，記錄下流動的時間。"
    }
];

let currentLocId = null;

// --- 關鍵修改：自動判斷螢幕寬度來決定初始縮放 ---
const isMobile = window.innerWidth < 768;
const initialZoom = isMobile ? 5 : 6; // 手機用 5 (看更廣), 電腦用 6
const initialCenter = [37.5, 137.5]; // 稍微往北偏一點，讓日本列島居中

const map = L.map('map', {
    zoomControl: false, 
    maxBounds: [[20, 115], [50, 155]], // 放寬邊界限制，讓移動更順暢
    minZoom: 4,
    maxZoom: 12
}).setView(initialCenter, initialZoom);

// --- 樣式更換：你可以更換下面的網址來切換地圖風格 ---
// 這裡換成了更乾淨的深色樣式 (Dark Matter)
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '© CARTO'
}).addTo(map);

// Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let currentBufferSource;
let gainNode;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
    }
}

async function playSound(url) {
    initAudio();
    if (gainNode) gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (currentBufferSource) currentBufferSource.stop();
        
        currentBufferSource = audioCtx.createBufferSource();
        currentBufferSource.buffer = audioBuffer;
        currentBufferSource.loop = true;
        currentBufferSource.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2);
        currentBufferSource.start();
    } catch (err) {
        console.error("音訊加載失敗:", url, err);
    }
}

// 地圖標記
const customIcon = L.divIcon({ className: 'glow-point', iconSize: [12, 12], iconAnchor: [6, 6] });

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon }).addTo(map).on('click', () => enterImmersive(loc));
});

// 進入沉浸模式
function enterImmersive(loc) {
    currentLocId = loc.id;
    const overlay = document.getElementById('image-overlay');
    const bgImg = document.getElementById('bg-image');
    const backBtn = document.getElementById('back-btn');
    const stamp = document.getElementById('stamp');

    bgImg.style.backgroundImage = `url('${loc.image}')`;
    
    // 電腦橫屏用 contain，手機豎屏用 cover
    if (window.innerWidth > window.innerHeight) {
        bgImg.style.backgroundSize = "contain";
    } else {
        bgImg.style.backgroundSize = "cover";
    }

    overlay.style.display = 'block';
    backBtn.style.display = 'block';

    setTimeout(() => {
        bgImg.style.opacity = "0.7"; 
        bgImg.classList.add('zooming');
    }, 50);

    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;
    stamp.classList.add('active');
    
    playSound(loc.audio);
}

// 返回地圖
document.getElementById('back-btn').addEventListener('click', () => {
    const bgImg = document.getElementById('bg-image');
    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('stamp').classList.remove('active');
    
    bgImg.style.opacity = "0";
    bgImg.classList.remove('zooming');
    currentLocId = null;

    if (gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        setTimeout(() => { if (currentBufferSource) currentBufferSource.stop(); }, 1000);
    }
});

// 隨機按鈕
document.getElementById('surprise-btn').addEventListener('click', () => {
    const otherLocations = locations.filter(l => l.id !== currentLocId);
    if (otherLocations.length === 0) return; // 如果只有一個點，就不跳轉
    
    const randomLoc = otherLocations[Math.floor(Math.random() * otherLocations.length)];
    
    // 如果在沉浸模式，先退出
    document.getElementById('back-btn').click();

    setTimeout(() => {
        // 跳轉時的縮放層級：如果是手機跳到 7，電腦跳到 9
        const jumpZoom = isMobile ? 7 : 9;
        map.flyTo(randomLoc.coords, jumpZoom, { animate: true, duration: 2 });
        setTimeout(() => enterImmersive(randomLoc), 2200);
    }, 500);
});
