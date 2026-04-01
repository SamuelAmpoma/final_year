import { useState, useEffect } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import DispatchPage from './pages/DispatchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StationsPage from './pages/StationsPage';
import HospitalAdminPage from './pages/HospitalAdminPage';
import StationAdminPage from './pages/StationAdminPage';
import DriverPage from './pages/DriverPage';

// ─── Role-based navigation config ─────────────────────────────────
// Roles from backend: ADMIN | DISPATCHER | RESPONDER
// We map:
//   ADMIN      → System Administrator (call center — full access)
//   DISPATCHER → Hospital/Police/Fire Station Admin (manage their station)
//   RESPONDER  → Ambulance Driver / Officer (GPS tracking, see dispatches)

const NAV_BY_ROLE = {
  ADMIN: [
    { id: 'dashboard',  label: 'Dashboard',          icon: '🏠',  page: 'Dashboard' },
    { id: 'incidents',  label: 'Incident Reports',    icon: '🚨',  page: 'Incident Reports' },
    { id: 'dispatch',   label: 'Dispatch & Tracking', icon: '📡',  page: 'Dispatch Tracking' },
    { id: 'stations',   label: 'Stations',            icon: '🏢',  page: 'Responder Stations' },
    { id: 'analytics',  label: 'Analytics',           icon: '📊',  page: 'Analytics & Reports' },
  ],
  DISPATCHER: [
    { id: 'dashboard',      label: 'Dashboard',             icon: '🏠',  page: 'Dashboard' },
    { id: 'hospital-admin', label: 'Hospital Management',   icon: '🏥',  page: 'Hospital Administration' },
    { id: 'police-admin',   label: 'Police Stations',       icon: '🚓',  page: 'Police Station Administration' },
    { id: 'fire-admin',     label: 'Fire Stations',         icon: '🚒',  page: 'Fire Station Administration' },
    { id: 'dispatch',       label: 'Dispatch & Tracking',   icon: '📡',  page: 'Dispatch Tracking' },
  ],
  RESPONDER: [
    { id: 'driver',    label: 'My Location (GPS)',    icon: '📍',  page: 'Driver GPS Panel' },
    { id: 'dispatch',  label: 'Active Dispatches',    icon: '📡',  page: 'Dispatch Tracking' },
    { id: 'dashboard', label: 'Dashboard',            icon: '🏠',  page: 'Dashboard' },
  ],
};

const ROLE_LABELS = {
  ADMIN:      { label: 'System Administrator', icon: '👨‍💼', color: '#ef4444', defaultPage: 'dashboard' },
  DISPATCHER: { label: 'Station Administrator', icon: '🏢', color: '#3b82f6', defaultPage: 'hospital-admin' },
  RESPONDER:  { label: 'Emergency Responder',   icon: '🚑', color: '#22c55e', defaultPage: 'driver' },
};

// ─── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ active, onNav, user, onLogout, openIncidents }) {
  const role = user?.role || 'ADMIN';
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.ADMIN;
  const roleMeta = ROLE_LABELS[role] || ROLE_LABELS.ADMIN;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🚨</div>
        <h2>GhanaEMS</h2>
        <p>Emergency Response Platform</p>
      </div>

      {/* Role Badge */}
      <div style={{
        margin: '0 12px 8px',
        padding: '8px 12px',
        borderRadius: 8,
        background: `${roleMeta.color}15`,
        border: `1px solid ${roleMeta.color}25`,
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 18 }}>{roleMeta.icon}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: roleMeta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {roleMeta.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Role-based access active</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'incidents' && openIncidents > 0 && (
              <span className="nav-badge">{openIncidents}</span>
            )}
          </button>
        ))}

        {/* API Docs — only show for ADMIN */}
        {role === 'ADMIN' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>API Documentation</div>
            {[
              { href: 'http://localhost:3001/api-docs', icon: '🔐', label: 'Auth Service' },
              { href: 'http://localhost:3002/api-docs', icon: '📋', label: 'Incident Service' },
              { href: 'http://localhost:3003/api-docs', icon: '📡', label: 'Dispatch Service' },
              { href: 'http://localhost:3004/api-docs', icon: '📊', label: 'Analytics Service' },
            ].map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="nav-item">
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={onLogout} title="Click to logout">
          <div className="user-avatar">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || user?.email || 'Admin'}</div>
            <div className="user-role">{roleMeta.label} · Logout</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Header ──────────────────────────────────────────────────────
function Header({ page, user, onLogout }) {
  const roleMeta = ROLE_LABELS[user?.role] || ROLE_LABELS.ADMIN;
  return (
    <header className="header">
      <div style={{ flex: 1 }}>
        <div className="header-title">{page}</div>
      </div>
      <div className="header-actions">
        <div className="status-pill">
          <div className="indicator-dot" />
          <span>System Online</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date().toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name || user?.email || 'Admin'}
            </div>
            <div style={{ fontSize: 11, color: roleMeta.color }}>
              {roleMeta.icon} {roleMeta.label}
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={onLogout}
            title="Logout"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, color: '#f87171', cursor: 'pointer',
              padding: '7px 14px', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.25)'; }}
          >
            🔓 Logout
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [openIncidents, setOpenIncidents] = useState(0);

  // Restore session
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const u = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(u);
      setActivePage(ROLE_LABELS[u?.role]?.defaultPage || 'dashboard');
    }
  }, []);

  // Poll for open incident count (ADMIN only)
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const poll = async () => {
      try {
        const { incidentAPI } = await import('./api');
        const res = await incidentAPI.getAll();
        const all = res.data || [];
        setOpenIncidents(all.filter(i => ['CREATED', 'DISPATCHED', 'IN_PROGRESS'].includes(i.status)).length);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogin = (u, t) => {
    setUser(u);
    setToken(t);
    setActivePage(ROLE_LABELS[u?.role]?.defaultPage || 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null); setToken(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const role = user.role || 'ADMIN';
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.ADMIN;
  const currentNav = navItems.find(n => n.id === activePage);
  const pageTitle = currentNav?.page || 'Dashboard';

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':      return <DashboardPage />;
      case 'incidents':      return <IncidentsPage />;
      case 'dispatch':       return <DispatchPage />;
      case 'stations':       return <StationsPage />;
      case 'analytics':      return <AnalyticsPage />;
      case 'hospital-admin': return <HospitalAdminPage user={user} />;
      case 'police-admin':   return <StationAdminPage user={user} stationType="POLICE" />;
      case 'fire-admin':     return <StationAdminPage user={user} stationType="FIRE" />;
      case 'driver':         return <DriverPage user={user} />;
      default:               return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        user={user}
        onLogout={handleLogout}
        openIncidents={openIncidents}
      />
      <div className="main-content">
        <Header page={pageTitle} user={user} onLogout={handleLogout} />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
