/**
 * 聲音郵局 (Sound Postcard) - 完整邏輯
 * 包含：Leaflet 地圖初始化、Web Audio API 處理、沉浸式切換
 */

// 1. 數據庫：請在此處增加或修改你的地點
const locations = [
    {
        id: "nara",
        name: "奈良・唐招提寺",
        coords: [34.6761, 135.7844],
        audio: "audio/nara.mp3",      // 確保 GitHub 上有此文件
        image: "images/nara.jpg",    // 確保 GitHub 上有此文件
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

// 2. 初始化地圖 (設置在日本中心，並限制縮放與邊界)
const map = L.map('map', {
    zoomControl: false, 
    maxBounds: [[24, 122], [46, 154]], 
    minZoom: 5
}).setView([35.2, 136.0], 6);

// 使用 CartoDB 的極簡深色地圖瓦片
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO'
}).addTo(map);

// 3. Web Audio API 設定 (實現高品質淡入淡出)
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
    
    // 如果正在播放，先淡出
    if (gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    }

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (currentBufferSource) {
            currentBufferSource.stop();
        }
        
        currentBufferSource = audioCtx.createBufferSource();
        currentBufferSource.buffer = audioBuffer;
        currentBufferSource.loop = true;
        currentBufferSource.connect(gainNode);
        
        // 開始播放並淡入
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2);
        currentBufferSource.start();
    } catch (err) {
        console.error("音頻加載失敗，請檢查路徑或 CORS 設定:", err);
    }
}

// 4. 自定義地圖標記 (閃爍的小圓點)
const customIcon = L.divIcon({ 
    className: 'glow-point', 
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// 5. 將地點加入地圖
locations.forEach(loc => {
    const marker = L.marker(loc.coords, { icon: customIcon }).addTo(map);
    
    // 點擊事件
    marker.on('click', () => {
        enterImmersive(loc);
    });
});

// 6. 進入沉浸式模式 (顯示圖片與播放聲音)
function enterImmersive(loc) {
    const overlay = document.getElementById('image-overlay');
    const bgImg = document.getElementById('bg-image');
    const backBtn = document.getElementById('back-btn');
    const stamp = document.getElementById('stamp');

    // 顯示容器
    overlay.style.display = 'block';
    backBtn.style.display = 'block';
    
    // 設定背景圖與動畫
    bgImg.style.backgroundImage = `url('${loc.image}')`;
    bgImg.classList.remove('zooming');
    setTimeout(() => bgImg.classList.add('zooming'), 100); 

    // 更新文字內容
    document.getElementById('loc-name').innerText = loc.name;
    document.getElementById('loc-desc').innerText = loc.desc;
    
    // 更新並顯示郵戳
    document.getElementById('stamp-loc').innerText = loc.name.split('・')[0];
    document.getElementById('stamp-coord').innerText = `${loc.coords[0]}° N, ${loc.coords[1]}° E`;
    stamp.classList.add('active');
    
    // 播放音頻
    playSound(loc.audio);
}

// 7. 返回地圖邏輯
document.getElementById('back-btn').addEventListener('click', () => {
    const overlay = document.getElementById('image-overlay');
    const backBtn = document.getElementById('back-btn');
    const stamp = document.getElementById('stamp');

    overlay.style.display = 'none';
    backBtn.style.display = 'none';
    stamp.classList.remove('active');

    // 聲音淡出並停止
    if (gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        setTimeout(() => {
            if (currentBufferSource) currentBufferSource.stop();
        }, 1000);
    }
});

// 8. 隨機按鈕 (Surprise Me)
document.getElementById('surprise-btn').addEventListener('click', () => {
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    // 地圖平滑飛行至目標
    map.flyTo(randomLoc.coords, 10, {
        animate: true,
        duration: 2
    });
    
    // 飛行結束後進入沉浸模式
    setTimeout(() => {
        enterImmersive(randomLoc);
    }, 2500);
});

// 9. 自動偵測夜間模式 (可選)
const hour = new Date().getHours();
if (hour >= 18 || hour <= 6) {
    console.log("夜間模式已啟動");
    // 這裡可以額外微調 UI 顏色
}
