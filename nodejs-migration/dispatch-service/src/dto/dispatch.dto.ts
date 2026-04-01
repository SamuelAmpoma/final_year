import { VehicleStatus, VehicleType } from '../entities/Vehicle';

export interface RegisterVehicleRequest {
  registrationNumber: string;
  vehicleType: VehicleType;
  stationId: number;
  stationName: string;
  driverName: string;
  driverPhone: string;
  latitude: number;
  longitude: number;
}

export interface LocationUpdateRequest {
  vehicleId: number;
  latitude: number;
  longitude: number;
}

export interface VehicleDTO {
  id: number;
  registrationNumber: string;
  vehicleType: VehicleType;
  stationId: number;
  stationName: string;
  driverName: string;
  driverPhone: string;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
  assignedIncidentId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationHistory {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
