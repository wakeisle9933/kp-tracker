// 전역 변수
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLanguage = localStorage.getItem('language') || 'ko';
let autoUpdateInterval = null;
let exchangeRate = 0;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initLanguage();
    // fetchAllData가 정의된 후 호출
    if (typeof fetchAllData !== 'undefined') {
        fetchAllData();
    } else {
        // kp-api.js가 로드될 때까지 대기
        setTimeout(function() {
            if (typeof fetchAllData !== 'undefined') {
                fetchAllData();
            }
        }, 100);
    }
});

// 테마 초기화
function initTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-stylesheet').href = '/css/kp-light-theme.css';
        document.querySelector('.theme-icon').textContent = '☀️';
    }
}

// 테마 토글
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-stylesheet').href = '/css/kp-light-theme.css';
        document.querySelector('.theme-icon').textContent = '☀️';
    } else {
        document.body.classList.remove('light-theme');
        document.getElementById('theme-stylesheet').href = '/css/kp-dark-theme.css';
        document.querySelector('.theme-icon').textContent = '🌙';
    }
}

// 언어 초기화
function initLanguage() {
    const select = document.querySelector('.language-select');
    select.value = currentLanguage;
    updateAllTranslations();
}

// 언어 변경
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateAllTranslations();
}

// 번역 업데이트
function updateAllTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation) {
            element.textContent = translation;
        }
    });
}

// 번역 데이터
const translations = {
    ko: {
        pageTitle: '김치 프리미엄 트래커',
        mainTabs: {
            realtime: '⚡ 실시간 김프',
            major: '🔥 주요 코인',
            all: '📊 전체 코인',
            settings: '⚙️ 설정'
        }
    },
    en: {
        pageTitle: 'Kimchi Premium Tracker',
        mainTabs: {
            realtime: '⚡ Real-time',
            major: '🔥 Major Coins',
            all: '📊 All Coins',
            settings: '⚙️ Settings'
        }
    }
};

// 번역 가져오기
function getTranslation(key) {
    const keys = key.split('.');
    let translation = translations[currentLanguage];
    
    for (const k of keys) {
        if (translation && translation[k]) {
            translation = translation[k];
        } else {
            return null;
        }
    }
    
    return translation;
}

// 메인 탭 전환
function showMainTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 모든 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    event.target.classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    // 탭별 초기화
    if (tabName === 'realtime') {
        fetchAllData();
    } else if (tabName === 'major') {
        fetchMajorCoins();
    } else if (tabName === 'all') {
        fetchAllCoins();
        // 전체 코인 탭 표시 시 필터 상태 유지
        setTimeout(() => {
            const currentFilter = document.querySelector('input[name="exchange-filter"]:checked')?.value || 'all';
            if (typeof updateTableColumns !== 'undefined') {
                updateTableColumns(currentFilter);
            }
        }, 100);
    }
}

// 자동 업데이트 토글
function toggleAutoUpdate() {
    const checkbox = document.getElementById('auto-update-check');
    
    if (checkbox.checked) {
        startAutoUpdate();
    } else {
        stopAutoUpdate();
    }
}

// 자동 업데이트 시작
function startAutoUpdate() {
    stopAutoUpdate();
    fetchAllData();
    
    // 설정에서 지정한 주기 사용 (기본값 30초)
    const refreshInterval = localStorage.getItem('refreshInterval') || 30;
    const intervalMs = refreshInterval * 1000;
    
    autoUpdateInterval = setInterval(fetchAllData, intervalMs);
    console.log(`자동 업데이트 시작: ${refreshInterval}초마다`);
}

// 자동 업데이트 중지
function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
}

// 숫자 포맷팅
function formatNumber(num) {
    if (!num && num !== 0) return '-';
    // 숫자를 문자열로 변환 후 정수 부분만 천 단위 쉼표 추가
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

// 가격 포맷팅
function formatPrice(price, currency = 'KRW') {
    if (!price) return '-';
    
    if (currency === 'KRW') {
        // KRW 가격은 정수로 표시 (실제 거래소 표시 방식)
        return '₩' + formatNumber(Math.round(price));
    } else if (currency === 'USD' || currency === 'USDT') {
        // USDT 가격은 소수점 자리수를 가격 크기에 따라 동적으로 결정
        if (price < 0.01) {
            return '$' + price.toFixed(5);  // 매우 작은 가격은 5자리
        } else if (price < 0.1) {
            return '$' + price.toFixed(4);  // 작은 가격은 4자리
        } else if (price < 1) {
            return '$' + price.toFixed(3);  // 1달러 미만은 3자리
        } else {
            return '$' + formatNumber(price.toFixed(2));  // 1달러 이상은 2자리
        }
    }
    
    return formatNumber(price);
}

// 퍼센트 포맷팅
function formatPercent(value) {
    if (!value && value !== 0) return '-';
    
    const percent = value.toFixed(2);
    if (value > 0) {
        return '+' + percent + '%';
    }
    return percent + '%';
}

// 김프 계산
function calculatePremium(krwPrice, usdPrice, exchangeRate) {
    if (!krwPrice || !usdPrice || !exchangeRate) return null;
    
    const usdToKrw = usdPrice * exchangeRate;
    const premium = ((krwPrice - usdToKrw) / usdToKrw) * 100;
    
    return premium;
}

// 시간 포맷팅
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

// 현재 시간 업데이트
function updateCurrentTime() {
    const now = new Date();
    const timeString = formatTime(now);
    document.getElementById('last-update-time').textContent = timeString;
}

// 로딩 상태 표시
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        // rate-value나 premium-percent 클래스가 있는 경우 처리
        const targetElement = element.querySelector('.rate-value') || 
                            element.querySelector('.premium-percent') || 
                            element;
        targetElement.innerHTML = '<div class="loading"></div>';
    }
}

// 에러 표시
function showError(message) {
    console.error(message);
    // 에러 알림 표시 (나중에 구현)
}

// 설정 저장
function saveSettings() {
    const alertEnabled = document.getElementById('alert-enabled').checked;
    const alertThreshold = document.getElementById('alert-threshold').value;
    const refreshInterval = document.getElementById('refresh-interval').value;
    
    localStorage.setItem('alertEnabled', alertEnabled);
    localStorage.setItem('alertThreshold', alertThreshold);
    localStorage.setItem('refreshInterval', refreshInterval);
    
    // 성공 메시지 표시
    alert(`설정이 저장되었습니다!\n새로고침 주기: ${refreshInterval}초`);
    
    // 자동 업데이트가 켜져 있으면 새 간격으로 재시작
    if (document.getElementById('auto-update-check') && 
        document.getElementById('auto-update-check').checked) {
        startAutoUpdate();
    }
}

// 설정 로드
function loadSettings() {
    const alertEnabled = localStorage.getItem('alertEnabled') === 'true';
    const alertThreshold = localStorage.getItem('alertThreshold') || 3;
    const refreshInterval = localStorage.getItem('refreshInterval') || 30;
    
    document.getElementById('alert-enabled').checked = alertEnabled;
    document.getElementById('alert-threshold').value = alertThreshold;
    document.getElementById('refresh-interval').value = refreshInterval;
}