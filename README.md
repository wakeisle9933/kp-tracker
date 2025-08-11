# Kimchi Premium Tracker

A real-time cryptocurrency arbitrage monitoring application that tracks price differences between Korean exchanges (Upbit, Bithumb) and global exchanges (Binance), calculating the "Kimchi Premium" - the percentage price difference that often exists in the Korean crypto market.

## Features

- **Real-time Price Monitoring**: Track cryptocurrency prices across multiple exchanges
- **Kimchi Premium Calculation**: Automatic calculation of price premiums between Korean and global markets
- **Multi-Exchange Support**: Integration with Upbit, Bithumb, and Binance APIs
- **Auto-Refresh**: 30-second interval updates for real-time data
- **Dark Theme UI**: Modern, responsive interface with gradient accents
- **Multi-language Support**: Interface available in multiple languages
- **RESTful API**: Comprehensive API endpoints for premium data access

## Tech Stack

- **Backend**: Spring Boot 3.5.4
- **Frontend**: Thymeleaf, JavaScript (Vanilla)
- **Build Tool**: Gradle
- **APIs**: Upbit, Bithumb, Binance, Exchange Rate API

## Prerequisites

- Java 17 or higher
- Gradle 7.x or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kp-tracker.git
cd kp-tracker
```

2. Build the project:
```bash
./gradlew build
```

3. Run the application:
```bash
./gradlew bootRun
```

The application will start on `http://localhost:8080`

## Configuration

You can modify application settings in `src/main/resources/application.properties`:

```properties
server.port=8080                      # Application port
spring.thymeleaf.cache=false          # Template caching (false for development)
spring.devtools.restart.enabled=true  # Enable hot reload
```

## API Documentation

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main dashboard page |
| GET | `/api/premium/all` | Get premium data for all cryptocurrencies |
| GET | `/api/exchange-rate` | Get current USD/KRW exchange rate |
| GET | `/api/prices/upbit?symbols=BTC,ETH` | Get Upbit prices for specific symbols |
| GET | `/api/prices/bithumb` | Get all Bithumb prices |
| GET | `/api/prices/binance?symbols=BTC,ETH` | Get Binance prices for specific symbols |

### Premium Calculation Formula

```
Premium = ((KRW_Price - (USD_Price * Exchange_Rate)) / (USD_Price * Exchange_Rate)) * 100
```

## Project Structure

```
kp-tracker/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/kptracker/
│   │   │       ├── controller/
│   │   │       │   ├── KimchiPremiumController.java    # HTML page controller
│   │   │       │   └── KimchiPremiumApiController.java  # REST API controller
│   │   │       └── service/
│   │   │           └── KimchiPremiumService.java        # Core business logic
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/                                 # Stylesheets
│   │       │   └── js/
│   │       │       ├── kp-core.js                      # Core functionality
│   │       │       ├── kp-api.js                       # API communication
│   │       │       └── kp-render.js                    # UI rendering
│   │       ├── templates/                              # Thymeleaf templates
│   │       └── application.properties                  # Application configuration
├── build.gradle
└── README.md
```

## Architecture

### Backend
- **Controllers**: Handle HTTP requests and responses
- **Service Layer**: Contains business logic for price fetching and premium calculation
- **External API Integration**: Communicates with cryptocurrency exchange APIs

### Frontend
- **Modular JavaScript**: Separated into core, API, and rendering modules
- **Thymeleaf Templates**: Server-side rendering with Spring Boot
- **Responsive Design**: Mobile-friendly dark theme interface

## Development

### Running Tests
```bash
./gradlew test
```

### Clean Build
```bash
./gradlew clean build
```

### Development Mode with Hot Reload
The application includes Spring DevTools for automatic restart on code changes.

## External APIs

The application integrates with the following APIs:
- **Upbit API**: `https://api.upbit.com/v1/`
- **Bithumb API**: `https://api.bithumb.com/public/`
- **Binance API**: `https://api.binance.com/api/v3/`
- **Exchange Rate API**: `https://api.exchangerate-api.com/v4/latest/USD`

## Special Considerations

- **USDT Handling**: USDT price on Binance is hardcoded to $1.00 as it's a stablecoin
- **CORS**: Backend provides proxy endpoints to handle CORS restrictions
- **Auto-refresh**: Data updates every 30 seconds automatically
- **Loading States**: Special DOM handling for nested elements during loading

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Upbit, Bithumb, and Binance for providing public APIs
- Spring Boot community for the excellent framework
- Exchange Rate API for currency conversion data