import axios from 'axios';

const API_ENDPOINTS = {
  AUTH: 'http://localhost:3001',
  INCIDENT: 'http://localhost:3002',
  DISPATCH: 'http://localhost:3003',
  ANALYTICS: 'http://localhost:3004',
};

// Helper: get stored token
const getToken = () => localStorage.getItem('token');

// Helper: make auth header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token || getToken()}` }
});

// ─── Auth API ────────────────────────────────────────
export const authAPI = {
  register: (data) => axios.post(`${API_ENDPOINTS.AUTH}/auth/register`, data),
  login: (email, password) => axios.post(`${API_ENDPOINTS.AUTH}/auth/login`, { email, password }),
  refreshToken: (refreshToken) => axios.post(`${API_ENDPOINTS.AUTH}/auth/refresh-token`, { refreshToken }),
  profile: (token) => axios.get(`${API_ENDPOINTS.AUTH}/auth/profile`, authHeader(token)),
};

// ─── Incident API ────────────────────────────────────
export const incidentAPI = {
  create: (data) => axios.post(`${API_ENDPOINTS.INCIDENT}/incidents`, data, authHeader()),
  getAll: () => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents`, authHeader()),
  getById: (id) => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents/${id}`, authHeader()),
  getOpen: () => axios.get(`${API_ENDPOINTS.INCIDENT}/incidents/open`, authHeader()),
  updateStatus: (id, status) => axios.put(`${API_ENDPOINTS.INCIDENT}/incidents/${id}/status`, { status }, authHeader()),
  assignUnit: (id, data) => axios.put(`${API_ENDPOINTS.INCIDENT}/incidents/${id}/assign`, data, authHeader()),
};

// ─── Stations API ────────────────────────────────────
export const stationAPI = {
  getAll: () => axios.get(`${API_ENDPOINTS.INCIDENT}/stations`),
  getById: (id) => axios.get(`${API_ENDPOINTS.INCIDENT}/stations/${id}`),
  getByType: (type) => axios.get(`${API_ENDPOINTS.INCIDENT}/stations/type/${type}`),
  create: (data) => axios.post(`${API_ENDPOINTS.INCIDENT}/stations`, data, authHeader()),
  updateAvailability: (id, available) =>
    axios.put(`${API_ENDPOINTS.INCIDENT}/stations/${id}/availability?available=${available}`, {}, authHeader()),
  updateCapacity: (id, capacity, occupancy) =>
    axios.put(`${API_ENDPOINTS.INCIDENT}/stations/${id}/capacity?capacity=${capacity}&occupancy=${occupancy}`, {}, authHeader()),
};

// ─── Dispatch / Vehicles API ─────────────────────────
export const dispatchAPI = {
  getVehicles: () => axios.get(`${API_ENDPOINTS.DISPATCH}/vehicles`),
  registerVehicle: (data) => axios.post(`${API_ENDPOINTS.DISPATCH}/vehicles/register`, data),
  getVehicleLocation: (id) => axios.get(`${API_ENDPOINTS.DISPATCH}/vehicles/${id}/location`),
  updateLocation: (vehicleId, data) =>
    axios.post(`${API_ENDPOINTS.DISPATCH}/vehicles/location`, { vehicleId, ...data }),
  updateVehicleStatus: (vehicleId, status) =>
    axios.put(`${API_ENDPOINTS.DISPATCH}/vehicles/${vehicleId}/status`, { status }),
};

// ─── Analytics API ───────────────────────────────────
export const analyticsAPI = {
  getResponseTimes: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/response-times`),
  getIncidentsByRegion: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/incidents-by-region`),
  getResourceUtilization: () => axios.get(`${API_ENDPOINTS.ANALYTICS}/analytics/resource-utilization`),
};

// ─── Health checks ───────────────────────────────────
export const healthCheck = async () => {
  const results = {};
  for (const [name, url] of Object.entries(API_ENDPOINTS)) {
    try {
      const res = await axios.get(`${url}/health`, { timeout: 3000 });
      results[name] = { ok: true, message: res.data?.status || 'Running' };
    } catch {
      results[name] = { ok: false, message: 'Offline' };
    }
  }
  return results;
};
