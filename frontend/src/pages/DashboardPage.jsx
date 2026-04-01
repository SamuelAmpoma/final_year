import { useState, useEffect } from 'react';
import { incidentAPI, stationAPI, analyticsAPI, healthCheck } from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, open: 0, dispatched: 0, resolved: 0 });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [incResult, stResult, healthResult] = await Promise.allSettled([
        incidentAPI.getAll(),
        stationAPI.getAll(),
        healthCheck(),
      ]);

      if (incResult.status === 'fulfilled') {
        const incidents = incResult.value.data || [];
        setRecentIncidents(incidents.slice(0, 8));
        setStats({
          total: incidents.length,
          open: incidents.filter(i => ['CREATED', 'DISPATCHED', 'IN_PROGRESS'].includes(i.status)).length,
          dispatched: incidents.filter(i => i.status === 'DISPATCHED').length,
          resolved: incidents.filter(i => i.status === 'RESOLVED').length,
        });
      }

      if (stResult.status === 'fulfilled') {
        setStations(stResult.value.data || []);
      }

      if (healthResult.status === 'fulfilled') {
        setServices(healthResult.value);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase().replace('_', '_');
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  const typeBadge = (type) => {
    const t = (type || '').toLowerCase();
    return <span className={`badge badge-${t}`}>{type}</span>;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--card-accent': '#3b82f6', '--card-accent-bg': 'rgba(59,130,246,0.12)' }}>
          <div className="stat-icon">📋</div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Incidents</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#ef4444', '--card-accent-bg': 'rgba(239,68,68,0.12)' }}>
          <div className="stat-icon">🔴</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.open}</div>
            <div className="stat-label">Active Incidents</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f59e0b', '--card-accent-bg': 'rgba(245,158,11,0.12)' }}>
          <div className="stat-icon">🚨</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.dispatched}</div>
            <div className="stat-label">Dispatched</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#22c55e', '--card-accent-bg': 'rgba(34,197,94,0.12)' }}>
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#8b5cf6', '--card-accent-bg': 'rgba(139,92,246,0.12)' }}>
          <div className="stat-icon">🏥</div>
          <div>
            <div className="stat-value">{stations.filter(s => s.stationType === 'HOSPITAL').length}</div>
            <div className="stat-label">Hospitals</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#06b6d4', '--card-accent-bg': 'rgba(6,182,212,0.12)' }}>
          <div className="stat-icon">🚓</div>
          <div>
            <div className="stat-value">{stations.filter(s => s.stationType === 'POLICE').length}</div>
            <div className="stat-label">Police Stations</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Incidents */}
        <div className="card full-width">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Incidents</div>
              <div className="card-subtitle">Latest emergency reports</div>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Citizen</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No incidents recorded yet</td></tr>
                ) : recentIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>#{inc.id}</td>
                    <td>{inc.citizenName}</td>
                    <td>{typeBadge(inc.incidentType)}</td>
                    <td className="truncate" style={{ maxWidth: 180 }}>{inc.locationAddress}</td>
                    <td>{statusBadge(inc.status)}</td>
                    <td>{inc.assignedUnitName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td className="text-muted">{new Date(inc.createdAt || inc.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Health */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🖥️ Service Health</div>
              <div className="card-subtitle">Microservice status</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'AUTH', name: 'Auth Service', port: 3001, icon: '🔐' },
              { key: 'INCIDENT', name: 'Incident Service', port: 3002, icon: '📋' },
              { key: 'DISPATCH', name: 'Dispatch Service', port: 3003, icon: '🚨' },
              { key: 'ANALYTICS', name: 'Analytics Service', port: 3004, icon: '📊' },
            ].map(svc => {
              const s = services[svc.key];
              const ok = s?.ok;
              return (
                <div key={svc.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 8,
                  background: ok ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                }}>
                  <span style={{ fontSize: 18 }}>{svc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{svc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>:{svc.port}</div>
                  </div>
                  <span className={`badge ${ok ? 'badge-resolved' : 'badge-cancelled'}`}>
                    {ok ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stations Summary */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🏢 Registered Stations</div>
              <div className="card-subtitle">{stations.length} total stations</div>
            </div>
          </div>
          {stations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No stations registered</h3>
              <p>Add stations from the Stations page</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stations.slice(0, 6).map(st => (
                <div key={st.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-input)', border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 16 }}>
                    {st.stationType === 'HOSPITAL' ? '🏥' : st.stationType === 'POLICE' ? '🚓' : '🚒'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.address}</div>
                  </div>
                  <span className={`badge ${st.isAvailable ? 'badge-resolved' : 'badge-cancelled'}`}>
                    {st.isAvailable ? 'AVAILABLE' : 'BUSY'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
