import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { IncidentService } from '../services/IncidentService';
import { IncidentType } from '../entities/Incident';

const router = Router();
const incidentService = new IncidentService();

// Validation schemas
const createIncidentSchema = Joi.object({
  citizenName: Joi.string().required(),
  citizenPhone: Joi.string().required(),
  incidentType: Joi.string()
    .valid('FIRE', 'MEDICAL', 'ACCIDENT', 'HAZMAT', 'OTHER')
    .required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  locationAddress: Joi.string().required(),
  notes: Joi.string(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('CREATED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')
    .required(),
});

const assignUnitSchema = Joi.object({
  unitId: Joi.number().required(),
  unitName: Joi.string().required(),
  unitType: Joi.string().required(),
});

/**
 * @swagger
 * /incidents:
 *   post:
 *     tags:
 *       - Incidents
 *     summary: Create a new incident
 *     description: Records a new emergency incident and auto-assigns nearest responder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               citizenName:
 *                 type: string
 *               citizenPhone:
 *                 type: string
 *               incidentType:
 *                 type: string
 *                 enum: [FIRE, MEDICAL, ACCIDENT, HAZMAT, OTHER]
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               locationAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident created
 *       400:
 *         description: Invalid request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createIncidentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // In production, extract admin ID from JWT
    const adminId = 1;
    const incident = await incidentService.createIncident(value, adminId);
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get incident by ID
 *     description: Retrieves details of a specific incident
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident retrieved
 *       404:
 *         description: Incident not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const incident = await incidentService.getIncidentById(
      parseInt(req.params.id)
    );
    res.json(incident);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

/**
 * @swagger
 * /incidents/open:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get open incidents
 *     description: Retrieves all non-resolved incidents
 *     responses:
 *       200:
 *         description: Open incidents retrieved
 */
router.get('/open', async (req: Request, res: Response) => {
  try {
    const incidents = await incidentService.getOpenIncidents();
    res.json(incidents);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /incidents:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get all incidents
 *     description: Retrieves all incidents
 *     responses:
 *       200:
 *         description: All incidents retrieved
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const incidents = await incidentService.getAllIncidents();
    res.json(incidents);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /incidents/{id}/status:
 *   put:
 *     tags:
 *       - Incidents
 *     summary: Update incident status
 *     description: Updates the status of an incident
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CREATED, DISPATCHED, IN_PROGRESS, RESOLVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const incident = await incidentService.updateIncidentStatus(
      parseInt(req.params.id),
      value
    );
    res.json(incident);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /incidents/{id}/assign:
 *   put:
 *     tags:
 *       - Incidents
 *     summary: Assign unit to incident
 *     description: Manually assigns a responder unit to an incident
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitId:
 *                 type: number
 *               unitName:
 *                 type: string
 *               unitType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unit assigned
 */
router.put('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { error, value } = assignUnitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const incident = await incidentService.assignUnit(
      parseInt(req.params.id),
      value
    );
    res.json(incident);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export { router as incidentRoutes };
