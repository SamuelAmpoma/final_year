# 🚀 Deployment Guide - Emergency Response Platform

This guide provides instructions on how to deploy and run the full microservices-based system.

## 📋 Prerequisites
- **Node.js 18+** & **npm**
- **PostgreSQL** (Local OR Neon.tech remote instance)
- **Git**

## 🗄️ Database Configuration
The system is currently configured to connect to a remote **Neon PostgreSQL** database. If you wish to use a local database, update the `.env` files in each backend service directory:
- `auth-service` → Port 3001
- `incident-service` → Port 3002
- `dispatch-service` → Port 3003
- `analytics-service` → Port 3004

## 📦 Installing Dependencies
```bash
# Install all backend service dependencies
cd backend/auth-service && npm install
cd ../incident-service && npm install
cd ../dispatch-service && npm install
cd ../analytics-service && npm install

# Install frontend dependencies
cd ../../frontend && npm install
```

## 🏃 Running the Backend
Run each service in a separate terminal:
```bash
# Auth Service (Port 3001)
cd backend/auth-service && npm run dev

# Incident Service (Port 3002)
cd backend/incident-service && npm run dev

# Dispatch Service (Port 3003)
cd backend/dispatch-service && npm run dev

# Analytics Service (Port 3004)
cd backend/analytics-service && npm run dev
```

## 🐳 Running with Docker (Alternative)
```bash
cd backend
docker-compose up --build
```

## 🌐 Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at [http://localhost:5173](http://localhost:5173).

## 🔐 Default Credentials
- **Role**: System Admin
- **Email**: `sasug540@gmail.com`
- **Password**: `password123`

## 📖 API Documentation (Swagger)
- Auth Service: http://localhost:3001/api-docs
- Incident Service: http://localhost:3002/api-docs
- Dispatch Service: http://localhost:3003/api-docs
- Analytics Service: http://localhost:3004/api-docs

## 🛠️ Troubleshooting
- **Port Conflicts**: Ensure ports 3001–3004 and 5173 are free.
- **Database Connection**: Ensure your internet connection is active for Neon PostgreSQL or that your local Postgres is running.
- **WebSockets**: The Map Tracking feature requires port 3003 to be accessible for Socket.IO connections.
- **Environment Variables**: Make sure `.env` files exist in each backend service directory. Copy from `.env.example` if missing.
