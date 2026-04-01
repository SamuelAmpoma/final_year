import { IncidentStatus, IncidentType } from '../entities/Incident';
import { StationType } from '../entities/ResponderStation';

export interface CreateIncidentRequest {
  citizenName: string;
  citizenPhone: string;
  incidentType: IncidentType;
  latitude: number;
  longitude: number;
  locationAddress: string;
  notes?: string;
}

export interface UpdateStatusRequest {
  status: IncidentStatus;
}

export interface AssignUnitRequest {
  unitId: number;
  unitName: string;
  unitType: string;
}

export interface IncidentDTO {
  id: number;
  citizenName: string;
  citizenPhone: string;
  incidentType: IncidentType;
  latitude: number;
  longitude: number;
  locationAddress: string;
  notes?: string;
  status: IncidentStatus;
  assignedUnitId?: number;
  assignedUnitName?: string;
  assignedUnitType?: string;
  createdAt: Date;
  dispatchedAt?: Date;
  updatedAt: Date;
}

export interface CreateStationRequest {
  name: string;
  stationType: StationType;
  latitude: number;
  longitude: number;
  address: string;
  phoneNumber: string;
  capacity?: number;
}
