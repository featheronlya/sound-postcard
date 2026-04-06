/**
 * 聲音郵局 (Sound Postcard) - 穩定版
 * 優化：解決圖片不顯示問題、強化淡入淡出效果
 */

// 1. 數據庫
const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",
        image: "images/nara.jpg",
        desc: "2026.01.16 記錄。冬日午後的寺院，鳥鳴聲在古老的木造建築間迴盪，空氣中彷彿能聽見寧靜。"
    },
    {
        id: "fushimi",
        name: "京都・伏見稻荷",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.jpg",
        desc: "千本鳥居旁的流水聲，清晨的泉水帶著苔蘚的濕氣與山林的幽靜。"
    },
    {
        id: "takamatsu",
        name: "高松・瀨戶內海",
        coords: [34.3503, 134.0465],
        audio: "audio/takamatsu.mp3",
        image: "images/takamatsu.jpg",
        desc: "瀨戶內海的平靜海風，夾雜著遠處微弱的船笛聲，是港口特有的節奏。"
    },
    {
        id: "kanazawa",
        name: "金澤・雨聲",
        coords: [36.5621, 136.6627],
        audio: "audio/kanazawa.mp3",
        image: "images/kanazawa.jpg",
        desc: "北陸地區常見的細雨，落在兼六園木質長椅上的滴答聲。"
    },
    {
        id: "uji",
        name: "宇治・宇治川",
        coords: [34.8893, 135.8077],
        audio: "audio/uji.mp3",
        image: "images/uji.jpg",
        desc: "宇治橋下湍急的川流聲，伴隨著兩岸茶香，記錄下流動的時間。"
    }
];

// 2. 初始化地圖
const map = L.map('map', {
    zoomControl: false, 
    maxBounds: [[24, 122], [46, 154]], 
    minZoom: 5
}).setView([35.2, 136.0], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CARTO'
}).addTo(map);

// 3. Web Audio API 設定
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

// 4. 地圖標記
const customIcon = L.divIcon({ className: 'glow-point', iconSize: [12, 12], iconAnchor: [6, 6] });

locations.forEach(loc => {
    L.marker(loc.coords, { icon: customIcon }).addTo(map).on('click', () => enterImmersive(loc));
});

// 5. 進入沉浸模式 (核心修正)
function enterImmersive(loc) {
    const overlay = document.getElementById('image-overlay');
    const bgImg = document.getElementById('bg-image');
    const backBtn = document.getElementById('back-btn');
    const stamp = document.getElementById('stamp');

    // 1. 先更換背景圖路徑
    bgImg.style.backgroundImage = `url('${loc.image}')`;
    
    // 2. 顯示容器
    overlay.style.display = 'block';
    backBtn.style.display = 'block';

    // 3. 強制觸發圖片顯示與動畫 (使用 setTimeout 確保渲染順序)
    setTimeout(() => {
        bgImg.style.opacity = "0.6"; // 直接給透明度
        bgImg.classList.add('zooming');
    }, 50);

    // 4. 更新文字
    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    
    // 5. 更新郵戳
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;
    stamp.classList.add('active');
    
    // 6. 播放聲音
    playSound(loc.audio);
}

// 6. 返回地圖
document.getElementById('back-btn').addEventListener('click', () => {
    const bgImg = document.getElementById('bg-image');
    document.getElementById('image-overlay').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('stamp').classList.remove('active');
    
    // 重置圖片狀態
    bgImg.style.opacity = "0";
    bgImg.classList.remove('zooming');

    if (gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        setTimeout(() => { if (currentBufferSource) currentBufferSource.stop(); }, 1000);
    }
});

// 7. 隨機按鈕
document.getElementById('surprise-btn').addEventListener('click', () => {
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    map.flyTo(randomLoc.coords, 10, { animate: true, duration: 2 });
    setTimeout(() => enterImmersive(randomLoc), 2500);
});
