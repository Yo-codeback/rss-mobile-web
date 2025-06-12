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
    '地震': '🌋',
    '颱風': '🌀',
    '海嘯': '🌊',
    'default': '⚠️'
};

// 時鐘自動更新（只在 dashboard 存在時啟動）
function startClock() {
    function updateClock() {
        const now = new Date();
        const timeElement = document.querySelector('.dashboard-header .clock .time');
        const dateElement = document.querySelector('.dashboard-header .clock .date');
        if (timeElement && dateElement) {
            const time = now.toLocaleTimeString('zh-TW', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            const date = now.toLocaleDateString('zh-TW', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
            });
            timeElement.textContent = time;
            dateElement.textContent = date;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// 顯示錯誤訊息
function showError(message) {
    // 優先顯示在 dashboard 或 app alert-list 上方
    let container = document.querySelector('.dashboard-container .alerts-section') || document.querySelector('.app-container');
    if (!container) return;
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        container.prepend(errorDiv);
    }
    errorDiv.textContent = message;
}
function clearError() {
    let errorDiv = document.querySelector('.error-message');
    if (errorDiv) errorDiv.remove();
}

// 更新跑馬燈
function updateTicker(alerts) {
    const tickerContent = document.querySelector('.ticker-content');
    if (!alerts || alerts.length === 0) {
        tickerContent.textContent = '目前沒有新的警報';
        return;
    }

    // 將警報轉換為跑馬燈文字
    const tickerText = alerts.map(alert => {
        const icon = alertIcons[alert.type] || alertIcons.default;
        return `${icon} ${alert.title} | ${alert.time} | ${alert.area}`;
    }).join(' | ');

    // 重複文字以確保連續滾動
    tickerContent.textContent = `${tickerText} | ${tickerText}`;
}

// 更新統計數據
function updateStats(alerts) {
    const stats = {
        '地震': 0,
        '颱風': 0,
        '海嘯': 0
    };

    alerts.forEach(alert => {
        if (stats.hasOwnProperty(alert.type)) {
            stats[alert.type]++;
        }
    });

    // 更新統計卡片
    Object.entries(stats).forEach(([type, count]) => {
        const statValue = document.querySelector(`.stat-card:nth-child(${
            type === '地震' ? 1 : type === '颱風' ? 2 : 3
        }) .stat-value`);
        if (statValue) {
            statValue.textContent = count;
        }
    });
}

// 獲取警報數據
async function fetchAlerts() {
    try {
        const useProxy = localStorage.getItem('cors-proxy') === 'true';
        const proxy = 'https://cors-anywhere.herokuapp.com/';
        const url = 'https://cbs.tw/files/rssatomfeed.xml';
        const fetchUrl = useProxy ? proxy + url : url;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('伺服器回應錯誤');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');
        const alerts = [];
        for (let entry of entries) {
            const title = entry.getElementsByTagName('title')[0].textContent;
            const time = entry.getElementsByTagName('published')[0].textContent;
            const text = entry.getElementsByTagName('content')[0].textContent;
            const link = entry.getElementsByTagName('link')[0].getAttribute('href');
            let type = 'default';
            if (title.includes('地震')) type = '地震';
            else if (title.includes('颱風')) type = '颱風';
            else if (title.includes('海嘯')) type = '海嘯';
            const areaMatch = text.match(/地區：([^<]+)/);
            const senderMatch = text.match(/發送者：([^<]+)/);
            alerts.push({
                title,
                time: new Date(time),
                text,
                link,
                type,
                area: areaMatch ? areaMatch[1] : '未知地區',
                sender: senderMatch ? senderMatch[1] : '未知發送者'
            });
        }
        alerts.sort((a, b) => b.time - a.time);
        const latestFive = alerts.slice(0, 5).map(alert => ({
            ...alert,
            time: alert.time.toLocaleString('zh-TW')
        }));
        clearError();
        return latestFive;
    } catch (error) {
        showError('警報資料載入失敗，請稍後再試！\n' + error.message);
        return [];
    }
}

// 渲染警報列表
function renderAlerts(alerts) {
    if (!Array.isArray(alerts)) alerts = [];
    const alertList = document.querySelector('.alert-list');
    alertList.innerHTML = '';
    // 只顯示前五個警報
    const recentAlerts = alerts.slice(0, 5);
    recentAlerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        alertItem.innerHTML = `
            <div class="alert-icon">${alertIcons[alert.type] || alertIcons.default}</div>
            <div class="alert-content">
                <h3>${alert.title}</h3>
                <div class="alert-time">${alert.time}</div>
                <div class="alert-summary">${alert.text}</div>
                <div class="alert-area">地區：${alert.area}</div>
                <div class="alert-sender">發送者：${alert.sender}</div>
            </div>
        `;
        alertItem.addEventListener('click', () => {
            showAlertDetail(alert);
        });
        alertList.appendChild(alertItem);
    });
}

// 顯示警報詳情
function showAlertDetail(alert) {
    const detailPage = document.querySelector('.alert-detail');
    const detailTitle = detailPage.querySelector('h3');
    const detailTime = detailPage.querySelector('.detail-time');
    const detailText = detailPage.querySelector('.detail-text');
    const detailArea = detailPage.querySelector('.detail-area');
    const detailSender = detailPage.querySelector('.detail-sender');
    
    detailTitle.textContent = alert.title;
    detailTime.textContent = alert.time;
    detailText.textContent = alert.text;
    detailArea.textContent = `地區：${alert.area}`;
    detailSender.textContent = `發送者：${alert.sender}`;
    
    detailPage.classList.remove('hidden');
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

// 初始化應用
async function initApp() {
    // 啟動時鐘（只在 dashboard 存在時）
    if (document.querySelector('.dashboard-header .clock .time')) {
        startClock();
    }
    // 取得並顯示警報
    const alerts = await fetchAlerts();
    renderAlerts(alerts);
    updateTicker(alerts);
    updateStats(alerts);
    loadSettings();
    const settings = {
        'earthquake-notification': true,
        'typhoon-notification': true,
        'tsunami-notification': true,
        'dark-mode': true,
        'auto-update': true,
        'cors-proxy': false
    };
    Object.keys(settings).forEach(key => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
            checkbox.checked = localStorage.getItem(key) !== 'false';
            checkbox.addEventListener('change', () => {
                localStorage.setItem(key, checkbox.checked);
                if (key === 'auto-update') {
                    if (checkbox.checked) {
                        initApp();
                    }
                }
                if (key === 'cors-proxy') {
                    // 立即重新抓取警報
                    initApp();
                }
            });
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
}); 