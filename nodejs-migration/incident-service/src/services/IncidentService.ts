import { AppDataSource } from '../database/database';
import { Incident, IncidentStatus, IncidentType } from '../entities/Incident';
import { ResponderStation, StationType } from '../entities/ResponderStation';
import {
  CreateIncidentRequest,
  UpdateStatusRequest,
  AssignUnitRequest,
  IncidentDTO,
} from '../dto/incident.dto';

export class IncidentService {
  private incidentRepository = AppDataSource.getRepository(Incident);
  private stationRepository = AppDataSource.getRepository(ResponderStation);

  private readonly EARTH_RADIUS_KM = 6371.0;

  async createIncident(
    request: CreateIncidentRequest,
    adminId: number
  ): Promise<IncidentDTO> {
    const incident = this.incidentRepository.create({
      citizenName: request.citizenName,
      citizenPhone: request.citizenPhone,
      incidentType: request.incidentType,
      latitude: request.latitude,
      longitude: request.longitude,
      locationAddress: request.locationAddress,
      notes: request.notes,
      createdBy: adminId,
      status: IncidentStatus.CREATED,
    });

    await this.incidentRepository.save(incident);

    // Auto-assign nearest available responder
    try {
      const requiredStationType = this.determineStationType(
        request.incidentType
      );
      const nearestStation = await this.findNearestAvailableStation(
        request.latitude,
        request.longitude,
        requiredStationType
      );

      if (nearestStation) {
        await this.assignStationToIncident(incident, nearestStation);
        console.log(
          `Incident ${incident.id} auto-assigned to station: ${nearestStation.name}`
        );
      } else {
        console.warn(
          `No available station found for incident type: ${request.incidentType}`
        );
      }
    } catch (error) {
      console.error(`Error auto-assigning responder for incident: ${error}`);
    }

    return this.mapToDTO(incident);
  }

  private determineStationType(incidentType: IncidentType): StationType {
    switch (incidentType) {
      case IncidentType.FIRE:
      case IncidentType.HAZMAT:
        return StationType.FIRE;
      case IncidentType.MEDICAL:
        return StationType.HOSPITAL;
      case IncidentType.ACCIDENT:
        return StationType.POLICE;
      default:
        return StationType.POLICE;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.asin(Math.sqrt(a));
    return this.EARTH_RADIUS_KM * c;
  }

  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private async findNearestAvailableStation(
    latitude: number,
    longitude: number,
    stationType: StationType
  ): Promise<ResponderStation | null> {
    const stations = await this.stationRepository.find({
      where: { stationType, isAvailable: true },
    });

    if (stations.length === 0) return null;

    let nearestStation = stations[0];
    let minDistance = this.calculateDistance(
      latitude,
      longitude,
      parseFloat(stations[0].latitude.toString()),
      parseFloat(stations[0].longitude.toString())
    );

    for (const station of stations) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        parseFloat(station.latitude.toString()),
        parseFloat(station.longitude.toString())
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    return nearestStation;
  }

  private async assignStationToIncident(
    incident: Incident,
    station: ResponderStation
  ): Promise<void> {
    incident.assignedUnitId = station.id;
    incident.assignedUnitName = station.name;
    incident.assignedUnitType = station.stationType;
    incident.status = IncidentStatus.DISPATCHED;
    incident.dispatchedAt = new Date();

    await this.incidentRepository.save(incident);

    // Update hospital occupancy if applicable
    if (station.stationType === StationType.HOSPITAL) {
      station.currentOccupancy =
        (station.currentOccupancy || 0) + 1;
      await this.stationRepository.save(station);
    }
  }

  async getIncidentById(id: number): Promise<IncidentDTO> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new Error(`Incident not found with id: ${id}`);
    }

    return this.mapToDTO(incident);
  }

  async getOpenIncidents(): Promise<IncidentDTO[]> {
    const incidents = await this.incidentRepository.find({
      where: [
        { status: IncidentStatus.CREATED },
        { status: IncidentStatus.DISPATCHED },
        { status: IncidentStatus.IN_PROGRESS },
      ],
    });

    return incidents.map((i) => this.mapToDTO(i));
  }

  async getAllIncidents(): Promise<IncidentDTO[]> {
    const incidents = await this.incidentRepository.find();
    return incidents.map((i) => this.mapToDTO(i));
  }

  async updateIncidentStatus(
    id: number,
    request: UpdateStatusRequest
  ): Promise<IncidentDTO> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new Error(`Incident not found with id: ${id}`);
    }

    incident.status = request.status;
    await this.incidentRepository.save(incident);

    return this.mapToDTO(incident);
  }

  async assignUnit(
    id: number,
    request: AssignUnitRequest
  ): Promise<IncidentDTO> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new Error(`Incident not found with id: ${id}`);
    }

    incident.assignedUnitId = request.unitId;
    incident.assignedUnitName = request.unitName;
    incident.assignedUnitType = request.unitType;
    incident.status = IncidentStatus.DISPATCHED;
    incident.dispatchedAt = new Date();

    await this.incidentRepository.save(incident);

    return this.mapToDTO(incident);
  }

  private mapToDTO(incident: Incident): IncidentDTO {
    return {
      id: incident.id,
      citizenName: incident.citizenName,
      citizenPhone: incident.citizenPhone,
      incidentType: incident.incidentType,
      latitude: incident.latitude,
      longitude: incident.longitude,
      locationAddress: incident.locationAddress,
      notes: incident.notes,
      status: incident.status,
      assignedUnitId: incident.assignedUnitId,
      assignedUnitName: incident.assignedUnitName,
      assignedUnitType: incident.assignedUnitType,
      createdAt: incident.createdAt,
      dispatchedAt: incident.dispatchedAt,
      updatedAt: incident.updatedAt,
    };
  }
}
