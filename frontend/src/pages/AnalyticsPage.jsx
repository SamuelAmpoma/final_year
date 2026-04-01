import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';

const barColor = (i) => {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  return colors[i % colors.length];
};

function BarChart({ data, labelKey, valueKey, title }) {
  if (!data || data.length === 0) {
    return <div className="empty-state"><div className="empty-icon">📊</div><h3>No data available</h3></div>;
  }
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div>
      {title && <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>{d[labelKey]}</div>
            <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden', height: 28 }}>
              <div style={{
                width: `${((d[valueKey] || 0) / max) * 100}%`,
                background: barColor(i),
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.6s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'white',
                minWidth: (d[valueKey] || 0) > 0 ? 30 : 0,
              }}>
                {d[valueKey] || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [responseTimes, setResponseTimes] = useState(null);
  const [byRegion, setByRegion] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [rtRes, brRes, urRes] = await Promise.allSettled([
        analyticsAPI.getResponseTimes(),
        analyticsAPI.getIncidentsByRegion(),
        analyticsAPI.getResourceUtilization(),
      ]);
      if (rtRes.status === 'fulfilled') setResponseTimes(rtRes.value.data);
      if (brRes.status === 'fulfilled') setByRegion(brRes.value.data);
      if (urRes.status === 'fulfilled') setUtilization(urRes.value.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className="loading-state"><div className="spinner" /><span>Loading analytics...</span></div>;
  }

  // Normalize data for display
  const rtData = responseTimes || {};
  const brData = byRegion || {};
  const urData = utilization || {};

  // Build chart-friendly arrays
  const incidentTypeData = brData.byType ? Object.entries(brData.byType).map(([k, v]) => ({ label: k, count: v })) : [];
  const regionData = brData.byRegion ? Object.entries(brData.byRegion).map(([k, v]) => ({ label: k, count: v })) : [];
  const hospitalData = urData.hospitals ? urData.hospitals.map(h => ({ label: h.name || h.id, occupancy: h.occupancyRate || 0 })) : [];
  const stationData = urData.stations ? urData.stations.map(s => ({ label: s.name || s.id, deployed: s.deployedCount || 0 })) : [];

  const summaryCards = [
    { label: 'Avg Response Time', value: rtData.average ? `${parseFloat(rtData.average).toFixed(1)} min` : '—', icon: '⏱️', color: '#3b82f6' },
    { label: 'Min Response Time', value: rtData.min ? `${parseFloat(rtData.min).toFixed(1)} min` : '—', icon: '⚡', color: '#22c55e' },
    { label: 'Max Response Time', value: rtData.max ? `${parseFloat(rtData.max).toFixed(1)} min` : '—', icon: '🐌', color: '#ef4444' },
    { label: 'Total Incidents', value: rtData.total || brData.total || '—', icon: '📋', color: '#f59e0b' },
    { label: 'Resolved', value: rtData.resolved || urData.resolvedCount || '—', icon: '✅', color: '#22c55e' },
    { label: 'Active Hospitals', value: urData.hospitalCount || '—', icon: '🏥', color: '#8b5cf6' },
  ];

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid">
        {summaryCards.map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <div className="flex gap-2 mb-4" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <span className="text-muted text-sm">Last updated: {lastUpdated}</span>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
      )}

      {/* Charts Row */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📊 Incidents by Type</div>
              <div className="card-subtitle">Distribution across incident categories</div>
            </div>
          </div>
          {incidentTypeData.length > 0 ? (
            <BarChart data={incidentTypeData} labelKey="label" valueKey="count" />
          ) : (
            <div className="empty-state"><div className="empty-icon">📊</div><h3>No incident type data</h3><p>Record incidents to see analytics</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Incidents by Region</div>
              <div className="card-subtitle">Geographic distribution</div>
            </div>
          </div>
          {regionData.length > 0 ? (
            <BarChart data={regionData} labelKey="label" valueKey="count" />
          ) : (
            <div className="empty-state"><div className="empty-icon">🗺️</div><h3>No regional data</h3><p>Data appears once incidents are resolved</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🏥 Hospital Occupancy</div>
              <div className="card-subtitle">Bed utilization rates (%)</div>
            </div>
          </div>
          {hospitalData.length > 0 ? (
            <BarChart data={hospitalData} labelKey="label" valueKey="occupancy" />
          ) : (
            <div className="empty-state"><div className="empty-icon">🏥</div><h3>No hospital data</h3><p>Hospital capacity data will appear here</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🚨 Most Deployed Responders</div>
              <div className="card-subtitle">Station deployment statistics</div>
            </div>
          </div>
          {stationData.length > 0 ? (
            <BarChart data={stationData} labelKey="label" valueKey="deployed" />
          ) : (
            <div className="empty-state"><div className="empty-icon">🚨</div><h3>No deployment data</h3><p>Data appears after dispatches are made</p></div>
          )}
        </div>
      </div>

      {/* Response Time Detail */}
      {rtData.byType && Object.keys(rtData.byType).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">⏱️ Response Times by Incident Type</div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Incident Type</th><th>Avg Response (min)</th><th>Count</th></tr>
              </thead>
              <tbody>
                {Object.entries(rtData.byType).map(([type, data]) => (
                  <tr key={type}>
                    <td><span className={`badge badge-${type.toLowerCase()}`}>{type}</span></td>
                    <td style={{ fontWeight: 600 }}>{parseFloat(data.avg || 0).toFixed(1)} min</td>
                    <td>{data.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
