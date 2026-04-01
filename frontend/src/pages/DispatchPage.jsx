import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { dispatchAPI, incidentAPI } from '../api';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const vehicleIcons = {
  AMBULANCE: { emoji: '🚑', color: '#22c55e' },
  POLICE: { emoji: '🚓', color: '#3b82f6' },
  FIRE_TRUCK: { emoji: '🚒', color: '#ef4444' },
};

const makeVehicleIcon = (type) => {
  const { emoji, color } = vehicleIcons[type] || { emoji: '🚗', color: '#94a3b8' };
  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${emoji}</div>`,
    iconSize: [32, 32],
    className: '',
  });
};

const incidentIcon = L.divIcon({
  html: '<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.8)"></div>',
  iconSize: [16, 16],
  className: '',
});

export default function DispatchPage() {
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ vehicleId: '', vehicleType: 'AMBULANCE', stationId: '' });
  const [simulating, setSimulating] = useState(false);
  const socketRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    loadData();
    connectSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, iRes] = await Promise.allSettled([
        dispatchAPI.getVehicles(),
        incidentAPI.getAll(),
      ]);
      if (vRes.status === 'fulfilled') setVehicles(vRes.value.data || []);
      if (iRes.status === 'fulfilled') setIncidents(iRes.value.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const connectSocket = () => {
    try {
      const socket = io('https://dispatch-service-w37p.onrender.com', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketConnected(true);
        addLog('🔌 WebSocket connected to Dispatch Service');
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
        addLog('❌ WebSocket disconnected');
      });

      socket.on('vehicle-location', (data) => {
        setVehicles(prev => prev.map(v =>
          v.vehicleId === data.vehicleId ? { ...v, latitude: data.latitude, longitude: data.longitude, status: data.status } : v
        ));
        addLog(`📍 Vehicle ${data.vehicleId} moved to (${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)})`);
      });
    } catch (e) {
      addLog('⚠️ WebSocket unavailable, using polling');
    }
  };

  const addLog = (msg) => {
    setLiveUpdates(p => [{ msg, t: new Date().toLocaleTimeString() }, ...p].slice(0, 20));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...regForm,
        registrationNumber: regForm.vehicleId,
        vehicleType: regForm.vehicleType?.toUpperCase() || 'AMBULANCE',
        stationId: Number(regForm.stationId) || 1,
        stationName: 'Headquarters',
        driverName: 'Unassigned',
        driverPhone: '0000000000',
        latitude: 5.6037,
        longitude: -0.187,
      };
      await dispatchAPI.registerVehicle(payload);
      addLog(`✅ Vehicle ${regForm.vehicleId} registered`);
      setShowRegister(false);
      setRegForm({ vehicleId: '', vehicleType: 'AMBULANCE', stationId: '' });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register vehicle');
    }
  };

  // Simulate GPS movement
  const toggleSimulation = () => {
    if (simulating) {
      clearInterval(simRef.current);
      setSimulating(false);
      addLog('⏸ GPS simulation paused');
    } else {
      setSimulating(true);
      addLog('▶ GPS simulation started');
      simRef.current = setInterval(() => {
        if (!socketRef.current?.connected) {
          addLog('⚠️ Socket not connected for simulation');
          return;
        }
        setVehicles(prev => {
          if (prev.length === 0) return prev;
          const v = prev[Math.floor(Math.random() * prev.length)];
          if (!v.latitude || !v.longitude) return prev;
          const newLat = v.latitude + (Math.random() - 0.5) * 0.003;
          const newLng = v.longitude + (Math.random() - 0.5) * 0.003;
          socketRef.current.emit('location-update', {
            vehicleId: v.id,
            latitude: newLat,
            longitude: newLng,
            status: v.status || 'ACTIVE',
          });
          return prev;
        });
      }, 3000);
    }
  };

  const dispatchedIncidents = incidents.filter(i => ['DISPATCHED', 'IN_PROGRESS'].includes(i.status));
  const vehiclesOnMap = vehicles.filter(v => v.latitude && v.longitude);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3" style={{ flexWrap: 'wrap' }}>
        <div className="flex gap-2 items-center">
          <div className={`indicator-dot`} style={{ background: socketConnected ? 'var(--success)' : '#ef4444' }} />
          <span className="text-sm text-muted">{socketConnected ? 'WebSocket Live' : 'WebSocket Offline'}</span>
        </div>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${simulating ? 'btn-warning' : 'btn-success'}`} onClick={toggleSimulation}>
            {simulating ? '⏸ Pause Simulation' : '▶ Simulate GPS'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRegister(true)}>＋ Register Vehicle</button>
          <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Vehicles', value: vehicles.length, color: '#3b82f6', icon: '🚗' },
          { label: 'Active Dispatches', value: dispatchedIncidents.length, color: '#ef4444', icon: '🚨' },
          { label: 'Vehicles on Map', value: vehiclesOnMap.length, color: '#22c55e', icon: '📍' },
          { label: 'WS Updates', value: liveUpdates.length, color: '#f59e0b', icon: '📡' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Live Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">🗺️ Live Dispatch Map</div>
            <div className="card-subtitle">Real-time vehicle & incident tracking</div>
          </div>
          <div style={{ height: 450 }}>
            <MapContainer center={[5.6037, -0.187]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {vehiclesOnMap.map(v => (
                <Marker key={v.id || v.vehicleId} position={[v.latitude, v.longitude]} icon={makeVehicleIcon(v.vehicleType)}>
                  <Popup>
                    <strong>{vehicleIcons[v.vehicleType]?.emoji} {v.vehicleId}</strong><br />
                    Type: {v.vehicleType}<br />
                    Status: {v.status}<br />
                    {v.incidentId && <>Incident: #{v.incidentId}</>}
                  </Popup>
                </Marker>
              ))}
              {dispatchedIncidents.filter(i => i.latitude && i.longitude).map(inc => (
                <Marker key={`inc-${inc.id}`} position={[inc.latitude, inc.longitude]} icon={incidentIcon}>
                  <Popup>
                    <strong>🚨 Incident #{inc.id}</strong><br />
                    {inc.incidentType} — {inc.status}<br />
                    {inc.citizenName}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="map-legend" style={{ padding: '10px 20px', borderTop: '1px solid var(--border)' }}>
            {Object.entries(vehicleIcons).map(([k, v]) => (
              <div key={k} className="legend-item">
                <span>{v.emoji}</span><span>{k}</span>
              </div>
            ))}
            <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} /><span>Incident</span></div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Dispatches */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div>
                <div className="card-title">🚨 Active Dispatches</div>
                <div className="card-subtitle">{dispatchedIncidents.length} active</div>
              </div>
            </div>
            {dispatchedIncidents.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div className="empty-icon">✅</div>
                <h3>No active dispatches</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dispatchedIncidents.map(inc => (
                  <div key={inc.id} style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: 'var(--bg-input)', border: '1px solid var(--border)'
                  }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>#{inc.id} — {inc.incidentType}</span>
                      <span className={`badge badge-${inc.status?.toLowerCase()}`}>{inc.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{inc.locationAddress}</div>
                    {inc.assignedUnitName && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>👤 {inc.assignedUnitName}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Log */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>📡 Live Updates</div>
            <div style={{ height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveUpdates.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Waiting for updates...
                </div>
              ) : liveUpdates.map((u, i) => (
                <div key={i} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'var(--bg-input)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{u.t}</span>
                  <span>{u.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title">🚗 Registered Vehicles</div>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th><th>Type</th><th>Station</th>
                  <th>Incident</th><th>Status</th><th>Location</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><div className="empty-icon">🚗</div><h3>No vehicles registered</h3></div>
                  </td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.vehicleId}</td>
                    <td><span style={{ fontSize: 16 }}>{vehicleIcons[v.vehicleType]?.emoji || '🚗'}</span> {v.vehicleType}</td>
                    <td>{v.stationId || '—'}</td>
                    <td>{v.incidentId ? `#${v.incidentId}` : '—'}</td>
                    <td><span className={`badge badge-${(v.status||'').toLowerCase()}`}>{v.status || 'IDLE'}</span></td>
                    <td className="text-muted">
                      {v.latitude ? `${parseFloat(v.latitude).toFixed(4)}, ${parseFloat(v.longitude).toFixed(4)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRegister(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">🚗 Register Vehicle</h2>
              <button className="modal-close" onClick={() => setShowRegister(false)}>✕</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Vehicle ID</label>
                <input className="form-input" placeholder="e.g. AMB-001" required
                  value={regForm.vehicleId} onChange={e => setRegForm({ ...regForm, vehicleId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={regForm.vehicleType}
                  onChange={e => setRegForm({ ...regForm, vehicleType: e.target.value })}>
                  <option value="AMBULANCE">🚑 Ambulance</option>
                  <option value="POLICE_CAR">🚓 Police Vehicle</option>
                  <option value="FIRE_ENGINE">🚒 Fire Truck</option>
                  <option value="RESCUE_UNIT">🚁 Rescue Unit</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Station ID (optional)</label>
                <input className="form-input" placeholder="Station ID"
                  value={regForm.stationId} onChange={e => setRegForm({ ...regForm, stationId: e.target.value })} />
              </div>
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRegister(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
