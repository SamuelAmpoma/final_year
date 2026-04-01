import axios, { AxiosInstance } from 'axios';
import { AppDataSource } from '../database/database';
import { AnalyticsEvent, IncidentType } from '../entities/AnalyticsEvent';
import {
  ResponseTimeAnalytics,
  IncidentsByRegionAnalytics,
  ResourceUtilizationAnalytics,
  AnalyticsEventRequest,
} from '../dto/analytics.dto';

export class AnalyticsService {
  private eventRepository = AppDataSource.getRepository(AnalyticsEvent);
  private httpClient: AxiosInstance;
  private incidentServiceUrl: string;
  private dispatchServiceUrl: string;

  constructor() {
    this.incidentServiceUrl = process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002';
    this.dispatchServiceUrl = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3003';
    this.httpClient = axios.create();
  }

  async getResponseTimeAnalytics(): Promise<ResponseTimeAnalytics> {
    try {
      // Get analytics from local database
      const events = await this.eventRepository.find();
      
      let avgResponseTime = 0;
      if (events.length > 0) {
        const totalTime = events.reduce(
          (sum, event) => sum + (event.responseTimeMinutes || 0),
          0
        );
        avgResponseTime = totalTime / events.length;
      }

      // Group by incident type
      const avgByType: Record<string, number> = {};
      const types = events.reduce((acc, event) => {
        if (event.incidentType) {
          if (!acc[event.incidentType]) {
            acc[event.incidentType] = [];
          }
          acc[event.incidentType].push(event);
        }
        return acc;
      }, {} as Record<string, AnalyticsEvent[]>);

      for (const [type, typeEvents] of Object.entries(types)) {
        const typeAvg = typeEvents.reduce(
          (sum, e) => sum + (e.responseTimeMinutes || 0),
          0
        ) / typeEvents.length;
        avgByType[type] = typeAvg;
      }

      // Try to get live data from incident service
      let totalIncidents = events.length;
      let resolvedIncidents = 0;
      let openIncidents = events.length;

      try {
        const response = await this.httpClient.get(`${this.incidentServiceUrl}/incidents`);
        if (response.data && Array.isArray(response.data)) {
          totalIncidents = response.data.length;
          resolvedIncidents = response.data.filter((i: any) => i.status === 'RESOLVED').length;
          openIncidents = totalIncidents - resolvedIncidents;
        }
      } catch (error) {
        console.warn('Could not fetch live data from incident service');
      }

      return {
        averageResponseTimeMinutes: avgResponseTime,
        averageByIncidentType: avgByType,
        totalIncidents,
        resolvedIncidents,
        openIncidents,
      };
    } catch (error) {
      console.error('Error getting response time analytics:', error);
      throw error;
    }
  }

  async getIncidentsByRegion(): Promise<IncidentsByRegionAnalytics> {
    try {
      const events = await this.eventRepository.find();

      // Group by region
      const byRegion: Record<string, number> = {};
      events.forEach((event) => {
        if (event.region) {
          byRegion[event.region] = (byRegion[event.region] || 0) + 1;
        }
      });

      // Group by region and incident type
      const byRegionAndType = events
        .filter((e) => e.region && e.incidentType)
        .map((e) => ({
          region: e.region!,
          incidentType: e.incidentType!,
          count: 1,
        }))
        .reduce((acc, item) => {
          const existing = acc.find(
            (a) => a.region === item.region && a.incidentType === item.incidentType
          );
          if (existing) {
            existing.count++;
          } else {
            acc.push(item);
          }
          return acc;
        }, [] as Array<{ region: string; incidentType: string; count: number }>);

      return {
        incidentsByRegion: byRegion,
        incidentsByRegionAndType: byRegionAndType,
      };
    } catch (error) {
      console.error('Error getting incidents by region:', error);
      throw error;
    }
  }

  async getResourceUtilization(): Promise<ResourceUtilizationAnalytics> {
    try {
      // Try to get live data from other services
      let resourceDeployment: Array<{ stationType: string; totalUnits: number; availableUnits: number; utilizationPercentage: number }> = [];
      let hospitalBedCapacity: Array<{ hospitalName: string; totalCapacity: number; currentOccupancy: number; occupancyPercentage: number }> = [];
      let avgResponseTime = 0;
      let totalIncidentsServiced = 0;

      try {
        // Get vehicle data
        const vehiclesResponse = await this.httpClient.get(
          `${this.dispatchServiceUrl}/vehicles`
        );
        if (vehiclesResponse.data && Array.isArray(vehiclesResponse.data)) {
          const vehicles = vehiclesResponse.data;
          const byType = vehicles.reduce(
            (acc, v: any) => {
              if (!acc[v.vehicleType]) {
                acc[v.vehicleType] = { total: 0, available: 0 };
              }
              acc[v.vehicleType].total++;
              if (v.status === 'AVAILABLE') {
                acc[v.vehicleType].available++;
              }
              return acc;
            },
            {} as Record<string, { total: number; available: number }>
          );

          resourceDeployment = Object.entries(byType).map(([type, data]) => {
            const typedData = data as { total: number; available: number };
            return {
              stationType: type,
              totalUnits: typedData.total,
              availableUnits: typedData.available,
              utilizationPercentage: ((typedData.total - typedData.available) / typedData.total) * 100,
            };
          });
        }

        // Get station data
        const stationsResponse = await this.httpClient.get(
          `${this.incidentServiceUrl}/stations`
        );
        if (stationsResponse.data && Array.isArray(stationsResponse.data)) {
          const stations = stationsResponse.data;
          hospitalBedCapacity = stations
            .filter((s: any) => s.stationType === 'HOSPITAL')
            .map((s: any) => ({
              hospitalName: s.name,
              totalCapacity: s.capacity || 0,
              currentOccupancy: s.currentOccupancy || 0,
              occupancyPercentage:
                ((s.currentOccupancy || 0) / (s.capacity || 1)) * 100,
            }));
        }
      } catch (error) {
        console.warn('Could not fetch live resource data');
      }

      // Get analytics from local database
      const events = await this.eventRepository.find();
      if (events.length > 0) {
        const totalTime = events.reduce(
          (sum, e) => sum + (e.responseTimeMinutes || 0),
          0
        );
        avgResponseTime = totalTime / events.length;
        totalIncidentsServiced = events.length;
      }

      return {
        resourceDeployment,
        hospitalBedCapacity,
        avgResponseTime,
        totalIncidentsServiced,
      };
    } catch (error) {
      console.error('Error getting resource utilization:', error);
      throw error;
    }
  }

  async recordEvent(request: AnalyticsEventRequest): Promise<AnalyticsEvent> {
    try {
      const event = this.eventRepository.create({
        eventType: request.eventType,
        incidentType: request.incidentType as IncidentType,
        region: request.region,
        responseTimeMinutes: request.responseTimeMinutes,
        incidentId: request.incidentId,
        metadata: request.metadata,
      });

      return await this.eventRepository.save(event);
    } catch (error) {
      console.error('Error recording analytics event:', error);
      throw error;
    }
  }
}
