# Emergency Response & Dispatch Coordination Platform

## Overview
A distributed microservices-based system that simulates a national emergency response and dispatch coordination platform for Ghana. The system helps coordinate emergency responses by recording incidents, automatically determining the nearest appropriate responder, dispatching units, and tracking responses in real time.

## Architecture

The platform consists of 4 independent microservices:

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **Auth Service** | 8081 | auth_db | Identity, authentication, JWT tokens |
| **Incident Service** | 8082 | incident_db | Emergency incident management |
| **Dispatch Service** | 8083 | dispatch_db | Vehicle tracking & WebSocket |
| **Analytics Service** | 8084 | analytics_db | Statistics & monitoring |

## Prerequisites

- **Java 17+** (JDK)
- **Maven 3.8+**
- **PostgreSQL 14+**
- **Git**

## Database Setup

Create the required databases in PostgreSQL:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE incident_db;
CREATE DATABASE dispatch_db;
CREATE DATABASE analytics_db;
```

> **Note:** The default PostgreSQL credentials are `postgres/postgres`. Update `application.yml` in each service if your credentials differ.

## Building the Project

From the root directory:

```bash
mvn clean install -DskipTests
```

To build a specific service:
```bash
cd auth-service
mvn clean package -DskipTests
```

## Running the Services

Start each service in a separate terminal:

```bash
# Terminal 1 - Auth Service
cd auth-service
mvn spring-boot:run

# Terminal 2 - Incident Service
cd incident-service
mvn spring-boot:run

# Terminal 3 - Dispatch Service
cd dispatch-service
mvn spring-boot:run

# Terminal 4 - Analytics Service
cd analytics-service
mvn spring-boot:run
```

## API Documentation (Swagger)

Each service exposes Swagger UI:

- Auth Service: http://localhost:8081/swagger-ui.html
- Incident Service: http://localhost:8082/swagger-ui.html
- Dispatch Service: http://localhost:8083/swagger-ui.html
- Analytics Service: http://localhost:8084/swagger-ui.html

## API Endpoints

### Auth Service (Port 8081)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login & get JWT | No |
| POST | `/auth/refresh-token` | Refresh JWT token | No |
| GET | `/auth/profile` | Get user profile | Yes |

### Incident Service (Port 8082)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/incidents` | Create incident | Yes |
| GET | `/incidents/{id}` | Get incident by ID | Yes |
| GET | `/incidents/open` | Get open incidents | Yes |
| GET | `/incidents` | Get all incidents | Yes |
| PUT | `/incidents/{id}/status` | Update status | Yes |
| PUT | `/incidents/{id}/assign` | Assign unit | Yes |
| POST | `/stations` | Create station | No |
| GET | `/stations` | List stations | No |
| GET | `/stations/type/{type}` | Stations by type | No |

### Dispatch Service (Port 8083)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vehicles/register` | Register vehicle | No |
| GET | `/vehicles` | List vehicles | No |
| GET | `/vehicles/{id}` | Get vehicle | No |
| GET | `/vehicles/{id}/location` | Get location | No |
| POST | `/vehicles/location` | Update location | No |
| PUT | `/vehicles/{id}/status` | Update status | No |
| WS | `/ws` | WebSocket endpoint | No |

### Analytics Service (Port 8084)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/response-times` | Response time stats | No |
| GET | `/analytics/incidents-by-region` | Regional breakdown | No |
| GET | `/analytics/resource-utilization` | Resource stats | No |

## Testing with cURL

### 1. Register a System Admin
```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@emergency.gov.gh",
    "password": "admin123",
    "role": "SYSTEM_ADMIN"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@emergency.gov.gh",
    "password": "admin123"
  }'
```

### 3. Create an Incident (use the JWT token from login)
```bash
curl -X POST http://localhost:8082/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "citizenName": "Kwame Asante",
    "citizenPhone": "+233-244-123456",
    "incidentType": "ROBBERY",
    "latitude": 5.5600,
    "longitude": -0.1900,
    "locationAddress": "Osu, Accra",
    "notes": "Armed robbery in progress at a shop"
  }'
```

