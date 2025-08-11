package com.kpt.main.kptracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Controller
public class KimchiPremiumController {
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    // 메인 페이지
    @GetMapping("/")
    public String index() {
        return "kimchi-premium";
    }
    
    // 김치 프리미엄 페이지
    @GetMapping("/kimchi-premium")
    public String kimchiPremium() {
        return "kimchi-premium";
    }
    
    // CORS 프록시 엔드포인트
    @GetMapping("/api/proxy")
    @ResponseBody
    public ResponseEntity<String> proxy(@RequestParam String url) {
        try {
            // URL 디코딩
            String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8.toString());
            
            // 허용된 도메인 체크
            if (!isAllowedDomain(decodedUrl)) {
                return ResponseEntity.badRequest().body("허용되지 않은 도메인입니다.");
            }
            
            // 외부 API 호출
            String response = restTemplate.getForObject(decodedUrl, String.class);
            
            // 응답 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("Access-Control-Allow-Origin", "*");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(response);
                    
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body("API 호출 실패: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("서버 오류: " + e.getMessage());
        }
    }
    
    // 허용된 도메인 체크
    private boolean isAllowedDomain(String url) {
        return url.contains("api.upbit.com") ||
               url.contains("api.bithumb.com") ||
               url.contains("api.binance.com") ||
               url.contains("api.exchangerate-api.com");
    }
}