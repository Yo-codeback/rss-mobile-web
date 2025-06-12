// DOM 元素
const alertItems = document.querySelectorAll('.alert-item');
const alertDetail = document.querySelector('.alert-detail');
const settingsPage = document.querySelector('.settings-page');
const backButton = document.querySelector('.back-button');
const settingsBackButton = document.querySelector('.settings-back-button');
const navItems = document.querySelectorAll('.nav-item');
const settingsSwitches = document.querySelectorAll('.switch input');

// 頁面狀態
let currentPage = 'alerts';

// 警報類型圖標映射
const alertIcons = {
    '地震速報': '🌋',
    '土石流': '⛰️',
    '疏散避難': '🏃',
    '海嘯警報': '🌊',
    '颱風警報': '🌀',
    '豪雨特報': '🌧️',
    'default': '⚠️'
};

// 獲取警報數據
async function fetchAlerts() {
    try {
        const response = await fetch('https://cbs.tw/files/rssatomfeed.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');
        
        // 只取前五個警報
        const alerts = Array.from(entries).slice(0, 5).map(entry => {
            const title = entry.getElementsByTagName('title')[0].textContent;
            const sent = entry.getElementsByTagName('sent')[0].textContent;
            const text = entry.getElementsByTagName('text')[0].textContent;
            const link = entry.getElementsByTagName('link')[0].getAttribute('href');
            const area = entry.getElementsByTagName('areaDesc')[0]?.textContent || '未指定區域';
            const sender = entry.getElementsByTagName('sender')[0].getElementsByTagName('value')[0].textContent;
            
            return {
                title,
                sent: new Date(sent).toLocaleString('zh-TW'),
                text,
                link,
                area,
                sender,
                icon: alertIcons[title] || alertIcons.default
            };
        });
        
        return alerts;
    } catch (error) {
        console.error('獲取警報數據失敗:', error);
        return [];
    }
}

// 渲染警報列表
async function renderAlerts() {
    const alertList = document.querySelector('.alert-list');
    const alerts = await fetchAlerts();
    
    alertList.innerHTML = alerts.map(alert => `
        <div class="alert-item" data-link="${alert.link}">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h3>${alert.title}</h3>
                <p class="alert-time">${alert.sent}</p>
                <p class="alert-summary">${alert.text}</p>
                <p class="alert-area">區域：${alert.area}</p>
                <p class="alert-sender">發布單位：${alert.sender}</p>
            </div>
        </div>
    `).join('');

    // 重新綁定事件監聽器
    document.querySelectorAll('.alert-item').forEach(item => {
        item.addEventListener('click', () => {
            const link = item.dataset.link;
            window.open(link, '_blank');
        });
    });
}

// 點擊警報項目顯示詳情
alertItems.forEach(item => {
    item.addEventListener('click', () => {
        alertDetail.classList.remove('hidden');
    });
});

// 返回按鈕功能
backButton.addEventListener('click', () => {
    alertDetail.classList.add('hidden');
});

// 設定頁面返回按鈕功能
settingsBackButton.addEventListener('click', () => {
    settingsPage.classList.add('hidden');
    currentPage = 'alerts';
    // 更新底部導航欄狀態
    navItems.forEach(nav => {
        if (nav.querySelector('.nav-text').textContent === '警報') {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });
});

// 底部導航切換
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有活動狀態
        navItems.forEach(nav => nav.classList.remove('active'));
        // 添加當前項目的活動狀態
        item.classList.add('active');

        // 切換頁面
        if (item.querySelector('.nav-text').textContent === '設定') {
            settingsPage.classList.remove('hidden');
            currentPage = 'settings';
        } else {
            settingsPage.classList.add('hidden');
            currentPage = 'alerts';
        }
    });
});

// 設定開關功能
settingsSwitches.forEach(switchInput => {
    switchInput.addEventListener('change', (e) => {
        const settingName = e.target.closest('.setting-item').querySelector('span').textContent;
        const isEnabled = e.target.checked;
        
        // 儲存設定到 localStorage
        localStorage.setItem(settingName, isEnabled);
        
        // 如果是深色模式設定，立即應用
        if (settingName === '深色模式') {
            document.body.classList.toggle('light-mode', !isEnabled);
        }

        // 如果是自動更新設定，設置定時更新
        if (settingName === '自動更新') {
            if (isEnabled) {
                startAutoUpdate();
            } else {
                stopAutoUpdate();
            }
        }
    });
});

// 自動更新功能
let updateInterval;

function startAutoUpdate() {
    // 每5分鐘更新一次
    updateInterval = setInterval(renderAlerts, 5 * 60 * 1000);
}

function stopAutoUpdate() {
    clearInterval(updateInterval);
}

// 載入儲存的設定
function loadSettings() {
    settingsSwitches.forEach(switchInput => {
        const settingName = switchInput.closest('.setting-item').querySelector('span').textContent;
        const savedValue = localStorage.getItem(settingName);
        if (savedValue !== null) {
            switchInput.checked = savedValue === 'true';
            
            // 如果是自動更新設定，啟動定時更新
            if (settingName === '自動更新' && savedValue === 'true') {
                startAutoUpdate();
            }
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderAlerts();
    loadSettings();
}); 