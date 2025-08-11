// API 엔드포인트
const API_ENDPOINTS = {
    UPBIT_MARKETS: 'https://api.upbit.com/v1/market/all',
    UPBIT_TICKER: 'https://api.upbit.com/v1/ticker',
    BITHUMB_TICKER: 'https://api.bithumb.com/public/ticker/ALL_KRW',
    BINANCE_TICKER: 'https://api.binance.com/api/v3/ticker/price',
    EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/USD'
};

// 프록시 서버 (CORS 우회용) - 백엔드 API 사용
const USE_BACKEND_API = true;

// 전체 데이터 가져오기
async function fetchAllData() {
    try {
        // 로딩 표시
        showLoading('usd-krw-rate');
        showLoading('btc-premium');
        showLoading('eth-premium');
        showLoading('usdt-premium');
        
        // 백엔드 API에서 전체 데이터 가져오기
        const response = await fetch('/api/premium/all');
        const data = await response.json();
        
        // 환율 가져오기
        await fetchExchangeRate();
        
        // 데이터 처리
        processAllData(data);
        
        // 시간 업데이트
        updateCurrentTime();
        
    } catch (error) {
        console.error('데이터 가져오기 실패:', error);
        showError('데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 전체 데이터 처리
function processAllData(data) {
    if (!data) return;
    
    // 코인 데이터 초기화
    window.coinData = {};
    window.allCoinsData = data;
    
    // 주요 코인 처리 (메인 화면)
    const majorCoins = ['BTC', 'ETH', 'USDT'];
    majorCoins.forEach(coin => {
        if (data[coin]) {
            const lowerCoin = coin.toLowerCase();
            window.coinData[lowerCoin] = data[coin];
            updateCoinDisplay(lowerCoin, data[coin]);
        }
    });
    
    // 전체 코인 테이블 업데이트
    updateAllCoinsTable(data);
    
    // 주요 코인 테이블 업데이트
    updateMajorCoinsTable(data);
    
    // 전체 코인 탭 환율과 시간 업데이트
    updateAllCoinsExchangeRate();
    updateAllCoinsTime();
}

// 코인 데이터 화면 업데이트
function updateCoinDisplay(symbol, data) {
    // 업비트 가격
    if (data.upbit) {
        const element = document.getElementById(`${symbol}-upbit`);
        if (element) element.textContent = formatPrice(data.upbit);
    }
    
    // 빗썸 가격
    if (data.bithumb) {
        const element = document.getElementById(`${symbol}-bithumb`);
        if (element) element.textContent = formatPrice(data.bithumb);
    }
    
    // 바이낸스 가격
    if (data.binance) {
        const element = document.getElementById(`${symbol}-binance`);
        if (element) element.textContent = formatPrice(data.binance, 'USDT');
    }
    
    // 김프 계산 및 표시
    if (data.upbitPremium !== undefined) {
        const element = document.querySelector(`#${symbol}-premium .premium-percent`);
        if (element) {
            element.textContent = formatPercent(data.upbitPremium);
            element.className = 'premium-percent ' + getPremiumClass(data.upbitPremium);
        }
    }
}

// 환율 가져오기
async function fetchExchangeRate() {
    try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        
        exchangeRate = data.USD_KRW;
        
        // 환율 표시
        const rateElement = document.querySelector('#usd-krw-rate .rate-value');
        if (rateElement) {
            rateElement.textContent = formatNumber(exchangeRate.toFixed(2));
        }
        
        return exchangeRate;
        
    } catch (error) {
        console.error('환율 가져오기 실패:', error);
        // 백업 환율 사용
        exchangeRate = 1390;
        return exchangeRate;
    }
}

// 업비트 가격 가져오기
async function fetchUpbitPrices() {
    try {
        const markets = 'KRW-BTC,KRW-ETH,KRW-USDT';
        const response = await fetch(PROXY_URL + encodeURIComponent(`${API_ENDPOINTS.UPBIT_TICKER}?markets=${markets}`));
        const data = await response.json();
        
        data.forEach(coin => {
            const symbol = coin.market.split('-')[1].toLowerCase();
            const price = coin.trade_price;
            
            // 가격 표시
            const element = document.getElementById(`${symbol}-upbit`);
            if (element) {
                element.textContent = formatPrice(price);
            }
            
            // 데이터 저장
            if (!window.coinData) window.coinData = {};
            if (!window.coinData[symbol]) window.coinData[symbol] = {};
            window.coinData[symbol].upbit = price;
        });
        
        // 김프 계산
        calculateAndDisplayPremium();
        
    } catch (error) {
        console.error('업비트 가격 가져오기 실패:', error);
    }
}

// 빗썸 가격 가져오기
async function fetchBithumbPrices() {
    try {
        const response = await fetch(PROXY_URL + encodeURIComponent(API_ENDPOINTS.BITHUMB_TICKER));
        const data = await response.json();
        
        if (data.status === '0000') {
            // BTC
            if (data.data.BTC) {
                const btcPrice = parseFloat(data.data.BTC.closing_price);
                document.getElementById('btc-bithumb').textContent = formatPrice(btcPrice);
                if (!window.coinData) window.coinData = {};
                if (!window.coinData.btc) window.coinData.btc = {};
                window.coinData.btc.bithumb = btcPrice;
            }
            
            // ETH
            if (data.data.ETH) {
                const ethPrice = parseFloat(data.data.ETH.closing_price);
                document.getElementById('eth-bithumb').textContent = formatPrice(ethPrice);
                if (!window.coinData.eth) window.coinData.eth = {};
                window.coinData.eth.bithumb = ethPrice;
            }
            
            // USDT
            if (data.data.USDT) {
                const usdtPrice = parseFloat(data.data.USDT.closing_price);
                document.getElementById('usdt-bithumb').textContent = formatPrice(usdtPrice);
                if (!window.coinData.usdt) window.coinData.usdt = {};
                window.coinData.usdt.bithumb = usdtPrice;
            }
        }
        
        // 김프 계산
        calculateAndDisplayPremium();
        
    } catch (error) {
        console.error('빗썸 가격 가져오기 실패:', error);
    }
}

// 바이낸스 가격 가져오기
async function fetchBinancePrices() {
    try {
        const symbols = 'BTCUSDT,ETHUSDT,USDTUSDT';
        const response = await fetch(PROXY_URL + encodeURIComponent(`${API_ENDPOINTS.BINANCE_TICKER}?symbols=["BTCUSDT","ETHUSDT"]`));
        const data = await response.json();
        
        data.forEach(coin => {
            let symbol = '';
            if (coin.symbol === 'BTCUSDT') symbol = 'btc';
            else if (coin.symbol === 'ETHUSDT') symbol = 'eth';
            else return;
            
            const price = parseFloat(coin.price);
            const krwPrice = price * exchangeRate;
            
            // USDT 가격 표시
            const element = document.getElementById(`${symbol}-binance`);
            if (element) {
                element.textContent = formatPrice(price, 'USDT');
            }
            
            // 데이터 저장
            if (!window.coinData) window.coinData = {};
            if (!window.coinData[symbol]) window.coinData[symbol] = {};
            window.coinData[symbol].binance = price;
            window.coinData[symbol].binanceKrw = krwPrice;
        });
        
        // USDT는 1달러로 고정 (USDT 스테이블코인)
        document.getElementById('usdt-binance').textContent = formatPrice(1, 'USDT');
        if (!window.coinData.usdt) window.coinData.usdt = {};
        window.coinData.usdt.binance = 1;
        window.coinData.usdt.binanceKrw = exchangeRate;
        
        // 김프 계산
        calculateAndDisplayPremium();
        
    } catch (error) {
        console.error('바이낸스 가격 가져오기 실패:', error);
    }
}

// 김프 계산 및 표시
function calculateAndDisplayPremium() {
    if (!window.coinData || !exchangeRate) return;
    
    // BTC 김프
    if (window.coinData.btc && window.coinData.btc.upbit && window.coinData.btc.binance) {
        const premium = calculatePremium(window.coinData.btc.upbit, window.coinData.btc.binance, exchangeRate);
        if (premium !== null) {
            const element = document.querySelector('#btc-premium .premium-percent');
            if (element) {
                element.textContent = formatPercent(premium);
                element.className = 'premium-percent ' + getPremiumClass(premium);
            }
        }
    }
    
    // ETH 김프
    if (window.coinData.eth && window.coinData.eth.upbit && window.coinData.eth.binance) {
        const premium = calculatePremium(window.coinData.eth.upbit, window.coinData.eth.binance, exchangeRate);
        if (premium !== null) {
            const element = document.querySelector('#eth-premium .premium-percent');
            if (element) {
                element.textContent = formatPercent(premium);
                element.className = 'premium-percent ' + getPremiumClass(premium);
            }
        }
    }
    
    // USDT 김프
    if (window.coinData.usdt && window.coinData.usdt.upbit && window.coinData.usdt.binance) {
        const premium = calculatePremium(window.coinData.usdt.upbit, window.coinData.usdt.binance, exchangeRate);
        if (premium !== null) {
            const element = document.querySelector('#usdt-premium .premium-percent');
            if (element) {
                element.textContent = formatPercent(premium);
                element.className = 'premium-percent ' + getPremiumClass(premium);
            }
        }
    }
}

// 프리미엄 클래스 가져오기
function getPremiumClass(premium) {
    if (premium > 3) return 'premium-high';
    if (premium > 1) return 'premium-medium';
    if (premium > -1) return 'premium-low';
    return 'premium-negative';
}

// 주요 코인 데이터 가져오기
async function fetchMajorCoins() {
    await fetchAllData();
    renderMajorCoinsTable();
}

// 전체 코인 테이블 업데이트
function updateAllCoinsTable(data) {
    const tbody = document.getElementById('all-coins-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // 현재 필터 확인
    const currentFilter = document.querySelector('input[name="exchange-filter"]:checked')?.value || 'all';
    
    // 데이터를 배열로 변환하고 필터링
    let coinsArray = Object.entries(data).map(([symbol, coinData]) => ({
        symbol,
        ...coinData
    }));
    
    // 거래소별 필터 적용
    coinsArray = coinsArray.filter(coin => {
        const hasUpbit = coin.upbit && coin.upbit > 0;
        const hasBithumb = coin.bithumb && coin.bithumb > 0;
        
        switch (currentFilter) {
            case 'both':
                return hasUpbit && hasBithumb;
            case 'upbit-only':
                return hasUpbit && !hasBithumb;
            case 'bithumb-only':
                return !hasUpbit && hasBithumb;
            case 'all':
            default:
                return true;
        }
    });
    
    // 현재 선택된 정렬 옵션 확인
    const currentSort = document.getElementById('sort-by')?.value || 'upbit-premium-desc';
    
    // 정렬 적용
    coinsArray.sort((a, b) => {
        switch (currentSort) {
            case 'upbit-premium-desc':
                return (b.upbitPremium || -999) - (a.upbitPremium || -999);
            case 'upbit-premium-asc':
                return (a.upbitPremium || 999) - (b.upbitPremium || 999);
            case 'bithumb-premium-desc':
                return (b.bithumbPremium || -999) - (a.bithumbPremium || -999);
            case 'bithumb-premium-asc':
                return (a.bithumbPremium || 999) - (b.bithumbPremium || 999);
            case 'volume-desc':
                return (b.totalVolume24h || 0) - (a.totalVolume24h || 0);
            case 'volume-asc':
                return (a.totalVolume24h || 0) - (b.totalVolume24h || 0);
            case 'name-asc':
                return a.symbol.localeCompare(b.symbol);
            default:
                return (b.upbitPremium || -999) - (a.upbitPremium || -999);
        }
    });
    
    coinsArray.forEach(coin => {
        const row = document.createElement('tr');
        row.setAttribute('data-coin', coin.symbol);
        row.setAttribute('data-upbit', coin.upbit ? 'true' : 'false');
        row.setAttribute('data-bithumb', coin.bithumb ? 'true' : 'false');
        row.setAttribute('data-volume', coin.totalVolume24h || 0);
        
        // 코인명 (아이콘 + 한글명 + 티커)
        const nameCell = document.createElement('td');
        const koreanName = coin.koreanName || '';
        const symbolLower = coin.symbol.toLowerCase();
        
        // 업비트 이미지 URL (로고 있는 경우) 또는 폴백 이미지
        const iconUrl = `https://static.upbit.com/logos/${coin.symbol}.png`;
        
        nameCell.innerHTML = `
            <div class="coin-info">
                <img src="${iconUrl}" 
                     alt="${coin.symbol}" 
                     class="coin-icon"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2212%22 fill=%22%23888%22>${coin.symbol.substring(0,2)}</text></svg>'; this.onerror=null;">
                <div class="coin-names">
                    <span class="coin-kr-name">${koreanName}</span>
                    <span class="coin-ticker">${coin.symbol}</span>
                </div>
            </div>
        `;
        row.appendChild(nameCell);
        
        // 업비트 가격
        const upbitCell = document.createElement('td');
        upbitCell.className = 'upbit-column';
        upbitCell.textContent = coin.upbit ? formatPrice(coin.upbit) : '-';
        row.appendChild(upbitCell);
        
        // 빗썸 가격
        const bithumbCell = document.createElement('td');
        bithumbCell.className = 'bithumb-column';
        bithumbCell.textContent = coin.bithumb ? formatPrice(coin.bithumb) : '-';
        row.appendChild(bithumbCell);
        
        // 바이낸스 가격 (USDT)
        const binanceCell = document.createElement('td');
        binanceCell.textContent = coin.binance ? formatPrice(coin.binance, 'USDT') : '-';
        row.appendChild(binanceCell);
        
        // 24H 거래대금
        const volumeCell = document.createElement('td');
        if (coin.totalVolume24h) {
            // 거래대금을 조/억원 단위로 표시
            const volumeInTrillion = coin.totalVolume24h / 1000000000000;
            const volumeInBillion = coin.totalVolume24h / 100000000;
            const volumeInMillion = coin.totalVolume24h / 1000000;
            
            if (volumeInTrillion >= 1) {
                // 1조원 이상
                if (volumeInTrillion >= 10) {
                    volumeCell.textContent = volumeInTrillion.toFixed(0) + '조';
                } else {
                    volumeCell.textContent = volumeInTrillion.toFixed(1) + '조';
                }
            } else if (volumeInBillion >= 1) {
                // 1억원 이상
                if (volumeInBillion >= 1000) {
                    // 1000억 이상은 숫자가 길어지므로 콤마 표시
                    volumeCell.textContent = formatNumber(Math.round(volumeInBillion)) + '억';
                } else {
                    volumeCell.textContent = Math.round(volumeInBillion) + '억';
                }
            } else if (volumeInMillion >= 10) {
                // 천만원 이상
                volumeCell.textContent = Math.round(volumeInMillion) + '백만';
            } else {
                volumeCell.textContent = '-';
            }
        } else {
            volumeCell.textContent = '-';
        }
        row.appendChild(volumeCell);
        
        // 업비트 김프
        const upbitPremiumCell = document.createElement('td');
        upbitPremiumCell.className = 'upbit-premium-column';
        if (coin.upbitPremium !== undefined) {
            upbitPremiumCell.innerHTML = `<span class="${getPremiumClass(coin.upbitPremium)}">${formatPercent(coin.upbitPremium)}</span>`;
        } else {
            upbitPremiumCell.textContent = '-';
        }
        row.appendChild(upbitPremiumCell);
        
        // 빗썸 김프
        const bithumbPremiumCell = document.createElement('td');
        bithumbPremiumCell.className = 'bithumb-premium-column';
        if (coin.bithumbPremium !== undefined) {
            bithumbPremiumCell.innerHTML = `<span class="${getPremiumClass(coin.bithumbPremium)}">${formatPercent(coin.bithumbPremium)}</span>`;
        } else {
            bithumbPremiumCell.textContent = '-';
        }
        row.appendChild(bithumbPremiumCell);
        
        // 상태
        const statusCell = document.createElement('td');
        statusCell.innerHTML = `<span class="status-badge status-online">정상</span>`;
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
    });
    
    // 필터 결과 개수 표시
    updateFilterInfo(coinsArray.length);
    
    // 현재 필터 상태에 따라 컬럼 숨김 처리 재적용
    // currentFilter는 이미 상단에 선언되어 있음
    setTimeout(() => updateTableColumns(currentFilter), 0);
}

// 주요 코인 테이블 업데이트
function updateMajorCoinsTable(data) {
    const majorCoins = ['BTC', 'ETH', 'USDT', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX'];
    const tbody = document.getElementById('major-coins-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    majorCoins.forEach(symbol => {
        const coin = data[symbol];
        if (!coin) return;
        
        const row = document.createElement('tr');
        
        // 코인명
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<strong>${symbol}</strong>`;
        row.appendChild(nameCell);
        
        // 업비트 가격
        const upbitCell = document.createElement('td');
        upbitCell.textContent = coin.upbit ? formatPrice(coin.upbit) : '-';
        row.appendChild(upbitCell);
        
        // 빗썸 가격
        const bithumbCell = document.createElement('td');
        bithumbCell.textContent = coin.bithumb ? formatPrice(coin.bithumb) : '-';
        row.appendChild(bithumbCell);
        
        // 바이낸스 USDT 가격
        const binanceUsdCell = document.createElement('td');
        binanceUsdCell.textContent = coin.binance ? formatPrice(coin.binance, 'USDT') : '-';
        row.appendChild(binanceUsdCell);
        
        // 바이낸스 KRW 환산
        const binanceKrwCell = document.createElement('td');
        const krwValue = coin.binance && coin.exchangeRate ? coin.binance * coin.exchangeRate : 0;
        binanceKrwCell.textContent = krwValue ? formatPrice(krwValue) : '-';
        row.appendChild(binanceKrwCell);
        
        // 업비트 김프
        const upbitPremiumCell = document.createElement('td');
        if (coin.upbitPremium !== undefined) {
            upbitPremiumCell.innerHTML = `<span class="${getPremiumClass(coin.upbitPremium)}">${formatPercent(coin.upbitPremium)}</span>`;
        } else {
            upbitPremiumCell.textContent = '-';
        }
        row.appendChild(upbitPremiumCell);
        
        // 빗썸 김프
        const bithumbPremiumCell = document.createElement('td');
        if (coin.bithumbPremium !== undefined) {
            bithumbPremiumCell.innerHTML = `<span class="${getPremiumClass(coin.bithumbPremium)}">${formatPercent(coin.bithumbPremium)}</span>`;
        } else {
            bithumbPremiumCell.textContent = '-';
        }
        row.appendChild(bithumbPremiumCell);
        
        tbody.appendChild(row);
    });
}

// 전체 코인 데이터 가져오기
async function fetchAllCoins() {
    await fetchAllData();
    // 전체 코인 탭에서도 환율과 시간 업데이트
    updateAllCoinsExchangeRate();
    updateAllCoinsTime();
}

// 코인 필터링
function filterCoins() {
    const searchTerm = document.getElementById('coin-search').value.toLowerCase();
    const rows = document.querySelectorAll('#all-coins-table tr');
    
    rows.forEach(row => {
        const coinName = row.querySelector('td:first-child').textContent.toLowerCase();
        if (coinName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 코인 정렬
function sortCoins() {
    // 현재 데이터가 있으면 정렬 옵션에 따라 다시 렌더링
    if (window.allCoinsData) {
        updateAllCoinsTable(window.allCoinsData);
    }
}

// 거래소별 필터링
function filterByExchange(filterType) {
    console.log('필터링 타입:', filterType);
    
    // 컬럼 표시/숨김 처리
    updateTableColumns(filterType);
    
    // 전체 데이터 다시 렌더링 (필터 적용)
    if (window.allCoinsData) {
        updateAllCoinsTable(window.allCoinsData);
    }
}

// 테이블 컬럼 업데이트
function updateTableColumns(filterType) {
    // 테이블 헤더의 컬럼들
    const headerRow = document.querySelector('#all-coins-header tr');
    if (!headerRow) return;
    
    const upbitHeader = headerRow.querySelector('.upbit-column');
    const upbitPremiumHeader = headerRow.querySelector('.upbit-premium-column');
    const bithumbHeader = headerRow.querySelector('.bithumb-column');
    const bithumbPremiumHeader = headerRow.querySelector('.bithumb-premium-column');
    
    // 테이블 바디의 모든 업비트/빗썸 컬럼
    const upbitBodyColumns = document.querySelectorAll('#all-coins-table td.upbit-column');
    const upbitPremiumBodyColumns = document.querySelectorAll('#all-coins-table td.upbit-premium-column');
    const bithumbBodyColumns = document.querySelectorAll('#all-coins-table td.bithumb-column');
    const bithumbPremiumBodyColumns = document.querySelectorAll('#all-coins-table td.bithumb-premium-column');
    
    // 모든 컬럼 초기화 (hide-column 클래스 제거)
    [upbitHeader, upbitPremiumHeader, bithumbHeader, bithumbPremiumHeader].forEach(col => {
        if (col) col.classList.remove('hide-column');
    });
    upbitBodyColumns.forEach(col => col.classList.remove('hide-column'));
    upbitPremiumBodyColumns.forEach(col => col.classList.remove('hide-column'));
    bithumbBodyColumns.forEach(col => col.classList.remove('hide-column'));
    bithumbPremiumBodyColumns.forEach(col => col.classList.remove('hide-column'));
    
    // 필터에 따라 컬럼 숨기기
    switch (filterType) {
        case 'upbit-only':
            // 빗썸 관련 컬럼 숨기기
            if (bithumbHeader) bithumbHeader.classList.add('hide-column');
            if (bithumbPremiumHeader) bithumbPremiumHeader.classList.add('hide-column');
            bithumbBodyColumns.forEach(col => col.classList.add('hide-column'));
            bithumbPremiumBodyColumns.forEach(col => col.classList.add('hide-column'));
            break;
        case 'bithumb-only':
            // 업비트 관련 컬럼 숨기기
            if (upbitHeader) upbitHeader.classList.add('hide-column');
            if (upbitPremiumHeader) upbitPremiumHeader.classList.add('hide-column');
            upbitBodyColumns.forEach(col => col.classList.add('hide-column'));
            upbitPremiumBodyColumns.forEach(col => col.classList.add('hide-column'));
            break;
        case 'both':
        case 'all':
        default:
            // 모든 컬럼 표시 (이미 초기화됨)
            break;
    }
}

// 전체 코인 탭 환율 업데이트
function updateAllCoinsExchangeRate() {
    const rateElement = document.querySelector('#all-usd-krw-rate .rate-value');
    if (rateElement && exchangeRate) {
        rateElement.textContent = formatNumber(exchangeRate.toFixed(2));
    }
}

// 전체 코인 탭 시간 업데이트
function updateAllCoinsTime() {
    const now = new Date();
    const timeString = formatTime(now);
    const timeElement = document.getElementById('all-last-update-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 필터 정보 업데이트
function updateFilterInfo(count) {
    const filterSection = document.querySelector('.exchange-filter-section');
    let infoElement = filterSection.querySelector('.filter-info');
    
    if (!infoElement) {
        infoElement = document.createElement('div');
        infoElement.className = 'filter-info';
        filterSection.appendChild(infoElement);
    }
    
    const currentFilter = document.querySelector('input[name="exchange-filter"]:checked')?.value || 'all';
    let filterText = '';
    
    switch (currentFilter) {
        case 'both':
            filterText = '업비트와 빗썸 모두에 상장된 코인';
            break;
        case 'upbit-only':
            filterText = '업비트에만 상장된 코인';
            break;
        case 'bithumb-only':
            filterText = '빗썸에만 상장된 코인';
            break;
        case 'all':
        default:
            filterText = '전체 코인';
            break;
    }
    
    infoElement.innerHTML = `📊 ${filterText}: <strong>${count}개</strong>`;
}