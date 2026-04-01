import { useState, useEffect } from 'react';
import { stationAPI } from '../api';

const STATION_TYPE_MAP = {
  POLICE: { icon: '🚓', label: 'Police Station', color: '#3b82f6', adminLabel: 'Police Station Administrator' },
  FIRE:   { icon: '🚒', label: 'Fire Station',   color: '#ef4444', adminLabel: 'Fire Service Administrator' },
};

export default function StationAdminPage({ user, stationType }) {
  const type = stationType || 'POLICE';
  const meta = STATION_TYPE_MAP[type];

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [officerForm, setOfficerForm] = useState({ name: '', badgeNumber: '', rank: '', phoneNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [type]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stationAPI.getByType(type);
      setStations(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const toggleAvailability = async (station) => {
    try {
      await stationAPI.updateAvailability(station.id, !station.isAvailable);
      showMsg(`✅ ${station.name} is now ${!station.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
      await load();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update', true);
    }
  };

  const available = stations.filter(s => s.isAvailable).length;

  return (
    <div>
      {success && <div className="alert alert-success"><span>✅</span><span>{success}</span></div>}
      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      {/* Welcome Banner */}
      <div className="card" style={{
        marginBottom: 24,
        background: `linear-gradient(135deg, ${meta.color}15, ${meta.color}08)`,
        border: `1px solid ${meta.color}30`
      }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 32 }}>{meta.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{meta.adminLabel} Panel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Welcome, {user?.name || 'Admin'} · Manage {meta.label.toLowerCase()} information and availability
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: `Total ${meta.label}s`, value: stations.length, icon: meta.icon, color: meta.color },
          { label: 'Currently Available', value: available, icon: '✅', color: '#22c55e' },
          { label: 'Currently Busy', value: stations.length - available, icon: '🔴', color: '#ef4444' },
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

      {/* Stations Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">{meta.icon} {meta.label} Roster</div>
            <div className="card-subtitle">Update station availability and operational status</div>
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="loading-state"><div className="spinner" /></div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Station Name</th><th>Address</th><th>Phone</th>
                  <th>Coordinates</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">{meta.icon}</div>
                      <h3>No {meta.label.toLowerCase()}s registered</h3>
                      <p>Ask a System Administrator to register {meta.label.toLowerCase()}s in the system</p>
                    </div>
                  </td></tr>
                ) : stations.map(st => (
                  <tr key={st.id}>
                    <td style={{ fontWeight: 600 }}>#{st.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meta.icon} {st.name}</td>
                    <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.address}</td>
                    <td className="text-muted">{st.phoneNumber}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {st.latitude?.toFixed(4)}, {st.longitude?.toFixed(4)}
                    </td>
                    <td>
                      <span className={`badge ${st.isAvailable ? 'badge-resolved' : 'badge-cancelled'}`}>
                        {st.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className={`btn btn-sm ${st.isAvailable ? 'btn-ghost' : 'btn-success'}`}
                          onClick={() => toggleAvailability(st)}
                          title={st.isAvailable ? 'Mark station as unavailable/busy' : 'Mark station as available for dispatch'}
                        >
                          {st.isAvailable ? '🔴 Mark Busy' : '🟢 Mark Available'}
                        </button>
                        <a
                          href={`https://www.google.com/maps?q=${st.latitude},${st.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="View on Google Maps"
                        >
                          🗺️ Maps
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="card" style={{ marginTop: 20, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
        <div className="card-title" style={{ marginBottom: 12 }}>ℹ️ {meta.adminLabel} Responsibilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '✅', title: 'Update Availability', desc: `Mark your ${meta.label.toLowerCase()} as available or busy for emergency dispatch` },
            { icon: '📍', title: 'Verify Coordinates', desc: 'Ensure your station\'s GPS coordinates are accurate for nearest-responder calculations' },
            { icon: '📞', title: 'Contact Information', desc: 'Keep phone numbers up to date so dispatch can reach your station directly' },
            { icon: '🚨', title: 'Respond to Dispatches', desc: 'Monitor the Dispatch & Tracking page for incoming incident assignments' },
          ].map(item => (
            <div key={item.title} style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
