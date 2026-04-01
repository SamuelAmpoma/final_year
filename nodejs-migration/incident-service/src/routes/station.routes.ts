import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { StationService } from '../services/StationService';
import { StationType } from '../entities/ResponderStation';

const router = Router();
const stationService = new StationService();

const createStationSchema = Joi.object({
  name: Joi.string().required(),
  stationType: Joi.string()
    .valid('POLICE', 'FIRE', 'HOSPITAL')
    .required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  address: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  capacity: Joi.number(),
});

/**
 * @swagger
 * /stations:
 *   post:
 *     tags:
 *       - Stations
 *     summary: Create a new station
 *     description: Register a new responder station
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               stationType:
 *                 type: string
 *                 enum: [POLICE, FIRE, HOSPITAL]
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Station created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createStationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const station = await stationService.createStation(value);
    res.status(201).json(station);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /stations:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get all stations
 *     description: Retrieves all registered responder stations
 *     responses:
 *       200:
 *         description: All stations retrieved
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stations = await stationService.getAllStations();
    res.json(stations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /stations/type/{type}:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get stations by type
 *     description: Retrieves stations filtered by type
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [POLICE, FIRE, HOSPITAL]
 *     responses:
 *       200:
 *         description: Stations retrieved
 */
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const stations = await stationService.getStationsByType(
      req.params.type as StationType
    );
    res.json(stations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /stations/{id}:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get station by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station retrieved
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const station = await stationService.getStationById(
      parseInt(req.params.id)
    );
    res.json(station);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

/**
 * @swagger
 * /stations/{id}/availability:
 *   put:
 *     tags:
 *       - Stations
 *     summary: Update station availability
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: available
 *         in: query
 *         required: true
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Availability updated
 */
router.put('/:id/availability', async (req: Request, res: Response) => {
  try {
    const available = req.query.available === 'true';
    const station = await stationService.updateStationAvailability(
      parseInt(req.params.id),
      available
    );
    res.json(station);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /stations/{id}/capacity:
 *   put:
 *     tags:
 *       - Stations
 *     summary: Update station capacity
 *     description: Update hospital capacity and current occupancy
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: capacity
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: occupancy
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Capacity updated
 */
router.put('/:id/capacity', async (req: Request, res: Response) => {
  try {
    const capacity = parseInt(req.query.capacity as string);
    const occupancy = parseInt(req.query.occupancy as string);

    const station = await stationService.updateStationCapacity(
      parseInt(req.params.id),
      capacity,
      occupancy
    );
    res.json(station);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export { router as stationRoutes };
