import 'express-async-errors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './database/database';
import { vehicleRoutes } from './routes/vehicle.routes';
import { VehicleService } from './services/VehicleService';

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Create HTTP server
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dispatch Service API',
      version: '1.0.0',
      description: 'Dispatch Tracking Service with Real-time WebSocket',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/vehicles', vehicleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Dispatch Service is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Location update from vehicle
  socket.on('location-update', async (data) => {
    try {
      const vehicleService = new VehicleService();
      const updatedVehicle = await vehicleService.updateLocation(data);

      // Broadcast to all connected clients
      io.emit('vehicle-location', updatedVehicle);

      // Also broadcast to a specific vehicle room
      io.to(`vehicle-${data.vehicleId}`).emit('vehicle-location', updatedVehicle);

      console.log(`Location updated for vehicle ${data.vehicleId}`);
    } catch (error) {
      console.error('Error updating location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Subscribe to a specific vehicle location updates
  socket.on('subscribe-vehicle', (vehicleId) => {
    socket.join(`vehicle-${vehicleId}`);
    console.log(`Client subscribed to vehicle ${vehicleId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`Dispatch Service running on port ${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`WebSocket available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
export { io };
