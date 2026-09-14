import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../AttendanceForm.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal. Periksa kembali email dan password Anda.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pln-attendance-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Identik PLN IP Cilegon */}
      <header className="pln-header">
        <div className="pln-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/logo-pln-ip.png"
                alt="Logo PLN Indonesia Power"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span
              className="font-title-md"
              style={{
                color: '#171c20',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '0.02em',
                fontSize: '17px',
              }}
            >
              PLN INDONESIA POWER
            </span>
            <span
              className="font-label-sm"
              style={{
                color: '#006574',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '1px',
              }}
            >
              UBP CILEGON
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              to="/"
              className="neu-raised-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                color: '#006574',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                backgroundColor: '#f6faff',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_back
              </span>
              Halaman Publik
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pln-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in-up">
          {/* Card Login Neumorphic */}
          <div
            className="neu-raised"
            style={{
              padding: '2.25rem 2rem',
              borderRadius: '1rem',
              backgroundColor: '#f6faff',
              border: '1px solid rgba(189, 201, 204, 0.4)',
            }}
          >
            {/* Header Login */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                className="neu-inset"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#006574',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                  admin_panel_settings
                </span>
              </div>
              <h1 className="font-headline-sm" style={{ color: '#171c20', margin: '0 0 4px', fontSize: '22px' }}>
                Portal Admin
              </h1>
              <p className="font-body-sm" style={{ color: '#3d494b', margin: 0 }}>
                Masuk untuk mengelola kegiatan dan data absensi
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#dc2626',
                  fontSize: '13px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  error
                </span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-email" style={{ color: '#171c20', fontWeight: 600 }}>
                  Email / Username Admin
                </label>
                <input
                  id="admin-email"
                  type="text"
                  className="pln-input neu-inset"
                  placeholder="admin@plnindonesiapower.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-password" style={{ color: '#171c20', fontWeight: 600 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="pln-input neu-inset"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6d797c',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="neu-raised"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#008093',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 128, 147, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" style={{ borderTopColor: '#ffffff' }} />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      login
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Identik */}
      <footer className="pln-footer">
        <div className="pln-footer-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006574' }} />
            <span className="font-body-sm" style={{ color: '#3d494b' }}>
              &copy; 2026 SIS PT PLN Indonesia Power UBP Cilegon. Hak Cipta Dilindungi.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
