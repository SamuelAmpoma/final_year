import { useState, useEffect } from 'react';
import { stationAPI, dispatchAPI } from '../api';

export default function HospitalAdminPage({ user }) {
  const [hospitals, setHospitals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [capacityForm, setCapacityForm] = useState({ capacity: '', occupancy: '' });
  const [showCapModal, setShowCapModal] = useState(false);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [hRes, vRes] = await Promise.allSettled([
        stationAPI.getByType('HOSPITAL'),
        dispatchAPI.getVehicles(),
      ]);
      if (hRes.status === 'fulfilled') setHospitals(hRes.value.data || []);
      if (vRes.status === 'fulfilled') setVehicles((vRes.value.data || []).filter(v => v.vehicleType === 'AMBULANCE'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const openCapacityModal = (h) => {
    setSelectedHospital(h);
    setCapacityForm({ capacity: h.capacity || '', occupancy: h.currentOccupancy || '' });
    setShowCapModal(true);
    setError('');
  };

  const handleCapacityUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await stationAPI.updateCapacity(selectedHospital.id, parseInt(capacityForm.capacity), parseInt(capacityForm.occupancy));
      showMsg(`✅ Capacity updated for ${selectedHospital.name}`);
      setShowCapModal(false);
      await load();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update capacity', true);
    } finally { setSubmitting(false); }
  };

  const toggleAvailability = async (station) => {
    try {
      await stationAPI.updateAvailability(station.id, !station.isAvailable);
      showMsg(`✅ ${station.name} is now ${!station.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
      await load();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update availability', true);
    }
  };

  const toggleAmbulance = async (id, currentStatus) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'ON_DUTY' : 'AVAILABLE';
    try {
      await dispatchAPI.updateVehicleStatus(id, newStatus);
      showMsg(`✅ Ambulance status updated`);
      await load();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update ambulance status', true);
    }
  };

  const totalBeds = hospitals.reduce((s, h) => s + (h.capacity || 0), 0);
  const totalOccupied = hospitals.reduce((s, h) => s + (h.currentOccupancy || 0), 0);
  const availHospitals = hospitals.filter(h => h.isAvailable).length;
  const availAmbulances = vehicles.filter(v => v.status === 'AVAILABLE').length;

  return (
    <div>
      {success && <div className="alert alert-success"><span>✅</span><span>{success}</span></div>}
      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      {/* Welcome Banner */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(16,185,129,0.06))', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 32 }}>🏥</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Hospital Administration Panel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Welcome, {user?.name || 'Hospital Admin'} · Manage hospital capacity, bed occupancy and ambulance availability
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Registered Hospitals', value: hospitals.length, icon: '🏥', color: '#22c55e' },
          { label: 'Available Hospitals', value: availHospitals, icon: '✅', color: '#4ade80' },
          { label: 'Total Beds', value: totalBeds, icon: '🛏️', color: '#3b82f6' },
          { label: 'Occupied Beds', value: totalOccupied, icon: '🔴', color: '#ef4444' },
          { label: 'Available Beds', value: totalBeds - totalOccupied, icon: '🟢', color: '#22c55e' },
          { label: 'Ambulances Available', value: availAmbulances, icon: '🚑', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hospitals Table */}
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">🏥 Hospitals Under Management</div>
            <div className="card-subtitle">Update bed capacity and availability status</div>
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="loading-state"><div className="spinner" /></div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital</th><th>Address</th><th>Bed Capacity</th>
                  <th>Occupied</th><th>Available Beds</th><th>Occupancy %</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state"><div className="empty-icon">🏥</div><h3>No hospitals registered</h3><p>Hospitals are added from the Stations management page by a System Admin</p></div>
                  </td></tr>
                ) : hospitals.map(h => {
                  const occupancyPct = h.capacity > 0 ? Math.round((h.currentOccupancy || 0) / h.capacity * 100) : 0;
                  const isCritical = occupancyPct >= 80;
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🏥 {h.name}</td>
                      <td className="text-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.address}</td>
                      <td style={{ fontWeight: 600 }}>{h.capacity || 0}</td>
                      <td>{h.currentOccupancy || 0}</td>
                      <td style={{ color: (h.capacity - (h.currentOccupancy || 0)) > 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {(h.capacity || 0) - (h.currentOccupancy || 0)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${occupancyPct}%`, height: '100%', background: isCritical ? '#ef4444' : '#22c55e', borderRadius: 999, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: 12, color: isCritical ? 'var(--danger)' : 'var(--success)', fontWeight: 600, minWidth: 32 }}>{occupancyPct}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${h.isAvailable ? 'badge-resolved' : 'badge-cancelled'}`}>
                          {h.isAvailable ? 'ACCEPTING' : 'FULL / CLOSED'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-info btn-sm" onClick={() => openCapacityModal(h)}>📊 Update Capacity</button>
                          <button className={`btn btn-sm ${h.isAvailable ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleAvailability(h)}>
                            {h.isAvailable ? 'Mark Full' : 'Mark Open'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ambulances Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title">🚑 Ambulance Fleet</div>
          <div className="card-subtitle">Manage ambulance availability for dispatch</div>
        </div>
        <div className="table-container">
          {loading ? <div className="loading-state"><div className="spinner" /></div> : (
            <table className="data-table">
              <thead>
                <tr><th>Vehicle ID</th><th>Station</th><th>Incident</th><th>Status</th><th>Last Location</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><div className="empty-icon">🚑</div><h3>No ambulances registered</h3><p>Register ambulances from the Dispatch & Tracking page</p></div>
                  </td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>🚑 {v.vehicleId}</td>
                    <td>{v.stationId || '—'}</td>
                    <td>{v.incidentId ? `#${v.incidentId}` : '—'}</td>
                    <td>
                      <span className={`badge ${v.status === 'AVAILABLE' ? 'badge-resolved' : v.status === 'ON_DUTY' ? 'badge-dispatched' : 'badge-cancelled'}`}>
                        {v.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {v.latitude ? `${parseFloat(v.latitude).toFixed(4)}, ${parseFloat(v.longitude).toFixed(4)}` : '—'}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${v.status === 'AVAILABLE' ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => toggleAmbulance(v.id, v.status)}
                        disabled={v.incidentId}
                        title={v.incidentId ? 'Cannot change — ambulance is on an active dispatch' : ''}
                      >
                        {v.status === 'AVAILABLE' ? 'Mark On Duty' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Capacity Update Modal */}
      {showCapModal && selectedHospital && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCapModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">📊 Update Bed Capacity</h2>
              <button className="modal-close" onClick={() => setShowCapModal(false)}>✕</button>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
              <strong>🏥 {selectedHospital.name}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{selectedHospital.address}</div>
            </div>
            <form onSubmit={handleCapacityUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Bed Capacity *</label>
                  <input className="form-input" type="number" min="0" placeholder="e.g. 200" required
                    value={capacityForm.capacity} onChange={e => setCapacityForm({ ...capacityForm, capacity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Occupancy *</label>
                  <input className="form-input" type="number" min="0" placeholder="e.g. 150" required
                    value={capacityForm.occupancy} onChange={e => setCapacityForm({ ...capacityForm, occupancy: e.target.value })} />
                </div>
              </div>
              {capacityForm.capacity && capacityForm.occupancy && (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  <span>ℹ️</span>
                  <span><strong>{capacityForm.capacity - capacityForm.occupancy} beds</strong> will be marked as available ({Math.round((capacityForm.occupancy / capacityForm.capacity) * 100)}% occupancy)</span>
                </div>
              )}
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCapModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" />Saving...</> : '💾 Save Capacity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
