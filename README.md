# Emergency Response & Dispatch Coordination Platform

## Overview
A distributed microservices-based system that simulates a national emergency response and dispatch coordination platform for Ghana. The system helps coordinate emergency responses by recording incidents, automatically determining the nearest appropriate responder, dispatching units, and tracking responses in real time.

## Architecture

The platform consists of 4 independent microservices and a React frontend:

| Service | Port | Description |
|---------|------|-------------|
| **Auth Service** | 3001 | Identity, authentication, JWT tokens |
| **Incident Service** | 3002 | Emergency incident management & station data |
| **Dispatch Service** | 3003 | Vehicle tracking, GPS & WebSocket real-time updates |
| **Analytics Service** | 3004 | Statistics, response times & monitoring |
| **Frontend** | 5173 | React SPA dashboard |

## Prerequisites

- **Node.js 18+** & **npm**
- **PostgreSQL 14+** (local) or **Neon PostgreSQL** (cloud — pre-configured)
- **Git**

## Database Setup

The system is pre-configured to connect to a remote **Neon PostgreSQL** cloud database. No local database setup is needed for development.

To use a **local PostgreSQL** instead, update the `.env` file in each service:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=emergency_db
DB_SSL=false
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend services
cd backend/auth-service && npm install
cd ../incident-service && npm install
cd ../dispatch-service && npm install
cd ../analytics-service && npm install

# Frontend
cd ../../frontend && npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in each backend service and update the values:

```bash
cd backend/auth-service && cp .env.example .env
cd ../incident-service && cp .env.example .env
cd ../dispatch-service && cp .env.example .env
cd ../analytics-service && cp .env.example .env
```

### 3. Run the Backend Services

Start each service in a separate terminal:

```bash
# Terminal 1 - Auth Service (Port 3001)
cd backend/auth-service
npm run dev

# Terminal 2 - Incident Service (Port 3002)
cd backend/incident-service
npm run dev

# Terminal 3 - Dispatch Service (Port 3003)
cd backend/dispatch-service
npm run dev

# Terminal 4 - Analytics Service (Port 3004)
cd backend/analytics-service
npm run dev
```

### 4. Run the Frontend

```bash
cd frontend
npm run dev
```

The dashboard will be available at **http://localhost:5173**

## Default Credentials

- **Email:** `sasug540@gmail.com`
- **Password:** `password123`
- **Role:** System Admin (full access)

## API Documentation (Swagger)

Each service exposes Swagger UI:

- Auth Service: http://localhost:3001/api-docs
- Incident Service: http://localhost:3002/api-docs
- Dispatch Service: http://localhost:3003/api-docs
- Analytics Service: http://localhost:3004/api-docs

## API Endpoints

### Auth Service (Port 3001)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login & get JWT | No |
| POST | `/auth/refresh-token` | Refresh JWT token | No |
| GET | `/auth/profile` | Get user profile | Yes |

### Incident Service (Port 3002)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/incidents` | Create incident | Yes |
| GET | `/incidents/{id}` | Get incident by ID | Yes |
| GET | `/incidents/open` | Get open incidents | Yes |
| GET | `/incidents` | Get all incidents | Yes |
| PUT | `/incidents/{id}/status` | Update status | Yes |
| PUT | `/incidents/{id}/assign` | Assign unit | Yes |
| POST | `/stations` | Create station | Yes |
| GET | `/stations` | List stations | No |
| GET | `/stations/type/{type}` | Stations by type | No |

### Dispatch Service (Port 3003)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vehicles/register` | Register vehicle | No |
| GET | `/vehicles` | List vehicles | No |
| GET | `/vehicles/{id}` | Get vehicle | No |
| GET | `/vehicles/{id}/location` | Get location | No |
| POST | `/vehicles/location` | Update location | No |
| PUT | `/vehicles/{id}/status` | Update status | No |
| WS | `/ws` | WebSocket (Socket.IO) | No |

### Analytics Service (Port 3004)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/response-times` | Response time stats | No |
| GET | `/analytics/incidents-by-region` | Regional breakdown | No |
| GET | `/analytics/resource-utilization` | Resource stats | No |

## Testing with cURL

### 1. Register a System Admin
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@emergency.gov.gh",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@emergency.gov.gh",
    "password": "admin123"
  }'
```

### 3. Create an Incident (use the JWT token from login)
```bash
curl -X POST http://localhost:3002/incidents \
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
curl -X POST http://localhost:3003/vehicles/register \
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
curl -X POST http://localhost:3003/vehicles/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 1,
    "latitude": 5.5450,
    "longitude": -0.2100
  }'
