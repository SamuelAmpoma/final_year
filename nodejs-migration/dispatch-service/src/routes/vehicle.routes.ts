import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { VehicleService } from '../services/VehicleService';
import { VehicleStatus } from '../entities/Vehicle';

const router = Router();
const vehicleService = new VehicleService();

const registerVehicleSchema = Joi.object({
  registrationNumber: Joi.string().required(),
  vehicleType: Joi.string()
    .valid('AMBULANCE', 'FIRE_ENGINE', 'POLICE_CAR', 'RESCUE_UNIT')
    .required(),
  stationId: Joi.number().required(),
  stationName: Joi.string().required(),
  driverName: Joi.string().required(),
  driverPhone: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
});

const locationUpdateSchema = Joi.object({
  vehicleId: Joi.number().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
});

/**
 * @swagger
 * /vehicles/register:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Register a new vehicle
 *     description: Register an emergency response vehicle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationNumber:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [AMBULANCE, FIRE_ENGINE, POLICE_CAR, RESCUE_UNIT]
 *               stationId:
 *                 type: number
 *               stationName:
 *                 type: string
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle registered
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerVehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const vehicle = await vehicleService.registerVehicle(value);
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get all vehicles
 *     description: Retrieves all registered vehicles
 *     responses:
 *       200:
 *         description: All vehicles retrieved
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get vehicle by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle retrieved
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleById(parseInt(req.params.id));
    res.json(vehicle);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/{id}/location:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get vehicle current location
 *     description: Returns the latest GPS coordinates of a vehicle
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location retrieved
 */
router.get('/:id/location', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleLocation(parseInt(req.params.id));
    res.json(vehicle);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/location:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Update vehicle location
 *     description: Receives GPS location update from a vehicle and broadcasts via WebSocket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: number
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.post('/location', async (req: Request, res: Response) => {
  try {
    const { error, value } = locationUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const vehicle = await vehicleService.updateLocation(value);
    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/{id}/status:
 *   put:
 *     tags:
 *       - Vehicles
 *     summary: Update vehicle status
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: status
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ON_DUTY, RESPONDING, AT_SCENE, RETURNING, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as VehicleStatus;
    const vehicle = await vehicleService.updateVehicleStatus(
      parseInt(req.params.id),
      status
    );
    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/{vehicleId}/assign/{incidentId}:
 *   put:
 *     tags:
 *       - Vehicles
 *     summary: Assign vehicle to incident
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: incidentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle assigned
 */
router.put('/:vehicleId/assign/:incidentId', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.assignToIncident(
      parseInt(req.params.vehicleId),
      parseInt(req.params.incidentId)
    );
    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /vehicles/{id}/history:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get vehicle location history
 *     description: Returns the GPS trail of a vehicle
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location history retrieved
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await vehicleService.getLocationHistory(parseInt(req.params.id));
    res.json(history);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export { router as vehicleRoutes };
