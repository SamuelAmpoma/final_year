# 🚀 Deployment Guide - Emergency Response Platform

This guide provides instructions on how to deploy and run the full microservices-based system.

## 📋 Prerequisites
- **Java 17 or higher**
- **Maven 3.8+**
- **Node.js 18+ & npm**
- **PostgreSQL** (Local OR Neon.tech remote instance)

## 🗄️ Database Configuration
The system is currently configured to connect to a remote **Neon PostgreSQL** database. If you wish to use a local database, update the `application.yml` files in the `src/main/resources` folder of each microservice:
- `auth-service`: `auth_db`
- `incident-service`: `incident_db`
- `dispatch-service`: `dispatch_db`
- `analytics-service`: `analytics_db`

## 🏗️ Building the Services
From the root directory:
```bash
# Build all backend microservices
./mvnw clean install -DskipTests
```

## 🏃 Running the Backend
You can run each service independently using Maven:
```bash
# Auth Service (Port 8081)
cd auth-service && mvn spring-boot:run

# Incident Service (Port 8082)
cd incident-service && mvn spring-boot:run

# Dispatch Service (Port 8083)
cd dispatch-service && mvn spring-boot:run

# Analytics Service (Port 8084)
cd analytics-service && mvn spring-boot:run
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

## 🛠️ Troubleshooting
- **Port Conflicts**: Ensure ports 8081-8084 and 5173 are free.
- **Database Connection**: Ensure your internet connection is active for Neon PostgreSQL or that your local Postgres is running.
- **WebSockets**: The Map Tracking feature requires port 8083 to be accessible for WS connections.
