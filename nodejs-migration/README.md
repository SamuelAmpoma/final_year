# Emergency Response Platform - Node.js Migration

This directory contains the Node.js/Express.js version of the Emergency Response Platform, migrated from Java Spring Boot.

## Services

1. **auth-service** - Authentication and user management
2. **incident-service** - Emergency incident management
3. **dispatch-service** - Vehicle tracking and real-time dispatch
4. **analytics-service** - Analytics and monitoring

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 12 or higher

## Installation

```bash
cd auth-service
npm install

cd ../incident-service
npm install

cd ../dispatch-service
npm install

cd ../analytics-service
npm install
```

## Configuration

Each service uses environment variables. Create a `.env` file in each service directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=emergency_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
INCIDENT_SERVICE_URL=http://localhost:3002
DISPATCH_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004

# Server
PORT=3001 (adjust per service)
NODE_ENV=development
```

## Development

To run a service in development mode with auto-reload:

```bash
cd auth-service
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## API Documentation

Each service provides Swagger OpenAPI documentation at:
- Auth Service: `http://localhost:3001/api-docs`
- Incident Service: `http://localhost:3002/api-docs`
- Dispatch Service: `http://localhost:3003/api-docs`
- Analytics Service: `http://localhost:3004/api-docs`

## Database Setup

Run migrations for each service:

```bash
npm run migrate
```

## WebSocket (Dispatch Service)

The dispatch service uses Socket.io for real-time location updates:

```javascript
// Client connection
const socket = io('http://localhost:3003');

// Listen for vehicle location updates
socket.on('vehicle-location', (vehicleData) => {
  console.log('Vehicle position:', vehicleData);
});

// Send location update
socket.emit('location-update', {
  vehicleId: 1,
  latitude: 40.7128,
  longitude: -74.0060
});
```

## Migration Notes

- JWT tokens are compatible with the Java version
- Database schemas have been converted to TypeORM entities
- All REST endpoints maintain the same structure
- Socket.io replaces Spring WebSocket STOMP
- Environment configuration uses dotenv instead of application.yml

## Testing

```bash
npm test
```

## Deployment

Docker images are provided for each service (see Dockerfile in each service directory).
