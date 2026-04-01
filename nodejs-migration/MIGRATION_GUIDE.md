# Java to Node.js Migration Guide

## Overview

This guide provides detailed information about migrating your Emergency Response Platform from Java Spring Boot to Node.js/Express.js.

## Project Structure

### Before (Java)
```
├── auth-service/ (Spring Boot)
├── incident-service/ (Spring Boot)
├── dispatch-service/ (Spring Boot)
├── analytics-service/ (Spring Boot)
└── frontend/
```

### After (Node.js)
```
├── auth-service/ (Express.js)
├── incident-service/ (Express.js)
├── dispatch-service/ (Express.js + Socket.io)
├── analytics-service/ (Express.js)
├── docker-compose.yml
├── .env.example
└── frontend/
```

## Key Technology Mappings

### Spring Boot → Express.js
| Spring Boot | Express.js |
|-------------|-----------|
| Spring Framework | Express.js |
| Spring Security + JWT | jsonwebtoken |
| Spring Data JPA | TypeORM |
| Spring Validation | Joi |
| Springdoc OpenAPI | Swagger JSDoc |
| Spring WebSocket (STOMP) | Socket.io |
| PostgreSQL | PostgreSQL (PostgreSQL) |
| Maven | npm |

### Java Classes → TypeScript Files
| Java | TypeScript |
|------|-----------|
| Entity | src/entities/*.ts |
| Repository | TypeORM getRepository() |
| Service | src/services/*.ts |
| Controller | src/routes/*.ts |
| DTO | src/dto/*.ts |
| Configuration | environment variables |

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 12 or higher

### Setup Steps

1. **Clone/Extract the Node.js migration folder**
   ```bash
   cd nodejs-migration
   ```

2. **Set up environment variables for each service**
   ```bash
   # For each service directory
   cp .env.example .env
   ```

3. **Update .env files with your database credentials**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=emergency_db
   ```

4. **Install dependencies for each service**
   ```bash
   # Auth Service
   cd auth-service && npm install && cd ..

   # Incident Service
   cd incident-service && npm install && cd ..

   # Dispatch Service
   cd dispatch-service && npm install && cd ..

   # Analytics Service
   cd analytics-service && npm install && cd ..
   ```

5. **Build TypeScript**
   ```bash
   cd auth-service && npm run build && cd ..
   cd incident-service && npm run build && cd ..
   cd dispatch-service && npm run build && cd ..
   cd analytics-service && npm run build && cd ..
   ```

## Running Services

### Development Mode (with hot reload)

Run each service in a separate terminal:

```bash
# Terminal 1 - Auth Service
cd auth-service
npm run dev

# Terminal 2 - Incident Service
cd incident-service
npm run dev

# Terminal 3 - Dispatch Service
cd dispatch-service
npm run dev

# Terminal 4 - Analytics Service
cd analytics-service
npm run dev
```

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

Services will be available at:
- Auth Service: http://localhost:3001
- Incident Service: http://localhost:3002
- Dispatch Service: http://localhost:3003
- Analytics Service: http://localhost:3004

### Production Mode

Build and run:
```bash
npm run build
npm start
```

## API Documentation

Each service provides Swagger OpenAPI documentation:

- **Auth Service**: http://localhost:3001/api-docs
- **Incident Service**: http://localhost:3002/api-docs
- **Dispatch Service**: http://localhost:3003/api-docs
- **Analytics Service**: http://localhost:3004/api-docs

## Database Migrations

The services use TypeORM with automatic synchronization in development mode (synchronize: true). For production:

```bash
npm run migrate
```

## Service-to-Service Communication

Services communicate using HTTP clients (axios) and can access each other through environment variables:

```typescript
const incidentServiceUrl = process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002';
const response = await this.httpClient.get(`${incidentServiceUrl}/incidents`);
```

## WebSocket (Dispatch Service)

The Dispatch Service uses Socket.io for real-time vehicle location updates:

```javascript
// Client connection
const socket = io('http://localhost:3003');

// Listen for vehicle location updates
socket.on('vehicle-location', (vehicleData) => {
  console.log('Vehicle updated:', vehicleData);
});

// Send location update
socket.emit('location-update', {
  vehicleId: 1,
  latitude: 40.7128,
  longitude: -74.0060
});

// Subscribe to specific vehicle
socket.emit('subscribe-vehicle', 1);
socket.on('vehicle-location', (data) => {
  // Receive updates only for vehicle 1
});
```

## Authentication

JWT tokens are compatible between Java and Node.js versions. The token structure remains the same:

```typescript
interface TokenPayload {
  sub: number;      // User ID
  email: string;    // User email
  role: string;     // User role
  iat?: number;     // Issued at
  exp?: number;     // Expiration time
}
```

**Token validation middleware** is applied to protected routes:

```typescript
router.get('/profile', validateToken, async (req, res) => {
  // req.user contains { id, email, role }
});
```

## Environmental Configuration

Create a central configuration for all services:

```env
# Shared Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=emergency_db

# JWT Settings
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
INCIDENT_SERVICE_URL=http://localhost:3002
DISPATCH_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004

# Deployment
NODE_ENV=production
```

## Directory Structure per Service

Each service follows this structure:

```
service-name/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── database/
│   │   └── database.ts          # TypeORM configuration
│   ├── entities/                # Database entities
│   ├── dto/                     # Data Transfer Objects
│   ├── services/                # Business logic
│   ├── routes/                  # API routes
│   ├── middleware/              # Middleware (auth, etc.)
│   └── security/                # Security utilities (JWT, etc.)
├── dist/                        # Compiled JavaScript (build output)
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
└── README.md
```

## Error Handling

Express.js middleware handles errors:

```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});
```

## Logging

Console logging is used for development:

```typescript
console.log('User registered:', user.email);
console.error('Database error:', error);
console.warn('Service unavailable:', serviceName);
```

For production, consider integrating:
- **winston** - Advanced logging
- **morgan** - HTTP request logging
- **pino** - Fast JSON logger

## Testing

Run tests with Jest:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Deployment Considerations

### Docker Deployment
```bash
# Build image
docker build -t auth-service:latest ..

# Run container
docker run -d \
  -p 3001:3001 \
  -e DB_HOST=db.example.com \
  -e NODE_ENV=production \
  auth-service:latest
```

### Azure Deployment
- Use Azure Container Registry (ACR) for images
- Deploy to Azure Container Instances (ACI) or Azure App Service
- Use Azure Database for PostgreSQL

### Environment Secrets
Never commit .env files. Use:
- Docker secrets
- Environment variable management (AWS Secrets Manager, Azure Key Vault)
- Build system secrets (GitHub Actions, GitLab CI)

## Performance Optimization

### Connection Pooling
```typescript
// TypeORM automatically manages connection pools
// Default pool size: 5-20 connections
```

### Caching
Consider adding Redis:
```bash
npm install redis
```

### Compression
```typescript
app.use(compression());
```

## Monitoring & Health Checks

Health check endpoints are available at:
- `GET /health` - Returns service status

Example response:
```json
{
  "status": "Auth Service is running"
}
```

## Common Issues & Solutions

### Database Connection Errors
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution: Ensure PostgreSQL is running
- Windows: services.msc search for PostgreSQL
- Mac: brew services start postgresql
- Linux: sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001

Solution: Kill the process or change PORT in .env
```

### TypeScript Compilation Errors
```bash
# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Rollback Procedure

To revert to Java version:
1. Stop Node.js services
2. Restore Java services from backup
3. Ensure database is in correct state
4. Restart Java services

## Support & Maintenance

- **Performance**: Monitor response times and database queries
- **Logging**: Check logs for errors and warnings
- **Dependencies**: Keep npm packages updated
- **Database**: Regular backups and maintenance

## Migration Checklist

- [ ] All services migrated to Node.js
- [ ] Environment variables configured
- [ ] Docker Compose tested
- [ ] API endpoints verified
- [ ] WebSocket communication tested
- [ ] JWT authentication working
- [ ] Database synchronized
- [ ] Swagger docs accessible
- [ ] Tests passing
- [ ] Performance benchmarked
- [ ] Documentation updated
- [ ] Team trained on Node.js setup

## References

- [Express.js Documentation](https://expressjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.io Documentation](https://socket.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
