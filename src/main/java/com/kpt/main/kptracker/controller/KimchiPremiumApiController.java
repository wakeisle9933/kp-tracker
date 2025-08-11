package com.kpt.main.kptracker.controller;

import com.kpt.main.kptracker.service.KimchiPremiumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class KimchiPremiumApiController {
    
    @Autowired
    private KimchiPremiumService kimchiPremiumService;
    
    // 전체 김프 데이터 조회
    @GetMapping("/premium/all")
    public ResponseEntity<Map<String, Map<String, Object>>> getAllPremium() {
        Map<String, Map<String, Object>> data = kimchiPremiumService.getAllPremiumData();
        return ResponseEntity.ok(data);
    }
    
    // 특정 코인 김프 조회
    @GetMapping("/premium/{coin}")
    public ResponseEntity<Map<String, Object>> getCoinPremium(@PathVariable String coin) {
        List<String> coins = List.of(coin.toUpperCase());
        
        Map<String, Double> upbitPrices = kimchiPremiumService.getUpbitPrices(coins);
        Map<String, Double> bithumbPrices = kimchiPremiumService.getBithumbPrices();
        Map<String, Double> binancePrices = kimchiPremiumService.getBinancePrices(coins);
        double exchangeRate = kimchiPremiumService.getExchangeRate();
        
        Map<String, Object> result = Map.of(
            "coin", coin.toUpperCase(),
            "upbit", upbitPrices.get(coin.toUpperCase()),
            "bithumb", bithumbPrices.get(coin.toUpperCase()),
            "binance", binancePrices.get(coin.toUpperCase()),
            "exchangeRate", exchangeRate
        );
        
        return ResponseEntity.ok(result);
    }
    
    // 환율 조회
    @GetMapping("/exchange-rate")
    public ResponseEntity<Map<String, Double>> getExchangeRate() {
        double rate = kimchiPremiumService.getExchangeRate();
        return ResponseEntity.ok(Map.of("USD_KRW", rate));
    }
    
    // 업비트 가격 조회
    @GetMapping("/prices/upbit")
    public ResponseEntity<Map<String, Double>> getUpbitPrices(@RequestParam List<String> symbols) {
        Map<String, Double> prices = kimchiPremiumService.getUpbitPrices(symbols);
        return ResponseEntity.ok(prices);
    }
    
    // 빗썸 가격 조회
    @GetMapping("/prices/bithumb")
    public ResponseEntity<Map<String, Double>> getBithumbPrices() {
        Map<String, Double> prices = kimchiPremiumService.getBithumbPrices();
        return ResponseEntity.ok(prices);
    }
    
    // 바이낸스 가격 조회
    @GetMapping("/prices/binance")
    public ResponseEntity<Map<String, Double>> getBinancePrices(@RequestParam List<String> symbols) {
        Map<String, Double> prices = kimchiPremiumService.getBinancePrices(symbols);
        return ResponseEntity.ok(prices);
    }
}