import { AppDataSource } from '../database/database';
import { ResponderStation, StationType } from '../entities/ResponderStation';
import { CreateStationRequest } from '../dto/incident.dto';

export class StationService {
  private stationRepository = AppDataSource.getRepository(ResponderStation);

  async createStation(request: CreateStationRequest): Promise<ResponderStation> {
    const station = this.stationRepository.create({
      name: request.name,
      stationType: request.stationType,
      latitude: request.latitude,
      longitude: request.longitude,
      address: request.address,
      phoneNumber: request.phoneNumber,
      capacity: request.capacity,
      currentOccupancy: 0,
      isAvailable: true,
    });

    return await this.stationRepository.save(station);
  }

  async getAllStations(): Promise<ResponderStation[]> {
    return await this.stationRepository.find();
  }

  async getStationsByType(type: StationType): Promise<ResponderStation[]> {
    return await this.stationRepository.find({
      where: { stationType: type },
    });
  }

  async getStationById(id: number): Promise<ResponderStation> {
    const station = await this.stationRepository.findOne({
      where: { id },
    });

    if (!station) {
      throw new Error(`Station not found with id: ${id}`);
    }

    return station;
  }

  async updateStationAvailability(
    id: number,
    available: boolean
  ): Promise<ResponderStation> {
    const station = await this.getStationById(id);
    station.isAvailable = available;
    return await this.stationRepository.save(station);
  }

  async updateStationCapacity(
    id: number,
    capacity: number,
    occupancy: number
  ): Promise<ResponderStation> {
    const station = await this.getStationById(id);
    station.capacity = capacity;
    station.currentOccupancy = occupancy;
    return await this.stationRepository.save(station);
  }
}
