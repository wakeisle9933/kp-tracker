// 주요 코인 테이블 렌더링
function renderMajorCoinsTable() {
    const tbody = document.getElementById('major-coins-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const coins = ['btc', 'eth', 'usdt'];
    const coinNames = {
        btc: '비트코인 (BTC)',
        eth: '이더리움 (ETH)',
        usdt: '테더 (USDT)'
    };
    
    coins.forEach(coin => {
        if (!window.coinData || !window.coinData[coin]) return;
        
        const data = window.coinData[coin];
        const row = document.createElement('tr');
        
        // 코인명
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<strong>${coinNames[coin]}</strong>`;
        row.appendChild(nameCell);
        
        // 업비트 가격
        const upbitCell = document.createElement('td');
        upbitCell.textContent = formatPrice(data.upbit || 0);
        row.appendChild(upbitCell);
        
        // 빗썸 가격
        const bithumbCell = document.createElement('td');
        bithumbCell.textContent = formatPrice(data.bithumb || 0);
        row.appendChild(bithumbCell);
        
        // 바이낸스 USD 가격
        const binanceUsdCell = document.createElement('td');
        binanceUsdCell.textContent = formatPrice(data.binance || 0, 'USD');
        row.appendChild(binanceUsdCell);
        
        // 바이낸스 KRW 환산
        const binanceKrwCell = document.createElement('td');
        binanceKrwCell.textContent = formatPrice(data.binanceKrw || 0);
        row.appendChild(binanceKrwCell);
        
        // 업비트 김프
        const upbitPremiumCell = document.createElement('td');
        if (data.upbit && data.binance && exchangeRate) {
            const premium = calculatePremium(data.upbit, data.binance, exchangeRate);
            upbitPremiumCell.innerHTML = `<span class="${getPremiumClass(premium)}">${formatPercent(premium)}</span>`;
        } else {
            upbitPremiumCell.textContent = '-';
        }
        row.appendChild(upbitPremiumCell);
        
        // 빗썸 김프
        const bithumbPremiumCell = document.createElement('td');
        if (data.bithumb && data.binance && exchangeRate) {
            const premium = calculatePremium(data.bithumb, data.binance, exchangeRate);
            bithumbPremiumCell.innerHTML = `<span class="${getPremiumClass(premium)}">${formatPercent(premium)}</span>`;
        } else {
            bithumbPremiumCell.textContent = '-';
        }
        row.appendChild(bithumbPremiumCell);
        
        tbody.appendChild(row);
    });
}

// 전체 코인 테이블 렌더링
function renderAllCoinsTable(coinsData) {
    const tbody = document.getElementById('all-coins-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    coinsData.forEach(coin => {
        const row = document.createElement('tr');
        
        // 코인명
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<strong>${coin.name}</strong>`;
        row.appendChild(nameCell);
        
        // 업비트 가격
        const upbitCell = document.createElement('td');
        upbitCell.textContent = coin.upbitPrice ? formatPrice(coin.upbitPrice) : '-';
        row.appendChild(upbitCell);
        
        // 빗썸 가격
        const bithumbCell = document.createElement('td');
        bithumbCell.textContent = coin.bithumbPrice ? formatPrice(coin.bithumbPrice) : '-';
        row.appendChild(bithumbCell);
        
        // 바이낸스 가격
        const binanceCell = document.createElement('td');
        binanceCell.textContent = coin.binancePrice ? formatPrice(coin.binancePrice, 'USD') : '-';
        row.appendChild(binanceCell);
        
        // 김프
        const premiumCell = document.createElement('td');
        if (coin.premium !== null) {
            premiumCell.innerHTML = `<span class="${getPremiumClass(coin.premium)}">${formatPercent(coin.premium)}</span>`;
        } else {
            premiumCell.textContent = '-';
        }
        row.appendChild(premiumCell);
        
        // 상태
        const statusCell = document.createElement('td');
        statusCell.innerHTML = `<span class="status-badge status-${coin.status}">${coin.status}</span>`;
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
    });
}

// 차트 렌더링 (추후 구현)
function renderPremiumChart(data) {
    // Chart.js를 사용한 차트 구현 예정
    console.log('차트 렌더링:', data);
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    
    // 컨테이너 첫 부분에 삽입
    const container = document.querySelector('.container');
    container.insertBefore(notification, container.firstChild);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// 김프 알림 체크
function checkPremiumAlert() {
    const alertEnabled = localStorage.getItem('alertEnabled') === 'true';
    const alertThreshold = parseFloat(localStorage.getItem('alertThreshold')) || 3;
    
    if (!alertEnabled || !window.coinData) return;
    
    // BTC 김프 체크
    if (window.coinData.btc && window.coinData.btc.upbit && window.coinData.btc.binance) {
        const premium = calculatePremium(window.coinData.btc.upbit, window.coinData.btc.binance, exchangeRate);
        if (Math.abs(premium) > alertThreshold) {
            showNotification(`⚠️ BTC 김프가 ${formatPercent(premium)}입니다!`, 'warning');
        }
    }
    
    // ETH 김프 체크
    if (window.coinData.eth && window.coinData.eth.upbit && window.coinData.eth.binance) {
        const premium = calculatePremium(window.coinData.eth.upbit, window.coinData.eth.binance, exchangeRate);
        if (Math.abs(premium) > alertThreshold) {
            showNotification(`⚠️ ETH 김프가 ${formatPercent(premium)}입니다!`, 'warning');
        }
    }
}

// 실시간 업데이트 애니메이션
function animateUpdate(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 2000);
    }
}

// 빈 상태 표시
function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
    }
}

// 테이블 정렬 기능
function sortTable(tableId, column, ascending = true) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.children[column].textContent;
        const bValue = b.children[column].textContent;
        
        // 숫자 정렬
        if (!isNaN(aValue) && !isNaN(bValue)) {
            return ascending ? aValue - bValue : bValue - aValue;
        }
        
        // 문자열 정렬
        return ascending ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
    });
    
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// 프로그레스 바 생성
function createProgressBar(percentage) {
    return `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%">
                ${percentage.toFixed(1)}%
            </div>
        </div>
    `;
}

// 통계 카드 렌더링
function renderStatsCard(title, value, change) {
    return `
        <div class="stats-card">
            <div class="stats-title">${title}</div>
            <div class="stats-value">${value}</div>
            ${change ? `<div class="stats-change ${change > 0 ? 'positive' : 'negative'}">${formatPercent(change)}</div>` : ''}
        </div>
    `;
}

// 페이지 초기화 시 렌더링
document.addEventListener('DOMContentLoaded', function() {
    // 설정 로드
    loadSettings();
    
    // 초기 렌더링
    if (window.location.hash === '#major') {
        renderMajorCoinsTable();
    }
});