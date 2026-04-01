#!/bin/bash

echo "================================================"
echo "EMERGENCY RESPONSE PLATFORM - SERVICE STATUS"
echo "================================================"
echo ""

# Check if ports are listening
echo "[1] Checking if service ports are open..."
echo "---"

for port in 8081 8082 8083 8084; do
    if nc -z localhost $port 2>/dev/null; then
        echo "✓ Port $port: OPEN"
    else
        echo "✗ Port $port: CLOSED"
    fi
done

echo ""
echo "[2] Testing service connectivity..."
echo "---"

# Auth Service
echo "Auth Service (8081):"
curl -s -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -c 100
echo ""
echo ""

# Incident Service  
echo "Incident Service (8082):"
curl -s -X GET http://localhost:8082/incidents \
  -H "Authorization: Bearer test" | head -c 100
echo ""
echo ""

# Dispatch Service
echo "Dispatch Service (8083):"
curl -s -X GET http://localhost:8083/vehicles | head -c 100
echo ""
echo ""

# Analytics Service
echo "Analytics Service (8084):"
curl -s -X GET http://localhost:8084/analytics | head -c 100
echo ""
echo ""

echo "================================================"
echo "DATABASE CONNECTIVITY TEST"
echo "================================================"
echo ""

# Check PostgreSQL
if psql -U postgres -h localhost -d auth_service_db -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null; then
    echo "✓ PostgreSQL: CONNECTED"
else
    echo "✗ PostgreSQL: FAILED TO CONNECT"
fi

echo ""
echo "Service Status Check Complete!"
