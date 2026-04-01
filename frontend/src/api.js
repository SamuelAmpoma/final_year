import axios from 'axios';

const API_ENDPOINTS = {
  AUTH: 'https://auth-service-25u8.onrender.com',
  INCIDENT: 'https://incident-service-ku7i.onrender.com',
  DISPATCH: 'https://dispatch-service-w37p.onrender.com',
  ANALYTICS: 'https://final-year-013s.onrender.com',
};

// Auth API
export const authAPI = {
  register: (data) => axios.post(`${API_ENDPOINTS.AUTH}/auth/register`, data),
  login: (email, password) => axios.post(`${API_ENDPOINTS.AUTH}/auth/login`, { email, password }),
  profile: (token) => axios.get(`${API_ENDPOINTS.AUTH}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Incident API
export const incidentAPI = {
  create: (data, token) => axios.post(`${API_ENDPOINTS.INCIDENT}/incidents`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getAll: (token) => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getById: (id, token) => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getOpen: (token) => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents/open`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateStatus: (id, status, token) => axios.put(`${API_ENDPOINTS.INCIDENT}/incidents/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getResponders: () => axios.get(`${API_ENDPOINTS.INCIDENT}/responders`),
  getStations: () => axios.get(`${API_ENDPOINTS.INCIDENT}/stations`),
};

// Dispatch API
export const dispatchAPI = {
  getVehicles: () => axios.get(`${API_ENDPOINTS.DISPATCH}/vehicles`),
  registerVehicle: (data) => axios.post(`${API_ENDPOINTS.DISPATCH}/vehicles/register`, data),
  updateLocation: (vehicleId, data) => axios.post(`${API_ENDPOINTS.DISPATCH}/vehicles/location`, { vehicleId, ...data }),
  updateVehicleStatus: (vehicleId, status) => axios.put(`${API_ENDPOINTS.DISPATCH}/vehicles/${vehicleId}/status`, { status }),
};

// Analytics API
export const analyticsAPI = {
  getResponseTimes: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/response-times`),
  getIncidentsByRegion: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/incidents-by-region`),
  getResourceUtilization: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/resource-utilization`),
};

// Station API
export const stationAPI = {
  getAll: () => axios.get(`${API_ENDPOINTS.INCIDENT}/stations`),
  getById: (id) => axios.get(`${API_ENDPOINTS.INCIDENT}/stations/${id}`),
  create: (data, token) => axios.post(`${API_ENDPOINTS.INCIDENT}/stations`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  update: (id, data, token) => axios.put(`${API_ENDPOINTS.INCIDENT}/stations/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Health Check API
export const healthCheck = async () => {
  try {
    const results = await Promise.allSettled([
      axios.get(`${API_ENDPOINTS.AUTH}/health`, { timeout: 5000 }).catch(() => 
        axios.get(`${API_ENDPOINTS.AUTH}/`, { timeout: 5000 })
      ),
      axios.get(`${API_ENDPOINTS.INCIDENT}/health`, { timeout: 5000 }).catch(() => 
        axios.get(`${API_ENDPOINTS.INCIDENT}/`, { timeout: 5000 })
      ),
      axios.get(`${API_ENDPOINTS.DISPATCH}/health`, { timeout: 5000 }).catch(() => 
        axios.get(`${API_ENDPOINTS.DISPATCH}/`, { timeout: 5000 })
      ),
      axios.get(`${API_ENDPOINTS.ANALYTICS}/health`, { timeout: 5000 }).catch(() => 
        axios.get(`${API_ENDPOINTS.ANALYTICS}/`, { timeout: 5000 })
      ),
    ]);
    return {
      auth: results[0].status === 'fulfilled',
      incident: results[1].status === 'fulfilled',
      dispatch: results[2].status === 'fulfilled',
      analytics: results[3].status === 'fulfilled',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return { auth: false, incident: false, dispatch: false, analytics: false };
  }
};
