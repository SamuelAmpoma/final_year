import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { dispatchAPI, incidentAPI } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = L.divIcon({
  html: '<div style="background:#22c55e;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 0 12px rgba(34,197,94,0.8)">🚑</div>',
  iconSize: [36, 36],
  className: '',
});

const incidentIcon = L.divIcon({
  html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.8)"></div>',
  iconSize: [20, 20],
  className: '',
});

export default function DriverPage({ user }) {
  const [myVehicle, setMyVehicle] = useState(null);
  const [activeIncident, setActiveIncident] = useState(null);
  const [position, setPosition] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [log, setLog] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [broadcastCount, setBroadcastCount] = useState(0);

  const socketRef = useRef(null);
  const watchRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    loadVehicles();
    connectSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      const v = vehicles.find(v => v.vehicleId === selectedVehicleId);
      setMyVehicle(v || null);
      if (v?.incidentId) loadIncident(v.incidentId);
    }
  }, [selectedVehicleId, vehicles]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await dispatchAPI.getVehicles();
      const ambs = (res.data || []).filter(v => v.vehicleType === 'AMBULANCE');
      setVehicles(ambs);
      if (ambs.length > 0) setSelectedVehicleId(ambs[0].vehicleId);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadIncident = async (id) => {
    try {
      const res = await incidentAPI.getById(id);
      setActiveIncident(res.data);
    } catch (e) { console.error(e); }
  };

  const connectSocket = () => {
    try {
      const socket = io('http://localhost:3003', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        setSocketConnected(true);
        addLog('🔌 Connected to Dispatch Service');
      });
      socket.on('disconnect', () => {
        setSocketConnected(false);
        addLog('❌ Disconnected from Dispatch Service');
      });
    } catch (e) {
      addLog('⚠️ WebSocket unavailable');
    }
  };

  const addLog = (msg) => {
    setLog(p => [{ msg, t: new Date().toLocaleTimeString() }, ...p].slice(0, 30));
  };

  const startTracking = () => {
    if (!selectedVehicleId) {
      alert('Please select your vehicle first');
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Switching to simulated GPS.');
      startSimulatedTracking();
      return;
    }
    setTracking(true);
    addLog('▶ GPS tracking started — broadcasting location every 5 seconds');
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        broadcastLocation(latitude, longitude);
      },
      (err) => {
        addLog(`⚠️ GPS error: ${err.message} — switching to simulation`);
        startSimulatedTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const startSimulatedTracking = () => {
    // Simulate Accra GPS coordinates
    let lat = 5.6037 + (Math.random() - 0.5) * 0.05;
    let lng = -0.187 + (Math.random() - 0.5) * 0.05;
    setPosition([lat, lng]);
    setTracking(true);
    addLog('▶ Simulated GPS active (Accra area)');

    watchRef.current = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.003;
      lng += (Math.random() - 0.5) * 0.003;
      setPosition([lat, lng]);
      broadcastLocation(lat, lng);
    }, 5000);
  };

  const broadcastLocation = (lat, lng) => {
    if (!selectedVehicleId) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit('location-update', {
        vehicleId: selectedVehicleId,
        latitude: lat,
        longitude: lng,
        status: 'ACTIVE',
      });
      setBroadcastCount(c => c + 1);
      addLog(`📍 Broadcast: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    } else {
      // Fallback to HTTP
      dispatchAPI.updateLocation(selectedVehicleId, { latitude: lat, longitude: lng }).catch(() => {});
      addLog(`📡 HTTP fallback: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    }
  };

  const stopTracking = () => {
    setTracking(false);
    if (watchRef.current) {
      if (typeof watchRef.current === 'number') {
        clearInterval(watchRef.current);
      } else {
        navigator.geolocation.clearWatch(watchRef.current);
      }
      watchRef.current = null;
    }
    addLog('⏸ GPS tracking stopped');
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(16,185,129,0.06))',
        border: '1px solid rgba(34,197,94,0.2)'
      }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 32 }}>🚑</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Ambulance Driver Panel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Welcome, {user?.name || 'Driver'} · Broadcast your GPS location to dispatch in real time
            </p>
          </div>
          <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
            <div className={`status-pill`} style={{ color: socketConnected ? 'var(--success)' : '#f87171', background: socketConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${socketConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div className="indicator-dot" style={{ background: socketConnected ? 'var(--success)' : '#ef4444' }} />
              <span>{socketConnected ? 'Dispatch Connected' : 'Dispatch Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'My Vehicle', value: selectedVehicleId || '—', icon: '🚑', color: '#22c55e' },
          { label: 'GPS Status', value: tracking ? 'ACTIVE' : 'IDLE', icon: tracking ? '📡' : '⏸', color: tracking ? '#22c55e' : '#64748b' },
          { label: 'Broadcasts Sent', value: broadcastCount, icon: '📍', color: '#3b82f6' },
          { label: 'Active Incident', value: activeIncident ? `#${activeIncident.id}` : 'None', icon: '🚨', color: activeIncident ? '#ef4444' : '#64748b' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: s.label === 'My Vehicle' ? 16 : 24, paddingTop: s.label === 'My Vehicle' ? 8 : 0 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left: Controls + Active Incident */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Vehicle Selection & Controls */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🚑 GPS Location Broadcaster</div>

            <div className="form-group">
              <label className="form-label">Select Your Ambulance</label>
              {loading ? <div className="spinner" style={{ margin: '10px 0' }} /> : (
                <select className="form-select" value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)} disabled={tracking}>
                  {vehicles.length === 0
                    ? <option value="">No ambulances registered</option>
                    : vehicles.map(v => (
                      <option key={v.vehicleId} value={v.vehicleId}>
                        🚑 {v.vehicleId} {v.incidentId ? `— Incident #${v.incidentId}` : '— No active dispatch'}
                      </option>
                    ))
                  }
                </select>
              )}
            </div>

            {position && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current GPS Position</div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
                <a href={`https://www.google.com/maps?q=${position[0]},${position[1]}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--info)', marginTop: 4, display: 'block' }}>
                  📌 View on Google Maps ↗
                </a>
              </div>
            )}

            {!tracking ? (
              <button className="btn btn-success btn-full" onClick={startTracking} disabled={!selectedVehicleId || loading}>
                📡 Start Broadcasting Location
              </button>
            ) : (
              <button className="btn btn-full" style={{ background: '#ef4444', color: 'white' }} onClick={stopTracking}>
                ⏹ Stop Broadcasting
              </button>
            )}

            {tracking && (
              <div className="alert alert-success" style={{ marginTop: 12 }}>
                <span>📡</span>
                <span>Broadcasting location every 5 seconds — Dispatch can see you on the map</span>
              </div>
            )}
          </div>

          {/* Active Incident */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🚨 Active Dispatch</div>
            {!activeIncident ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-icon">✅</div>
                <h3>No active dispatch</h3>
                <p>You will receive an assignment when a medical emergency is reported</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Incident #{activeIncident.id}</span>
                    <span className={`badge badge-${activeIncident.status?.toLowerCase()}`}>{activeIncident.status}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong>Type:</strong> {activeIncident.incidentType}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong>Patient:</strong> {activeIncident.citizenName} ({activeIncident.citizenPhone})
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <strong>Location:</strong> {activeIncident.locationAddress}
                  </div>
                  {activeIncident.notes && (
                    <div style={{ fontSize: 13, color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '8px 12px', borderRadius: 6 }}>
                      ⚠️ Notes: {activeIncident.notes}
                    </div>
                  )}
                  {activeIncident.latitude && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${activeIncident.latitude},${activeIncident.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary btn-full" style={{ marginTop: 12 }}>
                      🗺️ Navigate to Incident (Google Maps)
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map + Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">🗺️ My Live Position</div>
              <div className="card-subtitle">{position ? 'GPS active' : 'Start broadcasting to see your location'}</div>
            </div>
            <div style={{ height: 320 }}>
              <MapContainer center={position || [5.6037, -0.187]} zoom={position ? 14 : 11} style={{ height: '100%', width: '100%' }}>
                <TileLayer 
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {position && (
                  <Marker position={position} icon={driverIcon}>
                    <Popup>
                      <strong>🚑 My Location</strong><br />
                      {position[0].toFixed(5)}, {position[1].toFixed(5)}
                    </Popup>
                  </Marker>
                )}
                {activeIncident?.latitude && activeIncident?.longitude && (
                  <Marker position={[activeIncident.latitude, activeIncident.longitude]} icon={incidentIcon}>
                    <Popup>
                      <strong>🚨 Incident #{activeIncident.id}</strong><br/>
                      {activeIncident.locationAddress}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Broadcast Log */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>📋 Broadcast Log</div>
            <div style={{ height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {log.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No broadcasts yet</div>
              ) : log.map((l, i) => (
                <div key={i} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--bg-input)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{l.t}</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