```

### 6. View Analytics
```bash
curl http://localhost:3004/analytics/response-times
curl http://localhost:3004/analytics/incidents-by-region
curl http://localhost:3004/analytics/resource-utilization
```

## WebSocket (Real-time Vehicle Tracking)

Connect to the WebSocket endpoint at `http://localhost:3003` using Socket.IO client.

**Events:**
- `vehicle-location-update` — Receive real-time vehicle position updates
- `update-location` — Send GPS location updates from a driver client

## Role-Based Access Control

The system implements 3 actor roles with tailored UI views:

| Role | Label | Default View | Capabilities |
|------|-------|-------------|--------------|
| `ADMIN` | System Administrator | Dashboard | Full access — incidents, dispatch, stations, analytics |
| `DISPATCHER` | Station Administrator | Station Management | Hospital/Police/Fire station management, dispatch tracking |
| `RESPONDER` | Emergency Responder | Driver GPS Panel | GPS location sharing, view active dispatches |

## Project Structure

```
emergency-response-platform/
├── backend/
│   ├── docker-compose.yml               # Docker orchestration
│   ├── auth-service/                     # Microservice 1
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Express entry point (:3001)
│   │       ├── database/                 # TypeORM data source
│   │       ├── entities/                 # User entity
│   │       ├── dto/                      # Request/Response DTOs
│   │       ├── routes/                   # /auth/* endpoints
│   │       ├── services/                 # Business logic
│   │       ├── security/                 # JWT provider
│   │       ├── middleware/               # Auth middleware
│   │       └── types/                    # TypeScript types
│   ├── incident-service/                 # Microservice 2
│   │   └── src/
│   │       ├── index.ts                  # Express entry point (:3002)
│   │       ├── entities/                 # Incident, ResponderStation
│   │       ├── routes/                   # /incidents/*, /stations/*
│   │       └── services/                 # Incident + Station logic
│   ├── dispatch-service/                 # Microservice 3
│   │   └── src/
│   │       ├── index.ts                  # Express + Socket.IO (:3003)
│   │       ├── entities/                 # Vehicle, LocationHistory
│   │       ├── routes/                   # /vehicles/*
│   │       └── services/                 # Vehicle tracking logic
│   └── analytics-service/               # Microservice 4
│       └── src/
│           ├── index.ts                  # Express entry point (:3004)
│           ├── entities/                 # AnalyticsEvent
│           ├── routes/                   # /analytics/*
│           └── services/                 # Stats aggregation
├── frontend/                             # React SPA
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                      # React mount point
│       ├── App.jsx                       # Router + role-based navigation
│       ├── api.js                        # Axios HTTP client
│       ├── index.css                     # Global styles
│       └── pages/
│           ├── LoginPage.jsx             # JWT login form
│           ├── DashboardPage.jsx         # System overview
│           ├── IncidentsPage.jsx         # Incident management
│           ├── DispatchPage.jsx          # Vehicle tracking + map
│           ├── StationsPage.jsx          # Station management
│           ├── AnalyticsPage.jsx         # Charts & analytics
│           ├── HospitalAdminPage.jsx     # Hospital admin panel
│           ├── StationAdminPage.jsx      # Police/Fire admin panel
│           └── DriverPage.jsx            # Ambulance driver GPS
└── README.md
```

## Key Features

1. **JWT Authentication** — Secure token-based auth with role-based access control
2. **Automatic Responder Assignment** — Haversine formula to find nearest available unit
3. **Real-time Tracking** — Socket.IO for live vehicle location updates
4. **Cross-service Communication** — Axios for inter-service API calls
5. **Location History** — Full GPS trail tracking for dispatch vehicles
6. **Pre-seeded Ghana Data** — Real Accra police stations, fire stations, and hospitals
7. **Interactive Maps** — Leaflet.js with real-time vehicle markers
8. **Analytics Dashboard** — Chart.js for response times, regional stats, and resource utilization

## Technology Stack

### Backend
- **Node.js 18+** with **TypeScript 5.2**
- **Express.js 4.18** (REST API framework)
- **TypeORM 0.3** (database ORM)
- **PostgreSQL** via **Neon Cloud** (managed database)
- **Socket.IO 4.7** (real-time WebSocket communication)
- **JWT** with **bcryptjs** (authentication & password hashing)
- **Joi** (request validation)
- **Swagger** (API documentation)
- **Helmet + CORS** (security middleware)

### Frontend
- **React 19** with **Vite 8** (build tool)
- **Axios** (HTTP client)
- **Leaflet.js + react-leaflet** (interactive maps)
- **Chart.js** (data visualization)
- **Socket.IO Client** (real-time updates)

### Infrastructure
- **Docker Compose** (containerized deployment)
- **Neon PostgreSQL** (cloud database)
