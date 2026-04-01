import { useState, useEffect } from 'react';
import { stationAPI } from '../api';

const STATION_TYPES = ['POLICE', 'FIRE', 'HOSPITAL'];

const typeIcon = {
  HOSPITAL: { icon: '🏥', color: '#22c55e', label: 'Hospital' },
  POLICE: { icon: '🚓', color: '#3b82f6', label: 'Police Station' },
  FIRE: { icon: '🚒', color: '#ef4444', label: 'Fire Station' },
};

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({
    name: '', stationType: 'POLICE',
    latitude: '', longitude: '',
    address: '', phoneNumber: '', capacity: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stationAPI.getAll();
      setStations(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await stationAPI.create({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      });
      setSuccess(`${typeIcon[form.stationType]?.label} "${form.name}" registered successfully!`);
      setShowModal(false);
      setForm({ name: '', stationType: 'POLICE', latitude: '', longitude: '', address: '', phoneNumber: '', capacity: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register station');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailability = async (id, current) => {
    try {
      await stationAPI.updateAvailability(id, !current);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update availability');
    }
  };

  const filtered = filter === 'ALL' ? stations : stations.filter(s => s.stationType === filter);

  return (
    <div>
      {success && <div className="alert alert-success"><span>✅</span><span>{success}</span></div>}

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { type: 'ALL', label: 'Total Stations', count: stations.length, icon: '🏢', color: '#64748b' },
          { type: 'HOSPITAL', label: 'Hospitals', icon: '🏥', color: '#22c55e' },
          { type: 'POLICE', label: 'Police Stations', icon: '🚓', color: '#3b82f6' },
          { type: 'FIRE', label: 'Fire Stations', icon: '🚒', color: '#ef4444' },
        ].map(s => ({
          ...s,
          count: s.type === 'ALL' ? stations.length : stations.filter(st => st.stationType === s.type).length
        })).map(s => (
          <div key={s.type} className="stat-card" style={{ '--card-accent': s.color, cursor: 'pointer' }}
            onClick={() => setFilter(s.type)}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 28 }}>{s.count}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['ALL', ...STATION_TYPES].map(t => (
            <button key={t} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(t)}>
              {t === 'ALL' ? '🏢 All' : `${typeIcon[t]?.icon} ${typeIcon[t]?.label}`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>＋ Register Station</button>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Type</th><th>Address</th>
                  <th>Phone</th><th>Capacity</th><th>Availability</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">🏢</div>
                      <h3>No stations found</h3>
                      <p>Register your first station to get started</p>
                    </div>
                  </td></tr>
                ) : filtered.map(st => {
                  const t = typeIcon[st.stationType] || { icon: '🏢', color: '#64748b' };
                  return (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 600 }}>#{st.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.icon} {st.name}
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: `${t.color}20`, color: t.color,
                          border: `1px solid ${t.color}30`
                        }}>{st.stationType}</span>
                      </td>
                      <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.address}</td>
                      <td className="text-muted">{st.phoneNumber}</td>
                      <td>
                        {st.stationType === 'HOSPITAL' ? (
                          <span style={{ fontSize: 13 }}>
                            {st.currentOccupancy || 0}/{st.capacity || '—'}
                            {st.capacity > 0 && (
                              <span style={{ marginLeft: 4, color: ((st.currentOccupancy || 0) / st.capacity) > 0.8 ? 'var(--danger)' : 'var(--success)' }}>
                                ({Math.round(((st.currentOccupancy || 0) / st.capacity) * 100)}%)
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${st.isAvailable ? 'badge-resolved' : 'badge-cancelled'}`}>
                          {st.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${st.isAvailable ? 'btn-ghost' : 'btn-success'}`}
                          onClick={() => handleAvailability(st.id, st.isAvailable)}
                        >
                          {st.isAvailable ? 'Set Busy' : 'Set Available'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">🏢 Register Station</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Station Type *</label>
                <select className="form-select" value={form.stationType}
                  onChange={e => setForm({ ...form, stationType: e.target.value })}>
                  {STATION_TYPES.map(t => <option key={t} value={t}>{typeIcon[t]?.icon} {typeIcon[t]?.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Station Name *</label>
                <input className="form-input" placeholder="e.g. Accra Central Police Station" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input className="form-input" type="number" step="any" placeholder="e.g. 5.5500" required
                    value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input className="form-input" type="number" step="any" placeholder="e.g. -0.2000" required
                    value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <input className="form-input" placeholder="Full address" required
                  value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" placeholder="+233 XXXXXXXXX" required
                    value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                {form.stationType === 'HOSPITAL' && (
                  <div className="form-group">
                    <label className="form-label">Bed Capacity</label>
                    <input className="form-input" type="number" placeholder="e.g. 200"
                      value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" />Registering...</> : '✅ Register Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
