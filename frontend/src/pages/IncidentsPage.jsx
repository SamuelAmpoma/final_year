import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentAPI, stationAPI } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const incidentIcon = L.divIcon({
  html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(239,68,68,0.8)"></div>',
  iconSize: [20, 20],
  className: '',
});

const stationIcons = {
  HOSPITAL: L.divIcon({ html: '<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🏥</div>', iconSize: [24,24], className: '' }),
  POLICE:   L.divIcon({ html: '<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🚓</div>', iconSize: [24,24], className: '' }),
  FIRE:     L.divIcon({ html: '<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🚒</div>', iconSize: [24,24], className: '' }),
};

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

// Address search using OpenStreetMap Nominatim (free geocoder — no API key needed)
async function geocodeAddress(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=gh`,
    { headers: { 'Accept-Language': 'en' } }
  );
  return res.json();
}

const INCIDENT_TYPES = ['FIRE', 'MEDICAL', 'ACCIDENT', 'HAZMAT', 'OTHER'];
const STATUS_OPTIONS = ['CREATED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [filter, setFilter] = useState('ALL');
  const [pickedLocation, setPickedLocation] = useState(null);
  const [form, setForm] = useState({
    citizenName: '', citizenPhone: '',
    incidentType: 'FIRE',
    latitude: '', longitude: '',
    locationAddress: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Address search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => { loadIncidents(); loadStations(); }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const res = await incidentAPI.getAll();
      setIncidents(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStations = async () => {
    try {
      const res = await stationAPI.getAll();
      setStations(res.data || []);
    } catch (e) {}
  };

  // Address search with debounce
  const handleSearchInput = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimeout.current);
    if (val.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await geocodeAddress(val);
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPickedLocation({ lat, lng });
    setForm(f => ({
      ...f,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      locationAddress: result.display_name.split(',').slice(0, 3).join(',').trim()
    }));
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
  };

  const handleLocationPick = (latlng) => {
    setPickedLocation(latlng);
    setForm(f => ({
      ...f,
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6),
      locationAddress: f.locationAddress || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      const res = await incidentAPI.create({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setSuccess(`✅ Incident #${res.data.id} reported! ${res.data.assignedUnitName ? `Nearest responder dispatched: ${res.data.assignedUnitName}` : 'Processing responder assignment...'}`);
      setShowModal(false);
      resetForm();
      await loadIncidents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create incident. Check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await incidentAPI.updateStatus(id, status);
      await loadIncidents();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally { setUpdatingId(null); }
  };

  const resetForm = () => {
    setForm({ citizenName: '', citizenPhone: '', incidentType: 'FIRE', latitude: '', longitude: '', locationAddress: '', notes: '' });
    setPickedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const filtered = filter === 'ALL' ? incidents : incidents.filter(i => i.status === filter);
  const statusBadge = (s) => <span className={`badge badge-${(s||'').toLowerCase()}`}>{s}</span>;
  const typeBadge = (t) => <span className={`badge badge-${(t||'').toLowerCase()}`}>{t}</span>;

  const typeIcon = { FIRE: '🔥', MEDICAL: '🏥', ACCIDENT: '🚗', HAZMAT: '☢️', OTHER: '⚠️' };

  return (
    <div>
      {success && <div className="alert alert-success"><span>✅</span><span>{success}</span></div>}

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-4 gap-3" style={{ flexWrap: 'wrap' }}>
        <div className="flex gap-2">
          {['list', 'map'].map(t => (
            <button key={t} className={`btn ${activeTab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setActiveTab(t)}>
              {t === 'list' ? '📋 List View' : '🗺️ Map View'}
            </button>
          ))}
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">All Incidents ({incidents.length})</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s} ({incidents.filter(i=>i.status===s).length})</option>)}
          </select>
          <button id="new-incident-btn" className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            🚨 Report Incident
          </button>
          <button className="btn btn-ghost btn-sm" onClick={loadIncidents}>🔄</button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {[
          { label: 'Active', count: incidents.filter(i=>['CREATED','DISPATCHED','IN_PROGRESS'].includes(i.status)).length, color: '#ef4444' },
          { label: 'Dispatched', count: incidents.filter(i=>i.status==='DISPATCHED').length, color: '#f59e0b' },
          { label: 'Resolved', count: incidents.filter(i=>i.status==='RESOLVED').length, color: '#22c55e' },
        ].map(p => (
          <div key={p.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
            <span>{p.label}: <strong style={{ color:'var(--text-primary)' }}>{p.count}</strong></span>
          </div>
        ))}
      </div>

      {/* List View */}
      {activeTab === 'list' && (
        loading ? <div className="loading-state"><div className="spinner" /><span>Loading incidents...</span></div> : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Citizen</th><th>Phone</th><th>Type</th>
                    <th>Location</th><th>Status</th><th>Assigned Responder</th>
                    <th>Date/Time</th><th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No incidents found</h3>
                        <p>Click "Report Incident" to log a new emergency</p>
                      </div>
                    </td></tr>
                  ) : filtered.map(inc => (
                    <tr key={inc.id} className="animate-in">
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{inc.id}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inc.citizenName}</td>
                      <td className="text-muted">{inc.citizenPhone}</td>
                      <td>
                        <span style={{ marginRight: 4 }}>{typeIcon[inc.incidentType]}</span>
                        {typeBadge(inc.incidentType)}
                      </td>
                      <td className="text-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <a href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--info)', fontSize: 11 }}>🗺️ </a>
                        {inc.locationAddress}
                      </td>
                      <td>{statusBadge(inc.status)}</td>
                      <td>
                        {inc.assignedUnitName ? (
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {inc.assignedUnitType === 'HOSPITAL' ? '🚑' : inc.assignedUnitType === 'POLICE' ? '🚓' : '🚒'} {inc.assignedUnitName}
                          </span>
                        ) : <span className="text-muted">Pending assignment</span>}
                      </td>
                      <td className="text-muted" style={{ fontSize: 12 }}>
                        {new Date(inc.createdAt || inc.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}
                          value={inc.status}
                          disabled={updatingId === inc.id}
                          onChange={e => handleStatusUpdate(inc.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 600 }}>
            <MapContainer center={[5.6037, -0.187]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
              {filtered.filter(i => i.latitude && i.longitude).map(inc => (
                <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={incidentIcon}>
                  <Popup>
                    <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 200 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>#{inc.id} — {typeIcon[inc.incidentType]} {inc.incidentType}</div>
                      <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Citizen:</strong> {inc.citizenName} ({inc.citizenPhone})</div>
                      <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Location:</strong> {inc.locationAddress}</div>
                      <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Status:</strong> {inc.status}</div>
                      {inc.assignedUnitName && <div style={{ fontSize: 13 }}><strong>Responder:</strong> {inc.assignedUnitName}</div>}
                      <a href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3b82f6', display: 'block', marginTop: 6 }}>View on Google Maps ↗</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {stations.filter(s => s.latitude && s.longitude).map(st => (
                <Marker key={`st-${st.id}`} position={[st.latitude, st.longitude]} icon={stationIcons[st.stationType] || stationIcons.POLICE}>
                  <Popup>
                    <div style={{ fontFamily: 'Inter,sans-serif' }}>
                      <strong>{st.name}</strong><br />
                      {st.stationType} · {st.isAvailable ? '✅ Available' : '🔴 Busy'}<br />
                      <span style={{ fontSize: 12, color: '#666' }}>{st.address}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="map-legend" style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} /><span>Incident</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#22c55e' }} /><span>Hospital</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }} /><span>Police Station</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444', border: '2px solid orange' }} /><span>Fire Station</span></div>
            <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>{filtered.filter(i=>i.latitude&&i.longitude).length} incidents · {stations.length} stations shown</span>
          </div>
        </div>
      )}

      {/* ─── Report Incident Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">🚨 Report Emergency Incident</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Fill the form below. The system will automatically dispatch the nearest available responder.
                </p>
              </div>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>

            {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

            <form onSubmit={handleSubmit}>
              {/* Citizen info */}
              <div style={{ fontWeight: 600, fontSize: 13, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:12 }}>
                👤 Caller Information
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name of Caller *</label>
                  <input id="citizen-name" className="form-input" placeholder="e.g. Kwame Mensah" value={form.citizenName}
                    onChange={e => setForm({ ...form, citizenName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input id="citizen-phone" className="form-input" placeholder="+233 XX XXX XXXX" value={form.citizenPhone}
                    onChange={e => setForm({ ...form, citizenPhone: e.target.value })} required />
                </div>
              </div>

              {/* Incident type */}
              <div style={{ fontWeight: 600, fontSize: 13, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:12, marginTop:4 }}>
                🚨 Incident Details
              </div>
              <div className="form-group">
                <label className="form-label">Type of Emergency *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {INCIDENT_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm({ ...form, incidentType: t })}
                      style={{
                        padding: '10px 4px', borderRadius: 8, border: '2px solid',
                        borderColor: form.incidentType === t ? 'var(--primary)' : 'var(--border)',
                        background: form.incidentType === t ? 'var(--primary-light)' : 'var(--bg-input)',
                        color: form.incidentType === t ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 600, fontSize: 12, textAlign: 'center',
                        transition: 'all 0.15s', fontFamily: 'inherit'
                      }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{typeIcon[t]}</div>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location — Google Maps style search */}
              <div style={{ fontWeight: 600, fontSize: 13, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:12, marginTop:4 }}>
                📍 Incident Location
              </div>

              {/* Address search */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">🔍 Search Address (type to find location in Ghana)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Type address, landmark or area in Ghana..."
                    value={searchQuery}
                    onChange={e => handleSearchInput(e.target.value)}
                    autoComplete="off"
                  />
                  {searching && <div className="spinner" style={{ flexShrink: 0, marginTop: 10, color: 'var(--primary)' }} />}
                </div>
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 8, boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
                  }}>
                    {searchResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => selectSearchResult(r)}
                        style={{
                          width: '100%', padding: '10px 14px', textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)',
                          fontSize: 13, fontFamily: 'inherit', transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.display_name.split(',')[0]}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map for click-to-pin */}
              <div className="form-group">
                <label className="form-label">Or click on the map to pin the exact location</label>
                <div className="map-wrapper" style={{ height: 280, marginBottom: 8 }}>
                  <MapContainer center={pickedLocation ? [pickedLocation.lat, pickedLocation.lng] : [5.6037, -0.187]} zoom={pickedLocation ? 14 : 11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                    <LocationPicker onPick={handleLocationPick} />
                    {pickedLocation && (
                      <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={incidentIcon}>
                        <Popup>📍 Incident location</Popup>
                      </Marker>
                    )}
                    {stations.filter(s => s.latitude && s.longitude).map(st => (
                      <Marker key={`st-${st.id}`} position={[st.latitude, st.longitude]} icon={stationIcons[st.stationType] || stationIcons.POLICE}>
                        <Popup><strong>{st.name}</strong><br />{st.stationType} · {st.isAvailable ? '✅ Available' : '🔴 Busy'}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                {pickedLocation && (
                  <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>✅ Location pinned:</span>
                    <code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 4 }}>
                      {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                    </code>
                    <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--info)', fontSize: 11 }}>Verify on Google Maps ↗</a>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input id="incident-lat" className="form-input" type="number" step="any" placeholder="e.g. 5.6037" required
                    value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input id="incident-lng" className="form-input" type="number" step="any" placeholder="e.g. -0.1870" required
                    value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location Address *</label>
                <input id="incident-address" className="form-input" placeholder="e.g. Ring Road, near Circle, Accra"
                  value={form.locationAddress} onChange={e => setForm({ ...form, locationAddress: e.target.value })} required />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes (optional)</label>
                <textarea id="incident-notes" className="form-textarea" placeholder="Describe the emergency in more detail — number of victims, severity, hazards, etc."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* Submit */}
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
                <strong>ℹ️ Auto-Dispatch:</strong> <span style={{ color: 'var(--text-muted)' }}>
                  Once submitted, the system will automatically calculate the nearest {form.incidentType === 'FIRE' ? '🚒 fire station' : form.incidentType === 'MEDICAL' ? '🚑 ambulance with hospital capacity' : '🚓 police station'} and dispatch them.
                </span>
              </div>

              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button id="submit-incident" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" />Dispatching...</> : '🚨 Submit & Auto-Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
