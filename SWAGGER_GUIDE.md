# 📘 API Documentation - Swagger UI Guide

The Emergency Response Platform is built with four independent microservices, each providing comprehensive REST API documentation through **OpenAPI (Swagger UI)**.

## 🔗 Swagger UI Endpoints
Ensure each service is running before accessing these links:

| Service | Port | Documentation Link |
|---------|------|--------------------|
| **Identity & Auth** | `8081` | [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) |
| **Emergency Incidents** | `8082` | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) |
| **Dispatch Tracking** | `8083` | [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html) |
| **Analytics Service** | `8084` | [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html) |

## 🔑 Authentication
Most endpoints (except login/register) are protected by **JWT Authentication**.

**How to Test APIs in Swagger:**
1.  Go to the **Auth Service** Swagger UI and use `POST /auth/login` to get an `accessToken`.
2.  Copy the `accessToken`.
3.  On any service's Swagger UI, click the **"Authorize"** button (top right).
4.  Enter `Bearer YOUR_TOKEN_HERE` (include the word "Bearer" followed by a space).
5.  Click Authorize. You can now test all protected endpoints.

## 📡 Core Endpoints Summary

### 👤 Auth Service
- `POST /auth/register`: Create a new Administrator.
- `POST /auth/login`: Authenticate and receive a token.

### 📝 Incident Service
- `POST /incidents`: Record and auto-dispatch an emergency.
- `GET /incidents/open`: View all active emergencies.
- `PUT /stations/{id}/capacity`: Update station bed capacity (Hospital Admins).

### 🚑 Dispatch Service
- `GET /vehicles`: List all emergency vehicles and their locations.
- `POST /vehicles/location`: Update vehicle GPS coordinates.
- `/ws`: WebSocket endpoint for real-time tracking.

### 📊 Analytics Service
- `GET /analytics/response-times`: View response efficiency data.
- `GET /analytics/resource-utilization`: View hospital bed occupancy stats.
