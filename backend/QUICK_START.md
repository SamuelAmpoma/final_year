# Quick Start Guide - Node.js Migration

## 5-Minute Setup

### Option 1: Using Docker Compose (Easiest)

```bash
# 1. Navigate to the migration folder
cd nodejs-migration

# 2. Start all services with Docker
docker-compose up -d

# 3. Wait 30 seconds for database initialization
sleep 30

# 4. Services are now running!
```

**Services Available:**
- API Gateway/Auth: http://localhost:3001
- Incidents: http://localhost:3002
- Dispatch: http://localhost:3003
- Analytics: http://localhost:3004
- Swagger Docs: http://localhost:3001/api-docs

---

### Option 2: Manual Setup (Development)

```bash
# Step 1: Install Node.js dependencies for all services
cd auth-service && npm install && cd ..
cd incident-service && npm install && cd ..
cd dispatch-service && npm install && cd ..
cd analytics-service && npm install && cd ..

# Step 2: Create environment files
cp auth-service/.env.example auth-service/.env
cp incident-service/.env.example incident-service/.env
cp dispatch-service/.env.example dispatch-service/.env
cp analytics-service/.env.example analytics-service/.env

# Step 3: Start PostgreSQL (if not running)
# macOS: brew services start postgresql
# Windows: Services -> Start PostgreSQL
# Linux: sudo systemctl start postgresql

# Step 4: Run services (each in a separate terminal)
terminal1: cd auth-service && npm run dev
terminal2: cd incident-service && npm run dev
terminal3: cd dispatch-service && npm run dev
terminal4: cd analytics-service && npm run dev
```

---

## Testing the Services

### 1. Register a User (Auth Service)

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "ADMIN",
    "phoneNumber": "555-1234"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN"
  }
}
```

### 2. Create an Incident (Incident Service)

```bash
curl -X POST http://localhost:3002/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "citizenName": "Jane Smith",
    "citizenPhone": "555-9876",
    "incidentType": "MEDICAL",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "locationAddress": "123 Main St, New York, NY",
    "notes": "Patient having chest pain"
  }'
```

### 3. Create a Station (Incident Service)

```bash
curl -X POST http://localhost:3002/stations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Harbor Hospital",
    "stationType": "HOSPITAL",
    "latitude": 40.7150,
    "longitude": -74.0060,
    "address": "456 Park Ave, New York, NY",
    "phoneNumber": "555-5678",
    "capacity": 100
  }'
```

### 4. Register a Vehicle (Dispatch Service)

```bash
curl -X POST http://localhost:3003/vehicles/register \
  -H "Content-Type: application/json" \
  -d '{
    "registrationNumber": "AMB-001",
    "vehicleType": "AMBULANCE",
    "stationId": 1,
    "stationName": "Harbor Hospital",
    "driverName": "Bob Johnson",
    "driverPhone": "555-1111",
    "latitude": 40.7160,
    "longitude": -74.0050
  }'
```

### 5. Update Vehicle Location (Dispatch Service - via WebSocket)

```javascript
// In browser console or Node.js
const socket = io('http://localhost:3003');

socket.emit('location-update', {
  vehicleId: 1,
  latitude: 40.7180,
  longitude: -74.0040
});

socket.on('vehicle-location', (data) => {
  console.log('Vehicle location updated:', data);
});
```

### 6. Get Analytics (Analytics Service)

```bash
curl http://localhost:3004/analytics/response-times
curl http://localhost:3004/analytics/incidents-by-region
curl http://localhost:3004/analytics/resource-utilization
```

---

## Database Access

### Connect to PostgreSQL

```bash
# Using psql
psql -h localhost -U postgres -d emergency_db

# In psql, useful commands:
\dt                    # List tables
\d users               # Describe table
SELECT * FROM users;   # Query data
```

### Reset Database

```bash
# Drop all data
docker-compose down -v

# Recreate with fresh database
docker-compose up -d
```

---

## Accessing Swagger Documentation

Open in your browser:

| Service | URL |
|---------|-----|
| Auth | http://localhost:3001/api-docs |
| Incidents | http://localhost:3002/api-docs |
| Dispatch | http://localhost:3003/api-docs |
| Analytics | http://localhost:3004/api-docs |

---

## Troubleshooting

### Service won't start

```bash
# Check if port is in use
lsof -i :3001

# Kill process on port
kill -9 <PID>

# Or change PORT in .env
```

### Database connection error

```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database exists
psql -h localhost -U postgres -l
```

### Out of sync with Java version

1. Check `.env` file matches Java service config
2. Database schema should auto-sync in dev mode
3. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

---

## What Was Migrated

### ✅ Fully Migrated
- Auth Service (JWT authentication)
- Incident Service (incident & station management)
- Dispatch Service (vehicle tracking + WebSocket)
- Analytics Service (analytics & metrics)

### Configuration
- All environment variables mapped
- PostgreSQL connection pooling
- JWT token generation & validation
- Swagger/OpenAPI documentation

### Real-time Features
- Socket.io WebSocket for vehicle location updates
- Pub/Sub pattern for broadcast updates

---

## Next Steps

1. **Review MIGRATION_GUIDE.md** for detailed information
2. **Update frontend** to connect to new Node.js services
3. **Run tests** to validate functionality
4. **Performance test** under expected load
5. **Deploy** to staging environment first

---

## Support

For detailed information about each service, see:
- README.md - Service overview
- MIGRATION_GUIDE.md - Complete migration guide
- {service}/src/routes/*.ts - API endpoint definitions
- {service}/src/services/*.ts - Business logic

Swagger docs provide interactive API testing at `/api-docs` endpoint for each service.
