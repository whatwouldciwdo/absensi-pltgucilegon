import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../pages/AttendanceForm.css';

const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live ticking clock in topbar
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted =
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';

      setCurrentDateStr(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      to: '/admin/events',
      label: 'Kelola Kegiatan',
      icon: 'event_note',
    },
  ];

  return (
    <div className="pln-attendance-page" style={{ minHeight: '100vh', backgroundColor: '#f6faff' }}>
      <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(23, 28, 32, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 99,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{
            width: '270px',
            backgroundColor: '#f0f4f9',
            borderRight: '1px solid rgba(189, 201, 204, 0.4)',
            boxShadow: '4px 0 16px rgba(163, 177, 198, 0.25)',
          }}
        >
          {/* Sidebar Header */}
          <div
            className="admin-sidebar-header"
            style={{
              padding: '1.25rem 1.25rem',
              borderBottom: '1px solid rgba(189, 201, 204, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f6faff',
            }}
          >
            <img
              src="/logo-pln-ip.png"
              alt="Logo PLN"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171c20', lineHeight: 1.2 }}>
                PLN INDONESIA POWER
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#006574', letterSpacing: '0.08em' }}>
                UBP CILEGON - ADMIN
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="admin-nav" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active neu-inset' : 'neu-raised-sm'}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#006574' : '#3d494b',
                  backgroundColor: '#f6faff',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid rgba(0, 101, 116, 0.2)' : '1px solid transparent',
                })}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div
            className="admin-sidebar-footer"
            style={{
              padding: '1.25rem',
              borderTop: '1px solid rgba(189, 201, 204, 0.4)',
              backgroundColor: '#f6faff',
            }}
          >
            <div
              className="neu-inset"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              <p
                style={{
                  fontSize: '11px',
                  color: '#3d494b',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {user?.email || 'admin'}
              </p>
            </div>
            <button
              className="neu-raised-sm"
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                color: '#dc2626',
                backgroundColor: '#f6faff',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                logout
              </span>
              Keluar
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Topbar */}
          <div
            className="admin-topbar pln-header"
            style={{
              height: '68px',
              backgroundColor: 'rgba(246, 250, 255, 0.94)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(189, 201, 204, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.5rem',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="neu-raised-sm mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f6faff',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#171c20',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  menu
                </span>
              </button>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#171c20' }}>
                Sistem Informasi Presensi Digital
              </span>
            </div>

            {/* Right: Live Clock & Public Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="hide-mobile" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#171c20' }}>
                  {currentDateStr}
                </div>
                <div style={{ fontSize: '11px', color: '#006574', fontWeight: 600 }}>
                  {currentTime}
                </div>
              </div>

              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="neu-raised-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f6faff',
                  color: '#006574',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  open_in_new
                </span>
                <span>Lihat Publik</span>
              </Link>
            </div>
          </div>

          {/* Admin Page Content */}
          <div className="admin-content" style={{ padding: '1.5rem', flex: 1, backgroundColor: '#f6faff' }}>
            <Outlet />
          </div>

          {/* Admin Footer Identik */}
          <footer className="pln-footer" style={{ borderTop: '1px solid rgba(189, 201, 204, 0.4)' }}>
            <div className="pln-footer-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006574' }} />
                <span className="font-body-sm" style={{ color: '#3d494b' }}>
                  &copy; 2026 SIS PT PLN Indonesia Power UBP Cilegon. Hak Cipta Dilindungi.
                </span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
