import 'express-async-errors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './database/database';
import { incidentRoutes } from './routes/incident.routes';
import { stationRoutes } from './routes/station.routes';

const app: Express = express();
const PORT = process.env.PORT || 3002;

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
      title: 'Incident Service API',
      version: '1.0.0',
      description: 'Emergency Incident Management Service',
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
app.use('/incidents', incidentRoutes);
app.use('/stations', stationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Incident Service is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Incident Service running on port ${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
