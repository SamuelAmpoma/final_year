import { AppDataSource } from '../database/database';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';
import { LocationHistory } from '../entities/LocationHistory';
import {
  RegisterVehicleRequest,
  LocationUpdateRequest,
  VehicleDTO,
} from '../dto/dispatch.dto';

export class VehicleService {
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private locationHistoryRepository = AppDataSource.getRepository(LocationHistory);

  async registerVehicle(request: RegisterVehicleRequest): Promise<VehicleDTO> {
    // Check if registration number already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { registrationNumber: request.registrationNumber },
    });

    if (existingVehicle) {
      throw new Error(
        `Vehicle with registration number already exists: ${request.registrationNumber}`
      );
    }

    const vehicle = this.vehicleRepository.create({
      registrationNumber: request.registrationNumber,
      vehicleType: request.vehicleType,
      stationId: request.stationId,
      stationName: request.stationName,
      driverName: request.driverName,
      driverPhone: request.driverPhone,
      latitude: request.latitude,
      longitude: request.longitude,
      status: VehicleStatus.AVAILABLE,
    });

    await this.vehicleRepository.save(vehicle);
    console.log(
      `Vehicle registered: ${vehicle.registrationNumber} (${vehicle.vehicleType})`
    );

    return this.mapToDTO(vehicle);
  }

  async getAllVehicles(): Promise<VehicleDTO[]> {
    const vehicles = await this.vehicleRepository.find();
    return vehicles.map((v) => this.mapToDTO(v));
  }

  async getVehicleById(id: number): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new Error(`Vehicle not found with id: ${id}`);
    }

    return this.mapToDTO(vehicle);
  }

  async getVehicleLocation(id: number): Promise<VehicleDTO> {
    return this.getVehicleById(id);
  }

  async updateLocation(request: LocationUpdateRequest): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: request.vehicleId },
    });

    if (!vehicle) {
      throw new Error(`Vehicle not found with id: ${request.vehicleId}`);
    }

    vehicle.latitude = request.latitude;
    vehicle.longitude = request.longitude;
    await this.vehicleRepository.save(vehicle);

    // Save location history
    const history = this.locationHistoryRepository.create({
      vehicleId: vehicle.id,
      latitude: request.latitude,
      longitude: request.longitude,
    });

    await this.locationHistoryRepository.save(history);

    console.log(
      `Vehicle ${vehicle.id} location updated: (${request.latitude}, ${request.longitude})`
    );

    return this.mapToDTO(vehicle);
  }

  async updateVehicleStatus(id: number, status: VehicleStatus): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new Error(`Vehicle not found with id: ${id}`);
    }

    vehicle.status = status;
    await this.vehicleRepository.save(vehicle);

    return this.mapToDTO(vehicle);
  }

  async assignToIncident(vehicleId: number, incidentId: number): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error(`Vehicle not found with id: ${vehicleId}`);
    }

    vehicle.assignedIncidentId = incidentId;
    vehicle.status = VehicleStatus.RESPONDING;
    await this.vehicleRepository.save(vehicle);

    return this.mapToDTO(vehicle);
  }

  async getLocationHistory(id: number): Promise<LocationHistory[]> {
    return await this.locationHistoryRepository.find({
      where: { vehicleId: id },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  private mapToDTO(vehicle: Vehicle): VehicleDTO {
    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      stationId: vehicle.stationId,
      stationName: vehicle.stationName,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      status: vehicle.status,
      assignedIncidentId: vehicle.assignedIncidentId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
