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
