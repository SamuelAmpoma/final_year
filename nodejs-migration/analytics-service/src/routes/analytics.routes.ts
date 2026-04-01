import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

const router = Router();
const analyticsService = new AnalyticsService();

/**
 * @swagger
 * /analytics/response-times:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get response time analytics
 *     description: Returns average response times, breakdown by incident type, and overall incident statistics
 *     responses:
 *       200:
 *         description: Response time analytics retrieved
 */
router.get('/response-times', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getResponseTimeAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/incidents-by-region:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get incidents by region
 *     description: Returns incident counts grouped by region and incident type
 *     responses:
 *       200:
 *         description: Incidents by region retrieved
 */
router.get('/incidents-by-region', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getIncidentsByRegion();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/resource-utilization:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get resource utilization
 *     description: Returns resource deployment stats, vehicle utilization, and hospital bed capacity
 *     responses:
 *       200:
 *         description: Resource utilization retrieved
 */
router.get('/resource-utilization', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getResourceUtilization();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/events:
 *   post:
 *     tags:
 *       - Analytics
 *     summary: Record analytics event
 *     description: Manually record an analytics event for tracking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *               incidentType:
 *                 type: string
 *               region:
 *                 type: string
 *               responseTimeMinutes:
 *                 type: number
 *               incidentId:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event recorded
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const event = await analyticsService.recordEvent(req.body);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export { router as analyticsRoutes };
