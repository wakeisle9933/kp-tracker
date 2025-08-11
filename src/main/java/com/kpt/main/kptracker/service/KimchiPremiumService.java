package com.kpt.main.kptracker.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;

@Service
public class KimchiPremiumService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 김치 프리미엄 계산
    public double calculatePremium(double krwPrice, double usdPrice, double exchangeRate) {
        if (krwPrice == 0 || usdPrice == 0 || exchangeRate == 0) {
            return 0;
        }
        
        double usdToKrw = usdPrice * exchangeRate;
        return ((krwPrice - usdToKrw) / usdToKrw) * 100;
    }
    
    // 업비트 가격 가져오기
    public Map<String, Double> getUpbitPrices(List<String> symbols) {
        Map<String, Double> prices = new HashMap<>();
        
        try {
            String markets = String.join(",", symbols.stream()
                .map(s -> "KRW-" + s.toUpperCase())
                .toArray(String[]::new));
            
            String url = "https://api.upbit.com/v1/ticker?markets=" + markets;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            for (JsonNode node : root) {
                String market = node.get("market").asText();
                String symbol = market.replace("KRW-", "");
                double price = node.get("trade_price").asDouble();
                prices.put(symbol, price);
            }
        } catch (Exception e) {
            System.err.println("업비트 가격 조회 실패: " + e.getMessage());
        }
        
        return prices;
    }
    
    // 업비트 가격 및 거래대금 가져오기 (ticker 상세 정보)
    public Map<String, Map<String, Double>> getUpbitTickerData(List<String> symbols) {
        Map<String, Map<String, Double>> tickerData = new HashMap<>();
        
        try {
            String markets = String.join(",", symbols.stream()
                .map(s -> "KRW-" + s.toUpperCase())
                .toArray(String[]::new));
            
            String url = "https://api.upbit.com/v1/ticker?markets=" + markets;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            for (JsonNode node : root) {
                String market = node.get("market").asText();
                String symbol = market.replace("KRW-", "");
                
                Map<String, Double> data = new HashMap<>();
                data.put("price", node.get("trade_price").asDouble());
                data.put("volume24h", node.get("acc_trade_price_24h").asDouble());  // 24시간 거래대금
                
                tickerData.put(symbol, data);
            }
        } catch (Exception e) {
            System.err.println("업비트 ticker 조회 실패: " + e.getMessage());
        }
        
        return tickerData;
    }
    
    // 빗썸 가격 가져오기
    public Map<String, Double> getBithumbPrices() {
        Map<String, Double> prices = new HashMap<>();
        
        try {
            String url = "https://api.bithumb.com/public/ticker/ALL_KRW";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("0000".equals(root.get("status").asText())) {
                JsonNode data = root.get("data");
                
                data.fieldNames().forEachRemaining(symbol -> {
                    if (!"date".equals(symbol)) {
                        JsonNode coinData = data.get(symbol);
                        if (coinData != null && coinData.has("closing_price")) {
                            String priceStr = coinData.get("closing_price").asText();
                            try {
                                double price = Double.parseDouble(priceStr);
                                prices.put(symbol, price);
                            } catch (NumberFormatException e) {
                                // 가격 변환 실패 시 무시
                            }
                        }
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("빗썸 가격 조회 실패: " + e.getMessage());
        }
        
        return prices;
    }
    
    // 빗썸 가격 및 거래대금 가져오기 (ticker 상세 정보)
    public Map<String, Map<String, Double>> getBithumbTickerData() {
        Map<String, Map<String, Double>> tickerData = new HashMap<>();
        
        try {
            String url = "https://api.bithumb.com/public/ticker/ALL_KRW";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("0000".equals(root.get("status").asText())) {
                JsonNode data = root.get("data");
                
                data.fieldNames().forEachRemaining(symbol -> {
                    if (!"date".equals(symbol)) {
                        JsonNode coinData = data.get(symbol);
                        if (coinData != null && coinData.has("closing_price")) {
                            try {
                                Map<String, Double> coinTickerData = new HashMap<>();
                                coinTickerData.put("price", Double.parseDouble(coinData.get("closing_price").asText()));
                                
                                // 24시간 거래대금 계산 (거래량 * 가격)
                                if (coinData.has("units_traded_24H") && coinData.has("closing_price")) {
                                    double volume = Double.parseDouble(coinData.get("units_traded_24H").asText());
                                    double price = Double.parseDouble(coinData.get("closing_price").asText());
                                    coinTickerData.put("volume24h", volume * price);
                                }
                                
                                tickerData.put(symbol, coinTickerData);
                            } catch (NumberFormatException e) {
                                // 변환 실패 시 무시
                            }
                        }
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("빗썸 ticker 조회 실패: " + e.getMessage());
        }
        
        return tickerData;
    }
    
    // 바이낸스 가격 가져오기
    public Map<String, Double> getBinancePrices(List<String> symbols) {
        Map<String, Double> prices = new HashMap<>();
        
        // 먼저 바이낸스의 모든 심볼 가져오기
        Set<String> binanceSymbols = getBinanceSymbols();
        
        for (String symbol : symbols) {
            try {
                // USDT는 스테이블코인이므로 1달러로 고정
                if (symbol.equalsIgnoreCase("USDT")) {
                    prices.put("USDT", 1.0);
                    continue;
                }
                
                // 바이낸스에 해당 심볼이 있는지 확인
                String tradingPair = symbol.toUpperCase() + "USDT";
                if (!binanceSymbols.contains(tradingPair)) {
                    continue;
                }
                
                String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + tradingPair;
                String response = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(response);
                
                double price = root.get("price").asDouble();
                prices.put(symbol.toUpperCase(), price);
            } catch (Exception e) {
                // 개별 코인 조회 실패 시 무시하고 계속
                System.err.println("바이낸스 " + symbol + " 가격 조회 실패: " + e.getMessage());
            }
        }
        
        return prices;
    }
    
    // 바이낸스 심볼 리스트 가져오기
    private Set<String> getBinanceSymbols() {
        Set<String> symbols = new HashSet<>();
        try {
            String url = "https://api.binance.com/api/v3/exchangeInfo";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode symbolsNode = root.get("symbols");
            
            for (JsonNode symbolNode : symbolsNode) {
                String symbol = symbolNode.get("symbol").asText();
                String status = symbolNode.get("status").asText();
                if ("TRADING".equals(status)) {
                    symbols.add(symbol);
                }
            }
        } catch (Exception e) {
            System.err.println("바이낸스 심볼 리스트 조회 실패: " + e.getMessage());
            // 실패 시 주요 코인만 반환
            return Set.of("BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", 
                         "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT");
        }
        return symbols;
    }
    
    // 환율 가져오기
    public double getExchangeRate() {
        try {
            String url = "https://api.exchangerate-api.com/v4/latest/USD";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            return root.get("rates").get("KRW").asDouble();
        } catch (Exception e) {
            System.err.println("환율 조회 실패: " + e.getMessage());
            return 1390.0; // 기본값
        }
    }
    
    // 전체 김프 데이터 가져오기
    public Map<String, Map<String, Object>> getAllPremiumData() {
        Map<String, Map<String, Object>> result = new HashMap<>();
        
        // 환율 가져오기
        double exchangeRate = getExchangeRate();
        
        // 업비트와 빗썸 마켓 정보 가져오기 (한글명 포함)
        Map<String, Map<String, String>> upbitMarketInfo = getUpbitMarketInfo();
        Map<String, Map<String, String>> bithumbMarketInfo = getBithumbMarketInfo();
        
        // 각 거래소별 전체 코인 리스트 가져오기
        List<String> upbitMarkets = getUpbitMarketList();
        Map<String, Map<String, Double>> bithumbTickerData = getBithumbTickerData();
        
        // 업비트와 빗썸 코인 합치기 (중복 제거)
        Set<String> allKoreanCoins = new HashSet<>(upbitMarkets);
        allKoreanCoins.addAll(bithumbTickerData.keySet());
        
        // 업비트 ticker 데이터 가져오기 (가격 + 거래대금)
        Map<String, Map<String, Double>> upbitTickerData = getUpbitTickerData(upbitMarkets);
        
        // 빗썸 가격만 추출 (이전 호환성 유지)
        Map<String, Double> bithumbPrices = new HashMap<>();
        bithumbTickerData.forEach((symbol, data) -> {
            if (data.containsKey("price")) {
                bithumbPrices.put(symbol, data.get("price"));
            }
        });
        
        // 업비트 가격만 추출 (이전 호환성 유지)
        Map<String, Double> upbitPrices = new HashMap<>();
        upbitTickerData.forEach((symbol, data) -> {
            if (data.containsKey("price")) {
                upbitPrices.put(symbol, data.get("price"));
            }
        });
        
        // 바이낸스 가격 가져오기 (한국 거래소에 있는 코인들만)
        Map<String, Double> binancePrices = getBinancePrices(new ArrayList<>(allKoreanCoins));
        
        // 김프 계산 - 바이낸스에 있는 코인만 처리
        for (String coin : allKoreanCoins) {
            Double binancePrice = binancePrices.get(coin.toUpperCase());
            
            // 바이낸스에 없는 코인은 제외 (김프 계산 불가)
            if (binancePrice == null || binancePrice == 0) {
                continue;
            }
            
            Double upbitPrice = upbitPrices.get(coin.toUpperCase());
            Double bithumbPrice = bithumbPrices.get(coin.toUpperCase());
            
            // 업비트와 빗썸 둘 다 없으면 제외
            if ((upbitPrice == null || upbitPrice == 0) && 
                (bithumbPrice == null || bithumbPrice == 0)) {
                continue;
            }
            
            Map<String, Object> coinData = new HashMap<>();
            coinData.put("upbit", upbitPrice);
            coinData.put("bithumb", bithumbPrice);
            coinData.put("binance", binancePrice);
            coinData.put("exchangeRate", exchangeRate);
            
            // 거래대금 정보 추가
            double totalVolume24h = 0.0;
            
            // 업비트 거래대금
            if (upbitTickerData.containsKey(coin.toUpperCase())) {
                Map<String, Double> upbitData = upbitTickerData.get(coin.toUpperCase());
                if (upbitData.containsKey("volume24h")) {
                    double upbitVolume = upbitData.get("volume24h");
                    coinData.put("upbitVolume24h", upbitVolume);
                    totalVolume24h += upbitVolume;
                }
            }
            
            // 빗썸 거래대금
            if (bithumbTickerData.containsKey(coin.toUpperCase())) {
                Map<String, Double> bithumbData = bithumbTickerData.get(coin.toUpperCase());
                if (bithumbData.containsKey("volume24h")) {
                    double bithumbVolume = bithumbData.get("volume24h");
                    coinData.put("bithumbVolume24h", bithumbVolume);
                    totalVolume24h += bithumbVolume;
                }
            }
            
            // 합계 거래대금 (시가총액 대용치)
            if (totalVolume24h > 0) {
                coinData.put("totalVolume24h", totalVolume24h);
            }
            
            // 코인 이름 정보 추가 (업비트 우선, 없으면 빗썸)
            if (upbitMarketInfo.containsKey(coin.toUpperCase())) {
                Map<String, String> info = upbitMarketInfo.get(coin.toUpperCase());
                coinData.put("koreanName", info.get("korean_name"));
                coinData.put("englishName", info.get("english_name"));
            } else if (bithumbMarketInfo.containsKey(coin.toUpperCase())) {
                Map<String, String> info = bithumbMarketInfo.get(coin.toUpperCase());
                coinData.put("koreanName", info.get("korean_name"));
                coinData.put("englishName", info.get("english_name"));
            }
            
            // 업비트 김프 계산 (업비트에 있는 경우만)
            if (upbitPrice != null && upbitPrice > 0) {
                double upbitPremium = calculatePremium(upbitPrice, binancePrice, exchangeRate);
                coinData.put("upbitPremium", upbitPremium);
            }
            
            // 빗썸 김프 계산 (빗썸에 있는 경우만)
            if (bithumbPrice != null && bithumbPrice > 0) {
                double bithumbPremium = calculatePremium(bithumbPrice, binancePrice, exchangeRate);
                coinData.put("bithumbPremium", bithumbPremium);
            }
            
            result.put(coin.toUpperCase(), coinData);
        }
        
        System.out.println("김프 계산 완료: " + result.size() + "개 코인 (업비트/빗썸 + 바이낸스)");
        return result;
    }
    
    // 업비트 마켓 리스트 가져오기
    public List<String> getUpbitMarketList() {
        List<String> markets = new ArrayList<>();
        try {
            String url = "https://api.upbit.com/v1/market/all";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            for (JsonNode node : root) {
                String market = node.get("market").asText();
                if (market.startsWith("KRW-")) {
                    String symbol = market.replace("KRW-", "");
                    markets.add(symbol);
                }
            }
        } catch (Exception e) {
            System.err.println("업비트 마켓 리스트 조회 실패: " + e.getMessage());
            // 실패 시 기본 코인 목록 반환
            return List.of("BTC", "ETH", "USDT", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC");
        }
        return markets;
    }
    
    // 업비트 마켓 정보 가져오기 (한글명 포함)
    public Map<String, Map<String, String>> getUpbitMarketInfo() {
        Map<String, Map<String, String>> marketInfo = new HashMap<>();
        try {
            String url = "https://api.upbit.com/v1/market/all";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            for (JsonNode node : root) {
                String market = node.get("market").asText();
                if (market.startsWith("KRW-")) {
                    String symbol = market.replace("KRW-", "");
                    Map<String, String> info = new HashMap<>();
                    info.put("korean_name", node.get("korean_name").asText());
                    info.put("english_name", node.get("english_name").asText());
                    marketInfo.put(symbol, info);
                }
            }
        } catch (Exception e) {
            System.err.println("업비트 마켓 정보 조회 실패: " + e.getMessage());
        }
        return marketInfo;
    }
    
// 빗썸 마켓 정보 가져오기 (한글명 포함)
    public Map<String, Map<String, String>> getBithumbMarketInfo() {
        Map<String, Map<String, String>> marketInfo = new HashMap<>();
        try {
            String url = "https://api.bithumb.com/v1/market/all";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            for (JsonNode node : root) {
                String market = node.get("market").asText();
                if (market.startsWith("KRW-")) {
                    String symbol = market.replace("KRW-", "");
                    Map<String, String> info = new HashMap<>();
                    info.put("korean_name", node.get("korean_name").asText());
                    info.put("english_name", node.get("english_name").asText());
                    marketInfo.put(symbol, info);
                }
            }
        } catch (Exception e) {
            System.err.println("빗썸 마켓 정보 조회 실패: " + e.getMessage());
        }
        return marketInfo;
    }
}