### 4. Register a Vehicle
```bash
curl -X POST http://localhost:8083/vehicles/register \
  -H "Content-Type: application/json" \
  -d '{
    "registrationNumber": "GR-1234-20",
    "vehicleType": "AMBULANCE",
    "stationId": 6,
    "stationName": "Korle Bu Teaching Hospital",
    "driverName": "Kofi Mensah",
    "driverPhone": "+233-244-567890",
    "latitude": 5.5364,
    "longitude": -0.2279
  }'
```

### 5. Update Vehicle Location
```bash
curl -X POST http://localhost:8083/vehicles/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 1,
    "latitude": 5.5450,
    "longitude": -0.2100
  }'
```

### 6. View Analytics
```bash
curl http://localhost:8084/analytics/response-times
curl http://localhost:8084/analytics/incidents-by-region
curl http://localhost:8084/analytics/resource-utilization
```

## WebSocket (Real-time Vehicle Tracking)

Connect to the WebSocket endpoint at `ws://localhost:8083/ws` using STOMP protocol.

**Subscribe to:** `/topic/vehicle-locations` for all vehicle updates
**Subscribe to:** `/topic/vehicle/{id}` for a specific vehicle

**Send location updates to:** `/app/location-update`

## Project Structure

```
emergency-response-platform/
├── pom.xml                          # Parent POM
├── auth-service/                    # Microservice 1
│   ├── pom.xml
│   └── src/main/java/com/emergency/auth/
│       ├── AuthServiceApplication.java
│       ├── config/SecurityConfig.java
│       ├── controller/AuthController.java
│       ├── dto/
│       ├── exception/GlobalExceptionHandler.java
│       ├── model/User.java, Role.java
│       ├── repository/UserRepository.java
│       ├── security/JwtTokenProvider.java, JwtAuthenticationFilter.java
│       └── service/AuthService.java
├── incident-service/                # Microservice 2
│   ├── pom.xml
│   └── src/main/java/com/emergency/incident/
│       ├── IncidentServiceApplication.java
│       ├── config/SecurityConfig.java, DataSeeder.java
│       ├── controller/IncidentController.java, StationController.java
│       ├── dto/
│       ├── model/Incident.java, ResponderStation.java, etc.
│       ├── repository/
│       └── service/IncidentService.java, StationService.java
├── dispatch-service/                # Microservice 3
│   ├── pom.xml
│   └── src/main/java/com/emergency/dispatch/
│       ├── DispatchServiceApplication.java
│       ├── config/SecurityConfig.java, WebSocketConfig.java
│       ├── controller/VehicleController.java, LocationWebSocketController.java
│       ├── dto/
│       ├── model/Vehicle.java, LocationHistory.java
│       ├── repository/
│       └── service/VehicleService.java
└── analytics-service/               # Microservice 4
    ├── pom.xml
    └── src/main/java/com/emergency/analytics/
        ├── AnalyticsServiceApplication.java
        ├── config/SecurityConfig.java
        ├── controller/AnalyticsController.java
        ├── dto/
        ├── model/AnalyticsEvent.java
        ├── repository/AnalyticsEventRepository.java
        └── service/AnalyticsService.java
```

## Key Features

1. **JWT Authentication** - Secure token-based auth across all services
2. **Automatic Responder Assignment** - Haversine formula to find nearest available unit
3. **Real-time Tracking** - WebSocket/STOMP for live vehicle location updates
4. **Cross-service Communication** - WebClient for inter-service API calls
5. **Location History** - Full GPS trail tracking for dispatch vehicles
6. **Pre-seeded Ghana Data** - Real Accra police stations, fire stations, and hospitals

## Technology Stack

- **Java 17** + **Spring Boot 3.2.3**
- **Spring Security** + **JWT** (JJWT 0.12.5)
- **Spring Data JPA** + **PostgreSQL**
- **Spring WebSocket** (STOMP)
- **Spring WebFlux** (WebClient for inter-service communication)
- **SpringDoc OpenAPI** (Swagger UI)
- **Lombok** (boilerplate reduction)
- **Maven** (multi-module build)
