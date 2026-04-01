export interface ResponseTimeAnalytics {
  averageResponseTimeMinutes: number;
  averageByIncidentType: Record<string, number>;
  totalIncidents: number;
  resolvedIncidents: number;
  openIncidents: number;
}

export interface RegionalIncident {
  region: string;
  count: number;
}

export interface RegionalIncidentType {
  region: string;
  incidentType: string;
  count: number;
}

export interface IncidentsByRegionAnalytics {
  incidentsByRegion: Record<string, number>;
  incidentsByRegionAndType: RegionalIncidentType[];
}

export interface ResourceUtilization {
  stationType: string;
  totalUnits: number;
  availableUnits: number;
  utilizationPercentage: number;
}

export interface HospitalBed {
  hospitalName: string;
  totalCapacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
}

export interface ResourceUtilizationAnalytics {
  resourceDeployment: ResourceUtilization[];
  hospitalBedCapacity: HospitalBed[];
  avgResponseTime: number;
  totalIncidentsServiced: number;
}

export interface AnalyticsEventRequest {
  eventType: string;
  incidentType?: string;
  region?: string;
  responseTimeMinutes?: number;
  incidentId?: number;
  metadata?: any;
}
