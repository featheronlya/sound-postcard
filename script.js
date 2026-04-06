// 1. 初始化地圖，設為深色風格 (使用 CartoDB 提供的免費深色地圖)
const map = L.map('map').setView([35.0, 135.7], 7); 

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMapers'
}).addTo(map);

// 2. 定義你的聲音數據庫
const locations = [
    {
        name: "Kyoto・伏見稻荷・流水",
        coords: [34.9671, 135.7727],
        audio: "audio/fushimi.mp3",
        image: "images/fushimi.jpg",
        desc: "record on 2026.01.12 "
    },
    

    {
    name: "Nara・唐招提寺・bird",
    coords: [34.6761, 135.7844],
    audio: "audio/nara_toshodaiji.mp3", // 確保文件名對應
    image: "images/nara.jpg",
    desc: "record on 2026.01.16 "
}

];

// 3. 將點位加入地圖
locations.forEach(loc => {
    const marker = L.marker(loc.coords).addTo(map);
    
    marker.on('click', () => {
        // 更新郵票卡片內容
        document.getElementById('pc-title').innerText = loc.name;
        document.getElementById('pc-desc').innerText = loc.desc;
        document.getElementById('pc-image').src = loc.image;
        document.getElementById('pc-coord').innerText = `LOC: ${loc.coords[0]}, ${loc.coords[1]}`;
        
        const player = document.getElementById('audio-player');
        player.src = loc.audio;
        player.play();
        
        document.getElementById('postcard').style.display = 'block';
        map.flyTo(loc.coords, 13); // 點擊後地圖平滑縮放至該處
    });
});